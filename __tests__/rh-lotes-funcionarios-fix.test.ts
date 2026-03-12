/**
 * RH Lotes Funcionarios Fix Validation Test
 *
 * Valida que a rota RH de lotes funciona corretamente com transactionWithContext.
 * Foco: validação de resposta, estatísticas e cenários de edge case.
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

describe('RH Lotes Funcionarios Route - Fix Validation', () => {
  const mockSession = { cpf: '12345678909', perfil: 'rh', clinica_id: 5 };

  beforeEach(() => {
    mockRequireAuth.mockResolvedValue(mockSession as any);
    mockRequireRH.mockResolvedValue(mockSession as any);
    mockGetLoteInfo.mockResolvedValue({
      id: 6,
      descricao: 'Lote Test',
      status: 'liberado',
    } as any);
    mockGetFuncionarios.mockResolvedValue([
      {
        cpf: '11111111111',
        nome: 'João',
        setor: 'TI',
        funcao: 'Dev',
        matricula: '001',
        nivel_cargo: 'pleno',
        turno: 'diurno',
        escala: '5x2',
        avaliacao_id: 10,
        status_avaliacao: 'concluida',
        data_inicio: '2026-01-01',
        data_conclusao: '2026-01-15',
      },
    ]);
    mockTransaction.mockImplementation(async (cb) => {
      const mockQueryFn = jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              total_avaliacoes: '5',
              avaliacoes_concluidas: '3',
              avaliacoes_inativadas: '1',
              avaliacoes_pendentes: '1',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ avaliacao_id: 10, total: '15' }] })
        .mockResolvedValueOnce({ rows: [{ grupo: 1, media: 3.5 }] });
      return cb(mockQueryFn as any);
    });
  });

  describe('Correção: Usar session.clinica_id direto', () => {
    it('deve retornar 200 quando RH acessa lote com clinica válida', async () => {
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      expect(res.status).toBe(200);
    });

    it('deve usar session.clinica_id (via requireRHWithEmpresaAccess) para getLoteInfo', async () => {
      const req = makeRequest('6', '1');
      await GET(req, { params: { id: '6' } } as any);
      expect(mockGetLoteInfo).toHaveBeenCalledWith(6, 1, 5);
    });

    it('resposta deve incluir estatísticas do lote', async () => {
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      const json = await res.json();
      expect(json.estatisticas).toEqual({
        total_avaliacoes: 5,
        avaliacoes_concluidas: 3,
        avaliacoes_inativadas: 1,
        avaliacoes_pendentes: 1,
      });
    });
  });

  describe('Padrão Arquitetural RH vs Entity', () => {
    it('RH usa requireRHWithEmpresaAccess > transactionWithContext', async () => {
      const req = makeRequest('6', '1');
      await GET(req, { params: { id: '6' } } as any);
      expect(mockRequireRH).toHaveBeenCalled();
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('Perfil gestor é rejeitado pela rota RH', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '22222222222',
        perfil: 'gestor',
      } as any);
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      expect(res.status).toBe(403);
      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  describe('Error Cases Handled', () => {
    it('deve retornar 403 se sessão retorna null', async () => {
      mockRequireAuth.mockResolvedValue(null as any);
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      expect(res.status).toBe(403);
    });

    it('deve retornar 403 se RH não tem acesso à empresa', async () => {
      mockRequireRH.mockRejectedValue(new Error('Você não tem permissão'));
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error_code).toBe('permission_clinic_mismatch');
    });

    it('RH sem clinica_id é tratado em requireRHWithEmpresaAccess', async () => {
      mockRequireRH.mockRejectedValue(
        new Error('Clínica não identificada na sessão do RH')
      );
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      expect(res.status).toBe(403);
    });
  });

  describe('Database Context (RLS)', () => {
    it('transactionWithContext é executado com callback que faz queries', async () => {
      const req = makeRequest('6', '1');
      await GET(req, { params: { id: '6' } } as any);
      expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it('Query de estatísticas executa dentro da transação', async () => {
      let capturedQueryFn: jest.Mock | null = null;
      mockTransaction.mockImplementation(async (cb) => {
        capturedQueryFn = jest
          .fn()
          .mockResolvedValueOnce({
            rows: [
              {
                total_avaliacoes: '2',
                avaliacoes_concluidas: '2',
                avaliacoes_inativadas: '0',
                avaliacoes_pendentes: '0',
              },
            ],
          })
          .mockResolvedValueOnce({ rows: [] });
        return cb(capturedQueryFn as any);
      });

      const req = makeRequest('6', '1');
      await GET(req, { params: { id: '6' } } as any);

      expect(capturedQueryFn).toHaveBeenCalled();
      const firstCall = (capturedQueryFn as any).mock.calls[0][0] as string;
      expect(firstCall).toContain('total_avaliacoes');
    });
  });

  describe('No Regression for Entity Routes', () => {
    it('Perfil funcionario é rejeitado pela rota RH', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '33333333333',
        perfil: 'funcionario',
      } as any);
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      expect(res.status).toBe(403);
    });

    it('Perfil emissor é rejeitado pela rota RH', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '44444444444',
        perfil: 'emissor',
      } as any);
      const req = makeRequest('6', '1');
      const res = await GET(req, { params: { id: '6' } } as any);
      expect(res.status).toBe(403);
    });
  });
});
