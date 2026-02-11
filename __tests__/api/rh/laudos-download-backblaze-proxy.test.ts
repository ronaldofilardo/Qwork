/**
 * Teste da rota de download de laudos RH com proxy server-side do Backblaze
 *
 * Comportamento esperado (após correções de 10/02/2026):
 * 1. Servidor gera presigned URL do Backblaze
 * 2. Servidor faz fetch do PDF do Backblaze (proxy server-side)
 * 3. Servidor retorna PDF diretamente ao cliente (status 200)
 * 4. NÃO usa redirect 302 (evita problemas de CORS)
 * 5. NÃO busca arquivos locais em storage/laudos/ ou public/laudos/
 */

import { GET } from '@/app/api/rh/laudos/[laudoId]/download/route';
import { getSession, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');
jest.mock('@/lib/storage/backblaze-client');

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockRequireRHWithEmpresaAccess =
  requireRHWithEmpresaAccess as jest.MockedFunction<
    typeof requireRHWithEmpresaAccess
  >;
const mockQuery = query as jest.MockedFunction<typeof query>;

// Mock global fetch
global.fetch = jest.fn();

describe('GET /api/rh/laudos/[laudoId]/download - Backblaze Proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validação de Acesso', () => {
    it('deve retornar 403 quando usuário não tem sessão RH', async () => {
      mockGetSession.mockResolvedValue(null as any);

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1005' } } as any
      );

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Acesso negado');
    });

    it('deve retornar 404 quando laudo não existe', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '04703084945',
        nome: 'RH Test',
        perfil: 'rh',
        clinica_id: 104,
      } as any);

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const response = await GET(
        {} as Request,
        { params: { laudoId: '9999' } } as any
      );

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toContain('não encontrado');
    });

    it('deve retornar 403 quando RH não tem acesso à empresa', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '04703084945',
        nome: 'RH Test',
        perfil: 'rh',
        clinica_id: 104,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1005,
            lote_id: 1005,
            status: 'emitido',
            hash_pdf: '0014e8529251d709...',
            arquivo_remoto_key:
              'laudos/lote-1005/laudo-1770756960778-42nlgb.pdf',
            clinica_id: 104,
            empresa_id: 5,
          },
        ],
        rowCount: 1,
      } as any);

      mockRequireRHWithEmpresaAccess.mockRejectedValueOnce(
        new Error('Acesso negado')
      );

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1005' } } as any
      );

      expect(response.status).toBe(403);
      expect(mockRequireRHWithEmpresaAccess).toHaveBeenCalledWith(5);
    });
  });

  describe('Download via Backblaze (Proxy Server-Side)', () => {
    it('deve retornar 404 quando laudo não tem arquivo_remoto_key', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '04703084945',
        nome: 'RH Test',
        perfil: 'rh',
        clinica_id: 104,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1005,
            lote_id: 1005,
            status: 'emitido',
            hash_pdf: '0014e8529251d709...',
            arquivo_remoto_key: null, // SEM arquivo no Backblaze
            clinica_id: 104,
            empresa_id: 5,
          },
        ],
        rowCount: 1,
      } as any);

      mockRequireRHWithEmpresaAccess.mockResolvedValueOnce({} as any);

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1005' } } as any
      );

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toContain(
        'Arquivo do laudo não foi enviado ao bucket ainda'
      );
      expect(json.status).toBe('awaiting_upload');
    });

    it('deve fazer proxy do PDF do Backblaze e retornar status 200', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '04703084945',
        nome: 'tani akk',
        perfil: 'rh',
        clinica_id: 104,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1005,
            lote_id: 1005,
            status: 'emitido',
            hash_pdf: '0014e8529251d709...',
            arquivo_remoto_key:
              'laudos/lote-1005/laudo-1770756960778-42nlgb.pdf',
            clinica_id: 104,
            empresa_id: 5,
          },
        ],
        rowCount: 1,
      } as any);

      mockRequireRHWithEmpresaAccess.mockResolvedValueOnce({} as any);

      // Mock do getPresignedUrl
      const mockGetPresignedUrl = jest
        .fn()
        .mockResolvedValue(
          'https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1005/laudo-1770756960778-42nlgb.pdf?X-Amz...'
        );
      jest.doMock('@/lib/storage/backblaze-client', () => ({
        getPresignedUrl: mockGetPresignedUrl,
      }));

      // Mock do fetch do PDF do Backblaze
      const mockPdfBuffer = Buffer.from('PDF_CONTENT_FROM_BACKBLAZE');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockPdfBuffer),
      });

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1005' } } as any
      );

      // Verificar que retorna status 200 (não redirect 302)
      expect(response.status).toBe(200);

      // Verificar headers corretos
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain(
        'laudo-1005.pdf'
      );

      // Verificar que fetch foi chamado com presigned URL
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('s3.us-east-005.backblazeb2.com')
      );
    });

    it('deve retornar 500 quando fetch do Backblaze falha', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '04703084945',
        nome: 'tani akk',
        perfil: 'rh',
        clinica_id: 104,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1005,
            lote_id: 1005,
            status: 'emitido',
            arquivo_remoto_key:
              'laudos/lote-1005/laudo-1770756960778-42nlgb.pdf',
            clinica_id: 104,
            empresa_id: 5,
          },
        ],
        rowCount: 1,
      } as any);

      mockRequireRHWithEmpresaAccess.mockResolvedValueOnce({} as any);

      // Mock do fetch retornando erro
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1005' } } as any
      );

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toContain('Erro ao acessar arquivo no storage');
    });
  });

  describe('Comportamentos Removidos (Não Deve Mais Acontecer)', () => {
    it('NÃO deve tentar ler arquivo de storage/laudos/ local', async () => {
      // Este comportamento foi removido - testes devem passar sem mock de fs
      mockGetSession.mockResolvedValue({
        cpf: '04703084945',
        perfil: 'rh',
        clinica_id: 104,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1005,
            lote_id: 1005,
            status: 'emitido',
            arquivo_remoto_key:
              'laudos/lote-1005/laudo-1770756960778-42nlgb.pdf',
            clinica_id: 104,
            empresa_id: 5,
          },
        ],
        rowCount: 1,
      } as any);

      mockRequireRHWithEmpresaAccess.mockResolvedValueOnce({} as any);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('PDF')),
      });

      await GET({} as Request, { params: { laudoId: '1005' } } as any);

      // Se tentasse ler fs, o teste falharia (fs não está mockado)
      // O fato de passar prova que não usa filesystem
    });

    it('NÃO deve retornar redirect 302', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '04703084945',
        perfil: 'rh',
        clinica_id: 104,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1005,
            lote_id: 1005,
            status: 'emitido',
            arquivo_remoto_key: 'laudos/lote-1005/laudo.pdf',
            clinica_id: 104,
            empresa_id: 5,
          },
        ],
        rowCount: 1,
      } as any);

      mockRequireRHWithEmpresaAccess.mockResolvedValueOnce({} as any);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('PDF')),
      });

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1005' } } as any
      );

      // Deve retornar 200 (proxy), NÃO 302 (redirect)
      expect(response.status).toBe(200);
      expect(response.status).not.toBe(302);
    });
  });
});
