/**
 * @file __tests__/api/admin/isentar.test.ts
 *
 * Testes para POST /api/admin/tomadores/isentar
 * Concede isenção total de cobranças a um parceiro pelo CNPJ.
 * Auth: admin apenas.
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));
jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn(),
  extrairContextoRequisicao: jest.fn().mockReturnValue({ ip: '127.0.0.1' }),
}));

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { registrarAuditoria, extrairContextoRequisicao } from '@/lib/auditoria/auditoria';
import { POST } from '@/app/api/admin/tomadores/isentar/route';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/tomadores/isentar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/tomadores/isentar', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Restaurar implementação padrão (admin autenticado)
    mockRequireRole.mockResolvedValue({
      cpf: '00011122233',
      nome: 'Admin Dev',
      perfil: 'admin',
    });
    (registrarAuditoria as jest.Mock).mockResolvedValue(undefined);
    (extrairContextoRequisicao as jest.Mock).mockReturnValue({ ip: '127.0.0.1' });
  });

  it('retorna 401 quando não autenticado', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));
    const res = await POST(makeRequest({ cnpj: '11222333000100' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Não autorizado');
  });

  it('retorna 401 quando sem permissão', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));
    const res = await POST(makeRequest({ cnpj: '11222333000100' }));
    expect(res.status).toBe(401);
  });

  it('retorna 400 quando CNPJ não é string', async () => {
    const res = await POST(makeRequest({ cnpj: 12345 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('CNPJ é obrigatório');
  });

  it('retorna 400 quando CNPJ tem menos de 14 dígitos', async () => {
    const res = await POST(makeRequest({ cnpj: '1234567890' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('14 dígitos');
  });

  it('retorna 400 quando CNPJ é inválido após remover pontuação', async () => {
    const res = await POST(makeRequest({ cnpj: '11.222.333' }));
    expect(res.status).toBe(400);
  });

  it('isenta uma clínica pelo CNPJ e retorna dados', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 10, nome: 'Clínica Parceira Ltda' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never); // auditoria mock não precisa, mas para segurança

    const res = await POST(makeRequest({ cnpj: '11222333000100' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(10);
    expect(body.nome).toBe('Clínica Parceira Ltda');
    expect(body.tipo).toBe('clinica');
  });

  it('isenta uma entidade pelo CNPJ quando clínica não encontrada', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] } as never) // clinicas: não encontrada
      .mockResolvedValueOnce({ rows: [{ id: 20, nome: 'Entidade Parceira SA' }] } as never);

    const res = await POST(makeRequest({ cnpj: '55666777000188' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(20);
    expect(body.nome).toBe('Entidade Parceira SA');
    expect(body.tipo).toBe('entidade');
  });

  it('retorna 404 quando nenhum tomador encontrado para o CNPJ', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    const res = await POST(makeRequest({ cnpj: '99999999000100' }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('não encontrado');
  });

  it('aceita CNPJ formatado com pontuação', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 30, nome: 'Teste CNPJ Formatado' }] } as never);

    const res = await POST(makeRequest({ cnpj: '11.222.333/0001-00' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tipo).toBe('clinica');
  });

  it('usa requireRole com perfil admin (não suporte)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never).mockResolvedValueOnce({ rows: [] } as never);
    await POST(makeRequest({ cnpj: '11222333000100' }));
    expect(mockRequireRole).toHaveBeenCalledWith('admin', false);
  });

  it('retorna 500 em erro interno inesperado', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));
    const res = await POST(makeRequest({ cnpj: '11222333000100' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Erro interno do servidor');
  });
});
