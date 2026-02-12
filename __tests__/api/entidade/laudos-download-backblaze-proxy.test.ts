/**
 * Teste da rota de download de laudos Entidade com proxy server-side do Backblaze
 *
 * Comportamento esperado (após correção de 10/02/2026):
 * 1. Buscar arquivo_remoto_key no banco de dados (prioridade ÚNICA)
 * 2. Gerar presigned URL do Backblaze
 * 3. Servidor faz fetch do PDF do Backblaze (proxy server-side)
 * 4. Servidor retorna PDF diretamente ao cliente (status 200)
 * 5. NÃO tenta ler arquivos locais em storage/laudos/
 * 6. NÃO faz discovery no Backblaze
 */

import { GET } from '@/app/api/entidade/laudos/[laudoId]/download/route';
import { requireEntity } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;
const mockQuery = query as jest.MockedFunction<typeof query>;

// Mock global fetch
global.fetch = jest.fn();

describe('GET /api/entidade/laudos/[laudoId]/download - Backblaze Proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validação de Acesso', () => {
    it('deve retornar 403 quando usuário não tem sessão de entidade', async () => {
      mockRequireEntity.mockRejectedValueOnce(new Error('Acesso negado'));

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1008' } } as any
      );

      expect(response.status).toBe(403);
    });

    it('deve retornar 400 quando laudoId é inválido', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 1,
        cpf: '12345678901',
        nome: 'Entidade Test',
      } as any);

      const response = await GET(
        {} as Request,
        { params: { laudoId: 'abc' } } as any
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('inválido');
    });

    it('deve retornar 404 quando laudo não pertence à entidade', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 1,
        cpf: '12345678901',
        nome: 'Entidade Test',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [], // Laudo não encontrado
        rowCount: 0,
      } as any);

      const response = await GET(
        {} as Request,
        { params: { laudoId: '9999' } } as any
      );

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toContain('Laudo não encontrado ou acesso negado');
    });
  });

  describe('Validação de Arquivo Remoto', () => {
    it('deve retornar 404 quando laudo não tem arquivo_remoto_key', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 1,
        cpf: '12345678901',
        nome: 'Entidade Test',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1008,
            lote_id: 1008,
            status: 'emitido',
            arquivo_remoto_key: null, // SEM arquivo no Backblaze
            arquivo_remoto_provider: null,
            arquivo_remoto_bucket: null,
            arquivo_remoto_url: null,
            entidade_id: 1,
            clinica_id: 101,
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1008' } } as any
      );

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toContain('não foi enviado ao bucket ainda');
      expect(json.status).toBe('awaiting_upload');
    });
  });

  describe('Download com Proxy Server-Side', () => {
    it('deve fazer proxy server-side do PDF do Backblaze (status 200)', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 1,
        cpf: '12345678901',
        nome: 'Entidade Test',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1008,
            lote_id: 1008,
            status: 'emitido',
            arquivo_remoto_key: 'laudos/lote-1008/laudo-123.pdf',
            arquivo_remoto_provider: 'backblaze',
            arquivo_remoto_bucket: 'qwork-laudos',
            arquivo_remoto_url: null,
            entidade_id: 1,
            clinica_id: 101,
          },
        ],
        rowCount: 1,
      } as any);

      // Mock do fetch retornando PDF
      const pdfBuffer = Buffer.from('PDF_CONTENT_HERE');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(pdfBuffer),
      });

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1008' } } as any
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain(
        'laudo-1008.pdf'
      );

      // Verificar que fetch foi chamado com presigned URL
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('s3.us-east-005.backblazeb2.com')
      );
    });

    it('deve retornar headers corretos no response (Cache-Control, Content-Length)', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 1,
        cpf: '12345678901',
        nome: 'Entidade Test',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1008,
            lote_id: 1008,
            status: 'emitido',
            arquivo_remoto_key: 'laudos/lote-1008/laudo-456.pdf',
            arquivo_remoto_provider: 'backblaze',
            arquivo_remoto_bucket: 'qwork-laudos',
            arquivo_remoto_url: null,
            entidade_id: 1,
            clinica_id: 101,
          },
        ],
        rowCount: 1,
      } as any);

      const pdfBuffer = Buffer.from('MOCK_PDF_DATA');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(pdfBuffer),
      });

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1008' } } as any
      );

      expect(response.headers.get('Content-Length')).toBe(
        pdfBuffer.byteLength.toString()
      );
      expect(response.headers.get('Cache-Control')).toBe('private, max-age=0');
    });

    it('deve retornar 500 quando fetch do Backblaze falha', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 1,
        cpf: '12345678901',
        nome: 'Entidade Test',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1008,
            lote_id: 1008,
            status: 'emitido',
            arquivo_remoto_key: 'laudos/lote-1008/laudo-789.pdf',
            arquivo_remoto_provider: 'backblaze',
            arquivo_remoto_bucket: 'qwork-laudos',
            arquivo_remoto_url: null,
            entidade_id: 1,
            clinica_id: 101,
          },
        ],
        rowCount: 1,
      } as any);

      // Mock do fetch retornando erro
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1008' } } as any
      );

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toContain('Erro ao acessar arquivo no storage');
    });

    it('deve retornar 500 quando há erro ao processar response do Backblaze', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 1,
        cpf: '12345678901',
        nome: 'Entidade Test',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1008,
            lote_id: 1008,
            status: 'emitido',
            arquivo_remoto_key: 'laudos/lote-1008/laudo-error.pdf',
            arquivo_remoto_provider: 'backblaze',
            arquivo_remoto_bucket: 'qwork-laudos',
            arquivo_remoto_url: null,
            entidade_id: 1,
            clinica_id: 101,
          },
        ],
        rowCount: 1,
      } as any);

      // Mock do fetch retornando erro de rede
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1008' } } as any
      );

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toContain('Erro ao acessar arquivo do laudo');
    });
  });

  describe('Comportamentos Removidos (Query Correta)', () => {
    it('deve buscar arquivo_remoto_key no banco (não tentar descobrir via filesystem)', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 1,
        cpf: '12345678901',
        nome: 'Entidade Test',
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1008,
            lote_id: 1008,
            status: 'enviado',
            arquivo_remoto_key: 'laudos/lote-1008/remoto.pdf',
            arquivo_remoto_provider: 'backblaze',
            arquivo_remoto_bucket: 'qwork-laudos',
            arquivo_remoto_url: null,
            entidade_id: 1,
            clinica_id: 101,
          },
        ],
        rowCount: 1,
      } as any);

      const pdfBuffer = Buffer.from('PDF');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(pdfBuffer),
      });

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1008' } } as any
      );

      // Verificar que query foi chamado com SELECT correto
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('arquivo_remoto_key'),
        expect.arrayContaining([1008, 1])
      );

      expect(response.status).toBe(200);
    });
  });
});
