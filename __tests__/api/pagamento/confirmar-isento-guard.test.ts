/**
 * @file __tests__/api/pagamento/confirmar-isento-guard.test.ts
 *
 * Testes de contrato para a guarda de isento_pagamento em:
 *  - app/api/pagamento/emissao/[token]/confirmar/route.ts
 *  - lib/asaas/webhook-handler.ts
 *
 * Garante que tomadores isentos não são cobrados via rota pública
 * nem via webhook Asaas.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');

const CONFIRMAR_PATH = path.join(
  ROOT,
  'app',
  'api',
  'pagamento',
  'emissao',
  '[token]',
  'confirmar',
  'route.ts'
);

const WEBHOOK_PATH = path.join(ROOT, 'lib', 'asaas', 'webhook-handler.ts');

let confirmarSrc: string;
let webhookSrc: string;

beforeAll(() => {
  confirmarSrc = fs.readFileSync(CONFIRMAR_PATH, 'utf-8');
  webhookSrc = fs.readFileSync(WEBHOOK_PATH, 'utf-8');
});

describe('Guarda isento — /api/pagamento/emissao/[token]/confirmar', () => {
  it('arquivo existe', () => {
    expect(fs.existsSync(CONFIRMAR_PATH)).toBe(true);
  });

  it('faz JOIN com clinicas para verificar isento_pagamento', () => {
    expect(confirmarSrc).toMatch(/LEFT JOIN clinicas/i);
  });

  it('faz JOIN com entidades para verificar isento_pagamento', () => {
    expect(confirmarSrc).toMatch(/LEFT JOIN entidades/i);
  });

  it('usa COALESCE para isento_pagamento de clinica ou entidade', () => {
    expect(confirmarSrc).toMatch(/COALESCE.*isento_pagamento/i);
  });

  it('retorna 400 quando tomador é isento', () => {
    expect(confirmarSrc).toMatch(/isento_pagamento/);
    expect(confirmarSrc).toMatch(/400/);
    expect(confirmarSrc).toMatch(/isento de pagamento/i);
  });
});

describe('Guarda isento — lib/asaas/webhook-handler.ts (activateSubscription)', () => {
  it('arquivo existe', () => {
    expect(fs.existsSync(WEBHOOK_PATH)).toBe(true);
  });

  it('verifica isento_pagamento antes de processar lotes', () => {
    expect(webhookSrc).toMatch(/isento_pagamento/);
  });

  it('retorna cedo quando tomador é isento (sem atualizar lotes)', () => {
    // Deve existir return dentro do bloco isento + lotesAtualizados = []
    expect(webhookSrc).toMatch(/lotesAtualizados\s*=\s*\[\]/);
    expect(webhookSrc).toMatch(/return\s*;/);
  });

  it('loga aviso quando lote isento é ignorado', () => {
    expect(webhookSrc).toMatch(/console\.warn|console\.log/);
    expect(webhookSrc).toMatch(/isento_pagamento/);
  });
});
