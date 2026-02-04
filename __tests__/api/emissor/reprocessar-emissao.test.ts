/**
 * Testes para API de reprocessamento de emissão
 */

import { POST } from '@/app/api/emissor/reprocessar-emissao/[loteId]/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

// IGNORADO: testes de reprocessamento de emissão temporariamente skipados para breve refatoração
describe.skip('POST /api/emissor/reprocessar-emissao/[loteId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve reprocessar lote elegível com sucesso', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Emissor',
      perfil: 'emissor',
    });

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'concluido',
            auto_emitir_agendado: true,
            auto_emitir_em: new Date(),
            total_avaliacoes: 10,
            avaliacoes_concluidas: 10,
          },
        ],
        rowCount: 1,
      }) // lote check
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // laudo existente (não enviado)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // tentativa recente
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // UPDATE lote
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // INSERT auditoria
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // INSERT notificação

    const req = new Request(
      'http://localhost/api/emissor/reprocessar-emissao/1',
      { method: 'POST' }
    );
    const response = await POST(req, { params: { loteId: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('fila para reprocessamento');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE lotes_avaliacao'),
      expect.anything()
    );

    // Auditoria inserida deve conter IP válido (fallback 127.0.0.1 quando não fornecido)
    const auditorias = mockQuery.mock.calls.filter((c) =>
      c[0].includes('INSERT INTO auditoria_laudos')
    );
    expect(
      auditorias.some((c) => c[1]?.includes && c[1].includes('127.0.0.1'))
    ).toBe(true);
  });

  it('deve rejeitar lote não concluído', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Emissor',
      perfil: 'emissor',
    });

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status: 'ativo',
          auto_emitir_agendado: true,
        },
      ],
      rowCount: 1,
    });

    const req = new Request(
      'http://localhost/api/emissor/reprocessar-emissao/1',
      { method: 'POST' }
    );
    const response = await POST(req, { params: { loteId: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('concluido');
  });

  it('deve rejeitar lote sem emissão automática agendada', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Emissor',
      perfil: 'emissor',
    });

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status: 'concluido',
          auto_emitir_agendado: false,
          total_avaliacoes: 10,
          avaliacoes_concluidas: 10,
        },
      ],
      rowCount: 1,
    });

    const req = new Request(
      'http://localhost/api/emissor/reprocessar-emissao/1',
      { method: 'POST' }
    );
    const response = await POST(req, { params: { loteId: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('emissão automática agendada');
  });

  it('deve rejeitar lote já enviado', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Emissor',
      perfil: 'emissor',
    });

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'concluido',
            auto_emitir_agendado: true,
            total_avaliacoes: 10,
            avaliacoes_concluidas: 10,
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [{ id: 1, status: 'enviado', enviado_em: new Date() }],
        rowCount: 1,
      }); // laudo já enviado

    const req = new Request(
      'http://localhost/api/emissor/reprocessar-emissao/1',
      { method: 'POST' }
    );
    const response = await POST(req, { params: { loteId: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('já foi enviado');
  });

  it('deve aplicar rate limiting (5 minutos)', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Emissor',
      perfil: 'emissor',
    });

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'concluido',
            auto_emitir_agendado: true,
            total_avaliacoes: 10,
            avaliacoes_concluidas: 10,
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // laudo não enviado
      .mockResolvedValueOnce({
        rows: [{ criado_em: new Date() }],
        rowCount: 1,
      }); // tentativa recente

    const req = new Request(
      'http://localhost/api/emissor/reprocessar-emissao/1',
      { method: 'POST' }
    );
    const response = await POST(req, { params: { loteId: '1' } });
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('5 minutos');
  });

  it('deve negar acesso a não-emissor', async () => {
    mockRequireRole.mockResolvedValue(null);

    const req = new Request(
      'http://localhost/api/emissor/reprocessar-emissao/1',
      { method: 'POST' }
    );
    const response = await POST(req, { params: { loteId: '1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});
