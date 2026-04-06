/**
 * @fileoverview Correções 05/04/2026 — Drop FK liberado_por + remove contratante_id das routes de reset
 *
 * Bug 1 (Migration 1143): FK `lotes_avaliacao_liberado_por_fkey` apontava para
 * `entidades_senhas(cpf)` (migration 303 sobrescreveu migration 005 → funcionarios(cpf)).
 * Usuários RH (tabela `funcionarios`) tentavam criar lotes com liberado_por = CPF RH →
 * FK violation 23503. Solução: DROP da FK inteiramente (liberado_por rastreável via audit_logs).
 *
 * Bug 2 (reset routes): Coluna `contratante_id` foi removida de `lotes_avaliacao` na migration
 * 1129. Dois arquivos de reset de entidade ainda usavam COALESCE(la.entidade_id, la.contratante_id)
 * → "column la.contratante_id does not exist". Solução: remover COALESCE, usar la.entidade_id diretamente.
 *
 * Afetava:
 * - /api/rh/liberar-lote (FK violation ao liberar lote RH)
 * - /api/entidade/lotes/[id]/avaliacoes/[avaliacaoId]/reset (column does not exist)
 * - /api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/reset (column does not exist)
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

function readSource(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

// ============================================================================
// 1. Migration 1143 — estrutura e idempotência
// ============================================================================
describe('1. Migration 1143 — drop FK liberado_por', () => {
  const migFile = 'database/migrations/1143_drop_liberado_por_fkey.sql';
  let sql: string;

  beforeAll(() => {
    sql = readSource(migFile);
  });

  it('arquivo de migration existe', () => {
    expect(fs.existsSync(path.join(ROOT, migFile))).toBe(true);
  });

  it('contém BEGIN / COMMIT', () => {
    expect(sql).toMatch(/^\s*BEGIN\s*;/m);
    expect(sql).toMatch(/^\s*COMMIT\s*;/m);
  });

  it('verifica existência da constraint antes de dropar (idempotente)', () => {
    expect(sql).toMatch(/lotes_avaliacao_liberado_por_fkey/);
    expect(sql).toMatch(/IF EXISTS/i);
    expect(sql).toMatch(/DROP CONSTRAINT lotes_avaliacao_liberado_por_fkey/i);
  });

  it('valida que coluna liberado_por ainda existe após DROP', () => {
    expect(sql).toMatch(/liberado_por/);
    expect(sql).toMatch(/VALIDA[ÇC]ÃO OK/i);
  });

  it('valida que a FK não existe mais após o DROP', () => {
    expect(sql).toMatch(/VALIDA[ÇC]ÃO FALHOU.*FK ainda existe/is);
  });
});

// ============================================================================
// 2. Route reset (plural) — lotes/[id]/avaliacoes/[avaliacaoId]/reset
// ============================================================================
describe('2. Route reset plural — sem contratante_id', () => {
  const routeFile =
    'app/api/entidade/lotes/[id]/avaliacoes/[avaliacaoId]/reset/route.ts';
  let src: string;

  beforeAll(() => {
    src = readSource(routeFile);
  });

  it('arquivo de route existe', () => {
    expect(fs.existsSync(path.join(ROOT, routeFile))).toBe(true);
  });

  it('NÃO referencia la.contratante_id', () => {
    expect(src).not.toMatch(/la\.contratante_id/);
  });

  it('NÃO usa COALESCE com contratante_id', () => {
    expect(src).not.toMatch(
      /COALESCE\s*\(\s*la\.entidade_id\s*,\s*la\.contratante_id\s*\)/i
    );
  });

  it('usa la.entidade_id diretamente na query de verificação de posse', () => {
    expect(src).toMatch(/la\.entidade_id/);
    expect(src).toMatch(/AND la\.entidade_id = \$2/);
  });
});

// ============================================================================
// 3. Route reset (singular) — lote/[id]/avaliacoes/[avaliacaoId]/reset
// ============================================================================
describe('3. Route reset singular — sem contratante_id', () => {
  const routeFile =
    'app/api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/reset/route.ts';
  let src: string;

  beforeAll(() => {
    src = readSource(routeFile);
  });

  it('arquivo de route existe', () => {
    expect(fs.existsSync(path.join(ROOT, routeFile))).toBe(true);
  });

  it('NÃO referencia la.contratante_id', () => {
    expect(src).not.toMatch(/la\.contratante_id/);
  });

  it('NÃO usa COALESCE com contratante_id', () => {
    expect(src).not.toMatch(
      /COALESCE\s*\(\s*la\.entidade_id\s*,\s*la\.contratante_id\s*\)/i
    );
  });

  it('usa la.entidade_id diretamente no SELECT', () => {
    expect(src).toMatch(/SELECT la\.id,\s*la\.entidade_id,\s*la\.status/);
  });
});
