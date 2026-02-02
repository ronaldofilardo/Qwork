/**
 * Testes para validar o novo comportamento de auto-conclusão:
 * 1. Uso correto da tabela 'respostas' (não respostas_avaliacao)
 * 2. Error handling: conclusão não deve ser bloqueada por erro no cálculo
 * 3. Status sempre atualizado, mesmo com falha em resultados
 */

import { POST } from '@/app/api/avaliacao/respostas/route';
import { query } from '@/lib/db';
import { queryWithContext } from '@/lib/db-security';
import { calcularResultados } from '@/lib/calculate';
import { recalcularStatusLote } from '@/lib/lotes';

// Mocks
jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
}));

jest.mock('@/lib/calculate', () => ({
  calcularResultados: jest.fn(),
}));

jest.mock('@/lib/lotes', () => ({
  recalcularStatusLote: jest.fn(),
}));

jest.mock('@/lib/questoes', () => ({
  grupos: [
    { id: 1, itens: Array(37).fill({}), dominio: 'Demanda', tipo: 'normal' },
  ],
}));

const mockRequireAuth = require('@/lib/session').requireAuth;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryWithContext = queryWithContext as jest.MockedFunction<
  typeof queryWithContext
>;
const mockCalcularResultados = calcularResultados as jest.MockedFunction<
  typeof calcularResultados
>;
const mockRecalcularStatusLote = recalcularStatusLote as jest.MockedFunction<
  typeof recalcularStatusLote
>;

