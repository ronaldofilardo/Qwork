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
  transactionWithContext: jest.fn(),
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
const { transactionWithContext } = require('@/lib/db-security');
const mockTransactionWithContext =
  transactionWithContext as jest.MockedFunction<typeof transactionWithContext>;
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

    // Mock padrão de transactionWithContext para executar callback
    mockTransactionWithContext.mockImplementation(async (callback: any) => {
      const queryTx = jest.fn().mockResolvedValue({ rows: [], rowCount: 1 });
      return await callback(queryTx);
    });
  });

  describe('Uso correto da tabela respostas', () => {
    it('deve usar tabela "respostas" (não respostas_avaliacao) em todas as queries', async () => {
      mockQueryWithContext
        // Buscar avaliação atual
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // SELECT status
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // UPDATE status para em_andamento
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
      const allCalls = mockQueryWithContext.mock.calls.map((call) => call[0]);

      // INSERT deve usar "respostas"
      const insertCall = allCalls.find((sql) =>
        sql.includes('INSERT INTO respostas')
      );
      expect(insertCall).toBeDefined();
      expect(insertCall).not.toContain('respostas_avaliacao');

      // COUNT deve usar "respostas"
      const countCall = allCalls.find(
        (sql) => sql.includes('COUNT') && sql.includes('FROM respostas')
      );
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

      mockQueryWithContext
        // INSERT INTO respostas (como avaliacaoId é passado, não busca avaliação)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // SELECT status
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // UPDATE status para em_andamento
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // COUNT FROM respostas (37 respostas) - para verificarEConcluirAvaliacao
        .mockResolvedValueOnce({ rows: [{ total: '37' }], rowCount: 1 })
        // SELECT status novamente (para verificarEConcluirAvaliacao)
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // SELECT lote_id com JOIN (após transação para recalcularStatusLote)
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1 }],
          rowCount: 1,
        });

      mockRecalcularStatusLote.mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({
          avaliacaoId: 1,
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

      // Verificar que transactionWithContext foi chamado para conclusão
      expect(mockTransactionWithContext).toHaveBeenCalled();

      // Verificar que recalcularStatusLote foi chamado
      expect(mockRecalcularStatusLote).toHaveBeenCalledWith(1);
    });

    it('NÃO deve concluir se tiver menos de 37 respostas', async () => {
      mockQueryWithContext
        // INSERT INTO respostas (como avaliacaoId é passado)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // SELECT status
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // UPDATE status para em_andamento
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // COUNT FROM respostas (apenas 36)
        .mockResolvedValueOnce({ rows: [{ total: '36' }], rowCount: 1 });

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({
          avaliacaoId: 1,
          item: 'Q36',
          valor: 75,
          grupo: 1,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completed).toBe(false);

      // Não deve ter UPDATE de status de conclusão
      const updateConclusaoCall = mockQueryWithContext.mock.calls.find(
        (call) =>
          call[0].includes('UPDATE avaliacoes') && call[0].includes('concluida')
      );
      expect(updateConclusaoCall).toBeUndefined();

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

      mockQueryWithContext
        // Buscar avaliação atual
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // SELECT status
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // UPDATE status para em_andamento
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // COUNT FROM respostas (37 respostas)
        .mockResolvedValueOnce({ rows: [{ total: '37' }], rowCount: 1 })
        // SELECT status novamente
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // SELECT lote_id (após transação para recalcularStatusLote)
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1 }],
          rowCount: 1,
        });

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

      // Verificar que transactionWithContext foi usado para conclusão
      expect(mockTransactionWithContext).toHaveBeenCalled();

      // Verificar que recalcularStatusLote foi chamado com avaliacaoId
      expect(mockRecalcularStatusLote).toHaveBeenCalledWith(1);

      // Verificar que INSERT INTO resultados NÃO foi executado (erro no cálculo)
      const insertResultadosCall = mockQueryWithContext.mock.calls.find(
        (call) => call[0].includes('INSERT INTO resultados')
      );
      expect(insertResultadosCall).toBeUndefined();
    });

    it('deve concluir avaliação MESMO SE INSERT resultados falhar', async () => {
      mockCalcularResultados.mockReturnValue([
        { grupo: 1, score: 75, categoria: 'medio' },
      ]);

      mockQueryWithContext
        // Buscar avaliação atual
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // SELECT status
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // UPDATE status para em_andamento
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // COUNT FROM respostas (37 respostas)
        .mockResolvedValueOnce({ rows: [{ total: '37' }], rowCount: 1 })
        // SELECT status novamente (para verificarEConcluirAvaliacao)
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // SELECT lote_id (após transação para recalcularStatusLote)
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1 }],
          rowCount: 1,
        });

      // Mock transactionWithContext para executar callback com queryTx que falha em INSERT resultados
      mockTransactionWithContext.mockImplementation(async (callback: any) => {
        const queryTx = jest.fn();
        // SELECT respostas para cálculo
        queryTx.mockResolvedValueOnce({
          rows: Array(37)
            .fill(null)
            .map((_, i) => ({ grupo: 1, item: `Q${i}`, valor: 75 })),
          rowCount: 37,
        });
        // INSERT INTO resultados (FALHA)
        queryTx.mockRejectedValueOnce(new Error('Erro ao inserir resultados'));
        // UPDATE avaliacoes SET status = concluida (DEVE EXECUTAR)
        queryTx.mockResolvedValueOnce({ rows: [], rowCount: 1 });
        // SELECT lote_id (dentro da transação)
        queryTx.mockResolvedValueOnce({
          rows: [{ lote_id: 1, numero_ordem: 1 }],
          rowCount: 1,
        });
        // UPDATE funcionarios
        queryTx.mockResolvedValueOnce({ rows: [], rowCount: 1 });
        return await callback(queryTx);
      });

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

      // Verificar que transactionWithContext foi usado para conclusão
      expect(mockTransactionWithContext).toHaveBeenCalled();

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

      mockQueryWithContext
        // Buscar avaliação atual
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // SELECT status
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // UPDATE status para em_andamento
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // COUNT FROM respostas (37 respostas)
        .mockResolvedValueOnce({ rows: [{ total: '37' }], rowCount: 1 })
        // SELECT status novamente (em verificarEConcluirAvaliacao)
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // SELECT lote_id (após transação para recalcularStatusLote)
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1 }],
          rowCount: 1,
        });

      // Mock transactionWithContext para executar callback que falha
      mockTransactionWithContext.mockImplementation(async (callback: any) => {
        const queryTx = jest.fn();
        // SELECT respostas para cálculo
        queryTx.mockResolvedValueOnce({
          rows: Array(37)
            .fill(null)
            .map((_, i) => ({ grupo: 1, item: `Q${i}`, valor: 75 })),
          rowCount: 37,
        });
        // UPDATE avaliacoes SET status = concluida (vai ser executado mesmo com erro no cálculo)
        queryTx.mockResolvedValueOnce({ rows: [], rowCount: 1 });
        // SELECT lote_id (dentro da transação)
        queryTx.mockResolvedValueOnce({
          rows: [{ lote_id: 1, numero_ordem: 1 }],
          rowCount: 1,
        });
        // UPDATE funcionarios
        queryTx.mockResolvedValueOnce({ rows: [], rowCount: 1 });
        return await callback(queryTx);
      });

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
        expect.stringContaining('COMPLETA (37/37 respostas)')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao calcular resultados'),
        expect.any(Error)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('concluída automaticamente')
      );

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('Queries SQL corretas', () => {
    it('deve usar SELECT DISTINCT ON para evitar duplicatas', async () => {
      mockCalcularResultados.mockReturnValue([
        { grupo: 1, dominio: 'Demanda', score: 75, categoria: 'medio' },
      ]);

      // Spy para capturar chamadas do queryTx dentro da transação
      let queryTxCalls: any[] = [];
      mockTransactionWithContext.mockImplementation(async (callback: any) => {
        const queryTx = jest.fn(async (sql: string, params?: any[]) => {
          queryTxCalls.push([sql, params]);
          // Simular respostas esperadas
          if (sql.includes('SELECT DISTINCT ON')) {
            return {
              rows: Array(37)
                .fill(null)
                .map((_, i) => ({ grupo: 1, item: `Q${i}`, valor: 75 })),
              rowCount: 37,
            };
          }
          if (sql.includes('JOIN lotes_avaliacao')) {
            return { rows: [{ lote_id: 1, numero_ordem: 1 }], rowCount: 1 };
          }
          return { rows: [], rowCount: 1 };
        });
        return await callback(queryTx);
      });

      mockQueryWithContext
        // Buscar avaliação atual
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // SELECT status
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // UPDATE status para em_andamento
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // COUNT FROM respostas (37 respostas)
        .mockResolvedValueOnce({ rows: [{ total: '37' }], rowCount: 1 })
        // SELECT status novamente (em verificarEConcluirAvaliacao)
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // SELECT lote_id com JOIN (após transação para recalcularStatusLote)
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1 }],
          rowCount: 1,
        });

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

      // Verificar que SELECT dentro de transactionWithContext usa DISTINCT ON
      const selectRespostasCall = queryTxCalls.find(
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
        { grupo: 1, dominio: 'Demanda', score: 75, categoria: 'medio' },
      ]);

      // Spy para capturar chamadas do queryTx dentro da transação
      let queryTxCalls: any[] = [];
      mockTransactionWithContext.mockImplementation(async (callback: any) => {
        const queryTx = jest.fn(async (sql: string, params?: any[]) => {
          queryTxCalls.push([sql, params]);
          // Simular respostas esperadas
          if (sql.includes('SELECT DISTINCT ON')) {
            return {
              rows: Array(37)
                .fill(null)
                .map((_, i) => ({ grupo: 1, item: `Q${i}`, valor: 75 })),
              rowCount: 37,
            };
          }
          if (sql.includes('JOIN lotes_avaliacao')) {
            return { rows: [{ lote_id: 1, numero_ordem: 1 }], rowCount: 1 };
          }
          return { rows: [], rowCount: 1 };
        });
        return await callback(queryTx);
      });

      mockQueryWithContext
        // Buscar avaliação atual
        .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: 1 }], rowCount: 1 })
        // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // SELECT status
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // UPDATE status para em_andamento
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        // COUNT FROM respostas (37 respostas)
        .mockResolvedValueOnce({ rows: [{ total: '37' }], rowCount: 1 })
        // SELECT status novamente (em verificarEConcluirAvaliacao)
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        // SELECT lote_id com JOIN (após transação para recalcularStatusLote)
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1 }],
          rowCount: 1,
        });

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

      // Verificar JOIN correto dentro de transactionWithContext (avaliacoes -> lotes_avaliacao)
      const joinCall = queryTxCalls.find(
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
