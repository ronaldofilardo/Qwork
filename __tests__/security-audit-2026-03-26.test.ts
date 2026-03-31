/**
 * @fileoverview Testes de validação da auditoria de segurança 2026-03-26
 * @description Valida que as correções de segurança foram implementadas corretamente
 *
 * Fases implementadas:
 * - F1.1: Remoção de dangerouslySetInnerHTML (XSS)
 * - F1.2: Remoção de senha admin hardcoded do seed SQL
 * - F1.3: Migração de NEXT_PUBLIC_SKIP_PAYMENT_PHASE para server-only
 * - F2.1: Headers de segurança no next.config.cjs
 * - F4.1: Remoção de ALLOW_PROD_DB_LOCAL
 * - F4.2: Validação explícita do contexto RLS
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

describe('Auditoria de Segurança — 2026-03-26', () => {
  // ============================================================================
  // F1.1: XSS — dangerouslySetInnerHTML removido
  // ============================================================================
  describe('F1.1: dangerouslySetInnerHTML removido de LaudoEtapa4', () => {
    it('não deve conter dangerouslySetInnerHTML em LaudoEtapa4.tsx', () => {
      const filePath = path.join(
        ROOT,
        'app/emissor/laudo/[loteId]/components/LaudoEtapa4.tsx'
      );
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).not.toContain('dangerouslySetInnerHTML');
    });

    it('deve renderizar observacoesLaudo como texto puro com whitespace-pre-wrap', () => {
      const filePath = path.join(
        ROOT,
        'app/emissor/laudo/[loteId]/components/LaudoEtapa4.tsx'
      );
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('whitespace-pre-wrap');
      expect(content).toContain('{etapa4.observacoesLaudo}');
    });
  });

  // ============================================================================
  // F1.2: Senha admin removida do seed SQL
  // ============================================================================
  describe('F1.2: Senha admin não deve estar hardcoded no seed SQL', () => {
    it('não deve conter senha em plaintext no seed_admin_prod.sql', () => {
      const filePath = path.join(ROOT, 'database/seeds/seed_admin_prod.sql');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Não deve conter a senha antiga hardcoded
      expect(content).not.toContain("crypt('5978rdf'");
      expect(content).not.toContain('Senha: 5978rdf');
    });

    it('deve usar variável dinâmica para senha no seed', () => {
      const filePath = path.join(ROOT, 'database/seeds/seed_admin_prod.sql');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Deve usar current_setting para obter a senha de variável de sessão
      expect(content).toContain("current_setting('vars.admin_password')");
    });

    it('deve validar que a variável de senha foi definida antes de executar', () => {
      const filePath = path.join(ROOT, 'database/seeds/seed_admin_prod.sql');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Deve ter um bloco DO que verifica se a variável está definida
      expect(content).toContain('RAISE EXCEPTION');
      expect(content).toContain('vars.admin_password');
    });
  });

  // ============================================================================
  // F1.3: SKIP_PAYMENT_PHASE migrado para server-only
  // ============================================================================
  describe('F1.3: SKIP_PAYMENT_PHASE deve ser server-only', () => {
    it('não deve conter NEXT_PUBLIC_SKIP_PAYMENT_PHASE em código de produção', () => {
      const filesToCheck = [
        'app/api/pagamento/iniciar/route.ts',
        'components/modals/ModalContrato.tsx',
      ];

      for (const file of filesToCheck) {
        const filePath = path.join(ROOT, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        expect(content).not.toContain('NEXT_PUBLIC_SKIP_PAYMENT_PHASE');
      }
    });

    it('deve usar SKIP_PAYMENT_PHASE (sem prefixo NEXT_PUBLIC_) na rota de pagamento', () => {
      const filePath = path.join(ROOT, 'app/api/pagamento/iniciar/route.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('SKIP_PAYMENT_PHASE');
      expect(content).not.toContain('NEXT_PUBLIC_SKIP_PAYMENT_PHASE');
    });

    it('ModalContrato não deve ler feature flags do window object', () => {
      const filePath = path.join(ROOT, 'components/modals/ModalContrato.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).not.toContain('window.NEXT_PUBLIC_SKIP_PAYMENT_PHASE');
      expect(content).not.toContain('skipPaymentPhase');
    });
  });

  // ============================================================================
  // F2.1: Headers de segurança no next.config.cjs
  // ============================================================================
  describe('F2.1: Headers de segurança no next.config.cjs', () => {
    let configContent: string;

    beforeAll(() => {
      const filePath = path.join(ROOT, 'next.config.cjs');
      configContent = fs.readFileSync(filePath, 'utf-8');
    });

    it('deve conter função headers()', () => {
      expect(configContent).toContain('async headers()');
    });

    it('deve definir X-Frame-Options: DENY', () => {
      expect(configContent).toContain('X-Frame-Options');
      expect(configContent).toContain('DENY');
    });

    it('deve definir X-Content-Type-Options: nosniff', () => {
      expect(configContent).toContain('X-Content-Type-Options');
      expect(configContent).toContain('nosniff');
    });

    it('deve definir Strict-Transport-Security', () => {
      expect(configContent).toContain('Strict-Transport-Security');
      expect(configContent).toContain('max-age=31536000');
    });

    it('deve definir Referrer-Policy', () => {
      expect(configContent).toContain('Referrer-Policy');
      expect(configContent).toContain('strict-origin-when-cross-origin');
    });

    it('deve definir Permissions-Policy', () => {
      expect(configContent).toContain('Permissions-Policy');
      expect(configContent).toContain('camera=()');
      expect(configContent).toContain('microphone=()');
    });
  });

  // ============================================================================
  // F4.1: ALLOW_PROD_DB_LOCAL removido
  // ============================================================================
  describe('F4.1: ALLOW_PROD_DB_LOCAL removido de connection.ts', () => {
    it('não deve conter ALLOW_PROD_DB_LOCAL em lib/db/connection.ts', () => {
      const filePath = path.join(ROOT, 'lib/db/connection.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).not.toContain('ALLOW_PROD_DB_LOCAL');
    });

    it('deve bloquear DATABASE_URL Neon em desenvolvimento com warning', () => {
      const filePath = path.join(ROOT, 'lib/db/connection.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain(
        'Ignorado em desenvolvimento. Use LOCAL_DATABASE_URL'
      );
    });
  });

  // ============================================================================
  // F4.2: Validação explícita do contexto RLS
  // ============================================================================
  describe('F4.2: Validação explícita do contexto RLS em query.ts', () => {
    let queryContent: string;

    beforeAll(() => {
      const filePath = path.join(ROOT, 'lib/db/query.ts');
      queryContent = fs.readFileSync(filePath, 'utf-8');
    });

    it('deve verificar contexto RLS após SET LOCAL (local pool)', () => {
      expect(queryContent).toContain('FALHA DE SEGURANÇA RLS');
      expect(queryContent).toContain(
        "current_setting('app.current_user_cpf', true)"
      );
    });

    it('deve verificar contexto RLS após SET LOCAL (Neon pool)', () => {
      // Deve haver pelo menos 2 verificações (uma para local, uma para Neon)
      const matches = queryContent.match(/FALHA DE SEGURANÇA RLS/g);
      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('deve fazer ROLLBACK se contexto RLS falhar', () => {
      // Verifica que há ROLLBACK associado à falha de RLS
      const rlsCheckBlock = queryContent.split('FALHA DE SEGURANÇA RLS');
      for (let i = 1; i < rlsCheckBlock.length; i++) {
        // Cada bloco antes da mensagem de erro deve conter ROLLBACK
        const precedingBlock = rlsCheckBlock[i - 1];
        const lastRollbackIdx = precedingBlock.lastIndexOf('ROLLBACK');
        expect(lastRollbackIdx).toBeGreaterThan(-1);
      }
    });
  });

  // ============================================================================
  // Verificação global: sem secrets em client components
  // ============================================================================
  describe('Verificação global: sem secrets em client components', () => {
    it('não deve expor variáveis sensíveis como NEXT_PUBLIC_', () => {
      const sensitivePatterns = [
        'NEXT_PUBLIC_SKIP_PAYMENT_PHASE',
        'NEXT_PUBLIC_DATABASE_URL',
        'NEXT_PUBLIC_ASAAS_API_KEY',
        'NEXT_PUBLIC_WEBHOOK_SECRET',
      ];

      const clientFiles = ['components/modals/ModalContrato.tsx'];

      for (const file of clientFiles) {
        const filePath = path.join(ROOT, file);
        if (!fs.existsSync(filePath)) continue;
        const content = fs.readFileSync(filePath, 'utf-8');

        for (const pattern of sensitivePatterns) {
          expect(content).not.toContain(pattern);
        }
      }
    });
  });
});
