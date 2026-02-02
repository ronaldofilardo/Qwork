/**
 * TESTE: Correções de Produção - Endpoints /html, /pdf e /lotes
 *
 * Contexto:
 * - Produção reportou erro "column dados_laudo does not exist" no /html
 * - Produção tinha ENOENT errors no /lotes (hash calculation)
 * - Endpoint /pdf não calculava hash_pdf
 *
 * Correções aplicadas:
 * 1. /html: Reconstruir dados do laudo usando gerarDadosGeraisEmpresa + calcularScoresPorGrupo
 * 2. /lotes: Remover cálculo de hash (performance)
 * 3. /pdf: Adicionar cálculo e persistência de hash_pdf
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Correções de Produção - /html, /pdf, /lotes', () => {
  describe('/html endpoint - Correção dados_laudo', () => {
    it('NÃO deve consultar coluna dados_laudo (não existe)', () => {
      const htmlRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/html/route.ts'
      );

      expect(fs.existsSync(htmlRoutePath)).toBe(true);

      const content = fs.readFileSync(htmlRoutePath, 'utf-8');

      // NÃO deve ter referência a dados_laudo
      expect(content).not.toContain('dados_laudo');
      expect(content).not.toContain('SELECT * FROM laudos');
      expect(content).not.toContain('laudo.dados_laudo');
    });

    it('deve usar gerarDadosGeraisEmpresa(loteId)', () => {
      const htmlRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/html/route.ts'
      );

      const content = fs.readFileSync(htmlRoutePath, 'utf-8');

      // Deve importar a função
      expect(content).toContain('gerarDadosGeraisEmpresa');

      // Deve chamar com loteId
      expect(content).toMatch(/gerarDadosGeraisEmpresa\s*\(\s*lote\.id\s*\)/);
      expect(content).toContain('await gerarDadosGeraisEmpresa');
    });

    it('deve usar calcularScoresPorGrupo(loteId)', () => {
      const htmlRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/html/route.ts'
      );

      const content = fs.readFileSync(htmlRoutePath, 'utf-8');

      // Deve importar a função
      expect(content).toContain('calcularScoresPorGrupo');

      // Deve chamar com loteId
      expect(content).toMatch(/calcularScoresPorGrupo\s*\(\s*lote\.id\s*\)/);
      expect(content).toContain('await calcularScoresPorGrupo');
    });

    it('deve usar gerarInterpretacaoRecomendacoes com empresaAvaliada e scores', () => {
      const htmlRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/html/route.ts'
      );

      const content = fs.readFileSync(htmlRoutePath, 'utf-8');

      // Deve importar
      expect(content).toContain('gerarInterpretacaoRecomendacoes');

      // Deve chamar com empresaAvaliada + scoresPorGrupo
      expect(content).toMatch(/gerarInterpretacaoRecomendacoes\s*\(/);
      expect(content).toContain('dadosGeraisEmpresa.empresaAvaliada');
      expect(content).toContain('scoresPorGrupo');
    });

    it('deve reconstruir laudo de avaliacoes (não de dados_laudo)', () => {
      const htmlRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/html/route.ts'
      );

      const content = fs.readFileSync(htmlRoutePath, 'utf-8');

      // Deve consultar avaliacoes
      expect(content).toMatch(/SELECT[\s\S]*FROM\s+avaliacoes/i);

      // Deve gerar HTML usando criarLaudoPadronizado ou gerarHTMLLaudoCompleto
      expect(content).toMatch(/criarLaudoPadronizado|gerarHTMLLaudoCompleto/);
    });
  });

  describe('/lotes endpoint - Remoção de hash calculation', () => {
    it('NÃO deve calcular hash durante listagem (performance)', () => {
      const lotesRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/lotes/route.ts'
      );

      expect(fs.existsSync(lotesRoutePath)).toBe(true);

      const content = fs.readFileSync(lotesRoutePath, 'utf-8');

      // NÃO deve ter loop calculando hash
      const hashLoopPattern =
        /for\s*\([^)]*laudos[^)]*\)[^{]*\{[^}]*hash[^}]*\}/s;
      expect(content).not.toMatch(hashLoopPattern);

      // NÃO deve ter calcularHashArquivo
      expect(content).not.toContain('calcularHashArquivo');

      // NÃO deve ter fs.readFileSync em loop
      const loopPattern = /for\s*\([^)]*\)[^{]*\{[^}]*fs\.readFileSync[^}]*\}/s;
      expect(content).not.toMatch(loopPattern);
    });

    it('deve ter comentário explicando que hash é calculado na emissão', () => {
      const lotesRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/lotes/route.ts'
      );

      const content = fs.readFileSync(lotesRoutePath, 'utf-8');

      // Deve ter comentário explicativo
      expect(content).toMatch(/hash.*emiss[aã]o/i);
    });

    it('NÃO deve causar ENOENT ao tentar ler arquivos inexistentes', () => {
      const lotesRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/lotes/route.ts'
      );

      const content = fs.readFileSync(lotesRoutePath, 'utf-8');

      // Não deve ter fs.readFileSync de PDFs em loop
      const hasReadSync =
        content.includes('fs.readFileSync') &&
        content.includes('.pdf') &&
        /for\s*\(/.test(content);

      expect(hasReadSync).toBe(false);
    });
  });

  describe('/pdf endpoint - Adição de hash calculation', () => {
    it('deve calcular hash SHA-256 do PDF gerado', () => {
      const pdfRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/pdf/route.ts'
      );

      expect(fs.existsSync(pdfRoutePath)).toBe(true);

      const content = fs.readFileSync(pdfRoutePath, 'utf-8');

      // Deve importar crypto
      expect(content).toMatch(/import.*crypto|const\s+crypto\s*=/);

      // Deve calcular hash
      expect(content).toContain('createHash');
      expect(content).toContain('sha256');
      expect(content).toContain('.digest(');
    });

    it('deve persistir hash_pdf no banco de dados', () => {
      const pdfRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/pdf/route.ts'
      );

      const content = fs.readFileSync(pdfRoutePath, 'utf-8');

      // Deve ter UPDATE laudos SET hash_pdf
      expect(content).toMatch(/UPDATE\s+laudos\s+SET\s+hash_pdf/i);

      // Deve usar query parametrizado
      expect(content).toMatch(/query\s*\([^)]*UPDATE[^)]*hash_pdf[^)]*\)/is);
    });

    it('deve calcular hash APÓS gerar PDF (ordem correta)', () => {
      const pdfRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/pdf/route.ts'
      );

      const content = fs.readFileSync(pdfRoutePath, 'utf-8');

      // Verificar ordem: browser.close() -> calcular hash -> salvar arquivo -> UPDATE DB
      const browserCloseIndex = content.indexOf('browser.close()');
      const hashIndex = content.indexOf('createHash');
      const fsWriteIndex = content.indexOf('fs.writeFileSync');
      const updateIndex = content.indexOf('UPDATE laudos');

      expect(browserCloseIndex).toBeGreaterThan(-1);
      expect(hashIndex).toBeGreaterThan(browserCloseIndex);
      expect(fsWriteIndex).toBeGreaterThan(hashIndex);
      expect(updateIndex).toBeGreaterThan(fsWriteIndex);
    });

    it('deve incluir hash no metadata JSON', () => {
      const pdfRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/pdf/route.ts'
      );

      const content = fs.readFileSync(pdfRoutePath, 'utf-8');

      // Metadata deve conter hash
      expect(content).toMatch(/metadata[^}]*hash/i);
      expect(content).toMatch(/hash_sha256|hashSha256|hash:/);
    });

    it('deve logar hash calculado para auditoria', () => {
      const pdfRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/pdf/route.ts'
      );

      const content = fs.readFileSync(pdfRoutePath, 'utf-8');

      // Deve ter console.log do hash
      expect(content).toMatch(/console\.log.*hash/i);
    });

    it('deve tratar erro ao persistir hash (laudo imutável)', () => {
      const pdfRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/pdf/route.ts'
      );

      const content = fs.readFileSync(pdfRoutePath, 'utf-8');

      // Deve ter try-catch ou .catch() ao atualizar hash
      const hasErrorHandling =
        (content.includes('try') && content.includes('catch')) ||
        content.includes('.catch(');

      expect(hasErrorHandling).toBe(true);

      // Deve mencionar imutabilidade
      expect(content).toMatch(/imut[áa]vel|imutabilidade/i);
    });
  });

  describe('Integração - Fluxo completo corrigido', () => {
    it('/download deve apontar para /html quando PDF não existe', () => {
      const downloadRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/download/route.ts'
      );

      const content = fs.readFileSync(downloadRoutePath, 'utf-8');

      // Deve ter fallback para client-side
      expect(content).toContain('useClientSide');
      expect(content).toContain('htmlEndpoint');
      expect(content).toMatch(/\/html/);
    });

    it('todos os endpoints devem usar funções de laudo-calculos.ts', () => {
      const htmlRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/html/route.ts'
      );

      const content = fs.readFileSync(htmlRoutePath, 'utf-8');

      // Deve importar de lib/laudo-calculos
      expect(content).toMatch(/from ['"].*laudo-calculos['"]/);

      // Deve usar as funções corretas
      expect(content).toContain('gerarDadosGeraisEmpresa');
      expect(content).toContain('calcularScoresPorGrupo');
      expect(content).toContain('gerarInterpretacaoRecomendacoes');
    });

    it('hash só deve ser calculado em /pdf, não em /lotes listing', () => {
      const lotesPath = path.join(
        process.cwd(),
        'app/api/emissor/lotes/route.ts'
      );
      const pdfPath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/pdf/route.ts'
      );

      const lotesContent = fs.readFileSync(lotesPath, 'utf-8');
      const pdfContent = fs.readFileSync(pdfPath, 'utf-8');

      // Lotes NÃO deve calcular hash
      expect(lotesContent).not.toMatch(/createHash.*sha256/);

      // PDF DEVE calcular hash
      expect(pdfContent).toMatch(/createHash.*sha256/);
    });
  });

  describe('Validação de Imports', () => {
    it('/html deve importar funções corretas de laudo-calculos', () => {
      const htmlRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/html/route.ts'
      );

      const content = fs.readFileSync(htmlRoutePath, 'utf-8');

      // Verificar imports necessários
      const requiredImports = [
        'gerarDadosGeraisEmpresa',
        'calcularScoresPorGrupo',
        'gerarInterpretacaoRecomendacoes',
        'gerarObservacoesConclusao',
        'criarLaudoPadronizado',
      ];

      requiredImports.forEach((importName) => {
        expect(content).toContain(importName);
      });
    });

    it('/pdf deve importar crypto (nativo Node.js)', () => {
      const pdfRoutePath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/pdf/route.ts'
      );

      const content = fs.readFileSync(pdfRoutePath, 'utf-8');

      // Deve usar import dinâmico ou estático de crypto
      const hasCrypto =
        content.includes("import('crypto')") ||
        content.includes('import crypto') ||
        content.includes("from 'crypto'");

      expect(hasCrypto).toBe(true);
    });
  });

  describe('Performance e Segurança', () => {
    it('/lotes não deve causar overhead de I/O (sem fs.readFileSync)', () => {
      const lotesPath = path.join(
        process.cwd(),
        'app/api/emissor/lotes/route.ts'
      );

      const content = fs.readFileSync(lotesPath, 'utf-8');

      // Se tem readFileSync, não deve estar em loop sobre laudos
      if (content.includes('fs.readFileSync')) {
        const lines = content.split('\n');
        const readSyncLines = lines
          .map((line, idx) => ({ line, idx }))
          .filter(({ line }) => line.includes('fs.readFileSync'));

        // Verificar se está dentro de loop de laudos
        readSyncLines.forEach(({ idx }) => {
          const contextBefore = lines
            .slice(Math.max(0, idx - 20), idx)
            .join('\n');
          const contextAfter = lines
            .slice(idx, Math.min(lines.length, idx + 5))
            .join('\n');

          // Não deve estar em loop de laudos
          const isInLaudoLoop =
            /for\s*\([^)]*laudos[^)]*\)/.test(contextBefore) ||
            /laudos\.forEach/.test(contextBefore) ||
            /laudos\.map/.test(contextBefore);

          expect(isInLaudoLoop).toBe(false);
        });
      }
    });

    it('hash SHA-256 deve ser usado (não MD5 ou SHA1)', () => {
      const pdfPath = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/pdf/route.ts'
      );

      const content = fs.readFileSync(pdfPath, 'utf-8');

      // Deve usar SHA-256
      expect(content).toContain('sha256');

      // NÃO deve usar algoritmos fracos
      expect(content).not.toMatch(/createHash\(['"]md5['"]\)/);
      expect(content).not.toMatch(/createHash\(['"]sha1['"]\)/);
    });
  });
});
