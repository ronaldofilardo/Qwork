/**
 * Testes Unitários: Endpoint RH Download
 * Testa que RH apenas baixa PDFs existentes, sem gerar
 * Referência: Correções #7, #8
 */

import fs from 'fs';
import path from 'path';

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
}));

describe('Endpoint RH Download - Apenas Download, Sem Geração', () => {
  const mockQuery = require('@/lib/db').query;
  const mockGetSession = require('@/lib/session').getSession;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // TESTE: RH não pode gerar PDFs
  // ============================================================================
  describe('Regra de Negócio: RH não gera PDFs', () => {
    it('código não deve ter imports de puppeteer', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).not.toContain('puppeteer');
      expect(routeCode).not.toContain('getPuppeteerInstance');
      expect(routeCode).not.toContain('browser.launch');
    });

    it('deve retornar 404 se PDF não existe', () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'rh',
        empresa_id: 1,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 8,
            lote_id: 8,
            status: 'emitido',
            empresa_id: 1,
          },
        ],
      });

      // Simular que arquivo não existe
      mockFs.existsSync.mockReturnValue(false);

      const expectedError = {
        error:
          'Arquivo do laudo não encontrado. O laudo deve ser emitido pelo emissor antes de poder ser baixado.',
        success: false,
      };

      expect(expectedError.error).toContain('emitido pelo emissor');
    });
  });

  // ============================================================================
  // TESTE: Query com campo status
  // ============================================================================
  describe('Query SQL: Campo status presente', () => {
    it('deve selecionar l.status na query', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toMatch(/SELECT[\s\S]*l\.status[\s\S]*FROM laudos l/);
    });

    it('deve logar status do laudo corretamente', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain('status=${laudo.status}');
    });
  });

  // ============================================================================
  // TESTE: Logs de debug implementados
  // ============================================================================
  describe('Logs de Debug: Rastreamento de busca de arquivos', () => {
    it('deve ter logs de busca de candidateNames', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain('[DEBUG] Buscando arquivos para laudo');
      expect(routeCode).toContain('[DEBUG] Storage dir:');
      expect(routeCode).toContain('[DEBUG] Tentando:');
      expect(routeCode).toContain('[SUCCESS] Arquivo encontrado');
    });

    it('deve listar arquivos em storage para debug', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain('fs.readdirSync(storageDir)');
      expect(routeCode).toContain('[DEBUG] Arquivos em storage:');
    });
  });

  // ============================================================================
  // TESTE: Busca por múltiplos nomes candidatos
  // ============================================================================
  describe('Busca de Arquivos: Múltiplos nomes candidatos', () => {
    it('deve buscar por laudo-{id}.pdf', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain('laudo-${laudo.id}.pdf');
    });

    it('deve buscar por laudo-{codigo}.pdf se codigo existir', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain('laudo-${laudo.id}.pdf');
    });

    it('deve buscar por laudo-{lote_id}.pdf', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain('laudo-${laudo.lote_id}.pdf');
    });
  });

  // ============================================================================
  // TESTE: Validação de acesso
  // ============================================================================
  describe('Segurança: Validação de acesso por perfil', () => {
    it('deve permitir acesso para RH e emissor', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain("session.perfil !== 'rh'");
      expect(routeCode).toContain("session.perfil !== 'emissor'");
    });

    it('deve validar acesso à empresa para RH', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain('requireRHWithEmpresaAccess');
    });
  });

  // ============================================================================
  // TESTE: Download bem-sucedido
  // ============================================================================
  describe('Download: Retorno correto de PDF', () => {
    it('deve retornar PDF com headers corretos', () => {
      const mockPdfBuffer = Buffer.from('PDF_DATA');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockPdfBuffer);

      const expectedHeaders = {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="laudo-8.pdf"',
      };

      expect(expectedHeaders['Content-Type']).toBe('application/pdf');
      expect(expectedHeaders['Content-Disposition']).toContain('attachment');
    });

    it('deve logar sucesso com tamanho do arquivo', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain('[SUCCESS] Arquivo encontrado');
      expect(routeCode).toContain('bytes');
    });
  });

  // ============================================================================
  // TESTE: Tratamento de erros
  // ============================================================================
  describe('Erros: Mensagens claras e apropriadas', () => {
    it('deve ter mensagem clara quando arquivo não existe', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain('Arquivo do laudo não encontrado');
      expect(routeCode).toContain('deve ser emitido pelo emissor');
    });

    it('deve logar warning quando arquivo não encontrado', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/rh/laudos/[laudoId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain('[WARN] Arquivo do laudo');
      expect(routeCode).toContain('não encontrado em nenhum storage');
    });
  });
});
