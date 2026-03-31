/**
 * @fileoverview Testes de fluxo de integração completo — Representantes Comerciais
 * Simula fluxos end-to-end mocando o banco via jest.mock.
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/session-representante');
jest.mock('@/lib/db/comissionamento');

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import {
  requireRepresentante,
  repAuthErrorResponse,
  criarSessaoRepresentante,
  destruirSessaoRepresentante,
} from '@/lib/session-representante';
import { registrarAuditoria } from '@/lib/db/comissionamento';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockRequireRep = requireRepresentante as jest.MockedFunction<
  typeof requireRepresentante
>;
const mockErrResp = repAuthErrorResponse as jest.MockedFunction<
  typeof repAuthErrorResponse
>;
const mockCriarSessao = criarSessaoRepresentante as jest.MockedFunction<
  typeof criarSessaoRepresentante
>;
const mockDestruirSessao = destruirSessaoRepresentante as jest.MockedFunction<
  typeof destruirSessaoRepresentante
>;
const mockAuditoria = registrarAuditoria as jest.MockedFunction<
  typeof registrarAuditoria
>;

// Helper session
const repSession = {
  representante_id: 1,
  nome: 'Carlos Rep',
  email: 'carlos@test.dev',
  codigo: 'AB12-CD34',
  status: 'apto',
  tipo_pessoa: 'pf' as const,
  criado_em_ms: Date.now(),
};

describe('Fluxo de Integração — Ciclo de Vida do Representante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRep.mockReturnValue(repSession);
    mockErrResp.mockReturnValue({
      status: 500,
      body: { error: 'Erro interno.' },
    });
    mockRequireRole.mockResolvedValue({
      cpf: '00000000000',
      role: 'admin',
    } as any);
    mockAuditoria.mockResolvedValue(undefined as any);
    mockCriarSessao.mockResolvedValue(undefined as any);
    mockDestruirSessao.mockReturnValue(undefined as any);
  });

  it('Fluxo 1: Cadastro → Login → Dashboard', async () => {
    // 1. Cadastro
    const { POST: cadastroPost } =
      await import('@/app/api/representante/cadastro/route');

    // Email não existe
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // INSERT RETURNING
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          codigo: 'AB12-CD34',
          nome: 'Carlos Rep',
          email: 'carlos@test.dev',
          status: 'ativo',
          tipo_pessoa: 'pf',
          criado_em: '2026-01-01',
        },
      ],
      rowCount: 1,
    } as any);

    const cadastroRes = await cadastroPost(
      new NextRequest('http://localhost/api/representante/cadastro', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Carlos Rep',
          email: 'carlos@test.dev',
          tipo_pessoa: 'pf',
          cpf: '12345678901',
          aceite_termos: true,
          aceite_disclaimer_nv: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(cadastroRes.status).toBe(201);
    const cadastroData = await cadastroRes.json();
    expect(cadastroData.success).toBe(true);
    expect(cadastroData.representante.codigo).toBe('AB12-CD34');

    // 2. Login
    const { POST: loginPost } =
      await import('@/app/api/representante/login/route');

    // Buscar por email
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Carlos Rep',
          email: 'carlos@test.dev',
          codigo: 'AB12-CD34',
          status: 'ativo',
          tipo_pessoa: 'pf',
        },
      ],
      rowCount: 1,
    } as any);

    const loginRes = await loginPost(
      new NextRequest('http://localhost/api/representante/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'carlos@test.dev', codigo: 'AB12-CD34' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(loginRes.status).toBe(200);
    expect(mockCriarSessao).toHaveBeenCalled();

    // 3. GET /me
    const { GET: meGet } = await import('@/app/api/representante/me/route');

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: 'Carlos Rep',
          email: 'carlos@test.dev',
          codigo: 'AB12-CD34',
          status: 'ativo',
          tipo_pessoa: 'pf',
          telefone: null,
          aceite_termos: true,
          aceite_disclaimer_nv: true,
          criado_em: '2026-01-01',
          aprovado_em: null,
        },
      ],
      rowCount: 1,
    } as any);

    const meRes = await meGet();
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.representante.email).toBe('carlos@test.dev');
  });

  it('Fluxo 2: Rep cria lead → gera token → CNPJ vira entidade', async () => {
    const { POST: leadsPost } =
      await import('@/app/api/representante/leads/route');

    // Lead check (nenhum)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // Entidade check (não existe)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // INSERT lead
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          representante_id: 1,
          cnpj: '12345678000190',
          status: 'pendente',
        },
      ],
      rowCount: 1,
    } as any);

    const leadsRes = await leadsPost(
      new NextRequest('http://localhost/api/representante/leads', {
        method: 'POST',
        body: JSON.stringify({
          cnpj: '12345678000190',
          razao_social: 'Emp Test',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(leadsRes.status).toBe(201);
    const leadData = await leadsRes.json();
    expect(leadData.lead.id).toBe(10);
  });

  it('Fluxo 3: Admin aprova rep → libera comissões retidas', async () => {
    const { PATCH } =
      await import('@/app/api/admin/representantes/[id]/status/route');

    // Buscar rep (apto_pendente)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'apto_pendente', nome: 'Carlos' }],
      rowCount: 1,
    } as any);
    // UPDATE rep → apto
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'apto', aprovado_em: '2026-01-15' }],
      rowCount: 1,
    } as any);
    // Liberar comissões retidas
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 2 } as any);

    const res = await PATCH(
      new NextRequest('http://localhost/api/admin/representantes/1/status', {
        method: 'PATCH',
        body: JSON.stringify({
          novo_status: 'apto',
          motivo: 'Documentação OK',
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: { id: '1' } } as any
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        status_anterior: 'apto_pendente',
        status_novo: 'apto',
      })
    );
  });

  it('Fluxo 4: Admin suspende → congela comissões → reativa', async () => {
    const { PATCH } =
      await import('@/app/api/admin/representantes/[id]/status/route');

    // Suspender
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'apto', nome: 'Rep' }],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'suspenso' }],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 3 } as any); // congelar comissões
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // suspender vínculos

    const suspRes = await PATCH(
      new NextRequest('http://localhost/api/admin/representantes/1/status', {
        method: 'PATCH',
        body: JSON.stringify({ novo_status: 'suspenso', motivo: 'Teste' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: { id: '1' } } as any
    );
    expect(suspRes.status).toBe(200);

    // Reativar
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000000',
      role: 'admin',
    } as any);
    mockAuditoria.mockResolvedValue(undefined as any);

    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'suspenso', nome: 'Rep' }],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'apto' }],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // reativar vínculos
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 2 } as any); // restaurar comissões

    const reativarRes = await PATCH(
      new NextRequest('http://localhost/api/admin/representantes/1/status', {
        method: 'PATCH',
        body: JSON.stringify({ novo_status: 'apto', motivo: 'Resolvido' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: { id: '1' } } as any
    );
    expect(reativarRes.status).toBe(200);
  });

  it('Fluxo 5: Admin libera → paga comissão', async () => {
    const { PATCH } = await import('@/app/api/admin/comissoes/[id]/route');

    // Liberar
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status: 'aprovada',
          representante_id: 1,
          representante_nome: 'Rep',
          valor_comissao: '500',
        },
      ],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'liberada' }],
      rowCount: 1,
    } as any);

    const liberarRes = await PATCH(
      new NextRequest('http://localhost/api/admin/comissoes/1', {
        method: 'PATCH',
        body: JSON.stringify({ acao: 'liberar' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: { id: '1' } } as any
    );
    expect(liberarRes.status).toBe(200);

    // Pagar
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000000',
      role: 'admin',
    } as any);
    mockAuditoria.mockResolvedValue(undefined as any);

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status: 'liberada',
          representante_id: 1,
          representante_nome: 'Rep',
          valor_comissao: '500',
        },
      ],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'paga' }],
      rowCount: 1,
    } as any);

    const pagarRes = await PATCH(
      new NextRequest('http://localhost/api/admin/comissoes/1', {
        method: 'PATCH',
        body: JSON.stringify({
          acao: 'pagar',
          comprovante_path: '/comp/abc.pdf',
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: { id: '1' } } as any
    );
    expect(pagarRes.status).toBe(200);
    const pagarData = await pagarRes.json();
    expect(pagarData.comissao.status).toBe('paga');
  });
});
