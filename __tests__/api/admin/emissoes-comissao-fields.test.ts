/**
 * @file __tests__/api/admin/emissoes-comissao-fields.test.ts
 *
 * Valida que GET /api/admin/emissoes retorna campos de comissionamento
 * dos vínculos, leads e representantes via LEFT JOIN.
 *
 * Contexto:
 *   - Commit 520ee140 adicionou campos de percentuais negociados
 *     (vinculo_percentual_rep, lead_percentual_rep, etc.) à query principal
 *     para que o painel admin possa calcular splits de comissão corretamente.
 *   - Estes campos seguem a hierarquia:
 *       vinculo (negociado) > lead (snapshot) > representante (global/fallback)
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
  'route.ts'
);

let src: string;

beforeAll(() => {
  src = fs.readFileSync(ROUTE_PATH, 'utf-8');
});

// ─── Estrutura básica do arquivo ─────────────────────────────────────────────

describe('GET /api/admin/emissoes — Estrutura', () => {
  it('arquivo existe', () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it('exporta função GET', () => {
    expect(src).toMatch(/export\s+async\s+function\s+GET/);
  });

  it('exige role suporte via requireRole', () => {
    expect(src).toMatch(/requireRole\s*\(\s*['"]suporte['"]/);
  });
});

// ─── Campos de comissão do vínculo ───────────────────────────────────────────

describe('GET /api/admin/emissoes — Campos de comissão do vínculo (negociados)', () => {
  it('inclui vinculo_percentual_rep via alias', () => {
    expect(src).toMatch(/vinculo_percentual_rep/);
  });

  it('lê percentuais do vínculo a partir de vc_ext (vinculos_comissao)', () => {
    expect(src).toMatch(/vc_ext\.percentual_comissao_representante/);
  });
});

// ─── Campos de comissão do lead (snapshot) ───────────────────────────────────

describe('GET /api/admin/emissoes — Campos de comissão do lead (snapshot de negociação)', () => {
  it('inclui lead_modelo_comissionamento via alias', () => {
    expect(src).toMatch(/lead_modelo_comissionamento/);
  });

  it('inclui lead_percentual_rep via alias', () => {
    expect(src).toMatch(/lead_percentual_rep/);
  });

  it('inclui lead_valor_custo_fixo_snapshot via alias', () => {
    expect(src).toMatch(/lead_valor_custo_fixo_snapshot/);
  });

  it('lê dados do lead a partir de lr_ext (leads_representante)', () => {
    expect(src).toMatch(/lr_ext\.modelo_comissionamento/);
    expect(src).toMatch(/lr_ext\.percentual_comissao_representante/);
  });
});

// ─── Campos de comissão do representante (fallback global) ───────────────────

describe('GET /api/admin/emissoes — Campos de comissão do representante (fallback)', () => {
  it('inclui rep_modelo_comissionamento via alias', () => {
    expect(src).toMatch(/rep_modelo_comissionamento/);
  });

  it('inclui rep_valor_custo_fixo_entidade via alias', () => {
    expect(src).toMatch(/rep_valor_custo_fixo_entidade/);
  });

  it('inclui rep_valor_custo_fixo_clinica via alias', () => {
    expect(src).toMatch(/rep_valor_custo_fixo_clinica/);
  });

  it('lê dados do representante a partir de r_ext (representantes)', () => {
    expect(src).toMatch(/r_ext\.modelo_comissionamento/);
    expect(src).toMatch(/r_ext\.valor_custo_fixo_entidade/);
    expect(src).toMatch(/r_ext\.valor_custo_fixo_clinica/);
  });
});

// ─── JOINs necessários ───────────────────────────────────────────────────────

describe('GET /api/admin/emissoes — LEFT JOINs para comissão', () => {
  it('faz JOIN com vinculos_comissao', () => {
    expect(src).toMatch(/LEFT JOIN vinculos_comissao\s+vc_ext/);
  });

  it('faz JOIN com leads_representante via vc_ext.lead_id', () => {
    expect(src).toMatch(/LEFT JOIN leads_representante\s+lr_ext/);
    expect(src).toMatch(/vc_ext\.lead_id/);
  });

  it('faz JOIN com representantes via vs.representante_id', () => {
    expect(src).toMatch(/LEFT JOIN representantes\s+r_ext/);
    expect(src).toMatch(/vs\.representante_id/);
  });
});

// ─── Campos de contagem de avaliações cobradas ───────────────────────────────

describe('GET /api/admin/emissoes — num_avaliacoes_cobradas', () => {
  it('usa COALESCE para tratar NULL em num_avaliacoes_cobradas', () => {
    expect(src).toMatch(/COALESCE[\s\S]*?num_avaliacoes_cobradas/);
  });

  it('conta avaliações com status != rascunho (não só concluidas)', () => {
    // Regra: avaliacoes cobradas = status != 'rascunho'
    expect(src).toMatch(/status\s*!=\s*['"]rascunho['"]/);
  });
});
