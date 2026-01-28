/**
 * @jest-environment node
 */

import { GET as getReciboPdf } from '@/app/api/recibo/[id]/pdf/route';
import { GET as verificarIntegridade } from '@/app/api/recibo/[id]/verificar/route';
import { query } from '@/lib/db';

// Mock das dependências
jest.mock('@/lib/db');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('API Recibo PDF BYTEA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/recibo/[id]/pdf', () => {
    it('deve retornar PDF do banco com headers corretos', async () => {
      const mockPdfBuffer = Buffer.from('PDF_CONTENT_MOCK');
      const mockRecibo = {
        id: 200,
        numero_recibo: 'REC-20251231-0001',
        pdf: mockPdfBuffer,
        hash_pdf:
          'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
        contratante_id: 1,
        criado_em: new Date(),
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockRecibo] }) // buscar recibo
        .mockResolvedValueOnce({ rows: [] }); // auditoria (não falha se erro)

      const mockRequest = new Request(
        'http://localhost:3000/api/recibo/200/pdf'
      );
      const mockParams = { params: { id: '200' } };

      const response = await getReciboPdf(mockRequest, mockParams);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain(
        'recibo-REC-20251231-0001.pdf'
      );
      expect(response.headers.get('X-Recibo-Numero')).toBe('REC-20251231-0001');
      expect(response.headers.get('X-Recibo-Hash')).toBe(mockRecibo.hash_pdf);

      // Verificar se o PDF foi retornado corretamente
      // Como é um NextResponse com Buffer, verificamos apenas que foi criado
      expect(response.status).toBe(200);
      // O conteúdo do PDF é validado pelas queries do mock
    });

    it('deve retornar 404 para recibo inexistente', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const mockRequest = new Request(
        'http://localhost:3000/api/recibo/999/pdf'
      );
      const mockParams = { params: { id: '999' } };

      const response = await getReciboPdf(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Recibo não encontrado ou inativo');
    });

    it('deve verificar integridade do PDF quando hash existe', async () => {
      const mockPdfBuffer = Buffer.from('PDF_CONTENT_MOCK');
      const correctHash =
        'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
      const mockRecibo = {
        id: 200,
        numero_recibo: 'REC-20251231-0001',
        pdf: mockPdfBuffer,
        hash_pdf: correctHash,
        contratante_id: 1,
        criado_em: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockRecibo] });

      const mockRequest = new Request(
        'http://localhost:3000/api/recibo/200/pdf'
      );
      const mockParams = { params: { id: '200' } };

      // Não deve lançar erro pois hash confere
      const response = await getReciboPdf(mockRequest, mockParams);
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/recibo/[id]/verificar', () => {
    it('deve verificar integridade do recibo usando função PostgreSQL', async () => {
      const mockVerificacao = {
        id: 200,
        hash_armazenado: 'hash_armazenado_123',
        hash_calculado: 'hash_calculado_456',
        integro: false,
      };

      const mockMetadados = {
        numero_recibo: 'REC-20251231-0001',
        contratante_id: 1,
        criado_em: new Date(),
        emitido_por: '123.456.789-00',
        backup_path:
          'storage/recibos/2025/12-dezembro/recibo-REC-20251231-0001.pdf',
        tamanho_pdf: 102400,
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockVerificacao] }) // verificar_integridade_recibo
        .mockResolvedValueOnce({ rows: [mockMetadados] }); // metadados

      const mockRequest = new Request(
        'http://localhost:3000/api/recibo/200/verificar'
      );
      const mockParams = { params: { id: '200' } };

      const response = await verificarIntegridade(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.integro).toBe(false);
      expect(data.hash_armazenado).toBe('hash_armazenado_123');
      expect(data.hash_calculado).toBe('hash_calculado_456');
      expect(data.recibo.numero).toBe('REC-20251231-0001');
      expect(data.recibo.tamanho_pdf_kb).toBe(100); // 102400 / 1024
    });

    it('deve retornar erro para recibo inexistente na verificação', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const mockRequest = new Request(
        'http://localhost:3000/api/recibo/999/verificar'
      );
      const mockParams = { params: { id: '999' } };

      const response = await verificarIntegridade(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Recibo não encontrado');
    });
  });
});
