/**
 * Testes para validar o comportamento de auto-conclusão no POST /api/avaliacao/respostas
 *
 * A lógica de conclusão foi delegada para verificarEConcluirAvaliacao
 * (@/lib/avaliacao-conclusao). A rota apenas chama a função e usa o retorno.
 */

import { POST } from '@/app/api/avaliacao/respostas/route';
import { queryWithContext } from '@/lib/db-security';
import { verificarEConcluirAvaliacao } from '@/lib/avaliacao-conclusao';

// Mocks
jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
  transactionWithContext: jest.fn(),
}));

jest.mock('@/lib/avaliacao-conclusao', () => ({
  verificarEConcluirAvaliacao: jest.fn(),
}));

jest.mock('@/lib/questoes', () => ({
  grupos: [
    { id: 1, itens: Array(37).fill({}), dominio: 'Demanda', tipo: 'normal' },
  ],
}));

const mockRequireAuth = require('@/lib/session').requireAuth;
const mockQueryWithContext = queryWithContext as jest.MockedFunction<
  typeof queryWithContext
>;
const mockVerificarEConcluirAvaliacao =
  verificarEConcluirAvaliacao as jest.MockedFunction<
    typeof verificarEConcluirAvaliacao
  >;

describe('Auto-conclusão com Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      cpf: '12345678901',
      perfil: 'funcionario',
    });
    // Padrão: conclusão não ocorre
    mockVerificarEConcluirAvaliacao.mockResolvedValue({
      concluida: false,
      avaliacaoId: 1,
      totalRespostas: 10,
      mensagem: 'Avaliação incompleta (10/37 respostas)',
    });
  });

  describe('Uso correto da tabela respostas', () => {
    it('deve usar INSERT INTO respostas (não respostas_avaliacao)', async () => {
      // Com avaliacaoId passado: SELECT status → INSERT → (UPDATE se iniciada)
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ status: 'em_andamento' }],
          rowCount: 1,
        }) // SELECT status
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // INSERT INTO respostas

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({ avaliacaoId: 1, item: 'Q1', valor: 75, grupo: 1 }),
      });

      await POST(request);

      const allCalls = mockQueryWithContext.mock.calls.map((call) => call[0]);
      const insertCall = allCalls.find((sql) =>
        sql.includes('INSERT INTO respostas')
      );
      expect(insertCall).toBeDefined();
      expect(insertCall).not.toContain('respostas_avaliacao');
    });
  });

  describe('Auto-conclusão ao atingir 37 respostas', () => {
    it('deve retornar completed:true quando verificarEConcluirAvaliacao retorna concluida:true', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ status: 'iniciada' }],
          rowCount: 1,
        }) // SELECT status
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE status em_andamento

      mockVerificarEConcluirAvaliacao.mockResolvedValue({
        concluida: true,
        avaliacaoId: 1,
        totalRespostas: 37,
        mensagem: 'Avaliação concluída',
      });

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({ avaliacaoId: 1, item: 'Q37', valor: 75, grupo: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completed).toBe(true);
      expect(data.message).toContain('concluída');
      expect(mockVerificarEConcluirAvaliacao).toHaveBeenCalledWith(
        1,
        '12345678901'
      );
    });

    it('NÃO deve concluir se verificarEConcluirAvaliacao retorna concluida:false', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ status: 'iniciada' }],
          rowCount: 1,
        }) // SELECT status
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT INTO respostas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE status em_andamento

      mockVerificarEConcluirAvaliacao.mockResolvedValue({
        concluida: false,
        avaliacaoId: 1,
        totalRespostas: 36,
        mensagem: 'Avaliação incompleta (36/37 respostas)',
      });

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({ avaliacaoId: 1, item: 'Q36', valor: 75, grupo: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completed).toBe(false);
      expect(mockVerificarEConcluirAvaliacao).toHaveBeenCalledWith(
        1,
        '12345678901'
      );
    });
  });

  describe('Error handling - conclusão não bloqueada', () => {
    it('deve retornar 500 se verificarEConcluirAvaliacao lançar erro inesperado', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ status: 'em_andamento' }],
          rowCount: 1,
        }) // SELECT status
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // INSERT INTO respostas

      mockVerificarEConcluirAvaliacao.mockRejectedValue(
        new Error('Erro interno ao concluir')
      );

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({ avaliacaoId: 1, item: 'Q37', valor: 75, grupo: 1 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it('deve chamar verificarEConcluirAvaliacao com avaliacaoId e cpf corretos', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ status: 'em_andamento' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({ avaliacaoId: 42, item: 'Q1', valor: 75, grupo: 1 }),
      });

      await POST(request);

      expect(mockVerificarEConcluirAvaliacao).toHaveBeenCalledWith(
        42,
        '12345678901'
      );
    });

    it('deve buscar avaliação automaticamente quando avaliacaoId não for passado', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ id: 5, lote_id: 1 }],
          rowCount: 1,
        }) // SELECT avaliação por cpf
        .mockResolvedValueOnce({
          rows: [{ status: 'em_andamento' }],
          rowCount: 1,
        }) // SELECT status
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // INSERT INTO respostas

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({ item: 'Q1', valor: 75, grupo: 1 }),
      });

      await POST(request);

      expect(mockVerificarEConcluirAvaliacao).toHaveBeenCalledWith(
        5,
        '12345678901'
      );
    });
  });

  describe('Queries SQL corretas', () => {
    it('deve usar INSERT INTO respostas com ON CONFLICT para idempotência', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ status: 'em_andamento' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({ avaliacaoId: 1, item: 'Q1', valor: 75, grupo: 1 }),
      });

      await POST(request);

      const allCalls = mockQueryWithContext.mock.calls.map((call) => call[0]);
      const insertCall = allCalls.find((sql) =>
        sql.includes('INSERT INTO respostas')
      );
      expect(insertCall).toBeDefined();
      expect(insertCall).toContain('ON CONFLICT');
    });

    it('deve verificar status da avaliação antes de salvar respostas', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ status: 'em_andamento' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({ avaliacaoId: 1, item: 'Q1', valor: 75, grupo: 1 }),
      });

      await POST(request);

      const allCalls = mockQueryWithContext.mock.calls.map((call) => call[0]);
      const statusCall = allCalls.find(
        (sql) =>
          sql.includes('SELECT status') && sql.includes('FROM avaliacoes')
      );
      expect(statusCall).toBeDefined();
    });
  });
});
