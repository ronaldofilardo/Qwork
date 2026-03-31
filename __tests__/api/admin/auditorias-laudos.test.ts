/**
 * Testes para as APIs de laudos do módulo de auditoria admin.
 *
 * Cobre as alterações realizadas:
 * - GET /api/admin/auditorias/laudos       → lista com tomador_nome/empresa_cliente_nome (sem emissor)
 * - GET /api/admin/auditorias/laudos/:id   → detalhe com empresa_nome, solicitacao_emissao_em,
 *                                            pago_em, arquivo_remoto_uploaded_at,
 *                                            avaliacoes_resumo.concluidas (sem total/por_status),
 *                                            timeline sem avaliações inativadas
 */

import { GET as getLaudos } from '@/app/api/admin/auditorias/laudos/route';
import { GET as getLaudoDetalhe } from '@/app/api/admin/auditorias/laudos/[laudoId]/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeLaudoRow(overrides: Record<string, unknown> = {}) {
  return {
    laudo_id: 1,
    status: 'emitido',
    hash_pdf: 'abc123hash',
    observacoes: null,
    criado_em: '2024-01-01T00:00:00.000Z',
    emitido_em: '2024-01-01T01:00:00.000Z',
    enviado_em: null,
    atualizado_em: '2024-01-01T01:00:00.000Z',
    arquivo_remoto_uploaded_at: '2024-01-01T02:00:00.000Z',
    emissor_cpf: '12345678900',
    emissor_nome: 'Admin QWork',
    tamanho_pdf_kb: 128,
    tem_arquivo_pdf: true,
    lote_id: 10,
    lote_status: 'finalizado',
    lote_tipo: 'clinica',
    liberado_em: '2023-12-31T10:00:00.000Z',
    finalizado_em: '2024-01-01T00:00:00.000Z',
    solicitacao_emissao_em: '2024-01-01T00:30:00.000Z',
    pago_em: '2024-01-01T00:45:00.000Z',
    liberado_por_nome: 'Gerente',
    tomador_nome: 'Clínica Saúde',
    tomador_cnpj: '12345678000199',
    tomador_tipo: 'clinica',
    empresa_nome: 'Empresa ABC',
    ...overrides,
  };
}

