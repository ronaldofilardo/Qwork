import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/admin/planos/[id]/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const bcrypt = require('bcryptjs');

describe('API DELETE /api/admin/planos/[id] - exclusão segura de planos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '99999999999',
      perfil: 'admin',
    } as any);
  });

  test('400 se admin_password ausente', async () => {
    const req = new NextRequest('http://localhost/api/admin/planos/1', {
      method: 'DELETE',
    });
    (req as any).json = async () => ({});

    // plano existe
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, nome: 'Plano X', tipo: 'fixo' }],
    } as any);

    const res = await DELETE(req as any, { params: { id: '1' } } as any);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/admin_password é obrigatório/);
  });

  test('400 se corpo da requisição estiver ausente ou com JSON inválido (não crash)', async () => {
    const req = new NextRequest('http://localhost/api/admin/planos/4', {
      method: 'DELETE',
    });
    // simular undici lançando SyntaxError ao tentar parsear body vazio
    (req as any).json = async () => {
      throw new SyntaxError('Unexpected end of JSON input');
    };

    // plano existe
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 4, nome: 'Plano W', tipo: 'fixo' }],
    } as any);

    const res = await DELETE(req as any, { params: { id: '4' } } as any);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Corpo da requisição inválido ou ausente/);
  });

  test('403 se senha inválida', async () => {
    const req = new NextRequest('http://localhost/api/admin/planos/2', {
      method: 'DELETE',
    });
    (req as any).json = async () => ({
      admin_password: 'wrong',
      motivo: 'teste',
    });

    // plano existe
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 2, nome: 'Plano Y', tipo: 'personalizado' }],
    } as any);
    // buscar admin hash
    mockQuery.mockResolvedValueOnce({
      rows: [{ senha_hash: '$2a$10$hash' }],
    } as any);
    bcrypt.compare.mockResolvedValue(false);

    const res = await DELETE(req as any, { params: { id: '2' } } as any);
    const data = await res.json();

    // DEBUG: log response body when failing

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/Senha do admin inválida/);
  });

  test('Sucesso quando admin fornece senha e motivo - desvincula tomadors e deleta plano', async () => {
    const req = new NextRequest('http://localhost/api/admin/planos/3', {
      method: 'DELETE',
    });
    (req as any).json = async () => ({
      admin_password: 'right',
      motivo: 'limpeza/ajuste',
    });

    // plano existe
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 3, nome: 'Plano Z', tipo: 'personalizado' }],
    } as any);
    // buscar admin hash
    mockQuery.mockResolvedValueOnce({
      rows: [{ senha_hash: '$2a$10$hash' }],
    } as any);
    bcrypt.compare.mockResolvedValue(true);
    // transação
    mockQuery.mockResolvedValueOnce({} as any);

    const res = await DELETE(req as any, { params: { id: '3' } } as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verificar que a transação executou os passos esperados (BEGIN -> audit -> update tomadors -> delete plano -> COMMIT)
    const calls = mockQuery.mock.calls.map((c) => String(c[0]));
    const beginIdx = calls.findIndex((s) => /BEGIN/.test(s));
    const insertIdx = calls.findIndex((s) =>
      s.includes('INSERT INTO audit_logs')
    );
    const updateIdx = calls.findIndex((s) =>
      s.includes('UPDATE tomadors SET plano_id = NULL')
    );
    const deleteIdx = calls.findIndex((s) =>
      s.includes('DELETE FROM planos WHERE id = $1')
    );
    const commitIdx = calls.findIndex((s) => /COMMIT/.test(s));

    expect(beginIdx).toBeGreaterThanOrEqual(0);
    expect(insertIdx).toBeGreaterThanOrEqual(0);
    expect(updateIdx).toBeGreaterThanOrEqual(0);
    expect(deleteIdx).toBeGreaterThanOrEqual(0);
    expect(commitIdx).toBeGreaterThanOrEqual(0);
    // ordem esperada
    expect(beginIdx).toBeLessThan(insertIdx);
    expect(insertIdx).toBeLessThan(updateIdx);
    expect(updateIdx).toBeLessThan(deleteIdx);
    expect(deleteIdx).toBeLessThan(commitIdx);

    // verificar que o UPDATE tomadors foi chamado com o id correto
    const updateCall = mockQuery.mock.calls[updateIdx];
    expect(String(updateCall[0])).toContain(
      'UPDATE tomadors SET plano_id = NULL'
    );
    expect(Array.isArray(updateCall[1])).toBe(true);
    expect(String(updateCall[1][0])).toBe('3');

    // verificar que o INSERT recebeu os dados do plano antigo (params vêm como segundo argumento da chamada)
    const insertCall = mockQuery.mock.calls[insertIdx];
    expect(String(insertCall[0])).toContain('INSERT INTO audit_logs');
    // parâmetros devem ser um array e o quarto item (old_data) é o JSON stringificado do plano
    expect(Array.isArray(insertCall[1])).toBe(true);
    expect(typeof insertCall[1][3]).toBe('string');
    // aceitar qualquer espaçamento entre chaves/colon (ex.: "id":3 ou "id": 3)
    expect(insertCall[1][3]).toMatch(/"id"\s*:\s*3/);
  });

  test('409 quando existem dependências de FK que impedem exclusão', async () => {
    const req = new NextRequest('http://localhost/api/admin/planos/5', {
      method: 'DELETE',
    });
    (req as any).json = async () => ({
      admin_password: 'right',
      motivo: 'teste',
    });

    // plano existe
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, nome: 'Plano W', tipo: 'fixo' }],
    } as any);
    // buscar admin hash
    mockQuery.mockResolvedValueOnce({
      rows: [{ senha_hash: '$2a$10$hash' }],
    } as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    // na execução da transação, simular violação de FK (pg code 23503)
    const fkError: any = new Error(
      'update or delete on table "planos" violates foreign key constraint'
    );
    fkError.code = '23503';
    mockQuery.mockRejectedValueOnce(fkError);

    const res = await DELETE(req as any, { params: { id: '5' } } as any);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/recursos dependentes/i);
  });
});
