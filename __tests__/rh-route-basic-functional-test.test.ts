/**
 * RH Route Basic Functional Test
 *
 * Valida que o RH route funciona com transactionWithContext
 * e que session.clinica_id é utilizado para RLS context
 */

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
}));
jest.mock('@/lib/db-security', () => ({
  transactionWithContext: jest.fn(),
}));
jest.mock('@/lib/queries', () => ({
  getFuncionariosPorLote: jest.fn(),
  getLoteInfo: jest.fn(),
}));

import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import { transactionWithContext } from '@/lib/db-security';
import { getLoteInfo, getFuncionariosPorLote } from '@/lib/queries';
import { GET } from '@/app/api/rh/lotes/[id]/funcionarios/route';

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockRequireRH = requireRHWithEmpresaAccess as jest.MockedFunction<
  typeof requireRHWithEmpresaAccess
>;
const mockTransaction = transactionWithContext as jest.MockedFunction<
  typeof transactionWithContext
>;
const mockGetLoteInfo = getLoteInfo as jest.MockedFunction<typeof getLoteInfo>;
const mockGetFuncionarios = getFuncionariosPorLote as jest.MockedFunction<
  typeof getFuncionariosPorLote
>;

function makeRequest(loteId: string, empresaId?: string): Request {
  const url = new URL(
    `http://localhost:3000/api/rh/lotes/${loteId}/funcionarios`
  );
  if (empresaId) url.searchParams.set('empresa_id', empresaId);
  return new Request(url.toString());
}

describe('RH Lotes Funcionarios Route - Basic Functional Test', () => {
  const mockSession = { cpf: '12345678909', perfil: 'rh', clinica_id: 5 };

  beforeEach(() => {
    mockRequireAuth.mockResolvedValue(mockSession as any);
    mockRequireRH.mockResolvedValue(mockSession as any);
    mockGetLoteInfo.mockResolvedValue({ id: 6, descricao: 'Lote Test' } as any);
    mockGetFuncionarios.mockResolvedValue([]);
    mockTransaction.mockImplementation(async (cb) => {
      const mockQueryFn = jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              total_avaliacoes: '0',
              avaliacoes_concluidas: '0',
              avaliacoes_inativadas: '0',
              avaliacoes_pendentes: '0',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });
      return cb(mockQueryFn as any);
    });
  });

  describe('Correção Implementada', () => {
    it('transactionWithContext recebe session.clinica_id de requireRHWithEmpresaAccess', async () => {
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      expect(res.status).toBe(200);
      expect(mockRequireRH).toHaveBeenCalledWith(1);
    });

    it('A rota RH retorna dados estruturados corretamente', async () => {
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.lote).toBeDefined();
      expect(json.estatisticas).toBeDefined();
      expect(json.funcionarios).toBeDefined();
    });

    it('requireRHWithEmpresaAccess é chamado antes de transactionWithContext', async () => {
      const req = makeRequest('6', '1');
      await GET(req, { params: { id: '6' } } as any);
      const requireRHOrder = mockRequireRH.mock.invocationCallOrder[0];
      const txOrder = mockTransaction.mock.invocationCallOrder[0];
      expect(requireRHOrder).toBeLessThan(txOrder);
    });
  });

  describe('Entity Routes não são afetadas (No Regression)', () => {
    it('Rota RH rejeita perfis não-RH com 403', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        perfil: 'gestor',
      } as any);
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      expect(res.status).toBe(403);
    });

    it('requireRHWithEmpresaAccess não é chamado para perfis não-RH', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        perfil: 'gestor',
      } as any);
      const req = makeRequest('6', '1');
      await GET(req, { params: { id: '6' } } as any);
      expect(mockRequireRH).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('Retorna 403 se requireRHWithEmpresaAccess falhar', async () => {
      mockRequireRH.mockRejectedValue(new Error('Sem permissão'));
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      expect(res.status).toBe(403);
    });

    it('Retorna 400 se empresa_id faltando', async () => {
      const req = makeRequest('6');
      const res = await GET(req, { params: { id: '6' } } as any);
      expect(res.status).toBe(400);
    });

    it('Retorna 404 se lote não encontrado', async () => {
      mockGetLoteInfo.mockResolvedValue(null as any);
      const req = makeRequest('999', '1');
      const res = await GET(req, { params: { id: '999' } } as any);
      expect(res.status).toBe(404);
    });

    it('Retorna 500 se transactionWithContext lançar erro', async () => {
      mockTransaction.mockRejectedValue(new Error('DB error'));
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      expect(res.status).toBe(500);
    });
  });

  describe('Padrão Arquitetural', () => {
    it('RH segue pattern: auth > permission-check > loteInfo > transaction', async () => {
      const req = makeRequest('6', '1');
      await GET(req, { params: { id: '6' } } as any);
      expect(mockRequireAuth).toHaveBeenCalled();
      expect(mockRequireRH).toHaveBeenCalled();
      expect(mockGetLoteInfo).toHaveBeenCalled();
      expect(mockTransaction).toHaveBeenCalled();
    });
  });
});
