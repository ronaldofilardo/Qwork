/**
 * @file __tests__/api/admin/emissoes-deletar-link.test.ts
 *
 * Testes de contrato para a rota DELETE /api/admin/emissoes/[loteId]/deletar-link.
 *
 * Cobre:
 *  - Existência e estrutura da rota
 *  - Autenticação via requireRole('suporte', false)
 *  - Validação de loteId inválido
 *  - Guarda: só permite deletar lotes com status 'aguardando_pagamento'
 *  - UPDATE correto ao resetar o lote para 'aguardando_cobranca'
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
  'deletar-link',
  'route.ts'
);

let src: string;

beforeAll(() => {
  src = fs.readFileSync(ROUTE_PATH, 'utf-8');
});

describe('DELETE /api/admin/emissoes/[loteId]/deletar-link — Arquivo', () => {
  it('arquivo existe', () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it('exporta função DELETE', () => {
    expect(src).toMatch(/export\s+async\s+function\s+DELETE/);
  });
});

describe('DELETE /api/admin/emissoes/[loteId]/deletar-link — Autenticação', () => {
  it('usa requireRole com perfil suporte', () => {
    expect(src).toMatch(/requireRole\s*\(\s*['"]suporte['"]/);
  });

  it('desabilita enforceMfa passando false', () => {
    expect(src).toMatch(/requireRole\s*\(\s*['"]suporte['"]\s*,\s*false\s*\)/);
  });
});

describe('DELETE /api/admin/emissoes/[loteId]/deletar-link — Validação', () => {
  it('valida loteId como número inteiro', () => {
    expect(src).toMatch(/parseInt\s*\(\s*params\.loteId\s*\)/);
    expect(src).toMatch(/isNaN\s*\(\s*loteId\s*\)/);
  });

  it('retorna 400 para loteId inválido', () => {
    expect(src).toMatch(/status:\s*400/);
  });

  it('retorna 404 se lote não encontrado', () => {
    expect(src).toMatch(/status:\s*404/);
  });

  it('guarda status: só permite deletar aguardando_pagamento', () => {
    expect(src).toMatch(/aguardando_pagamento/);
  });
});

describe('DELETE /api/admin/emissoes/[loteId]/deletar-link — UPDATE', () => {
  it('zera link_pagamento_token', () => {
    expect(src).toMatch(/link_pagamento_token\s*=\s*NULL/i);
  });

  it('zera link_pagamento_enviado_em', () => {
    expect(src).toMatch(/link_pagamento_enviado_em\s*=\s*NULL/i);
  });

  it('zera link_disponibilizado_em', () => {
    expect(src).toMatch(/link_disponibilizado_em\s*=\s*NULL/i);
  });

  it('define status_pagamento como aguardando_cobranca', () => {
    expect(src).toMatch(/status_pagamento\s*=\s*'aguardando_cobranca'/);
  });

  it('atualiza atualizado_em com NOW()', () => {
    expect(src).toMatch(/atualizado_em\s*=\s*NOW\(\)/);
  });

  it('retorna { success: true, lote_id }', () => {
    expect(src).toMatch(/success:\s*true/);
    expect(src).toMatch(/lote_id/);
  });
});
