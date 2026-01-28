import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/admin/contratantes/route';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const bcrypt = require('bcryptjs');

describe('API DELETE /api/admin/contratantes (admin + senha)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      cpf: '99999999999',
      perfil: 'admin',
    } as any);
  });

  test('400 se admin_password ausente quando force=true', async () => {
    const req = new NextRequest('http://localhost/api/admin/contratantes', {
      method: 'DELETE',
    });
    (req as any).json = async () => ({ id: 1, force: true });

    // Simular contratante existente
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] } as any);

    const res = await DELETE(req as any);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Senha do admin é necessária/);
  });

  test('403 se senha inválida', async () => {
    const req = new NextRequest('http://localhost/api/admin/contratantes', {
      method: 'DELETE',
    });
    (req as any).json = async () => ({
      id: 2,
      force: true,
      admin_password: 'wrongpass',
    });

    // contratante existe
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] } as any);
    // buscar admin hash
    mockQuery.mockResolvedValueOnce({
      rows: [{ senha_hash: '$2a$10$hash' }],
    } as any);
    // bcrypt.compare falso
    bcrypt.compare.mockResolvedValue(false);

    const res = await DELETE(req as any);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/Senha do admin inválida/);
  });

  test('Sucesso quando senha válida - chama fn_delete_senha_autorizado', async () => {
    const req = new NextRequest('http://localhost/api/admin/contratantes', {
      method: 'DELETE',
    });
    (req as any).json = async () => ({
      id: 3,
      force: true,
      admin_password: 'rightpass',
      motivo: 'teste remoção',
    });

    // contratante existe
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 3 }] } as any);
    // buscar admin hash
    mockQuery.mockResolvedValueOnce({
      rows: [{ senha_hash: '$2a$10$hash' }],
    } as any);
    // bcrypt.compare verdadeiro
    bcrypt.compare.mockResolvedValue(true);
    // transação (SELECT fn_delete_senha_autorizado ...)
    mockQuery.mockResolvedValueOnce([
      { fn_delete_senha_autorizado: 'Senha deletada com sucesso' },
    ] as any);

    const res = await DELETE(req as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verificar que a transação foi chamada com fn_delete_senha_autorizado
    expect(mockQuery.mock.calls[mockQuery.mock.calls.length - 1][0]).toContain(
      'SELECT fn_delete_senha_autorizado'
    );
    expect(mockQuery.mock.calls[mockQuery.mock.calls.length - 1][1]).toEqual([
      3,
      'teste remoção',
      '99999999999',
      'admin',
    ]);
  });

  test('não deve excluir plano fixo compartilhado ao remover contratante (force=true)', async () => {
    const req = new NextRequest('http://localhost/api/admin/contratantes', {
      method: 'DELETE',
    });
    (req as any).json = async () => ({
      id: 4,
      force: true,
      admin_password: 'rightpass',
      motivo: 'remover contratante com plano compartilhado',
    });

    // contratante existe (tem plano_id = 1)
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 4, plano_id: 1 }] } as any);
    // buscar admin hash
    mockQuery.mockResolvedValueOnce({
      rows: [{ senha_hash: '$2a$10$hash' }],
    } as any);
    // bcrypt.compare verdadeiro
    bcrypt.compare.mockResolvedValue(true);
    // transação (executada por um único query call)
    mockQuery.mockResolvedValueOnce([
      { fn_delete_senha_autorizado: 'ok' },
    ] as any);

    const res = await DELETE(req as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verificar que a transação contém a cláusula segura para não apagar planos fixos compartilhados
    // Now the policy is: planos (fixo ou personalizado) não devem ser deletados ao remover contratante.
    const txCall = mockQuery.mock.calls.find(
      (call) =>
        typeof call[0] === 'string' && call[0].includes('DELETE FROM planos')
    );
    expect(txCall).toBeUndefined();

    // Verificar que contratante foi excluído na transação
    const deleteContratanteCall = mockQuery.mock.calls.find(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('DELETE FROM contratantes')
    );
    expect(deleteContratanteCall).toBeDefined();
  });
});
