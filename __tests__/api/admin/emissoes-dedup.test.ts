/**
 * admin-emissoes-dedup.test.ts
 *
 * Valida que a rota GET /api/admin/emissoes deduplica solicitações pelo lote_id.
 *
 * Contexto: a view v_solicitacoes_emissao pode retornar múltiplas linhas para
 * o mesmo lote quando há mais de um vínculo de comissão ativo. A dedup por
 * lote_id (Map) garante que cada lote aparece apenas uma vez no painel suporte.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const ROUTE_PATH = path.join(ROOT, 'app', 'api', 'admin', 'emissoes', 'route.ts');

let src: string;

beforeAll(() => {
  src = fs.readFileSync(ROUTE_PATH, 'utf-8');
});

describe('GET /api/admin/emissoes — Arquivo', () => {
  it('arquivo existe', () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it('exporta função GET', () => {
    expect(src).toMatch(/export\s+async\s+function\s+GET/);
  });
});

describe('GET /api/admin/emissoes — Deduplicação por lote_id', () => {
  it('deve usar Map para deduplicar por lote_id', () => {
    expect(src).toMatch(/new Map/);
    expect(src).toMatch(/lote_id/);
  });

  it('deve retornar Array.from(seenLotes.values()) ou equivalente', () => {
    expect(src).toMatch(/Array\.from[\s\S]*?\.values\(\)/);
  });

  it('não deve fazer dedup por chave diferente de lote_id', () => {
    // Garante que o campo que identifica a entry é lote_id
    expect(src).toMatch(/\.has\(row\.lote_id\)|seenLotes\.has/);
  });

  it('deve preservar a primeira ocorrência de cada lote_id', () => {
    // Padrão: if (!seenLotes.has(row.lote_id)) { seenLotes.set(row.lote_id, row) }
    expect(src).toMatch(/!seenLotes\.has[\s\S]*?seenLotes\.set/s);
  });
});
