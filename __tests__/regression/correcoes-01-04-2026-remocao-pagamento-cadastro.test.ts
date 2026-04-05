/**
 * @fileoverview Correções 01/04/2026 — Remoção de pagamento/plano/proposta/recibo
 *               do fluxo de cadastro de tomador
 *
 * Valida que o sistema foi limpo de todos os artefatos de pagamento
 * obrigatório no fluxo de cadastro.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// ============================================================================
// Helpers
// ============================================================================
function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}
function fileExists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

// ============================================================================
// Suite principal
// ============================================================================
describe('Correções 01/04/2026 — Remoção de pagamento no cadastro de tomador', () => {
  // --------------------------------------------------------------------------
  // 1. Página legacy de pagamento
  // --------------------------------------------------------------------------
  describe('1. app/pagamento/[contratoId]/page.tsx — redirecionada', () => {
    it('arquivo existe (página não deletada; apenas redireciona)', () => {
      expect(fileExists('app/pagamento/[contratoId]/page.tsx')).toBe(true);
    });

    it('não contém lógica de pagamento (useEffect, iniciar, CheckoutAsaas)', () => {
      const content = readFile('app/pagamento/[contratoId]/page.tsx');
      expect(content).not.toContain('useEffect');
      expect(content).not.toContain('pagamento/iniciar');
      expect(content).not.toContain('CheckoutAsaas');
      expect(content).not.toContain('aguardando_pagamento');
    });

    it('contém apenas redirect para /', () => {
      const content = readFile('app/pagamento/[contratoId]/page.tsx');
      expect(content).toContain("redirect('/')");
    });
  });

  // --------------------------------------------------------------------------
  // 2. ModalContrato — sem skipPaymentPhase
  // --------------------------------------------------------------------------
  describe('2. components/modals/ModalContrato.tsx — sem feature flag de pagamento', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('components/modals/ModalContrato.tsx');
    });

    it('não contém skipPaymentPhase', () => {
      expect(content).not.toContain('skipPaymentPhase');
    });

    it('não lê NEXT_PUBLIC_SKIP_PAYMENT_PHASE do window', () => {
      expect(content).not.toContain('NEXT_PUBLIC_SKIP_PAYMENT_PHASE');
    });

    it('botão de aceite tem texto único sem condição de pagamento', () => {
      expect(content).toContain('Aceitar Contrato e Liberar Acesso');
      // Label não deve ser condicional sobre pagamento
      expect(content).not.toContain('skipPaymentPhase');
    });

    it('após aceite redireciona para boasVindasUrl (sucesso-cadastro) ou login', () => {
      expect(content).toContain('boasVindasUrl');
      expect(content).toContain("router.push('/login')");
    });
  });

  // --------------------------------------------------------------------------
  // 3. lib/db/entidade-crud.ts — StatusAprovacao limpo
  // --------------------------------------------------------------------------
  describe('3. lib/db/entidade-crud.ts — StatusAprovacao sem aguardando_pagamento', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('lib/db/entidade-crud.ts');
    });

    it("StatusAprovacao não contém 'aguardando_pagamento'", () => {
      expect(content).not.toContain("'aguardando_pagamento'");
    });

    it('createEntidade não tenta adicionar data_primeiro_pagamento on-the-fly', () => {
      expect(content).not.toContain('data_primeiro_pagamento');
    });
  });

  // --------------------------------------------------------------------------
  // 4. app/api/contratos/route.ts — aceite libera login direto sem pagamento
  // --------------------------------------------------------------------------
  describe('4. app/api/contratos/route.ts — aceite libera login sem pagamento', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('app/api/contratos/route.ts');
    });

    it('aceita contrato com ação "aceitar" sem redirecionar para pagamento', () => {
      expect(content).toContain("acao === 'aceitar'");
      // Não deve redirecionar para /pagamento/
      expect(content).not.toContain("'/pagamento/");
      expect(content).not.toContain('pagamento/iniciar');
    });

    it('retorna loginLiberadoImediatamente após aceite', () => {
      expect(content).toContain('loginLiberadoImediatamente: true');
    });

    it('não faz referência a plano_id nem pagamento_confirmado no flow', () => {
      expect(content).not.toContain('plano_id');
      expect(content).not.toContain('pagamento_confirmado');
    });
  });

  // --------------------------------------------------------------------------
  // 5. cypress.config.ts — tasks sem tabela tomadors e sem pagamento
  // --------------------------------------------------------------------------
  describe('5. cypress.config.ts — tasks E2E atualizadas', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('cypress.config.ts');
    });

    it('db:insertTesttomador usa tabela entidades (não tomadors)', () => {
      // Verificar que INSERT usa "entidades" e não "tomadors"
      expect(content).toContain('INSERT INTO entidades');
    });

    it('db:insertTesttomador não insere em pagamentos', () => {
      // Após remoção do pagamento, task não deve criar registro de pagamento
      expect(content).not.toContain('INSERT INTO pagamentos');
    });

    it('db:insertTesttomador não usa status aguardando_pagamento', () => {
      expect(content).not.toContain("'aguardando_pagamento'");
    });

    it('db:cleanupTestData usa entidades nas queries de limpeza', () => {
      expect(content).toContain('SELECT id FROM entidades WHERE cnpj');
      expect(content).not.toContain('SELECT id FROM tomadors WHERE cnpj');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Rota /api/pagamento/iniciar não existe
  // --------------------------------------------------------------------------
  describe('6. app/api/pagamento/iniciar — rota removida', () => {
    it('arquivo route.ts não existe', () => {
      expect(fileExists('app/api/pagamento/iniciar/route.ts')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Cypress fluxo-cadastro-regressao — sem referência a pagamento
  // --------------------------------------------------------------------------
  describe('7. cypress/e2e/regressao/fluxo-cadastro-regressao.cy.ts — atualizado', () => {
    let content: string;

    beforeAll(() => {
      content = readFile(
        'cypress/e2e/regressao/fluxo-cadastro-regressao.cy.ts'
      );
    });

    it('não visita /pagamento/:id', () => {
      expect(content).not.toContain('cy.visit(`/pagamento/');
    });

    it('não chama /api/pagamento/confirmar', () => {
      expect(content).not.toContain('/api/pagamento/confirmar');
    });

    it('não seleciona plano-card', () => {
      expect(content).not.toContain('plano-card');
    });

    it('usa db:cleanupTestData para limpeza (não db:cleanuptomadorByCpf com tomadors)', () => {
      expect(content).toContain('db:cleanupTestData');
    });
  });
});
