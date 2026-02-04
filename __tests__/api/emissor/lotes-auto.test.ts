import { GET as getLotesEmissor } from '@/app/api/emissor/lotes/route';
import { query } from '@/lib/db';

// Mock das dependências
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/validacao-lote-laudo', () => ({
  validarLotesParaLaudo: jest.fn(),
}));

const mockRequireRole = require('@/lib/session').requireRole;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockValidarLotes =
  require('@/lib/validacao-lote-laudo').validarLotesParaLaudo;
describe('API Emissor Lotes - Sistema Automático', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/emissor/lotes', () => {
    it('deve retornar todos os lotes com informações de emissão automática', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        perfil: 'emissor',
      });

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ total: 3 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              titulo: 'Lote Manual',
              tipo: 'completo',
              lote_status: 'concluido',
              liberado_em: '2025-01-01T00:00:00Z',
              auto_emitir_em: null,
              empresa_nome: 'Empresa A',
              clinica_nome: 'Clinica A',
              total_avaliacoes: 5,
              observacoes: null,
              status_laudo: null,
              laudo_id: null,
              emitido_em: null,
              enviado_em: null,
            },
            {
              id: 2,
              titulo: 'Lote Automático',
              tipo: 'completo',
              lote_status: 'concluido',
              liberado_em: '2025-01-02T00:00:00Z',
              auto_emitir_em: new Date(
                Date.now() + 4 * 60 * 60 * 1000
              ).toISOString(),
              empresa_nome: 'Empresa B',
              clinica_nome: 'Clinica B',
              total_avaliacoes: 3,
              observacoes: null,
              status_laudo: null,
              laudo_id: null,
              emitido_em: null,
              enviado_em: null,
            },
          ],
          rowCount: 2,
        });

      const mockMap = new Map();
      mockMap.set(1, {
        pode_emitir_laudo: false,
        motivos_bloqueio: ['Motivo X'],
        detalhes: { taxa_conclusao: 100 } as any,
      });
      mockMap.set(2, {
        pode_emitir_laudo: true,
        motivos_bloqueio: [],
        detalhes: { taxa_conclusao: 100 } as any,
      });

      mockValidarLotes.mockResolvedValue(mockMap);

      const request = new Request('http://localhost/api/emissor/lotes');
      const response = await getLotesEmissor(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.lotes).toHaveLength(2);

      // Verificar lote manual
      const loteManual = data.lotes.find((l: any) => l.id === 1);
      expect(loteManual.emissao_automatica).toBe(false);
      expect(loteManual.previsao_emissao).toBeNull();

      // Verificar lote automático
      const loteAutomatico = data.lotes.find((l: any) => l.id === 2);
      expect(loteAutomatico.emissao_automatica).toBe(true);
      expect(loteAutomatico.previsao_emissao).toBeDefined();
      expect(loteAutomatico.previsao_emissao.formatada).toBeDefined();
    });

    it('deve incluir contagem total correta', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        perfil: 'emissor',
      });

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ total: 5 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      const request = new Request('http://localhost/api/emissor/lotes');
      const response = await getLotesEmissor(request);
      const data = await response.json();

      expect(data.total).toBe(5);
    });

    it('preenche hash a partir do arquivo quando laudo existe mas hash é nulo', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        perfil: 'emissor',
      });

      // total
      mockQuery.mockResolvedValueOnce({ rows: [{ total: 1 }], rowCount: 1 });

      // lotes: laudo_id presente, hash_pdf nulo
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 42,
            titulo: 'Lote Com Laudo Sem Hash',
            tipo: 'completo',
            lote_status: 'finalizado',
            liberado_em: '2025-01-02T00:00:00Z',
            auto_emitir_em: null,
            empresa_nome: 'Empresa X',
            clinica_nome: 'Clinica X',
            total_avaliacoes: 2,
            observacoes: null,
            status_laudo: 'enviado',
            laudo_id: 99,
            emitido_em: '2025-12-14T08:30:00Z',
            enviado_em: '2025-12-14T09:00:00Z',
            hash_pdf: null,
          },
        ],
        rowCount: 1,
      });

      // validarLotesParaLaudo
      const mockMap = new Map();
      mockMap.set(42, {
        pode_emitir_laudo: true,
        motivos_bloqueio: [],
        detalhes: { taxa_conclusao: 100 },
      } as any);
      mockValidarLotes.mockResolvedValue(mockMap);

      // Mock FS: o arquivo existe e retorna buffer
      jest.mock('fs/promises', () => ({
        readFile: jest.fn().mockResolvedValue(Buffer.from('PDF-BYTES')),
      }));
      const crypto = require('crypto');
      const expectedHash = crypto
        .createHash('sha256')
        .update(Buffer.from('PDF-BYTES'))
        .digest('hex');

      // Mock UPDATE laudos (persistência do hash)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const request = new Request('http://localhost/api/emissor/lotes');
      const response = await getLotesEmissor(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.lotes[0].laudo).toBeDefined();
      expect(data.lotes[0].laudo.hash_pdf).toBe(expectedHash);
    });
  });
});
