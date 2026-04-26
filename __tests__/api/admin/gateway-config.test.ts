import { GET, PATCH } from '@/app/api/admin/financeiro/gateway-config/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('/api/admin/financeiro/gateway-config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000000',
      nome: 'Admin Teste',
      perfil: 'admin',
      mfaVerified: false,
    } as Awaited<ReturnType<typeof requireRole>>);
  });

  it('GET deve retornar lista de configurações do gateway', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          codigo: 'boleto',
          descricao: 'Boleto bancário',
          tipo: 'taxa_fixa',
          valor: '2.9000',
          ativo: true,
        },
        {
          codigo: 'pix',
          descricao: 'PIX',
          tipo: 'percentual',
          valor: '0.9900',
          ativo: true,
        },
      ],
      rowCount: 2,
    } as never);

    const response = await GET();
    const data = (await response.json()) as {
      success: boolean;
      configuracoes: Array<{ codigo: string; tipo: string; valor: number }>;
    };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.configuracoes).toHaveLength(2);
    expect(data.configuracoes[0].codigo).toBe('boleto');
    expect(data.configuracoes[0].valor).toBe(2.9);
    expect(data.configuracoes[1].codigo).toBe('pix');
    expect(data.configuracoes[1].valor).toBe(0.99);
  });

  it('GET deve retornar lista vazia quando tabela não tiver configs', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as never);

    const response = await GET();
    const data = (await response.json()) as { configuracoes: unknown[] };

    expect(response.status).toBe(200);
    expect(data.configuracoes).toHaveLength(0);
  });

  it('PATCH deve atualizar taxa PIX com valor válido', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);

    const request = new Request(
      'http://localhost/api/admin/financeiro/gateway-config',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: 'pix', valor: 1.5 }),
      }
    );

    const response = await PATCH(request as never);
    const data = (await response.json()) as { success: boolean };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE configuracoes_gateway'),
      [1.5, 'pix']
    );
  });

  it('PATCH deve atualizar taxa boleto com valor taxa_fixa', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);

    const request = new Request(
      'http://localhost/api/admin/financeiro/gateway-config',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: 'boleto', valor: 3.5 }),
      }
    );

    const response = await PATCH(request as never);
    expect(response.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE configuracoes_gateway'),
      [3.5, 'boleto']
    );
  });

  it('PATCH deve rejeitar código de gateway inválido', async () => {
    const request = new Request(
      'http://localhost/api/admin/financeiro/gateway-config',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: 'invalid_gateway', valor: 1.5 }),
      }
    );

    const response = await PATCH(request as never);
    expect(response.status).toBe(400);
  });

  it('PATCH deve rejeitar valor negativo', async () => {
    const request = new Request(
      'http://localhost/api/admin/financeiro/gateway-config',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: 'pix', valor: -1 }),
      }
    );

    const response = await PATCH(request as never);
    expect(response.status).toBe(400);
  });

  it('PATCH deve rejeitar valor acima de 100', async () => {
    const request = new Request(
      'http://localhost/api/admin/financeiro/gateway-config',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: 'credit_card_1x', valor: 101 }),
      }
    );

    const response = await PATCH(request as never);
    expect(response.status).toBe(400);
  });
});
