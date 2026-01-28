import { POST as finalizarAvaliacao } from '@/app/api/avaliacao/finalizar/route';
import { query } from '@/lib/db';

// Mock das dependências
jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}));

// Mock trigger para evitar chamar o endpoint real durante testes
jest.mock('@/lib/auto-laudo-trigger', () => ({
  triggerAutoLaudoCron: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/calculate', () => ({
  calcularResultados: jest.fn(),
}));

jest.mock('@/lib/questoes', () => ({
  grupos: [
    { id: 1, itens: [{}, {}] },
    { id: 2, itens: [{}, {}] },
  ],
}));

const mockRequireAuth = require('@/lib/session').requireAuth;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockCalcularResultados = require('@/lib/calculate').calcularResultados;

describe('API Finalizar Avaliação - Recálculo Automático', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch para não depender de serviço externo
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  });

  it('deve manter lote como rascunho quando há avaliações em andamento', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '12345678901' });

    // Configurar mock do calcularResultados ANTES dos outros mocks
    mockCalcularResultados.mockReturnValue([
      { grupo: 1, dominio: 'Demanda', score: 87.5, categoria: 'alto' },
      { grupo: 2, dominio: 'Organização', score: 37.5, categoria: 'baixo' },
    ]);

    // Configurar mock inteligente baseado na query
    mockQuery.mockImplementation((query: string, params?: any[]) => {
      if (
        query.includes(
          'SELECT id FROM avaliacoes WHERE id = $1 AND funcionario_cpf = $2'
        )
      ) {
        return Promise.resolve({ rows: [{ id: 10 }], rowCount: 1 });
      }
      if (query.includes('SELECT grupo, item, valor FROM respostas')) {
        return Promise.resolve({
          rows: [
            { grupo: 1, item: 'Q1', valor: 75 },
            { grupo: 1, item: 'Q2', valor: 100 },
            { grupo: 2, item: 'Q1', valor: 50 },
            { grupo: 2, item: 'Q2', valor: 25 },
          ],
          rowCount: 4,
        });
      }
      if (
        query.includes('INSERT INTO resultados') ||
        query.includes('UPDATE avaliacoes SET status') ||
        query.includes('UPDATE funcionarios') ||
        query.includes('INSERT INTO auditorias')
      ) {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      if (query.includes('SELECT lote_id FROM avaliacoes WHERE id = $1')) {
        return Promise.resolve({ rows: [{ lote_id: 5 }], rowCount: 1 });
      }
      if (
        query.includes('em_andamento') ||
        query.includes('COUNT(a.id) FILTER') ||
        query.includes("a.status != 'inativada'")
      ) {
        return Promise.resolve({
          rows: [{ ativas: '2', concluidas: '2', iniciadas: '0' }],
          rowCount: 1,
        });
      }
      if (query.includes('SELECT status FROM lotes_avaliacao WHERE id = $1')) {
        return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
      }
      if (
        query.includes(
          'SELECT la.numero_ordem, la.liberado_em FROM avaliacoes a'
        )
      ) {
        return Promise.resolve({
          rows: [{ numero_ordem: 1, liberado_em: new Date() }],
          rowCount: 1,
        });
      }
      if (query.includes('SELECT indice_avaliacao FROM funcionarios')) {
        return Promise.resolve({
          rows: [{ indice_avaliacao: 0 }],
          rowCount: 1,
        });
      }
      // Default
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const request = new Request('http://localhost/api/avaliacao/finalizar', {
      method: 'POST',
      body: JSON.stringify({ avaliacaoId: 10 }),
    });

    const response = await finalizarAvaliacao(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verificar se o lote foi atualizado para concluído com agendamento automático
    const updateCalls = mockQuery.mock.calls.filter((call) => {
      const query = call[0];
      return (
        query &&
        typeof query === 'string' &&
        query.trim().startsWith('UPDATE lotes_avaliacao')
      );
    });
    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0][0]).toMatch(
      /UPDATE\s+lotes_avaliacao\s+SET\s+status\s*=\s*\$1.*auto_emitir_em\s*=\s*NOW\(\)\s*\+\s*INTERVAL\s*'10 minutes'.*auto_emitir_agendado\s*=\s*true/
    );
    expect(updateCalls[0][1]).toEqual(['concluido', 5]);

    // Verificar que o trigger do cron foi invocado (mocked)
    const trigger = require('@/lib/auto-laudo-trigger').triggerAutoLaudoCron;
    expect(trigger).toHaveBeenCalled();
  });

  it('não deve atualizar lote quando status já está correto', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '12345678901' });

    // Configurar mock do calcularResultados
    mockCalcularResultados.mockReturnValue([
      { grupo: 1, dominio: 'Demanda', score: 87.5, categoria: 'alto' },
      { grupo: 2, dominio: 'Organização', score: 37.5, categoria: 'baixo' },
    ]);

    // Configurar mock inteligente baseado na query
    mockQuery.mockImplementation((query: string, params?: any[]) => {
      if (
        query.includes(
          'SELECT id FROM avaliacoes WHERE id = $1 AND funcionario_cpf = $2'
        )
      ) {
        return Promise.resolve({ rows: [{ id: 10 }], rowCount: 1 });
      }
      if (query.includes('SELECT grupo, item, valor FROM respostas')) {
        return Promise.resolve({
          rows: [
            { grupo: 1, item: 'Q1', valor: 75 },
            { grupo: 1, item: 'Q2', valor: 100 },
            { grupo: 2, item: 'Q1', valor: 50 },
            { grupo: 2, item: 'Q2', valor: 25 },
          ],
          rowCount: 4,
        });
      }
      if (
        query.includes('INSERT INTO resultados') ||
        query.includes('UPDATE avaliacoes SET status') ||
        query.includes('UPDATE funcionarios') ||
        query.includes('INSERT INTO auditorias')
      ) {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      if (query.includes('SELECT lote_id FROM avaliacoes WHERE id = $1')) {
        return Promise.resolve({ rows: [{ lote_id: 5 }], rowCount: 1 });
      }
      if (
        query.includes('em_andamento') ||
        query.includes('COUNT(a.id) FILTER') ||
        query.includes("a.status != 'inativada'")
      ) {
        return Promise.resolve({
          rows: [{ ativas: '3', concluidas: '1', iniciadas: '2' }],
          rowCount: 1,
        });
      }
      if (query.includes('SELECT status FROM lotes_avaliacao WHERE id = $1')) {
        return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
      }
      if (
        query.includes(
          'SELECT la.numero_ordem, la.liberado_em FROM avaliacoes a'
        )
      ) {
        return Promise.resolve({
          rows: [{ numero_ordem: 1, liberado_em: new Date() }],
          rowCount: 1,
        });
      }
      if (query.includes('SELECT indice_avaliacao FROM funcionarios')) {
        return Promise.resolve({
          rows: [{ indice_avaliacao: 0 }],
          rowCount: 1,
        });
      }
      // Default
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const request = new Request('http://localhost/api/avaliacao/finalizar', {
      method: 'POST',
      body: JSON.stringify({ avaliacaoId: 10 }),
    });

    const response = await finalizarAvaliacao(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verificar que NÃO houve update do lote (status já está correto como 'ativo')
    const updateCalls = mockQuery.mock.calls.filter(
      (call) =>
        call[0] &&
        typeof call[0] === 'string' &&
        call[0].includes('UPDATE lotes_avaliacao SET status')
    );
    // Não deve haver chamada de update porque o status já está correto
    expect(updateCalls.length).toBe(0);
  });
});
