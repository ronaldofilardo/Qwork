/**
 * __tests__/db/1140_fix_seq_vendedor_codigo.test.ts
 *
 * Teste da migration 1140:
 * Verifica a estrutura da migration e integridade da migration file.
 *
 * Nota: Teste de execução real da migration requer banco DEV (nr-bps_db).
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const MIGRATION_PATH = path.join(
  ROOT,
  'database',
  'migrations',
  '1140_fix_seq_vendedor_codigo_duplicatas.sql'
);

let src: string;

beforeAll(() => {
  src = fs.readFileSync(MIGRATION_PATH, 'utf-8');
});

describe('Migration 1140 — correção de seq_vendedor_codigo', () => {
  it('arquivo da migration deve existir', () => {
    expect(fs.existsSync(MIGRATION_PATH)).toBe(true);
  });

  it('deve envolver tudo em transação (BEGIN/COMMIT)', () => {
    expect(src).toMatch(/^\s*BEGIN\s*;/im);
    expect(src).toMatch(/^\s*COMMIT\s*;/im);
  });

  it('deve ajustar seq_vendedor_codigo baseado em máximo código existente', () => {
    expect(src).toMatch(/seq_vendedor_codigo/i);
    expect(src).toMatch(/setval/i);
    expect(src).toMatch(/MAX.*codigo/i);
  });

  it('deve filtrar apenas códigos numéricos', () => {
    // A migration usa WHERE codigo ~ '^\\d+$'
    expect(src).toMatch(/WHERE.*codigo.*~.*\^/i);
  });

  it('deve usar guard se v_max_codigo >= 100', () => {
    expect(src).toMatch(/IF.*v_max_codigo/i);
    expect(src).toMatch(/v_max_codigo >= 100/);
  });

  it('deve registrar notices de diagnostic (RAISE NOTICE)', () => {
    expect(src).toMatch(/RAISE NOTICE.*ajustada para/i);
  });

  it('não deve desabilitar triggers (apenas ajusta sequência)', () => {
    expect(src).not.toMatch(/DISABLE TRIGGER/i);
    expect(src).not.toMatch(/ALTER TABLE.*DISABLE/i);
  });

  it('não deve deletar ou truncar dados', () => {
    expect(src).not.toMatch(/DELETE/i);
    expect(src).not.toMatch(/TRUNCATE/i);
    expect(src).not.toMatch(/DROP/i);
  });

  it('comentários descrevem problema (duplicatas) e solução', () => {
    expect(src).toMatch(/duplicata/i);
    expect(src).toMatch(/constraint violations/i);
  });
});