function makeAvaliacaoRow(overrides: Record<string, unknown> = {}) {
  return {
    avaliacao_id: 1,
    status: 'concluida',
    iniciada_em: '2024-01-01T00:00:00.000Z',
    concluida_em: '2024-01-01T00:30:00.000Z',
    atualizado_em: '2024-01-01T00:30:00.000Z',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('APIs de Auditoria — Laudos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/admin/auditorias/laudos  (lista)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/admin/auditorias/laudos', () => {
    it('deve retornar lista de laudos com tomador_nome e empresa_cliente_nome', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery.mockResolvedValue({
        rows: [
          {
            laudo_id: 1,
            lote_id: 10,
            numero_lote: '1',
            status: 'emitido',
            hash_pdf: 'abc123',
            criado_em: '2024-01-01T00:00:00.000Z',
            emitido_em: '2024-01-01T01:00:00.000Z',
            enviado_em: null,
            atualizado_em: '2024-01-01T01:00:00.000Z',
            clinica_nome: 'Clínica Teste',
            empresa_cliente_nome: 'Empresa ABC',
            tomador_nome: 'Empresa ABC',
            clinica_id: 1,
            empresa_id: 5,
            entidade_id: null,
            solicitado_em: null,
          },
        ],
        rowCount: 1,
      });

      // Act
      const response = await getLaudos();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.laudos).toHaveLength(1);
      expect(data.laudos[0].tomador_nome).toBe('Empresa ABC');
      expect(data.laudos[0].empresa_cliente_nome).toBe('Empresa ABC');
      // Campos de emissor não devem aparecer (removidos da query)
      expect(data.laudos[0]).not.toHaveProperty('emissor_nome');
      expect(data.laudos[0]).not.toHaveProperty('emissor_cpf');
    });

    it('deve retornar empresa_cliente_nome nulo para lotes de entidade', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery.mockResolvedValue({
        rows: [
          {
            laudo_id: 2,
            lote_id: 20,
            numero_lote: '2',
            status: 'emitido',
            hash_pdf: 'def456',
            criado_em: '2024-01-02T00:00:00.000Z',
            emitido_em: '2024-01-02T01:00:00.000Z',
            enviado_em: null,
            atualizado_em: '2024-01-02T01:00:00.000Z',
            clinica_nome: null,
            empresa_cliente_nome: null,
            tomador_nome: 'Entidade Pública XYZ',
            clinica_id: null,
            empresa_id: null,
            entidade_id: 3,
            solicitado_em: null,
          },
        ],
        rowCount: 1,
      });

      // Act
      const response = await getLaudos();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.laudos[0].empresa_cliente_nome).toBeNull();
      expect(data.laudos[0].tomador_nome).toBe('Entidade Pública XYZ');
      expect(data.laudos[0].clinica_id).toBeNull();
      expect(data.laudos[0].entidade_id).toBe(3);
    });

    it('deve retornar 403 se não for admin', async () => {
      // Arrange
      mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

      // Act
      const response = await getLaudos();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe('Acesso negado');
    });

    it('deve retornar 500 em caso de falha no banco', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery.mockRejectedValue(new Error('Connection refused'));

      // Act
      const response = await getLaudos();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Erro interno do servidor');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/admin/auditorias/laudos/[laudoId]  (detalhe)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/admin/auditorias/laudos/[laudoId]', () => {
    function makeRequest(laudoId: string) {
      return new Request(
        `http://localhost/api/admin/auditorias/laudos/${laudoId}`
      );
    }

    it('deve retornar detalhe completo com empresa_nome para lote de clínica', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [makeLaudoRow()], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [makeAvaliacaoRow()], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Act
      const response = await getLaudoDetalhe(makeRequest('1'), {
        params: { laudoId: '1' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.empresa_nome).toBe('Empresa ABC');
      expect(data.tomador.tipo).toBe('clinica');
      expect(data.tomador.nome).toBe('Clínica Saúde');
      expect(data.laudo.arquivo_remoto_uploaded_at).toBe(
        '2024-01-01T02:00:00.000Z'
      );
    });

    it('deve retornar empresa_nome nulo para lotes de entidade', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            makeLaudoRow({
              tomador_tipo: 'entidade',
              tomador_nome: 'Entidade Pública XYZ',
              empresa_nome: null,
              clinica_id: null,
              entidade_id: 3,
            }),
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Act
      const response = await getLaudoDetalhe(makeRequest('1'), {
        params: { laudoId: '1' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.empresa_nome).toBeNull();
      expect(data.tomador.tipo).toBe('entidade');
    });

    it('deve retornar avaliacoes_resumo apenas com concluidas (sem total nem por_status)', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [makeLaudoRow()], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [
            makeAvaliacaoRow({ avaliacao_id: 1, status: 'concluida' }),
            makeAvaliacaoRow({
              avaliacao_id: 2,
              status: 'concluida',
              concluida_em: '2024-01-01T00:40:00.000Z',
            }),
            makeAvaliacaoRow({
              avaliacao_id: 3,
              status: 'inativada',
              concluida_em: null,
            }),
          ],
          rowCount: 3,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Act
      const response = await getLaudoDetalhe(makeRequest('1'), {
        params: { laudoId: '1' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.avaliacoes_resumo).toEqual({ concluidas: 2 });
      expect(data.avaliacoes_resumo).not.toHaveProperty('total');
      expect(data.avaliacoes_resumo).not.toHaveProperty('por_status');
    });

    it('deve excluir avaliações inativadas da timeline', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            makeLaudoRow({
              liberado_em: '2024-01-01T08:00:00.000Z',
              finalizado_em: null,
              solicitacao_emissao_em: null,
              pago_em: null,
              arquivo_remoto_uploaded_at: null,
            }),
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            makeAvaliacaoRow({
              avaliacao_id: 1,
              status: 'concluida',
              concluida_em: '2024-01-01T09:30:00.000Z',
            }),
            makeAvaliacaoRow({
              avaliacao_id: 2,
              status: 'inativada',
              concluida_em: null,
            }),
          ],
          rowCount: 2,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Act
      const response = await getLaudoDetalhe(makeRequest('1'), {
        params: { laudoId: '1' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      const avaliacoesNaTimeline = data.timeline.filter(
        (e: { tipo: string }) => e.tipo === 'avaliacao'
      );
      expect(avaliacoesNaTimeline).toHaveLength(1);
      expect(avaliacoesNaTimeline[0].label).toContain('#1');
    });

    it('deve incluir solicitacao_emissao_em e pago_em como eventos na timeline', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [makeLaudoRow()], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Act
      const response = await getLaudoDetalhe(makeRequest('1'), {
        params: { laudoId: '1' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      const solicitacaoEvento = data.timeline.find(
        (e: { label: string }) => e.label === 'Solicitação de emissão'
      );
      const pagamentoEvento = data.timeline.find(
        (e: { label: string }) => e.label === 'Pagamento confirmado'
      );
      expect(solicitacaoEvento).toBeDefined();
      expect(pagamentoEvento).toBeDefined();
    });

    it('deve incluir arquivo_remoto_uploaded_at como evento de envio na timeline', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [makeLaudoRow()], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Act
      const response = await getLaudoDetalhe(makeRequest('1'), {
        params: { laudoId: '1' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      const bucketEvento = data.timeline.find(
        (e: { label: string }) => e.label === 'Arquivo enviado ao bucket'
      );
      expect(bucketEvento).toBeDefined();
      expect(bucketEvento.tipo).toBe('envio');
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Act
      const response = await getLaudoDetalhe(makeRequest('9999'), {
        params: { laudoId: '9999' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe('Laudo não encontrado');
    });

    it('deve retornar 400 para laudoId inválido (string)', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);

      // Act
      const response = await getLaudoDetalhe(makeRequest('abc'), {
        params: { laudoId: 'abc' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('ID inválido');
    });

    it('deve retornar 400 para laudoId igual a zero', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);

      // Act
      const response = await getLaudoDetalhe(makeRequest('0'), {
        params: { laudoId: '0' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('ID inválido');
    });

    it('deve retornar 403 se não for admin', async () => {
      // Arrange
      mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

      // Act
      const response = await getLaudoDetalhe(makeRequest('1'), {
        params: { laudoId: '1' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe('Acesso negado');
    });

    it('deve retornar 500 em caso de falha no banco', async () => {
      // Arrange
      mockRequireRole.mockResolvedValue({ perfil: 'admin' } as any);
      mockQuery.mockRejectedValue(new Error('Connection refused'));

      // Act
      const response = await getLaudoDetalhe(makeRequest('1'), {
        params: { laudoId: '1' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Erro interno do servidor');
    });
  });
});
