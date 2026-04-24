/**
 * Testes para a API de contagem (/api/admin/contagem)
 * - Validação de retorno de métricas de Entidades
 * - Validação de retorno de métricas de Clínicas
 * - Testes de erro
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/contagem/route';
import * as db from '@/lib/db';

// Mock do módulo de database
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

const mockQuery = db.query as jest.MockedFunction<typeof db.query>;

describe('GET /api/admin/contagem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar métricas com sucesso', async () => {
    // Todas as queries retornam um valor
    mockQuery.mockResolvedValue({ rows: [{ count: '10' }] } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/contagem',
      {
        method: 'GET',
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.entidades).toBeDefined();
    expect(data.clinicas).toBeDefined();
    expect(typeof data.entidades.funcionarios).toBe('number');
    expect(typeof data.entidades.entidades).toBe('number');
    expect(typeof data.clinicas.clinicas).toBe('number');
    expect(Array.isArray(data.lista_entidades)).toBe(true);
    expect(Array.isArray(data.lista_clinicas)).toBe(true);
  });

  it('deve retornar valores zerados quando não há dados', async () => {
    mockQuery.mockResolvedValue({ rows: [{ count: '0' }] } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/contagem',
      {
        method: 'GET',
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.entidades.funcionarios).toBe(0);
    expect(data.clinicas.clinicas).toBe(0);
  });

  it('deve tratar erros de banco de dados adequadamente', async () => {
    mockQuery.mockRejectedValue(new Error('Connection failed'));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/contagem',
      {
        method: 'GET',
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('deve incluir todas as métricas esperadas na resposta', async () => {
    mockQuery.mockResolvedValue({ rows: [{ count: '1' }] } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/contagem',
      {
        method: 'GET',
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.entidades).toHaveProperty('entidades');
    expect(data.entidades).toHaveProperty('funcionarios');
    expect(data.entidades).toHaveProperty('lotes');
    expect(data.entidades).toHaveProperty('laudos');
    expect(data.entidades).toHaveProperty('avaliacoes_liberadas');
    expect(data.entidades).toHaveProperty('avaliacoes_concluidas');

    expect(data.clinicas).toHaveProperty('clinicas');
    expect(data.clinicas).toHaveProperty('funcionarios');
    expect(data.clinicas).toHaveProperty('lotes');
    expect(data.clinicas).toHaveProperty('laudos');
    expect(data.clinicas).toHaveProperty('avaliacoes_liberadas');
    expect(data.clinicas).toHaveProperty('avaliacoes_concluidas');
    expect(data).toHaveProperty('lista_entidades');
    expect(data).toHaveProperty('lista_clinicas');
  });

  it('deve retornar contagens corretas para clínicas (caso RLJ: 2 empresas, 9 funcionários) e entidades (RELEGERE: 4+4)', async () => {
    // Sequência de 14 queries na route GET:
    // 1  entidadesCount    (SELECT COUNT(*) FROM entidades)
    // 2  entidadesFuncionarios
    // 3  entidadesLotes
    // 4  entidadesLaudos
    // 5  entidadesAvaliaoesLiberadas
    // 6  entidadesAvaliaoesConcluidass
    // 7  clinicasCount
    // 8  clinicasFuncionarios
    // 9  clinicasLotes
    // 10 clinicasLaudos
    // 11 clinicasAvaliaoesLiberadas
    // 12 clinicasAvaliaoesConcluidass
    // 13 lista_entidades (usa tabela entidades, fc.ativo)
    // 14 lista_clinicas  (usa fc.ativo e empresa_id de funcionarios_clinicas)
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any) // 1 entidadesCount
      .mockResolvedValueOnce({ rows: [{ count: '8' }] } as any) // 2 entidadesFuncionarios
      .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any) // 3 entidadesLotes
      .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any) // 4 entidadesLaudos
      .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any) // 5 entidadesAvaliacoesLiberadas
      .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any) // 6 entidadesAvaliacoesConcluidas
      .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any) // 7 clinicasCount
      .mockResolvedValueOnce({ rows: [{ count: '9' }] } as any) // 8 clinicasFuncionarios
      .mockResolvedValueOnce({ rows: [{ count: '3' }] } as any) // 9 clinicasLotes
      .mockResolvedValueOnce({ rows: [{ count: '2' }] } as any) // 10 clinicasLaudos
      .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any) // 11 clinicasAvaliacoesLiberadas
      .mockResolvedValueOnce({ rows: [{ count: '9' }] } as any) // 12 clinicasAvaliacoesConcluidas
      // 13 lista_entidades — RELEGERE: 4 ativos, 4 inativos
      // Query usa tabela `entidades` + funcionarios_entidades.ativo (fe.ativo)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'RELEGERE',
            ativa: true,
            criado_em: '2025-01-01T00:00:00.000Z',
            data_aceite: '2025-01-10T00:00:00.000Z',
            ativos: 4,
            inativos: 4,
          },
        ],
      } as any)
      // 14 lista_clinicas — RLJ: 2 empresas (via funcionarios_clinicas.empresa_id DISTINCT),
      //   6 ativos + 3 inativos via funcionarios.ativo (f.ativo, NÃO fc.ativo)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 42,
            nome: 'RLJ COMERCIAL EXPORTADORA LTDA',
            ativa: true,
            criado_em: '2025-02-01T00:00:00.000Z',
            data_aceite: '2025-02-15T00:00:00.000Z',
            empresas_clientes: 2, // DISTINCT empresa_id de funcionarios_clinicas
            ativos: 6, // fc.ativo = true
            inativos: 3, // fc.ativo = false
          },
        ],
      } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/contagem',
      { method: 'GET' }
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Validar RELEGERE (entidade): 4 ativos + 4 inativos
    expect(data.lista_entidades).toHaveLength(1);
    const relegere = data.lista_entidades[0];
    expect(relegere.nome).toBe('RELEGERE');
    expect(relegere.ativos).toBe(4);
    expect(relegere.inativos).toBe(4);
    expect(relegere.ativos + relegere.inativos).toBe(8);

    // Validar RLJ (clínica): 2 empresas, 6+3=9 funcionários
    expect(data.lista_clinicas).toHaveLength(1);
    const rlj = data.lista_clinicas[0];
    expect(rlj.empresas_clientes).toBe(2);
    expect(rlj.ativos).toBe(6);
    expect(rlj.inativos).toBe(3);
    expect(rlj.ativos + rlj.inativos).toBe(9);
  });
});
