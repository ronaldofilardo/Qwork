/**
 * @file __tests__/api/admin/emissoes-cancelar-cobranca.test.ts
 *
 * Testes de contrato para DELETE /api/admin/emissoes/[loteId]/cancelar-cobranca.
 *
 * Cobre:
 *  - Existência e estrutura da rota
 *  - Autenticação via requireRole(['admin', 'suporte'])
 *  - Validação de loteId (inteiro, 400 se inválido)
 *  - Guarda: só permite status_pagamento = 'aguardando_cobranca'
 *  - UPDATE correto: status_pagamento = NULL, solicitacao_emissao_em = NULL
 *  - Resposta de sucesso { success: true, lote_id }
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
  'cancelar-cobranca',
  'route.ts'
);

let src: string;

beforeAll(() => {
  src = fs.readFileSync(ROUTE_PATH, 'utf-8');
});

describe('DELETE /api/admin/emissoes/[loteId]/cancelar-cobranca — Arquivo', () => {
  it('arquivo existe', () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it('exporta função DELETE', () => {
    expect(src).toMatch(/export\s+async\s+function\s+DELETE/);
  });

  it('não exporta GET, POST ou PATCH', () => {
    expect(src).not.toMatch(/export\s+async\s+function\s+GET/);
    expect(src).not.toMatch(/export\s+async\s+function\s+POST/);
    expect(src).not.toMatch(/export\s+async\s+function\s+PATCH/);
  });
});

describe('DELETE /api/admin/emissoes/[loteId]/cancelar-cobranca — Autenticação', () => {
  it('usa requireRole com admin e suporte', () => {
    expect(src).toMatch(/requireRole\s*\(\s*\[/);
    expect(src).toMatch(/['"]admin['"]/);
    expect(src).toMatch(/['"]suporte['"]/);
  });
});

describe('DELETE /api/admin/emissoes/[loteId]/cancelar-cobranca — Validação de loteId', () => {
  it('faz parseInt no params.loteId', () => {
    expect(src).toMatch(/parseInt\s*\(\s*params\.loteId\s*\)/);
  });

  it('retorna 400 para loteId inválido (isNaN)', () => {
    expect(src).toMatch(/isNaN\s*\(\s*loteId\s*\)/);
    expect(src).toMatch(/status:\s*400/);
  });

  it('retorna 404 se lote não encontrado', () => {
    expect(src).toMatch(/status:\s*404/);
  });
});

describe('DELETE /api/admin/emissoes/[loteId]/cancelar-cobranca — Guarda de status', () => {
  it("valida que status deve ser 'aguardando_cobranca'", () => {
    expect(src).toMatch(/aguardando_cobranca/);
  });

  it('retorna 400 se status não for aguardando_cobranca', () => {
    // Deve ter validação de status com retorno 400
    const guardPattern = /aguardando_cobranca[\s\S]{0,200}status:\s*400/;
    expect(src).toMatch(guardPattern);
  });
});

describe('DELETE /api/admin/emissoes/[loteId]/cancelar-cobranca — UPDATE SQL', () => {
  it('reseta status_pagamento para NULL', () => {
    expect(src).toMatch(/status_pagamento\s*=\s*NULL/i);
  });

  it('reseta solicitacao_emissao_em para NULL', () => {
    expect(src).toMatch(/solicitacao_emissao_em\s*=\s*NULL/i);
  });

  it('atualiza atualizado_em com NOW()', () => {
    expect(src).toMatch(/atualizado_em\s*=\s*NOW\(\)/i);
  });

  it('usa WHERE id = $1 para escopo correto', () => {
    expect(src).toMatch(/WHERE\s+id\s*=\s*\$1/i);
  });
});

describe('DELETE /api/admin/emissoes/[loteId]/cancelar-cobranca — Resposta', () => {
  it('retorna { success: true, lote_id } em caso de sucesso', () => {
    expect(src).toMatch(/success:\s*true/);
    expect(src).toMatch(/lote_id/);
  });

  it('trata erros e retorna status 500 por padrão', () => {
    expect(src).toMatch(/status.*500|500.*status/);
  });
});
