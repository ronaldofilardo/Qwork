/**
 * Testes para API de monitoramento de emissão automática
 */

import { GET } from '@/app/api/system/emissao-automatica/status/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('GET /api/system/emissao-automatica/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar status completo para usuário autorizado', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Admin',
      perfil: 'admin',
    });

    // Mocks das queries
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ cpf: '111', nome: 'Emissor 1', email: 'emissor@test.com' }],
        rowCount: 1,
      }) // emissores
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            codigo: '001-010125',
            titulo: 'Lote 1',
            status: 'concluido',
            auto_emitir_em: new Date(),
            empresa_nome: 'Empresa A',
            total_avaliacoes: 10,
            avaliacoes_concluidas: 10,
          },
        ],
        rowCount: 1,
      }) // aguardando emissão
      .mockResolvedValueOnce({
        rows: [
          {
            laudo_id: 1,
            lote_id: 1,
            emitido_em: new Date(),
            hash_pdf: 'abc123',
            codigo: '001-010125',
            titulo: 'Lote 1',
            empresa_nome: 'Empresa A',
          },
        ],
        rowCount: 1,
      }) // aguardando envio
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // agendados futuro
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // ultimas emissões
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // erros recentes

    const req = new Request(
      'http://localhost/api/system/emissao-automatica/status'
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.emissor).toEqual({
      ok: true,
      total: 1,
      emissor: { cpf: '111', nome: 'Emissor 1', email: 'emissor@test.com' },
      erro: null,
    });
    expect(data.fila.fase1_aguardando_emissao.total).toBe(1);
    // Emissão imediata: fila de envio atrasado deve estar vazia
    expect(data.fila.fase2_aguardando_envio.total).toBe(0);
  });

  it('deve detectar erro quando não há emissor ativo', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Admin',
      perfil: 'admin',
    });

    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // nenhum emissor
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const req = new Request(
      'http://localhost/api/system/emissao-automatica/status'
    );
    const response = await GET(req);
    const data = await response.json();

    expect(data.emissor.ok).toBe(false);
    expect(data.emissor.erro).toBe('Nenhum emissor ativo no sistema');
  });

  it('deve detectar erro quando há múltiplos emissores ativos', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Admin',
      perfil: 'admin',
    });

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ cpf: '111' }, { cpf: '222' }],
        rowCount: 2,
      }) // múltiplos emissores
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const req = new Request(
      'http://localhost/api/system/emissao-automatica/status'
    );
    const response = await GET(req);
    const data = await response.json();

    expect(data.emissor.ok).toBe(false);
    expect(data.emissor.erro).toBe('Múltiplos emissores ativos detectados');
  });

  it('deve negar acesso a usuário não autorizado', async () => {
    mockRequireRole.mockResolvedValue(null);

    const req = new Request(
      'http://localhost/api/system/emissao-automatica/status'
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});
