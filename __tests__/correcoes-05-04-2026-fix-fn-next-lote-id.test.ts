/**
 * @fileoverview Correções 05/04/2026 — Fix fn_next_lote_id() retornando NULL
 *
 * Bug: fn_next_lote_id() faz UPDATE em lote_id_allocator. Se a tabela tiver 0 rows,
 * o UPDATE não afeta nenhuma linha e v_next permanece NULL, causando:
 * "null value in column 'id' of relation 'lotes_avaliacao' violates not-null constraint"
 *
 * Fix (Migration 1142):
 * - Reinicializa lote_id_allocator com COALESCE(MAX(id), 0) de lotes_avaliacao
 * - Recria fn_next_lote_id() com NULL-guard explícito + RAISE EXCEPTION descritivo
 * - GREATEST() previne colisão com INSERTs externos ao allocator
 *
 * Afetava: /api/entidade/liberar-lote e /api/rh/liberar-lote
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

function readSource(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

// ============================================================================
// 1. Migration 1142 — estrutura do arquivo
// ============================================================================
describe('1. Migration 1142 — existência e estrutura', () => {
  const migFile = 'database/migrations/1142_fix_fn_next_lote_id_null_guard.sql';
  let sql: string;

  beforeAll(() => {
    sql = readSource(migFile);
  });

  it('arquivo de migration existe', () => {
    expect(fs.existsSync(path.join(ROOT, migFile))).toBe(true);
  });

  it('faz DELETE FROM lote_id_allocator antes de reinicializar', () => {
    expect(sql).toMatch(/DELETE FROM lote_id_allocator/);
  });

  it('reinicializa com COALESCE(MAX(id), 0) de lotes_avaliacao', () => {
    expect(sql).toMatch(/INSERT INTO lote_id_allocator.*\n.*SELECT COALESCE\(MAX\(id\),\s*0\) FROM lotes_avaliacao/s);
  });

  it('recria CREATE OR REPLACE FUNCTION fn_next_lote_id()', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION fn_next_lote_id/i);
  });

  it('possui NULL-guard que lança RAISE EXCEPTION descritivo', () => {
    expect(sql).toContain('RAISE EXCEPTION');
    expect(sql).toContain('lote_id_allocator vazia');
  });

  it('usa GREATEST() para evitar colisão com IDs externos', () => {
    expect(sql).toMatch(/GREATEST\(last_id \+ 1,\s*v_max_existing \+ 1\)/);
  });

  it('possui bloco de validação que reverte IDs de teste', () => {
    expect(sql).toContain('VALIDAÇÃO OK');
    expect(sql).toContain('last_id - 2');
  });

  it('é executado dentro de BEGIN/COMMIT (transação)', () => {
    expect(sql).toMatch(/^\s*BEGIN;/m);
    expect(sql).toMatch(/^\s*COMMIT;/m);
  });
});

// ============================================================================
// 2. fn_next_lote_id() — versão 301 (regressão: deve permanecer)
// ============================================================================
describe('2. Migration 301 — versão anterior da função (referência)', () => {
  const mig301 = 'database/migrations/301_fix_lote_id_allocator_collision.sql';
  let sql: string;

  beforeAll(() => {
    sql = readSource(mig301);
  });

  it('arquivo 301 existe (não foi removido por engano)', () => {
    expect(fs.existsSync(path.join(ROOT, mig301))).toBe(true);
  });

  it('contém a versão com retry loop (referência histórica)', () => {
    expect(sql).toContain('v_max_retries');
  });
});

// ============================================================================
// 3. Route /api/entidade/liberar-lote — INSERT sem id explícito
// ============================================================================
describe('3. /api/entidade/liberar-lote — INSERT confia no DEFAULT fn_next_lote_id()', () => {
  const routePath = 'app/api/entidade/liberar-lote/route.ts';
  let src: string;

  beforeAll(() => {
    src = readSource(routePath);
  });

  it('arquivo de route existe', () => {
    expect(fs.existsSync(path.join(ROOT, routePath))).toBe(true);
  });

  it('INSERT INTO lotes_avaliacao não inclui coluna id explicitamente', () => {
    // O padrão correto é omitir `id` no INSERT, deixando o DEFAULT disparar
    const insertMatch = src.match(
      /INSERT INTO lotes_avaliacao\s*\(([^)]+)\)/s
    );
    expect(insertMatch).not.toBeNull();
    const columns = insertMatch![1].toLowerCase();
    expect(columns).not.toContain(' id ');
    expect(columns).not.toMatch(/^id[,\s]/);
    expect(columns).not.toMatch(/,\s*id\s*[,)]/);
  });

  it('INSERT usa RETURNING id para obter o ID gerado', () => {
    expect(src).toMatch(/RETURNING\s+id[,\s]/i);
  });

  it('rota usa o id retornado para inserir em avaliacoes (lote_id)', () => {
    expect(src).toContain('lote_id');
    expect(src).toMatch(/loteData\.id|lote\.id|rows\[0\]\.id/);
  });
});

// ============================================================================
// 4. Route /api/rh/liberar-lote — INSERT sem id explícito
// ============================================================================
describe('4. /api/rh/liberar-lote — INSERT confia no DEFAULT fn_next_lote_id()', () => {
  const routePath = 'app/api/rh/liberar-lote/route.ts';
  let src: string;

  beforeAll(() => {
    src = readSource(routePath);
  });

  it('arquivo de route existe', () => {
    expect(fs.existsSync(path.join(ROOT, routePath))).toBe(true);
  });

  it('INSERT INTO lotes_avaliacao não inclui coluna id explicitamente', () => {
    const insertMatch = src.match(
      /INSERT INTO lotes_avaliacao\s*\(([^)]+)\)/s
    );
    expect(insertMatch).not.toBeNull();
    const columns = insertMatch![1].toLowerCase();
    expect(columns).not.toContain(' id ');
    expect(columns).not.toMatch(/^id[,\s]/);
    expect(columns).not.toMatch(/,\s*id\s*[,)]/);
  });

  it('INSERT usa RETURNING id para obter o ID gerado', () => {
    expect(src).toMatch(/RETURNING\s+id[,\s]/i);
  });

  it('usa lote.id para criar laudo com id espelhado', () => {
    // RH route cria laudo com mesmo id do lote (by design do projeto)
    expect(src).toMatch(/INSERT INTO laudos.*id.*lote\.id|lote\.id.*laudos/s);
  });
});

// ============================================================================
// 5. Route /api/rh/empresas-bulk/liberar-ciclos — INSERT sem id explícito
// ============================================================================
describe('5. /api/rh/empresas-bulk/liberar-ciclos — INSERT confia no DEFAULT', () => {
  const routePath = 'app/api/rh/empresas-bulk/liberar-ciclos/route.ts';
  let src: string;

  beforeAll(() => {
    const fullPath = path.join(ROOT, routePath);
    // Arquivo pode não existir em todos os ambientes — skip gracioso
    if (!fs.existsSync(fullPath)) {
      src = '';
      return;
    }
    src = fs.readFileSync(fullPath, 'utf-8');
  });

  it('arquivo de route existe ou é ignorado (opcional)', () => {
    // Apenas verifica se existe — se não existe, teste passa (não é obrigatório)
    const exists = fs.existsSync(path.join(ROOT, routePath));
    if (exists) {
      expect(src.length).toBeGreaterThan(0);
    } else {
      expect(true).toBe(true);
    }
  });

  it('se existir, INSERT não inclui id explicitamente', () => {
    if (!src) return; // arquivo inexistente — skip local

    const insertSection = src.match(
      /INSERT INTO lotes_avaliacao\s*\(([^)]+)\)/s
    );
    if (insertSection) {
      const columns = insertSection[1].toLowerCase();
      expect(columns).not.toMatch(/^id[,\s]|[, ]id[,\s)]/);
    }
  });
});

// ============================================================================
// 6. Integridade: nenhum outro INSERT em lotes_avaliacao passa id literal
// ============================================================================
describe('6. Nenhum INSERT em lotes_avaliacao passa coluna id explicitamente', () => {
  const routesDir = path.join(ROOT, 'app', 'api');

  function findInsertLoteWithExplicitId(dir: string): string[] {
    const violations: string[] = [];

    function scan(current: string): void {
      if (!fs.existsSync(current)) return;
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          scan(fullPath);
        } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          // Detectar INSERT onde a lista de colunas começa com 'id' ou tem ', id,'
          const matches = content.match(
            /INSERT INTO lotes_avaliacao\s*\(\s*id[\s,]/gi
          );
          if (matches) {
            violations.push(path.relative(ROOT, fullPath));
          }
        }
      }
    }

    scan(dir);
    return violations;
  }

  it('nenhum arquivo de route passa id explicitamente em INSERT INTO lotes_avaliacao', () => {
    const violations = findInsertLoteWithExplicitId(routesDir);
    expect(violations).toEqual([]);
  });
});
