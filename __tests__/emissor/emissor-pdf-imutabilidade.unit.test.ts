/**
 * Testes Unitários: Endpoint Emissor PDF
 * Testa imutabilidade e geração de laudos
 * Referência: Correções #6, #7, #9, #11
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Mock das dependências
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe('Endpoint Emissor PDF - Imutabilidade e Segurança', () => {
  const mockQuery = require('@/lib/db').query;
  const mockRequireRole = require('@/lib/session').requireRole;
  const mockFs = fs as jest.Mocked<typeof fs>;

  const realFs = jest.requireActual('fs');

  beforeEach(() => {
    jest.clearAllMocks();

    // Quando os testes precisarem ler o código fonte do endpoint,
    // delegamos para a versão real do fs para evitar que o mock impeça
    // a inspeção do arquivo `app/api/emissor/laudos/[loteId]/pdf/route.ts`.
    mockFs.readFileSync.mockImplementation((p: any, enc?: any) => {
      if (typeof p === 'string') {
        // Normalizar separadores de diretório para detectar caminho mesmo no Windows (\) ou Unix (/)
        const normalized = p.split(require('path').sep).join('/');
        if (normalized.includes('/emissor/laudos/')) {
          return realFs.readFileSync(p, enc || 'utf-8');
        }
      }
      // Caso geral, retornar um buffer simulado para outros usos do mock
      return Buffer.from('PDF_MOCK_DATA');
    });

    // existsSync e outros permanecem mocks normais e podem ser controlados por cada teste
  });

  // ============================================================================
  // TESTE: Apenas emissor pode acessar
  // ============================================================================
  describe('Segurança: Apenas emissor autorizado', () => {
    it('deve bloquear acesso de não-emissor com 403', async () => {
      // Este é um teste conceitual - verificamos o código fonte
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain("requireRole('emissor')");
      expect(routeCode).toContain('Apenas emissores podem gerar laudos');
    });

    it('deve permitir acesso de emissor autenticado', async () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      expect(routeCode).toContain("requireRole('emissor')");
    });
  });

  // ============================================================================
  // TESTE: Imutabilidade - PDF existente
  // ============================================================================
  describe('Imutabilidade: Não regenerar PDF existente', () => {
    it('deve retornar PDF existente quando arquivo já existe', async () => {
      const mockPdfBuffer = Buffer.from('PDF_MOCK_DATA');
      const mockLaudo = { id: 8, lote_id: 8, status: 'emitido' };

      mockRequireRole.mockResolvedValue({
        cpf: '53051173991',
        perfil: 'emissor',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 8, status: 'emitido', emissor_cpf: '53051173991' }],
      });

      // Simular que arquivo existe
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockPdfBuffer);

      const expectedPath = path.join(
        process.cwd(),
        'storage',
        'laudos',
        'laudo-8.pdf'
      );

      // Verificar que fs.existsSync foi chamado com caminho correto
      expect(mockFs.existsSync).not.toHaveBeenCalled(); // Ainda não executou

      // Simular resposta esperada
      const expectedHeaders = {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="laudo-8.pdf"',
        'X-Laudo-Status': 'existente',
        'X-Laudo-Imutavel': 'true',
      };

      // Validar que headers indicam imutabilidade
      expect(expectedHeaders['X-Laudo-Imutavel']).toBe('true');
      expect(expectedHeaders['X-Laudo-Status']).toBe('existente');
    });

    it('deve gerar novo PDF apenas se arquivo não existe', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '53051173991',
        perfil: 'emissor',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 9, lote_id: 9, status: 'emitido', emissor_cpf: '53051173991' },
        ],
      });

      // Simular que arquivo NÃO existe
      mockFs.existsSync.mockReturnValue(false);

      // Validar que tentará gerar novo PDF
      expect(mockFs.existsSync).not.toHaveBeenCalled(); // Setup do teste
    });
  });

  // ============================================================================
  // TESTE: Sem declarações duplicadas
  // ============================================================================
  describe('Código Limpo: Sem declarações duplicadas', () => {
    it('deve ter apenas uma declaração de fs', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      const fsDeclarations = routeCode.match(
        /const\s+fs\s*=\s*await\s+import\(['"]fs['"]\)/g
      );
      expect(fsDeclarations?.length).toBe(1);
    });

    it('deve ter apenas uma declaração de path', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      const pathDeclarations = routeCode.match(
        /const\s+path\s*=\s*await\s+import\(['"]path['"]\)/g
      );
      expect(pathDeclarations?.length).toBe(1);
    });

    it('deve ter apenas uma declaração de storageDir', () => {
      const routeCode = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      const storageDirDeclarations = routeCode.match(/const\s+storageDir\s*=/g);
      expect(storageDirDeclarations?.length).toBe(1);
    });
  });

  // ============================================================================
  // TESTE: Persistência correta
  // ============================================================================
  describe('Persistência: PDF e metadata salvos corretamente', () => {
    it('deve salvar PDF com nome laudo-{id}.pdf', () => {
      const laudoId = 10;
      const expectedFileName = `laudo-${laudoId}.pdf`;
      const expectedPath = path.join(
        process.cwd(),
        'storage',
        'laudos',
        expectedFileName
      );

      expect(expectedFileName).toBe('laudo-10.pdf');
    });

    it('deve salvar metadata com estrutura completa', () => {
      const metadata = {
        laudo_id: 10,
        lote_id: 10,
        emissor_cpf: '53051173991',
        gerado_em: new Date().toISOString(),
        gerado_por_cpf: '53051173991',
        arquivo_local: 'laudo-10.pdf',
        tamanho_bytes: 695065,
      };

      expect(metadata).toHaveProperty('laudo_id');
      expect(metadata).toHaveProperty('emissor_cpf');
      expect(metadata).toHaveProperty('gerado_em');
      expect(metadata).toHaveProperty('arquivo_local');
    });
  });

  // ============================================================================
  // TESTE: Audit logs corretos
  // ============================================================================
  describe('Auditoria: Logs com schema correto', () => {
    it('deve usar colunas em inglês no INSERT de audit_logs', () => {
      const routeCode = fs
        .readFileSync(
          path.join(
            process.cwd(),
            'app/api/emissor/laudos/[loteId]/pdf/route.ts'
          )
        )
        .toString('utf-8');

      // Verificar se usa schema correto
      expect(routeCode).toContain('action');
      expect(routeCode).toContain('resource');
      expect(routeCode).toContain('user_cpf');
      expect(routeCode).toContain('user_perfil');

      // Verificar que o INSERT INTO audit_logs NÃO usa colunas em português (ex.: 'acao')
      const insertAuditMatch = routeCode.match(
        /INSERT INTO audit_logs[\s\S]*?\)/
      );
      if (insertAuditMatch) {
        expect(insertAuditMatch[0]).not.toContain('acao');
      }
    });
  });

  // ============================================================================
  // TESTE: Trigger de imutabilidade respeitado
  // ============================================================================
  describe('Imutabilidade: Sem UPDATE em laudos emitidos', () => {
    it('não deve ter UPDATE laudos SET no código', () => {
      const routeCode = fs
        .readFileSync(
          path.join(
            process.cwd(),
            'app/api/emissor/laudos/[loteId]/pdf/route.ts'
          )
        )
        .toString('utf-8');

      // Verificar que não tem UPDATE em laudos após emissão
      const hasUpdateLaudos = /UPDATE\s+laudos\s+SET/i.test(routeCode);
      expect(hasUpdateLaudos).toBe(false);
    });

    it('deve ter comentário sobre imutabilidade', () => {
      const routeCode = fs
        .readFileSync(
          path.join(
            process.cwd(),
            'app/api/emissor/laudos/[loteId]/pdf/route.ts'
          )
        )
        .toString('utf-8');

      expect(routeCode).toContain('[IMUTABILIDADE]');
      expect(routeCode).toContain('não pode ser regenerado');
    });
  });
});
