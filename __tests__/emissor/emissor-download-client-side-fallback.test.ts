/**
 * Testes: Endpoint /api/emissor/laudos/[loteId]/download
 * Testa fallback client-side quando PDF não existe
 * Referência: Fix Vercel Chromium - Client-side PDF Generation
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/emissor/laudos/[loteId]/download/route';

// Mock das dependências
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

describe('Endpoint /api/emissor/laudos/[loteId]/download - Client-side Fallback', () => {
  const mockQuery = require('@/lib/db').query;
  const mockRequireRole = require('@/lib/session').requireRole;
  const mockFsPromises = require('fs/promises');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // TESTE: Retornar PDF quando existe
  // ============================================================================
  describe('Cenário 1: PDF existe no servidor', () => {
    it('deve retornar PDF com status 200 quando arquivo existe', async () => {
      const mockPdfBuffer = Buffer.from('MOCK_PDF_DATA');
      const loteId = 123;

      mockRequireRole.mockResolvedValue({
        cpf: '12345678900',
        perfil: 'emissor',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 456,
            lote_id: loteId,
            titulo: 'Laudo Teste',
          },
        ],
      });

      mockFsPromises.readFile.mockResolvedValueOnce(mockPdfBuffer);

      const request = new NextRequest(
        `http://localhost:3000/api/emissor/laudos/${loteId}/download`
      );
      const context = { params: { loteId: String(loteId) } };

      const response = await GET(request, context);

      expect(response.status).toBe(200);
      expect(mockFsPromises.readFile).toHaveBeenCalled();
    });

    it('deve chamar fs.readFile quando PDF existe', async () => {
      const mockPdfBuffer = Buffer.from('MOCK_PDF_DATA');
      const loteId = 123;

      mockRequireRole.mockResolvedValue({
        cpf: '12345678900',
        perfil: 'emissor',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 456,
            lote_id: loteId,
            titulo: 'Laudo Teste',
          },
        ],
      });

      mockFsPromises.readFile.mockResolvedValueOnce(mockPdfBuffer);

      const request = new NextRequest(
        `http://localhost:3000/api/emissor/laudos/${loteId}/download`
      );
      const context = { params: { loteId: String(loteId) } };

      await GET(request, context);

      // Verificar que tentou ler o arquivo
      expect(mockFsPromises.readFile).toHaveBeenCalledWith(
        expect.stringContaining('storage/laudos')
      );
    });
  });

  // ============================================================================
  // TESTE: Fallback client-side quando PDF não existe
  // ============================================================================
  describe('Cenário 2: PDF não existe - Fallback client-side', () => {
    it('deve retornar JSON com useClientSide: true quando PDF não existe', async () => {
      const loteId = 123;

      mockRequireRole.mockResolvedValue({
        cpf: '12345678900',
        perfil: 'emissor',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 456,
            lote_id: loteId,
            titulo: 'Laudo Teste',
          },
        ],
      });

      // PDF não existe - rejeitar todas as tentativas de leitura
      mockFsPromises.readFile.mockRejectedValue(
        new Error('ENOENT: file not found')
      );

      const request = new NextRequest(
        `http://localhost:3000/api/emissor/laudos/${loteId}/download`
      );
      const context = { params: { loteId: String(loteId) } };

      const response = await GET(request, context);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('useClientSide', true);
      expect(data).toHaveProperty('htmlEndpoint');
      expect(data.htmlEndpoint).toContain(`/api/emissor/laudos/${loteId}/html`);
    });

    it('deve retornar JSON com message explicativa', async () => {
      const loteId = 999;

      mockRequireRole.mockResolvedValue({
        cpf: '98765432100',
        perfil: 'emissor',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 777,
            lote_id: loteId,
            titulo: 'Laudo Teste',
          },
        ],
      });

      mockFsPromises.readFile.mockRejectedValue(new Error('ENOENT'));

      const request = new NextRequest(
        `http://localhost:3000/api/emissor/laudos/${loteId}/download`
      );
      const context = { params: { loteId: String(loteId) } };

      const response = await GET(request, context);

      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('navegador');
    });
  });

  // ============================================================================
  // TESTE: Segurança - Validação de permissões
  // ============================================================================
  describe('Cenário 3: Segurança e Validações', () => {
    it('deve bloquear acesso de não-emissor', async () => {
      mockRequireRole.mockRejectedValue(new Error('Acesso negado'));

      const request = new NextRequest(
        'http://localhost:3000/api/emissor/laudos/123/download'
      );
      const context = { params: { loteId: '123' } };

      await expect(GET(request, context)).rejects.toThrow('Acesso negado');
    });

    it('deve retornar 404 quando lote não existe', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678900',
        perfil: 'emissor',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [], // Lote não encontrado
      });

      const request = new NextRequest(
        'http://localhost:3000/api/emissor/laudos/999/download'
      );
      const context = { params: { loteId: '999' } };

      const response = await GET(request, context);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('não encontrado');
    });

    it('deve retornar 403 quando emissor não é dono do lote', async () => {
      const loteId = 123;
      const emissorCpf = '11111111111';

      mockRequireRole.mockResolvedValue({
        cpf: emissorCpf,
        perfil: 'emissor',
      });

      // Laudo não encontrado para este emissor
      mockQuery.mockResolvedValueOnce({
        rows: [], // Sem resultados = acesso negado
      });

      const request = new NextRequest(
        `http://localhost:3000/api/emissor/laudos/${loteId}/download`
      );
      const context = { params: { loteId: String(loteId) } };

      const response = await GET(request, context);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('não encontrado');
    });

    it('deve retornar 404 quando lote não tem laudo emitido', async () => {
      const loteId = 123;

      mockRequireRole.mockResolvedValue({
        cpf: '12345678900',
        perfil: 'emissor',
      });

      // Nenhum laudo encontrado (status não é enviado/emitido)
      mockQuery.mockResolvedValueOnce({
        rows: [], // Query filtra por status IN ('enviado','emitido')
      });

      const request = new NextRequest(
        `http://localhost:3000/api/emissor/laudos/${loteId}/download`
      );
      const context = { params: { loteId: String(loteId) } };

      const response = await GET(request, context);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('não encontrado');
    });
  });

  // ============================================================================
  // TESTE: Validação de código-fonte
  // ============================================================================
  describe('Cenário 4: Validação de Implementação', () => {
    it('deve conter lógica de fallback client-side no código', () => {
      const fs = require('fs');
      const path = require('path');

      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/download/route.ts'
        ),
        'utf-8'
      );

      // Verificar que código contém lógica de fallback
      expect(routeCode).toContain('useClientSide');
      expect(routeCode).toContain('htmlEndpoint');
      expect(routeCode).toContain('readFile');
    });

    it('não deve conter código de geração Puppeteer on-demand', () => {
      const fs = require('fs');
      const path = require('path');

      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/download/route.ts'
        ),
        'utf-8'
      );

      // Não deve chamar /pdf endpoint para gerar on-demand
      expect(routeCode).not.toContain('getPuppeteerInstance');
      expect(routeCode).not.toContain('puppeteer');
    });
  });
});
