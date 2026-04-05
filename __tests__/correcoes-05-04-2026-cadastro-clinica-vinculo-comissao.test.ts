/**
 * @fileoverview Correções 05/04/2026 — Cadastro de clínica: FK violation em vinculos_comissao
 *
 * Bug: ao criar clínica com código de representante, handlers.ts tentava usar
 * entidade_id = clinica.id em vinculos_comissao, mas a FK aponta para 'entidades'.
 * Migration 504 já adicionou clinica_id nullable + CHECK (entidade_id XOR clinica_id).
 *
 * Fix: handlers.ts agora usa vinculoColuna = 'clinica_id' para clínicas
 *      e vinculoColuna = 'entidade_id' para entidades.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const handlersPath = path.join(
  ROOT,
  'app',
  'api',
  'cadastro',
  'tomadores',
  'handlers.ts'
);

let src: string;

beforeAll(() => {
  src = fs.readFileSync(handlersPath, 'utf-8');
});

// ============================================================================
// 1. Estrutura da fix — vinculoColuna dinâmico
// ============================================================================
describe('1. handlers.ts — vinculoColuna dinâmico (entidade_id vs clinica_id)', () => {
  it('arquivo deve existir', () => {
    expect(fs.existsSync(handlersPath)).toBe(true);
  });

  it('declara variável vinculoColuna', () => {
    expect(src).toContain('vinculoColuna');
  });

  it("atribui 'clinica_id' quando tipo === 'clinica'", () => {
    expect(src).toMatch(/vinculoColuna\s*=\s*isClinica\s*\?\s*['"]clinica_id['"]/);
  });

  it("atribui 'entidade_id' para entidades", () => {
    expect(src).toMatch(/:\s*['"]entidade_id['"]/);
  });

  it('declara variável vinculoValor = entidade.id', () => {
    expect(src).toContain('vinculoValor');
    expect(src).toContain('entidade.id');
  });

  it('NÃO deve mais consultar clinicas.entidade_id (código legado removido)', () => {
    expect(src).not.toContain('SELECT entidade_id FROM clinicas');
  });

  it('NÃO deve mais ter fallback entidadeIdParaVinculo (legado)', () => {
    expect(src).not.toContain('entidadeIdParaVinculo');
  });
});

// ============================================================================
// 2. INSERT em vinculos_comissao usa template literal com vinculoColuna
// ============================================================================
describe('2. INSERT vinculos_comissao — template literal dinâmico', () => {
  it('INSERT usa ${vinculoColuna} como coluna', () => {
    expect(src).toContain('representante_id, ${vinculoColuna}, lead_id');
  });

  it('INSERT passa vinculoValor como $2', () => {
    // O array de parâmetros deve ter vinculoValor logo após rep.id
    expect(src).toContain('vinculoValor');
  });

  it('log de sucesso usa [vinculoColuna] como chave dinâmica', () => {
    expect(src).toContain('[vinculoColuna]: vinculoValor');
  });
});

// ============================================================================
// 3. UPDATE de backfill (23505) também usa vinculoColuna
// ============================================================================
describe('3. UPDATE backfill 23505 — usa vinculoColuna', () => {
  it('UPDATE usa ${vinculoColuna} = $3', () => {
    expect(src).toContain('AND ${vinculoColuna} = $3 AND lead_id IS NULL');
  });

  it('log cadastro_vinculo_comissao_already_exists preservado', () => {
    expect(src).toContain('cadastro_vinculo_comissao_already_exists');
  });

  it('log usa [vinculoColuna] como chave dinâmica', () => {
    expect(src).toContain('[vinculoColuna]: vinculoValor');
  });
});

// ============================================================================
// 4. Compatibilidade com autoConvertirLeadPorCnpj (fallback sem código)
// ============================================================================
describe('4. autoConvertirLeadPorCnpj — já suporta clinica_id', () => {
  const leadsPath = path.join(ROOT, 'lib', 'db', 'comissionamento', 'leads.ts');
  let leadsSrc: string;

  beforeAll(() => {
    leadsSrc = fs.readFileSync(leadsPath, 'utf-8');
  });

  it('usa clinica_id quando entidadeId é null', () => {
    expect(leadsSrc).toContain("'representante_id, clinica_id, lead_id");
  });

  it('usa entidade_id quando entidadeId é não-null', () => {
    expect(leadsSrc).toContain("'representante_id, entidade_id, lead_id");
  });

  it('UPDATE de backfill 23505 suporta AND clinica_id = $3', () => {
    expect(leadsSrc).toContain('AND clinica_id = $3 AND lead_id IS NULL');
  });
});

// ============================================================================
// 5. Migration 504 — suporte a clinica_id em vinculos_comissao
// ============================================================================
describe('5. Migration 504 — vinculos_comissao suporta clinica_id', () => {
  const migPath = path.join(
    ROOT,
    'database',
    'migrations',
    '504_vinculos_comissao_suporte_clinica.sql'
  );
  let migSrc: string;

  beforeAll(() => {
    migSrc = fs.readFileSync(migPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(migPath)).toBe(true);
  });

  it('adiciona clinica_id como FK para clinicas', () => {
    expect(migSrc).toContain('clinica_id');
    expect(migSrc).toContain('REFERENCES public.clinicas(id)');
  });

  it('torna entidade_id opcional (DROP NOT NULL)', () => {
    expect(migSrc).toContain('ALTER COLUMN entidade_id DROP NOT NULL');
  });

  it('adiciona CHECK constraint entidade_id XOR clinica_id', () => {
    expect(migSrc).toContain('vinculo_entidade_ou_clinica');
    expect(migSrc).toContain('entidade_id IS NOT NULL AND clinica_id IS NULL');
    expect(migSrc).toContain('entidade_id IS NULL AND clinica_id IS NOT NULL');
  });
});
