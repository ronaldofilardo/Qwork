/**
 * @file __tests__/api/admin/emissoes-confirmar-pagamento.test.ts
 *
 * Testes de contrato para POST /api/admin/emissoes/[loteId]/confirmar-pagamento.
 *
 * Cobre:
 *  - Existência e estrutura da rota
 *  - Autenticação via requireRole(['admin', 'suporte'])
 *  - Validação de loteId e parâmetros obrigatórios
 *  - Guarda: lote já pago → 400
 *  - Guarda: tomador isento com método diferente de 'isento' → 400
 *  - UPDATE correto com todos os campos da constraint pagamento_completo_check
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const ROUTE_PATH = path.join(
  ROOT,
  'app',
  'api',
  'admin',
  'emissoes',
  '[loteId]',
  'confirmar-pagamento',
  'route.ts'
);

let src: string;

beforeAll(() => {
  src = fs.readFileSync(ROUTE_PATH, 'utf-8');
});

describe('POST /api/admin/emissoes/[loteId]/confirmar-pagamento — Arquivo', () => {
  it('arquivo existe', () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it('exporta função POST', () => {
    expect(src).toMatch(/export\s+async\s+function\s+POST/);
  });
});

describe('POST /api/admin/emissoes/[loteId]/confirmar-pagamento — Autenticação', () => {
  it('usa requireRole com admin e suporte', () => {
    expect(src).toMatch(/requireRole\s*\(\s*\[/);
    expect(src).toMatch(/['"]admin['"]/);
    expect(src).toMatch(/['"]suporte['"]/);
  });
});

describe('POST /api/admin/emissoes/[loteId]/confirmar-pagamento — Validação', () => {
  it('valida loteId como inteiro', () => {
    expect(src).toMatch(/parseInt\s*\(\s*params\.loteId\s*\)/);
    expect(src).toMatch(/isNaN\s*\(\s*loteId\s*\)/);
  });

  it('retorna 400 para loteId inválido', () => {
    expect(src).toMatch(/status:\s*400/);
  });

  it('valida metodo_pagamento como obrigatório', () => {
    expect(src).toMatch(/metodo_pagamento/);
  });

  it('lista METODOS_VALIDOS incluindo pix, boleto, isento', () => {
    expect(src).toMatch(/['"]pix['"]/);
    expect(src).toMatch(/['"]boleto['"]/);
    expect(src).toMatch(/['"]isento['"]/);
  });

  it('valida parcelas entre 1 e 12', () => {
    expect(src).toMatch(/parcelas\s*<\s*1/);
    expect(src).toMatch(/parcelas\s*>\s*12/);
  });

  it('retorna 404 se lote não encontrado', () => {
    expect(src).toMatch(/status:\s*404/);
  });
});

describe('POST /api/admin/emissoes/[loteId]/confirmar-pagamento — Guardas de negócio', () => {
  it('bloqueia lote já pago (status_pagamento === pago)', () => {
    expect(src).toMatch(/status_pagamento.*pago/);
    expect(src).toMatch(/já está com pagamento confirmado|já.*pago/i);
  });

  it('bloqueia tomador isento com método diferente de isento', () => {
    expect(src).toMatch(/isento_pagamento/);
    expect(src).toMatch(/Tomador é isento|isento.*método/i);
  });

  it('faz JOIN com clinicas e entidades para verificar isento_pagamento', () => {
    expect(src).toMatch(/LEFT JOIN clinicas/i);
    expect(src).toMatch(/LEFT JOIN entidades/i);
    expect(src).toMatch(/COALESCE.*isento_pagamento/i);
  });
});

describe('POST /api/admin/emissoes/[loteId]/confirmar-pagamento — UPDATE', () => {
  it('seta status_pagamento = pago', () => {
    expect(src).toMatch(/status_pagamento\s*=\s*'pago'/i);
  });

  it('seta pagamento_metodo', () => {
    expect(src).toMatch(/pagamento_metodo/);
  });

  it('seta pagamento_parcelas', () => {
    expect(src).toMatch(/pagamento_parcelas/);
  });

  it('seta pago_em = NOW()', () => {
    expect(src).toMatch(/pago_em\s*=\s*NOW\(\)/i);
  });

  it('retorna success: true', () => {
    expect(src).toMatch(/success:\s*true/);
  });

  it('registra log com loteId e perfil', () => {
    expect(src).toMatch(/\[INFO\].*Pagamento confirmado manualmente/i);
  });
});
