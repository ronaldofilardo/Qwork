import { NextRequest } from 'next/server';
import { POST } from '@/app/api/emissor/laudos/[loteId]/reprocessar/route';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

// Mocks
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('POST /api/emissor/laudos/[loteId]/reprocessar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve rejeitar usuário sem sessão', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/reprocessar',
      {
        method: 'POST',
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });

  it('deve rejeitar usuário sem perfil emissor ou admin', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        cpf: '12345678901',
        perfil: 'rh',
        nome: 'RH User',
      },
    });

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/reprocessar',
      {
        method: 'POST',
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });

  it('deve rejeitar lote não encontrado', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        cpf: '12345678901',
        perfil: 'emissor',
        nome: 'Emissor User',
      },
    });

    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/999/reprocessar',
      {
        method: 'POST',
      }
    );

    const response = await POST(req, { params: { loteId: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Lote não encontrado');
  });

  it('deve rejeitar lote com status diferente de concluido', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        cpf: '12345678901',
        perfil: 'emissor',
        nome: 'Emissor User',
      },
    });

    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 123, codigo: '001-010125', status: 'ativo' }],
      rowCount: 1,
    });

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/reprocessar',
      {
        method: 'POST',
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Lote não está concluído (status: ativo)');
  });

  it('deve rejeitar lote que já tem laudo enviado', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        cpf: '12345678901',
        perfil: 'emissor',
        nome: 'Emissor User',
      },
    });

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 123, codigo: '001-010125', status: 'concluido' }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [{ id: 456 }],
        rowCount: 1,
      });

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/reprocessar',
      {
        method: 'POST',
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Laudo já foi enviado para este lote');
  });

  it('deve informar quando lote já está na fila', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        cpf: '12345678901',
        perfil: 'emissor',
        nome: 'Emissor User',
      },
    });

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 123, codigo: '001-010125', status: 'concluido' }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({
        rows: [{ id: 789 }],
        rowCount: 1,
      });

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/reprocessar',
      {
        method: 'POST',
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.na_fila).toBe(true);
    expect(data.message).toBe('Lote já está na fila de processamento');
  });

  it('deve reprocessar lote com sucesso', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        cpf: '12345678901',
        perfil: 'emissor',
        nome: 'Emissor User',
      },
    });

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 123, codigo: '001-010125', status: 'concluido' }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Sem laudo enviado
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Não está na fila
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // INSERT fila_emissao
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // INSERT audit_logs

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/reprocessar',
      {
        method: 'POST',
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('Reprocessamento solicitado');
    expect(data.lote).toEqual({
      id: 123,
      codigo: '001-010125',
    });

    // Verificar chamadas do banco
    expect(mockQuery).toHaveBeenCalledTimes(5);

    // Verificar INSERT na fila (asserção robusta, não sensível a espaçamento)
    expect(mockQuery).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('INSERT INTO fila_emissao'),
      [123]
    );
  });

  it('deve registrar auditoria corretamente', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        cpf: '12345678901',
        perfil: 'admin',
        nome: 'Admin User',
      },
    });

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 123, codigo: '001-010125', status: 'concluido' }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/reprocessar',
      {
        method: 'POST',
      }
    );

    await POST(req, { params: { loteId: '123' } });

    // Verificar INSERT de auditoria (asserção robusta)
    expect(mockQuery).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('INSERT INTO audit_logs'),
      [
        '123',
        '12345678901',
        'admin',
        JSON.stringify({ codigo_lote: '001-010125' }),
      ]
    );
  });

  it('deve lidar com erro interno do servidor', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        cpf: '12345678901',
        perfil: 'emissor',
        nome: 'Emissor User',
      },
    });

    mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/reprocessar',
      {
        method: 'POST',
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erro ao solicitar reprocessamento');
    expect(data.detalhes).toBe('Database connection failed');
  });
});
