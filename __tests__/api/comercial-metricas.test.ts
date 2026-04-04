/**
 * @jest-environment node
 */
const {
  GET: getMetricas,
} = require('@/app/api/comercial/representantes/metricas/route');
const { query } = require('@/lib/db');
const { requireRole } = require('@/lib/session');

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

describe('Portal Comercial - API Metricas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar métricas dos representantes para usuários comercial/admin', async () => {
    requireRole.mockResolvedValue({ cpf: '12345678901', role: 'comercial' });
    query.mockResolvedValue({
      rows: [
        {
          id: 1,
          nome: 'Rep Teste',
          email: 'rep@teste.com',
          status: 'apto',
          codigo: 'REP001',
          leads_ativos: '5',
          leads_mes: '2',
          vinculos_ativos: '10',
          comissoes_pendentes: '3',
          valor_pendente: '1500.50',
        },
      ],
    });

    const res = await getMetricas(
      new Request('http://localhost/api/comercial/representantes/metricas')
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.representantes).toHaveLength(1);
    expect(data.representantes[0].valor_pendente).toBe(1500.5);
    expect(data.representantes[0].leads_ativos).toBe(5);
  });

  it('deve retornar 401/403 se não tiver permissão', async () => {
    requireRole.mockRejectedValue(new Error('Sem permissão'));

    const res = await getMetricas(
      new Request('http://localhost/api/comercial/representantes/metricas')
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Sem permissão');
  });
});

describe('Portal Comercial - SQL Metricas — estrutura da query', () => {
  const fs = require('fs');
  const path = require('path');
  const routePath = path.resolve(
    __dirname,
    '../../app/api/comercial/representantes/metricas/route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('usa hierarquia_comercial para contar vendedores (não vendedores_perfil)', () => {
    expect(src).toMatch(/hierarquia_comercial/);
    expect(src).not.toMatch(
      /FROM public\.vendedores_perfil vp WHERE vp\.representante_id/
    );
  });

  it('filtra hc_v.ativo = true para vendedores ativos', () => {
    expect(src).toMatch(/hc_v\.ativo\s*=\s*true/i);
  });

  it('faz join via hc_v.representante_id = r.id', () => {
    expect(src).toMatch(/hc_v\.representante_id\s*=\s*r\.id/i);
  });
});
