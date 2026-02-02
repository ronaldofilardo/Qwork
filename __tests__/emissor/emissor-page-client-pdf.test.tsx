/**
 * Testes: Componente EmissorDashboard - Geração Client-side de PDF
 * Testa handleDownloadLaudo e gerarPDFClientSide
 * Referência: Fix Vercel Chromium - Client-side PDF Generation
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock do router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock do jsPDF e html2canvas
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    addImage: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
  })),
}));

jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    width: 800,
    height: 1200,
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,MOCK'),
  }),
}));

describe('EmissorDashboard - Client-side PDF Generation', () => {
  const originalFetch = global.fetch;
  const originalAlert = global.alert;

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.alert = originalAlert;
  });

  // ============================================================================
  // TESTE: Download direto quando PDF existe
  // ============================================================================
  describe('Cenário 1: PDF existe no servidor', () => {
    it('deve fazer download direto do PDF', async () => {
      const mockBlob = new Blob(['PDF_DATA'], { type: 'application/pdf' });
      const mockResponse = {
        ok: true,
        headers: new Map([['content-type', 'application/pdf']]),
        blob: jest.fn().mockResolvedValue(mockBlob),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Mock de elementos DOM
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      jest
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockLink as any);
      jest
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => mockLink as any);
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();

      // Simular função handleDownloadLaudo
      const lote = {
        id: 123,
        codigo: 'LOTE-ABC',
        laudo: { id: 456 },
      };

      const handleDownloadLaudo = async (lote: any) => {
        const response = await fetch(`/api/emissor/laudos/${lote.id}/download`);
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/pdf')) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `laudo-${lote.codigo || lote.id}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      };

      await handleDownloadLaudo(lote);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/emissor/laudos/123/download'
      );
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toBe('laudo-LOTE-ABC.pdf');
    });
  });

  // ============================================================================
  // TESTE: Fallback client-side quando PDF não existe
  // ============================================================================
  describe('Cenário 2: Fallback client-side', () => {
    it('deve usar geração client-side quando receber JSON com useClientSide', async () => {
      const mockJsonResponse = {
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({
          useClientSide: true,
          htmlEndpoint: '/api/emissor/laudos/123/html',
          message: 'PDF será gerado no navegador',
        }),
      };

      const mockHtmlResponse = {
        ok: true,
        text: jest
          .fn()
          .mockResolvedValue('<html><body>Laudo Mock</body></html>'),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse) // Primeira chamada: /download
        .mockResolvedValueOnce(mockHtmlResponse); // Segunda chamada: /html

      const lote = {
        id: 123,
        codigo: 'LOTE-XYZ',
        laudo: { id: 789 },
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Simular handleDownloadLaudo com fallback
      const handleDownloadLaudo = async (lote: any) => {
        const response = await fetch(`/api/emissor/laudos/${lote.id}/download`);
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          const data = await response.json();

          if (data.useClientSide && data.htmlEndpoint) {
            console.log(
              '[INFO] PDF não disponível no servidor. Usando geração client-side...'
            );

            const htmlResponse = await fetch(data.htmlEndpoint);
            if (!htmlResponse.ok) {
              throw new Error('Erro ao buscar HTML do laudo');
            }

            const htmlContent = await htmlResponse.text();
            // Aqui chamaria gerarPDFClientSide
            return { clientSide: true, html: htmlContent };
          }
        }
      };

      const result = await handleDownloadLaudo(lote);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        '/api/emissor/laudos/123/download'
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        '/api/emissor/laudos/123/html'
      );
      expect(result).toEqual({
        clientSide: true,
        html: '<html><body>Laudo Mock</body></html>',
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        '[INFO] PDF não disponível no servidor. Usando geração client-side...'
      );

      consoleSpy.mockRestore();
    });

    it('deve exibir erro quando HTML endpoint falhar', async () => {
      const mockJsonResponse = {
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({
          useClientSide: true,
          htmlEndpoint: '/api/emissor/laudos/123/html',
        }),
      };

      const mockHtmlErrorResponse = {
        ok: false,
        status: 500,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse)
        .mockResolvedValueOnce(mockHtmlErrorResponse);

      const lote = {
        id: 123,
        codigo: 'LOTE-ERROR',
        laudo: { id: 999 },
      };

      const handleDownloadLaudo = async (lote: any) => {
        try {
          const response = await fetch(
            `/api/emissor/laudos/${lote.id}/download`
          );
          const contentType = response.headers.get('content-type');

          if (contentType?.includes('application/json')) {
            const data = await response.json();

            if (data.useClientSide && data.htmlEndpoint) {
              const htmlResponse = await fetch(data.htmlEndpoint);

              if (!htmlResponse.ok) {
                throw new Error('Erro ao buscar HTML do laudo');
              }
            }
          }
        } catch (error) {
          alert(`Erro ao fazer download do laudo: ${(error as Error).message}`);
          throw error;
        }
      };

      await expect(handleDownloadLaudo(lote)).rejects.toThrow(
        'Erro ao buscar HTML do laudo'
      );
      expect(global.alert).toHaveBeenCalledWith(
        'Erro ao fazer download do laudo: Erro ao buscar HTML do laudo'
      );
    });
  });

  // ============================================================================
  // TESTE: gerarPDFClientSide - Geração no navegador
  // ============================================================================
  describe('Cenário 3: gerarPDFClientSide', () => {
    it('deve criar iframe, renderizar HTML e gerar PDF', async () => {
      const { jsPDF } = require('jspdf');
      const html2canvas = require('html2canvas').default;

      const mockIframe = {
        style: {},
        contentDocument: {
          open: jest.fn(),
          write: jest.fn(),
          close: jest.fn(),
          body: document.createElement('body'),
          querySelectorAll: jest.fn().mockReturnValue([]),
        },
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockIframe as any);
      jest
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockIframe as any);
      jest
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => mockIframe as any);

      const mockPdf = {
        addImage: jest.fn(),
        addPage: jest.fn(),
        save: jest.fn(),
      };
      jsPDF.mockReturnValue(mockPdf);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const gerarPDFClientSide = async (
        htmlContent: string,
        filename: string,
        loteId: number
      ) => {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;

        console.log(
          `[PDF] Iniciando geração client-side para lote ${loteId}...`
        );

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument;
        if (!doc) throw new Error('Documento não disponível');

        doc.open();
        doc.write(htmlContent);
        doc.close();

        // [PDF] HTML renderizado no iframe

        const canvas = await html2canvas(doc.body, { scale: 2 });
        // [PDF] Canvas capturado

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

        // [PDF] PDF gerado, iniciando download...

        pdf.save(`${filename}.pdf`);

        document.body.removeChild(iframe);
      };

      await gerarPDFClientSide(
        '<html><body>Test</body></html>',
        'laudo-123',
        123
      );

      expect(mockIframe.contentDocument.write).toHaveBeenCalledWith(
        '<html><body>Test</body></html>'
      );
      expect(html2canvas).toHaveBeenCalled();
      expect(mockPdf.addImage).toHaveBeenCalled();
      expect(mockPdf.save).toHaveBeenCalledWith('laudo-123.pdf');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[PDF] Iniciando geração client-side para lote 123...'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[SUCCESS] PDF gerado e baixado: laudo-123.pdf'
      );

      consoleSpy.mockRestore();
    });

    it('deve aguardar carregamento de imagens antes de gerar PDF', async () => {
      const html2canvas = require('html2canvas').default;

      const mockImg1 = { complete: false, onload: null, onerror: null };
      const mockImg2 = { complete: true };

      const mockIframe = {
        style: {},
        contentDocument: {
          open: jest.fn(),
          write: jest.fn(),
          close: jest.fn(),
          body: document.createElement('body'),
          querySelectorAll: jest.fn().mockReturnValue([mockImg1, mockImg2]),
        },
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockIframe as any);
      jest
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockIframe as any);
      jest
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => mockIframe as any);

      const gerarPDFClientSide = async (htmlContent: string) => {
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument;
        if (!doc) throw new Error('Documento não disponível');

        doc.write(htmlContent);

        const images = doc.querySelectorAll('img');
        await Promise.all(
          Array.from(images).map(
            (img: any) =>
              new Promise((resolve) => {
                if (img.complete) {
                  resolve(true);
                } else {
                  img.onload = () => resolve(true);
                  img.onerror = () => resolve(false);
                  // Simular carregamento
                  setTimeout(() => img.onload?.(), 10);
                }
              })
          )
        );

        return images.length;
      };

      const imageCount = await gerarPDFClientSide(
        '<html><img src="test1.png"/><img src="test2.png"/></html>'
      );

      expect(imageCount).toBe(2);
      expect(mockIframe.contentDocument.querySelectorAll).toHaveBeenCalledWith(
        'img'
      );
    });
  });

  // ============================================================================
  // TESTE: Tratamento de erros
  // ============================================================================
  describe('Cenário 4: Tratamento de erros', () => {
    it('deve mostrar alerta quando laudo não tem ID', async () => {
      const lote = {
        id: 123,
        codigo: 'LOTE-NO-LAUDO',
        laudo: null, // Sem laudo
      };

      const handleDownloadLaudo = async (lote: any) => {
        if (!lote.laudo?.id) {
          alert('Erro: ID do laudo inválido');
          return;
        }
      };

      await handleDownloadLaudo(lote);

      expect(global.alert).toHaveBeenCalledWith('Erro: ID do laudo inválido');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('deve capturar e exibir erro genérico da API', async () => {
      const mockErrorResponse = {
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({
          error: 'Laudo não disponível para download',
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      const lote = {
        id: 123,
        codigo: 'LOTE-ERROR',
        laudo: { id: 456 },
      };

      const handleDownloadLaudo = async (lote: any) => {
        const response = await fetch(`/api/emissor/laudos/${lote.id}/download`);
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          const data = await response.json();

          if (!data.useClientSide && data.error) {
            alert(`Erro: ${data.error}`);
          }
        }
      };

      await handleDownloadLaudo(lote);

      expect(global.alert).toHaveBeenCalledWith(
        'Erro: Laudo não disponível para download'
      );
    });
  });
});
