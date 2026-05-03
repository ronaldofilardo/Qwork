/**
 * @jest-environment node
 */

import {
  gerarPdf,
  gerarPdfRecibo,
  calcularHash,
  verificarHash,
} from '@/lib/pdf-generator';

// Mock do Puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

// Mock do fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}));

const mockPuppeteer = require('puppeteer');
const mockFs = require('fs/promises');

describe('pdf-generator unificado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('gerarPdf', () => {
    it('deve gerar PDF com hash SHA-256 incluído no rodapé', async () => {
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue({
          setContent: jest.fn().mockResolvedValue(undefined),
          pdf: jest.fn().mockResolvedValue(Buffer.from('PDF_FINAL')),
          close: jest.fn().mockResolvedValue(undefined),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockPuppeteer.launch.mockResolvedValue(mockBrowser);

      const htmlTemplate = `
        <html>
          <body>
            <h1>Recibo Teste</h1>
            <div id="hash-section">{{HASH_PDF}}</div>
          </body>
        </html>
      `;

      const result = await gerarPdf({
        tipo: 'recibo',
        html: htmlTemplate,
        filename: 'recibo-test.pdf',
        includeHash: true,
        saveToDisk: false, // Não salvar para teste
      });

      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/); // Hash SHA-256 válido
      expect(result.size).toBeGreaterThan(0);

      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('deve salvar PDF localmente quando solicitado', async () => {
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue({
          setContent: jest.fn().mockResolvedValue(undefined),
          pdf: jest.fn().mockResolvedValue(Buffer.from('PDF_CONTENT')),
          close: jest.fn().mockResolvedValue(undefined),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockPuppeteer.launch.mockResolvedValue(mockBrowser);

      const result = await gerarPdf({
        tipo: 'recibo',
        html: '<html><body>Test</body></html>',
        filename: 'recibo-test.pdf',
        includeHash: false,
        saveToDisk: true,
        storageSubpath: 'recibos/2025/12-dezembro',
      });

      expect(result.localPath).toContain(
        'storage/recibos/2025/12-dezembro/recibo-test.pdf'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('recibo-test.pdf'),
        expect.any(Buffer)
      );
    });
  });

  describe('gerarPdfRecibo', () => {
    it('deve gerar PDF de recibo com configuração específica', async () => {
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue({
          setContent: jest.fn().mockResolvedValue(undefined),
          pdf: jest.fn().mockResolvedValue(Buffer.from('RECIBO_PDF')),
          close: jest.fn().mockResolvedValue(undefined),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockPuppeteer.launch.mockResolvedValue(mockBrowser);

      const result = await gerarPdfRecibo(
        '<html><body>Recibo HTML</body></html>',
        'REC-20251231-0001'
      );

      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
      // O subpath pode variar conforme a data atual; validar que é um path de 'recibos' e inclui o filename
      expect(result.localPath).toContain('recibos/');
      expect(result.localPath).toContain('recibo-REC-20251231-0001.pdf');
    });
  });

  describe('funções utilitárias', () => {
    describe('calcularHash', () => {
      it('deve calcular hash SHA-256 corretamente', () => {
        const buffer = Buffer.from('test content');
        const hash = calcularHash(buffer);

        expect(hash).toBe(
          '6ae8a75555209fd6c44157c0aed8016e763ff435a19cf186f76863140143ff72'
        );
        expect(hash).toHaveLength(64);
      });
    });

    describe('verificarHash', () => {
      it('deve verificar hash corretamente', () => {
        const buffer = Buffer.from('test content');
        const hashCorreto =
          '6ae8a75555209fd6c44157c0aed8016e763ff435a19cf186f76863140143ff72';
        const hashIncorreto =
          'hash_incorreto_123456789012345678901234567890123456789012345678901234567890';

        expect(verificarHash(buffer, hashCorreto)).toBe(true);
        expect(verificarHash(buffer, hashIncorreto)).toBe(false);
      });
    });
  });
});
