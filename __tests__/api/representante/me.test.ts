/**
 * @fileoverview Testes da API GET /api/representante/me
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session-representante');

import { GET } from '@/app/api/representante/me/route';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequire = requireRepresentante as jest.MockedFunction<
  typeof requireRepresentante
>;
const mockErrResp = repAuthErrorResponse as jest.MockedFunction<
  typeof repAuthErrorResponse
>;

describe('GET /api/representante/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: repAuthErrorResponse retorna 500
    mockErrResp.mockReturnValue({
      status: 500,
      body: { error: 'Erro interno.' },
    });
  });

  it('deve retornar 401 quando não há sessão', async () => {
    mockRequire.mockImplementation(() => {
      throw new Error('REP_NAO_AUTENTICADO');
    });
    mockErrResp.mockReturnValue({
      status: 401,
      body: { error: 'Não autenticado. Faça login como representante.' },
    });

    const res = await GET();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/autenticado/i);
  });

  it('deve retornar 404 quando representante não existe no DB', async () => {
    mockRequire.mockReturnValue({
      representante_id: 999,
      nome: 'X',
      email: 'x@x.com',
      codigo: 'XXXX-XXXX',
      status: 'ativo',
      tipo_pessoa: 'pf',
      criado_em_ms: Date.now(),
    });
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('deve retornar 200 com perfil completo para sessão válida', async () => {
    const repDB = {
      id: 1,
      nome: 'Carlos Teste',
      email: 'rep@test.dev',
      codigo: 'AB12-CD34',
      status: 'apto',
      tipo_pessoa: 'pf',
      telefone: '11999990000',
      aceite_termos: true,
      aceite_disclaimer_nv: true,
      criado_em: '2026-01-01T00:00:00Z',
      aprovado_em: '2026-01-15T00:00:00Z',
    };

    mockRequire.mockReturnValue({
      representante_id: 1,
      nome: 'Carlos Teste',
      email: 'rep@test.dev',
      codigo: 'AB12-CD34',
      status: 'apto',
      tipo_pessoa: 'pf',
      criado_em_ms: Date.now(),
    });
    mockQuery.mockResolvedValue({ rows: [repDB], rowCount: 1 } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.representante).toEqual(repDB);
    expect(data.representante.id).toBe(1);
    expect(data.representante.aprovado_em).toBeTruthy();
  });
});
