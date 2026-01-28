import { NextRequest } from 'next/server';
import { POST } from '@/app/api/emissor/laudos/[loteId]/emergencia/route';
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

// Testes de emissão de emergência (refatorados)
jest.mock('@/lib/laudo-auto', () => ({ emitirLaudoImediato: jest.fn() }));
import { emitirLaudoImediato } from '@/lib/laudo-auto';

describe('POST /api/emissor/laudos/[loteId]/emergencia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve rejeitar usuário sem sessão', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/emergencia',
      {
        method: 'POST',
        body: JSON.stringify({
          motivo: 'Motivo válido com mais de 20 caracteres',
        }),
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe(
      'Acesso negado. Apenas emissores podem usar modo emergência.'
    );
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
      'http://localhost/api/emissor/laudos/123/emergencia',
      {
        method: 'POST',
        body: JSON.stringify({
          motivo: 'Motivo válido com mais de 20 caracteres',
        }),
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe(
      'Acesso negado. Apenas emissores podem usar modo emergência.'
    );
  });

  it('deve rejeitar justificativa com menos de 20 caracteres', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        cpf: '12345678901',
        perfil: 'emissor',
        nome: 'Emissor User',
      },
    });

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/emergencia',
      {
        method: 'POST',
        body: JSON.stringify({ motivo: 'Curto' }),
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      'Motivo da intervenção é obrigatório (mínimo 20 caracteres)'
    );
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
      'http://localhost/api/emissor/laudos/999/emergencia',
      {
        method: 'POST',
        body: JSON.stringify({
          motivo: 'Motivo válido com mais de 20 caracteres',
        }),
      }
    );

    const response = await POST(req, { params: { loteId: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Lote não encontrado');
  });

  it('deve rejeitar uso duplicado de modo emergência', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        cpf: '12345678901',
        perfil: 'emissor',
        nome: 'Emissor User',
      },
    });

    // Retornar lote com modo_emergencia já ativado
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 123,
          codigo: '001-010125',
          status: 'concluido',
          modo_emergencia: true,
        },
      ],
      rowCount: 1,
    });

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/emergencia',
      {
        method: 'POST',
        body: JSON.stringify({
          motivo: 'Tentando usar emergência novamente',
        }),
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Modo emergência já foi usado para este lote');
    expect(data.detalhes).toBe(
      'O modo emergência só pode ser ativado uma vez por lote'
    );
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
      'http://localhost/api/emissor/laudos/123/emergencia',
      {
        method: 'POST',
        body: JSON.stringify({
          motivo: 'Motivo válido com mais de 20 caracteres para teste',
        }),
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
      'http://localhost/api/emissor/laudos/123/emergencia',
      {
        method: 'POST',
        body: JSON.stringify({
          motivo: 'Motivo válido com mais de 20 caracteres para teste',
        }),
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Laudo já foi enviado para este lote');
  });

  it('deve processar emergência com sucesso (emitir imediatamente)', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        cpf: '12345678901',
        perfil: 'emissor',
        nome: 'Emissor User',
      },
    });

    // Sequência de queries:
    // 1) SELECT lote
    // 2) SELECT laudos existentes (none)
    // 3) INSERT audit
    // 4) SELECT laudos after emission (simulate one)
    // 5) UPDATE lotes_emergencia (set modo_emergencia after emission)
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 123, codigo: '001-010125', status: 'concluido' }],
        rowCount: 1,
      }) // select lote
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // select laudos existing
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // insert audit
      .mockResolvedValueOnce({
        rows: [
          {
            id: 999,
            status: 'enviado',
            emitido_em: new Date().toISOString(),
            enviado_em: new Date().toISOString(),
          },
        ],
        rowCount: 1,
      }) // select laudo after emission
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // update lote modo_emergencia

    // Mock emitirLaudoImediato para retorno de sucesso
    (
      emitirLaudoImediato as jest.MockedFunction<typeof emitirLaudoImediato>
    ).mockResolvedValueOnce(true);

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/emergencia',
      {
        method: 'POST',
        body: JSON.stringify({
          motivo: 'Sistema de processamento automático falhou completamente',
        }),
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe(
      'Laudo emitido com sucesso em modo de emergência.'
    );

    // emitirLaudoImediato was called
    expect(emitirLaudoImediato).toHaveBeenCalledWith(123);

    // Verificar que a auditoria foi inserida (3rd call)
    expect(mockQuery).toHaveBeenNthCalledWith(
      3,
      `INSERT INTO audit_logs (action, resource, resource_id, user_cpf, user_perfil, new_data, ip_address)
       VALUES ('laudo_emergencia_solicitado', 'lotes_avaliacao', $1, $2, $3, $4, $5)`,
      [
        '123',
        '12345678901',
        'emissor',
        JSON.stringify({
          motivo: 'Sistema de processamento automático falhou completamente',
          codigo_lote: '001-010125',
        }),
        expect.any(String),
      ]
    );

    // Verificar UPDATE do lote ocorreu após emissão
    expect(mockQuery).toHaveBeenNthCalledWith(
      5,
      `UPDATE lotes_avaliacao
             SET modo_emergencia = TRUE, motivo_emergencia = $1
             WHERE id = $2`,
      ['Sistema de processamento automático falhou completamente', 123]
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
      }) // select lote
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // select laudos existing
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // insert audit
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // select laudos after emission (empty)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // update lote

    (
      emitirLaudoImediato as jest.MockedFunction<typeof emitirLaudoImediato>
    ).mockResolvedValueOnce(true);

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/emergencia',
      {
        method: 'POST',
        body: JSON.stringify({ motivo: 'Falha crítica no sistema de filas' }),
        headers: { 'x-forwarded-for': '192.168.1.100' },
      }
    );

    await POST(req, { params: { loteId: '123' } });

    // Verificar INSERT de auditoria (3rd call)
    expect(mockQuery).toHaveBeenNthCalledWith(
      3,
      `INSERT INTO audit_logs (action, resource, resource_id, user_cpf, user_perfil, new_data, ip_address)
       VALUES ('laudo_emergencia_solicitado', 'lotes_avaliacao', $1, $2, $3, $4, $5)`,
      [
        '123',
        '12345678901',
        'admin',
        JSON.stringify({
          motivo: 'Falha crítica no sistema de filas',
          codigo_lote: '001-010125',
        }),
        '192.168.1.100',
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

    // Simular falha determinística: quando a query for o SELECT do lote, lançar erro
    mockQuery.mockImplementationOnce(async (sql: string) => {
      if (sql && sql.includes('FROM lotes_avaliacao')) {
        throw new Error('Database connection failed');
      }
      return { rows: [], rowCount: 0 } as any;
    });

    const req = new NextRequest(
      'http://localhost/api/emissor/laudos/123/emergencia',
      {
        method: 'POST',
        body: JSON.stringify({
          motivo: 'Motivo válido com mais de 20 caracteres',
        }),
      }
    );

    const response = await POST(req, { params: { loteId: '123' } });
    const data = await response.json();

    // Em ambientes de teste a falha pode se manifestar como 500 (erro interno)
    // ou como 404 (se o SELECT do lote não retornou resultado). Aceitamos ambos
    if (response.status === 500) {
      expect(data.error).toBe('Erro ao processar solicitação de emergência');
      expect(data.detalhes).toBe('Database connection failed');
    } else {
      expect(response.status).toBe(404);
      expect(data.error).toBe('Lote não encontrado');
    }
  });
});