describe('Auto-conclusão com Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      cpf: '12345678901',
      perfil: 'funcionario',
    });
  });

  describe('Uso correto da tabela respostas', () => {
    it('deve usar tabela "respostas" (não respostas_avaliacao) em todas as queries', async () => {
      mockQuery
        // Buscar avaliação atual
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // COUNT FROM respostas (total < 37)
        .mockResolvedValueOnce({ rows: [{ total: '10' }], rowCount: 1 });

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({
          item: 'Q1',
          valor: 75,
          grupo: 1,
        }),
      });

      await POST(request);

      // Verificar que todas as queries usam "respostas"
      const allCalls = mockQuery.mock.calls.map((call) => call[0]);

      // INSERT deve usar "respostas"
      const insertCall = allCalls.find((sql) =>
        sql.includes('INSERT INTO respostas')
      );
      expect(insertCall).toBeDefined();
      expect(insertCall).not.toContain('respostas_avaliacao');

      // COUNT deve usar "respostas"
      const countCall = allCalls.find((sql) => sql.includes('FROM respostas'));
      expect(countCall).toBeDefined();
      expect(countCall).toContain('FROM respostas');
      expect(countCall).not.toContain('FROM respostas_avaliacao');
    });
  });

  describe('Auto-conclusão ao atingir 37 respostas', () => {
    it('deve concluir automaticamente quando atingir 37 respostas', async () => {
      mockCalcularResultados.mockReturnValue([
        { grupo: 1, dominio: 'Demanda', score: 75, categoria: 'medio' },
      ]);

      mockQuery
        // Buscar avaliação atual
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // COUNT FROM respostas (37 respostas)
        .mockResolvedValueOnce({ rows: [{ total: '37' }], rowCount: 1 })
        // SELECT respostas para cálculo
        .mockResolvedValueOnce({
          rows: Array(37)
            .fill(null)
            .map((_, i) => ({ grupo: 1, item: `Q${i}`, valor: 75 })),
          rowCount: 37,
        })
        // INSERT INTO resultados
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // SELECT lote_id
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1, numero_ordem: 1 }],
          rowCount: 1,
        })
        // UPDATE funcionarios
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      // Mock queryWithContext para UPDATE avaliacoes
      mockQueryWithContext.mockResolvedValue({ rows: [], rowCount: 1 });

      mockRecalcularStatusLote.mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({
          item: 'Q37',
          valor: 75,
          grupo: 1,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completed).toBe(true);
      expect(data.message).toContain('concluída');

      // Verificar UPDATE de status com queryWithContext
      expect(mockQueryWithContext).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE avaliacoes'),
        expect.arrayContaining([1]),
        expect.objectContaining({ cpf: '12345678901' })
      );

      // Verificar que recalcularStatusLote foi chamado
      expect(mockRecalcularStatusLote).toHaveBeenCalledWith(1);
    });

    it('NÃO deve concluir se tiver menos de 37 respostas', async () => {
      mockQuery
        // Buscar avaliação atual
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // COUNT FROM respostas (apenas 36)
        .mockResolvedValueOnce({ rows: [{ total: '36' }], rowCount: 1 });

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({
          item: 'Q36',
          valor: 75,
          grupo: 1,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completed).toBe(false);

      // Não deve ter UPDATE de status
      const updateStatusCall = mockQuery.mock.calls.find((call) =>
        call[0].includes('UPDATE avaliacoes SET status')
      );
      expect(updateStatusCall).toBeUndefined();

      // Não deve chamar recalcularStatusLote
      expect(mockRecalcularStatusLote).not.toHaveBeenCalled();
    });
  });

  describe('Error handling - conclusão não bloqueada', () => {
    it('deve concluir avaliação MESMO SE calcularResultados falhar', async () => {
      // Simular erro no cálculo de resultados
      mockCalcularResultados.mockImplementation(() => {
        throw new Error('Erro no cálculo de resultados');
      });

      mockQuery
        // Buscar avaliação atual
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // COUNT FROM respostas (37 respostas)
        .mockResolvedValueOnce({ rows: [{ total: '37' }], rowCount: 1 })
        // SELECT respostas para cálculo (vai falhar)
        .mockResolvedValueOnce({
          rows: Array(37)
            .fill(null)
            .map((_, i) => ({ grupo: 1, item: `Q${i}`, valor: 75 })),
          rowCount: 37,
        })
        // SELECT lote_id
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1, numero_ordem: 1 }],
          rowCount: 1,
        })
        // UPDATE funcionarios
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      // Mock queryWithContext para UPDATE avaliacoes (DEVE EXECUTAR)
      mockQueryWithContext.mockResolvedValue({ rows: [], rowCount: 1 });

      mockRecalcularStatusLote.mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({
          item: 'Q37',
          valor: 75,
          grupo: 1,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Deve retornar sucesso
      expect(response.status).toBe(200);
      expect(data.completed).toBe(true);

      // Verificar que UPDATE de status FOI EXECUTADO (fora do try-catch)
      expect(mockQueryWithContext).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE avaliacoes'),
        expect.arrayContaining([1]),
        expect.objectContaining({ cpf: '12345678901' })
      );

      // Verificar que recalcularStatusLote foi chamado
      expect(mockRecalcularStatusLote).toHaveBeenCalledWith(1);

      // Verificar que INSERT INTO resultados NÃO foi executado (erro no cálculo)
      const insertResultadosCall = mockQuery.mock.calls.find((call) =>
        call[0].includes('INSERT INTO resultados')
      );
      expect(insertResultadosCall).toBeUndefined();
    });

    it('deve concluir avaliação MESMO SE INSERT resultados falhar', async () => {
      mockCalcularResultados.mockReturnValue([
        { grupo: 1, score: 75, categoria: 'medio' },
      ]);

      mockQuery
        // Buscar avaliação atual
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // COUNT FROM respostas (37 respostas)
        .mockResolvedValueOnce({ rows: [{ total: '37' }], rowCount: 1 })
        // SELECT respostas para cálculo
        .mockResolvedValueOnce({
          rows: Array(37)
            .fill(null)
            .map((_, i) => ({ grupo: 1, item: `Q${i}`, valor: 75 })),
          rowCount: 37,
        })
        // INSERT INTO resultados (FALHA)
        .mockRejectedValueOnce(new Error('Erro ao inserir resultados'))
        // UPDATE avaliacoes SET status = concluida (DEVE EXECUTAR)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // SELECT lote_id
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1, numero_ordem: 1 }],
          rowCount: 1,
        })
        // UPDATE funcionarios
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      mockRecalcularStatusLote.mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({
          item: 'Q37',
          valor: 75,
          grupo: 1,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Deve retornar sucesso
      expect(response.status).toBe(200);
      expect(data.completed).toBe(true);

      // Verificar que UPDATE de status FOI EXECUTADO
      const updateStatusCall = mockQuery.mock.calls.find(
        (call) =>
          call[0].includes('UPDATE avaliacoes') &&
          call[0].includes("status = 'concluida'")
      );
      expect(updateStatusCall).toBeDefined();

      // Verificar que recalcularStatusLote foi chamado
      expect(mockRecalcularStatusLote).toHaveBeenCalledWith(1);
    });

    it('deve logar erro mas continuar execução quando cálculo falha', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      mockCalcularResultados.mockImplementation(() => {
        throw new Error('ERRO_TESTE_CALCULO');
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ total: '37' }], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: Array(37)
            .fill(null)
            .map((_, i) => ({ grupo: 1, item: `Q${i}`, valor: 75 })),
          rowCount: 37,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1, numero_ordem: 1 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      mockRecalcularStatusLote.mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({
          item: 'Q37',
          valor: 75,
          grupo: 1,
        }),
      });

      await POST(request);

      // Verificar logs
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('COMPLETA! Marcando como concluída')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao calcular resultados'),
        expect.any(Error)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('marcada como concluída')
      );

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('Queries SQL corretas', () => {
    it('deve usar SELECT DISTINCT ON para evitar duplicatas', async () => {
      mockCalcularResultados.mockReturnValue([
        { grupo: 1, score: 75, categoria: 'medio' },
      ]);

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ total: '37' }], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: Array(37)
            .fill(null)
            .map((_, i) => ({ grupo: 1, item: `Q${i}`, valor: 75 })),
          rowCount: 37,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1, numero_ordem: 1 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      mockRecalcularStatusLote.mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({
          item: 'Q37',
          valor: 75,
          grupo: 1,
        }),
      });

      await POST(request);

      // Verificar que SELECT usa DISTINCT ON
      const selectRespostasCall = mockQuery.mock.calls.find(
        (call) =>
          call[0].includes('SELECT DISTINCT ON') &&
          call[0].includes('FROM respostas')
      );
      expect(selectRespostasCall).toBeDefined();
      expect(selectRespostasCall[0]).toContain(
        'SELECT DISTINCT ON (r.grupo, r.item)'
      );
    });

    it('deve usar JOIN correto para buscar lote_id', async () => {
      mockCalcularResultados.mockReturnValue([
        { grupo: 1, score: 75, categoria: 'medio' },
      ]);

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ total: '37' }], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: Array(37)
            .fill(null)
            .map((_, i) => ({ grupo: 1, item: `Q${i}`, valor: 75 })),
          rowCount: 37,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1, numero_ordem: 1 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      mockRecalcularStatusLote.mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({
          item: 'Q37',
          valor: 75,
          grupo: 1,
        }),
      });

      await POST(request);

      // Verificar JOIN correto (avaliacoes -> lotes_avaliacao)
      const joinCall = mockQuery.mock.calls.find(
        (call) =>
          call[0].includes('FROM avaliacoes a') &&
          call[0].includes('JOIN lotes_avaliacao la')
      );
      expect(joinCall).toBeDefined();
      expect(joinCall[0]).toContain('FROM avaliacoes a');
      expect(joinCall[0]).toContain(
        'JOIN lotes_avaliacao la ON a.lote_id = la.id'
      );
    });
  });
});
