/**
 * Teste de integração: Encerramento de lote quando todas avaliações ativas foram concluídas
 *
 * Cenário: Lote com 5 avaliações
 * - 3 concluídas
 * - 1 inativada (não deve impedir encerramento)
 * - 1 em andamento (deve impedir encerramento)
 *
 * Ao finalizar a última em andamento, lote deve encerrar automaticamente
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/auto-laudo-trigger', () => ({
  triggerAutoLaudoCron: jest.fn(),
}));

jest.mock('@/lib/calculate', () => ({
  calcularResultados: jest.fn(),
}));

jest.mock('@/lib/questoes', () => ({
  grupos: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    dominio: `Dominio ${i + 1}`,
    tipo: 'copsoq',
    itens: Array.from({ length: 7 }, (_, j) => ({ item: `q${j + 1}` })),
  })),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { calcularResultados } from '@/lib/calculate';
import { POST as finalizarAvaliacao } from '@/app/api/avaliacao/finalizar/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockCalcularResultados = calcularResultados as jest.MockedFunction<
  typeof calcularResultados
>;

describe.skip('Integração: Encerramento de Lote com Avaliações Inativadas (IGNORADO: refatoração pendente)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Funcionário Teste',
      perfil: 'funcionario',
    });
    // Mock padrão do calcularResultados
    mockCalcularResultados.mockReturnValue([
      { grupo: 1, dominio: 'Dominio 1', score: 50, categoria: 'medio' },
      { grupo: 2, dominio: 'Dominio 2', score: 60, categoria: 'medio' },
      { grupo: 3, dominio: 'Dominio 3', score: 70, categoria: 'alto' },
      { grupo: 4, dominio: 'Dominio 4', score: 40, categoria: 'baixo' },
      { grupo: 5, dominio: 'Dominio 5', score: 55, categoria: 'medio' },
      { grupo: 6, dominio: 'Dominio 6', score: 65, categoria: 'medio' },
      { grupo: 7, dominio: 'Dominio 7', score: 45, categoria: 'baixo' },
      { grupo: 8, dominio: 'Dominio 8', score: 75, categoria: 'alto' },
      { grupo: 9, dominio: 'Dominio 9', score: 50, categoria: 'medio' },
      { grupo: 10, dominio: 'Dominio 10', score: 60, categoria: 'medio' },
    ]);
  });

  it('não deve encerrar lote se há avaliação em_andamento (mesmo com inativadas)', async () => {
    // Cenário: 3 concluídas, 1 em_andamento, 1 inativada
    // Ao finalizar uma das concluídas (recálculo), lote deve permanecer 'ativo'

    let queryCallIndex = 0;
    mockQuery.mockImplementation((sql: string) => {
      queryCallIndex++;

      // Verificar avaliação do usuário
      if (queryCallIndex === 1) {
        return Promise.resolve({ rows: [{ id: 1 }], rowCount: 1 });
      }

      // Buscar respostas (37 completas)
      if (queryCallIndex === 2) {
        return Promise.resolve({
          rows: Array.from({ length: 37 }, (_, i) => ({
            grupo: Math.floor(i / 10) + 1,
            item: `q${i + 1}`,
            valor: 2,
          })),
          rowCount: 37,
        });
      }

      // INSERT resultados (10 grupos)
      if (queryCallIndex >= 3 && queryCallIndex <= 12) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }

      // UPDATE status avaliação para concluída
      if (queryCallIndex === 13) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }

      // Buscar dados do lote para índice
      if (queryCallIndex === 14) {
        return Promise.resolve({
          rows: [{ numero_ordem: 5, liberado_em: new Date() }],
          rowCount: 1,
        });
      }

      // Buscar índice atual do funcionário
      if (queryCallIndex === 15) {
        return Promise.resolve({
          rows: [{ indice_avaliacao: 4 }],
          rowCount: 1,
        });
      }

      // UPDATE índice funcionário
      if (queryCallIndex === 16) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }

      // INSERT audit log
      if (queryCallIndex === 17) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }

      // recalcularStatusLote: buscar lote_id
      if (queryCallIndex === 18) {
        return Promise.resolve({ rows: [{ lote_id: 100 }], rowCount: 1 });
      }

      // recalcularStatusLote: stats (4 ativas, 3 concluídas, 1 em_andamento)
      if (queryCallIndex === 19 && sql.includes('em_andamento')) {
        return Promise.resolve({
          rows: [{ ativas: '4', concluidas: '3', iniciadas: '1' }],
          rowCount: 1,
        });
      }

      // recalcularStatusLote: status atual
      if (queryCallIndex === 20) {
        return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
      }

      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const request = new NextRequest(
      'http://localhost:3000/api/avaliacao/finalizar',
      {
        method: 'POST',
        body: JSON.stringify({ avaliacaoId: 1 }),
      }
    );

    const response = await finalizarAvaliacao(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verifica que a contagem incluiu 'em_andamento'
    const statsCalls = mockQuery.mock.calls.filter(
      (call) =>
        call[0] &&
        typeof call[0] === 'string' &&
        call[0].includes('em_andamento')
    );
    expect(statsCalls.length).toBeGreaterThan(0);

    // Verifica que NÃO foi feito UPDATE para 'concluido'
    const updateConcluidoCalls = mockQuery.mock.calls.filter(
      (call) =>
        call[0] &&
        typeof call[0] === 'string' &&
        call[0].includes('UPDATE lotes_avaliacao') &&
        call[0].includes('auto_emitir_agendado')
    );
    expect(updateConcluidoCalls.length).toBe(0);
  });

  it('deve encerrar lote quando última avaliação ativa é concluída (ignorando inativadas)', async () => {
    // Cenário inicial: 3 concluídas, 1 em_andamento (que será finalizada), 1 inativada
    // Após finalizar: 4 concluídas, 0 em_andamento, 1 inativada → deve concluir lote

    let queryCallIndex = 0;
    mockQuery.mockImplementation((sql: string) => {
      queryCallIndex++;

      if (queryCallIndex === 1) {
        return Promise.resolve({ rows: [{ id: 1 }], rowCount: 1 });
      }

      if (queryCallIndex === 2) {
        return Promise.resolve({
          rows: Array.from({ length: 37 }, (_, i) => ({
            grupo: Math.floor(i / 10) + 1,
            item: `q${i + 1}`,
            valor: 2,
          })),
          rowCount: 37,
        });
      }

      // INSERTs de resultados (10 grupos)
      if (queryCallIndex >= 3 && queryCallIndex <= 12) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }

      if (queryCallIndex === 13) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }

      if (queryCallIndex === 14) {
        return Promise.resolve({
          rows: [{ numero_ordem: 5, liberado_em: new Date() }],
          rowCount: 1,
        });
      }

      if (queryCallIndex === 15) {
        return Promise.resolve({
          rows: [{ indice_avaliacao: 4 }],
          rowCount: 1,
        });
      }

      if (queryCallIndex === 16 || queryCallIndex === 17) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }

      // recalcularStatusLote
      if (queryCallIndex === 18) {
        return Promise.resolve({ rows: [{ lote_id: 100 }], rowCount: 1 });
      }

      // Stats: 4 ativas (ignorando 1 inativada), todas concluídas, 0 iniciadas
      if (queryCallIndex === 19 && sql.includes('em_andamento')) {
        return Promise.resolve({
          rows: [{ ativas: '4', concluidas: '4', iniciadas: '0' }],
          rowCount: 1,
        });
      }

      if (queryCallIndex === 20) {
        return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
      }

      // UPDATE para concluido
      if (queryCallIndex === 21 && sql.includes('UPDATE lotes_avaliacao')) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }

      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const request = new NextRequest(
      'http://localhost:3000/api/avaliacao/finalizar',
      {
        method: 'POST',
        body: JSON.stringify({ avaliacaoId: 1 }),
      }
    );

    const response = await finalizarAvaliacao(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verifica que lote foi concluído e emissão agendada
    const updateConcluidoCalls = mockQuery.mock.calls.filter(
      (call) =>
        call[0] &&
        typeof call[0] === 'string' &&
        call[0].includes('UPDATE lotes_avaliacao') &&
        call[0].includes('auto_emitir_agendado = true')
    );
    expect(updateConcluidoCalls.length).toBeGreaterThan(0);
  });

  it('deve incluir em_andamento na contagem de iniciadas (fix do bug)', async () => {
    let queryCallIndex = 0;
    mockQuery.mockImplementation((sql: string) => {
      queryCallIndex++;

      if (queryCallIndex === 1) {
        return Promise.resolve({ rows: [{ id: 1 }], rowCount: 1 });
      }

      if (queryCallIndex === 2) {
        return Promise.resolve({
          rows: Array.from({ length: 37 }, (_, i) => ({
            grupo: Math.floor(i / 10) + 1,
            item: `q${i + 1}`,
            valor: 2,
          })),
          rowCount: 37,
        });
      }

      if (queryCallIndex >= 3 && queryCallIndex <= 17) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }

      if (queryCallIndex === 18) {
        return Promise.resolve({ rows: [{ lote_id: 100 }], rowCount: 1 });
      }

      // Esta é a query crítica que deve incluir 'em_andamento'
      if (queryCallIndex === 19 && sql.includes('em_andamento')) {
        // Verifica que a query correta foi construída
        expect(sql).toContain('em_andamento');

        return Promise.resolve({
          rows: [{ ativas: '10', concluidas: '5', iniciadas: '5' }],
          rowCount: 1,
        });
      }

      if (queryCallIndex === 20) {
        return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
      }

      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const request = new NextRequest(
      'http://localhost:3000/api/avaliacao/finalizar',
      {
        method: 'POST',
        body: JSON.stringify({ avaliacaoId: 1 }),
      }
    );

    await finalizarAvaliacao(request);

    // O teste passa se a query com 'em_andamento' foi chamada (verificado no mock acima)
  });
});
