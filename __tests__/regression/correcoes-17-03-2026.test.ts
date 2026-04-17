/**
 * correcoes-17-03-2026.test.ts
 *
 * Testes para as correções de 17/03/2026:
 *
 * 1. lib/db.ts — Roteamento emissor para Neon em modo DEV local
 *    - ALLOW_PROD_DB_LOCAL + EMISSOR_CPF → queries do emissor vão para Neon
 *    - Pool local (localPool) aponta para nr-bps_db, não para Neon
 *    - Guard ACESSO BLOQUEADO removido (admin pode acessar Neon localmente)
 *
 * 2. app/api/admin/comissoes/route.ts — Cast ::text no filtro de status
 *    - status::text = $N evita erro "invalid input value for enum status_comissao: pendente_nf"
 *    - Filtro aceita pendente_nf, nf_em_analise, liberada, paga, etc.
 *
 * 3. app/api/emissor/laudos/[loteId]/upload/route.ts — Step 16 inclui laudo_enviado_em
 *    - UPDATE lotes_avaliacao SET status = 'finalizado', laudo_enviado_em = NOW()
 *    - Satisfaz condição do trigger prevent_update_finalized_lote (migration 026)
 *    - Trigger bloqueia toda alteração em lote com laudo enviado, EXCETO quando
 *      laudo_enviado_em muda de NULL → valor (primeiro envio real)
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// ============================================================================
// 1. lib/db.ts — Roteamento DEV emissor para Neon
// ============================================================================
describe('1. lib/db/connection.ts — Gerenciamento de conexão e ambiente', () => {
  const dbPath = path.join(ROOT, 'lib', 'db', 'connection.ts');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(dbPath, 'utf-8');
  });

  it('arquivo lib/db/connection.ts deve existir', () => {
    expect(fs.existsSync(dbPath)).toBe(true);
  });

  it('deve exportar variável environment com detecção de ambiente', () => {
    expect(src).toMatch(/export let environment\s*=/);
  });

  it('deve exportar isDevelopment, isTest, isProduction', () => {
    expect(src).toContain('export const isDevelopment');
    expect(src).toContain('export const isTest');
    expect(src).toContain('export const isProduction');
  });

  it('deve expor função getNeonPool', () => {
    expect(src).toContain('getNeonPool');
  });

  it('NÃO deve conter guard ACESSO BLOQUEADO (removido)', () => {
    expect(src).not.toContain('ACESSO BLOQUEADO');
  });

  it('deve proteger banco de produção em testes (neon.tech check)', () => {
    expect(src).toContain('neon.tech');
  });

  it('deve definir isEmissorLocalProdMode como false', () => {
    expect(src).toContain('isEmissorLocalProdMode = false');
  });

  it('deve detectar ambiente de testes via JEST_WORKER_ID', () => {
    expect(src).toContain('JEST_WORKER_ID');
  });
});

// ============================================================================
// 2. app/api/admin/comissoes/route.ts — Cast ::text no filtro de status
// ============================================================================
// [ATUALIZADO] Contadores pendente_nf/nf_em_analise removidos na migração 1212
describe.skip('2. admin/comissoes/route.ts — Cast ::text para enum status_comissao [LEGADO]', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'comissoes',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('filtro de status usa c.status::text no wheres.push (evita erro de enum)', () => {
    // Sem ::text o PostgreSQL lança "invalid input value for enum status_comissao: pendente_nf"
    // O fonte usa template literal: wheres.push(`c.status::text = $${i++}`)
    expect(src).toMatch(/wheres\.push\(`c\.status::text\s*=\s*\$/);
  });

  it('filtro NÃO deve usar c.status = $N sem cast (risco de erro enum)', () => {
    // Garantir que o bloco de filtros dinâmicos usa ::text
    const filterBlock = src.match(/wheres\.push\(`c\.status[^`]+`\)/);
    if (filterBlock) {
      expect(filterBlock[0]).toMatch(/::text/);
    }
  });

  it('contagens COUNT usam c.status::text para compatibilidade', () => {
    expect(src).toMatch(
      /COUNT\(\*\) FILTER \(WHERE c\.status::text = 'pendente_nf'\)/
    );
    expect(src).toMatch(
      /COUNT\(\*\) FILTER \(WHERE c\.status::text = 'nf_em_analise'\)/
    );
    expect(src).toMatch(
      /COUNT\(\*\) FILTER \(WHERE c\.status::text = 'liberada'\)/
    );
    expect(src).toMatch(
      /COUNT\(\*\) FILTER \(WHERE c\.status::text = 'paga'\)/
    );
  });

  it('SUM usa c.status::text IN para valores de pagamento pendente', () => {
    expect(src).toMatch(
      /SUM\(c\.valor_comissao\) FILTER \(WHERE c\.status::text IN \('pendente_nf','nf_em_analise','liberada'\)\)/
    );
  });

  it('deve aceitar pendente_nf como valor válido de filtro', () => {
    // pendente_nf precisa estar na lista de valores aceitos pelo endpoint
    expect(src).toContain("'pendente_nf'");
  });
});

// ============================================================================
// 3. upload/route.ts — Step 16: laudo_enviado_em no UPDATE do lote
// ============================================================================
describe('3. emissor/laudos/upload/route.ts — Step 16 inclui laudo_enviado_em', () => {
  const uploadPath = path.join(
    ROOT,
    'app',
    'api',
    'emissor',
    'laudos',
    '[loteId]',
    'upload',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(uploadPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(uploadPath)).toBe(true);
  });

  it('step 16 deve incluir laudo_enviado_em = NOW() no UPDATE', () => {
    // Sem laudo_enviado_em, o trigger prevent_update_finalized_lote bloqueia a query
    // Trigger (migration 026): permite update SOMENTE quando laudo_enviado_em NULL → valor
    expect(src).toMatch(
      /UPDATE lotes_avaliacao SET status = 'finalizado', laudo_enviado_em = NOW\(\), atualizado_em = NOW\(\) WHERE id = \$1/
    );
  });

  it('step 16 NÃO deve usar UPDATE sem laudo_enviado_em (seria bloqueado pelo trigger)', () => {
    // Forma antiga que causava erro: SET status = 'finalizado', atualizado_em = NOW() - sem laudo_enviado_em
    expect(src).not.toMatch(
      /UPDATE lotes_avaliacao SET status = 'finalizado', atualizado_em = NOW\(\) WHERE id = \$1/
    );
  });

  it('deve ter comentário explicando relação com trigger de imutabilidade do lote', () => {
    expect(src).toMatch(
      /prevent_modification_lote|trigger pode estar bloqueando/
    );
  });

  it('step 15 deve marcar laudo como enviado antes do step 16', () => {
    // Ordem crítica: laudo → enviado (15), depois lote → finalizado (16)
    const step15Idx = src.indexOf("status = 'enviado'");
    const step16Idx = src.indexOf("status = 'finalizado'");

    expect(step15Idx).toBeGreaterThan(-1);
    expect(step16Idx).toBeGreaterThan(-1);
    // Step 15 (enviado) deve aparecer ANTES do step 16 (finalizado) no arquivo
    expect(step15Idx).toBeLessThan(step16Idx);
  });

  it('deve setar enviado_em = NOW() no laudo (step 15)', () => {
    expect(src).toMatch(/enviado_em\s*=\s*NOW\(\)/);
  });
});

// ============================================================================
// 4. Documentação: Migration 026 e compatibilidade do trigger
// ============================================================================
describe('4. Migration 026 — trigger prevent_update_finalized_lote corrigida', () => {
  const migrationPath = path.join(
    ROOT,
    'database',
    'migrations',
    '026_allow_laudo_enviado_update_trigger_fix.sql'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(migrationPath, 'utf-8');
  });

  it('arquivo migration 026 deve existir', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('deve bloquear modificações em lotes com status finalizado ou cancelado', () => {
    expect(src).toMatch(/OLD\.status IN \('finalizado', 'cancelado'\)/);
    expect(src).toMatch(/RAISE EXCEPTION 'Lote com status/);
  });

  it('deve bloquear quando há laudo enviado E laudo_enviado_em já está preenchido', () => {
    // Condição de bloqueio: laudo enviado existe E não é o primeiro envio
    expect(src).toMatch(
      /EXISTS\s*\(\s*SELECT 1 FROM laudos WHERE lote_id = OLD\.id AND status = 'enviado'/
    );
    expect(src).toMatch(
      /NEW\.laudo_enviado_em IS NOT NULL AND OLD\.laudo_enviado_em IS NULL/
    );
  });

  it('deve PERMITIR a atualização quando laudo_enviado_em é definido pela primeira vez', () => {
    // Exceção que permite o fluxo de upload: NULL → valor
    expect(src).toMatch(
      /IF NOT \(NEW\.laudo_enviado_em IS NOT NULL AND OLD\.laudo_enviado_em IS NULL\)/
    );
    expect(src).toMatch(
      /RAISE EXCEPTION 'Lote possui laudo enviado\. Modificações bloqueadas\.'/
    );
  });
});
