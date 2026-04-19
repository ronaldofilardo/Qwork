import { GET, PATCH } from '@/app/api/admin/financeiro/sociedade/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('/api/admin/financeiro/sociedade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000000',
      nome: 'Admin Teste',
      perfil: 'admin',
      mfaVerified: true,
    } as Awaited<ReturnType<typeof requireRole>>);
  });

  it('deve retornar fallback com Ronaldo e Antonio quando estruturas opcionais do banco não existirem', async () => {
    mockQuery.mockRejectedValue(new Error('relação não existe'));

    const request = new Request(
      'http://localhost:3000/api/admin/financeiro/sociedade?dias=30'
    );

    const response = await GET(request as never);
    const data = (await response.json()) as {
      success: boolean;
      persistenciaDisponivel: boolean;
      qwork: { id: string; nome: string };
      beneficiarios: Array<{ id: string; nome: string }>;
      eventosRecentes: unknown[];
    };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.persistenciaDisponivel).toBe(false);
    expect(data.qwork).toEqual(
      expect.objectContaining({ id: 'qwork', nome: 'QWork' })
    );
    expect(data.beneficiarios).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'ronaldo', nome: 'Ronaldo' }),
        expect.objectContaining({ id: 'antonio', nome: 'Antonio' }),
      ])
    );
    expect(data.beneficiarios).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'qwork' }),
      ])
    );
    expect(data.eventosRecentes).toEqual([]);
  });

  it('deve salvar beneficiário societário quando a persistência estiver disponível', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);

    const request = new Request(
      'http://localhost:3000/api/admin/financeiro/sociedade',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiarioId: 'qwork',
          nome: 'QWork',
          nomeEmpresarial: 'QWork Plataforma',
          documentoFiscal: '00.000.000/0001-00',
          walletId: 'wallet-qwork-123',
          percentualParticipacao: 0,
          ativo: true,
          observacoes: 'Wallet institucional da plataforma para recolhimento de impostos e operação do split.',
        }),
      }
    );

    const response = await PATCH(request as never);
    const data = (await response.json()) as {
      success: boolean;
      persisted: boolean;
      beneficiario: { walletId: string; beneficiarioId: string };
    };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.persisted).toBe(true);
    expect(data.beneficiario.beneficiarioId).toBe('qwork');
    expect(data.beneficiario.walletId).toBe('wallet-qwork-123');
    expect(mockQuery).toHaveBeenCalled();
  });
});
