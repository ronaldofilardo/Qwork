/**
 * correcoes-04-03-2026.test.ts
 *
 * Testes para as correcoes e implementacoes de 04/03/2026:
 * 1. Sync DEV migrations 505+506
 * 2. Fix SQL: e.razao_social -> e.nome
 * 3. Fix erros silenciados em comissoes
 * 4. Fix trigger auditoria sem CPF de sessao
 * 5. Fix session-representante: campo cpf
 * 6. Fix registrarNfRep: param cpf
 * 7. Feature: botao Ver NF no painel admin
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

describe('1. DEV_SYNC_505_506.sql — script idempotente', () => {
  const sqlPath = path.join(
    ROOT,
    'database',
    'migrations',
    'DEV_SYNC_505_506.sql'
  );
  let src: string;
  beforeAll(() => {
    src = fs.readFileSync(sqlPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(sqlPath)).toBe(true);
  });
  it('deve adicionar pendente_nf com IF NOT EXISTS', () => {
    expect(src).toMatch(/ADD VALUE IF NOT EXISTS\s+'pendente_nf'/i);
  });
  it('deve adicionar nf_em_analise com IF NOT EXISTS', () => {
    expect(src).toMatch(/ADD VALUE IF NOT EXISTS\s+'nf_em_analise'/i);
  });
  it('deve migrar aprovada para pendente_nf', () => {
    expect(src).toMatch(/status\s*=\s*'pendente_nf'/i);
    expect(src).toMatch(/status::text\s*=\s*'aprovada'/i);
  });
  it('deve criar indice UNIQUE em lote_pagamento_id', () => {
    expect(src).toMatch(/CREATE UNIQUE INDEX/i);
    expect(src).toMatch(/lote_pagamento_id/i);
  });
  it('deve ter 2+ INSERTs retroativos (entidades e clinicas)', () => {
    const m = src.match(/INSERT INTO public\.comissoes_laudo/gi);
    expect(m).not.toBeNull();
    expect(m!.length).toBeGreaterThanOrEqual(2);
  });
  it('deve verificar NOT EXISTS para evitar duplicatas', () => {
    expect(src).toMatch(/NOT EXISTS\s*\(\s*SELECT 1 FROM comissoes_laudo/i);
  });
});

describe('2. Fix coluna e.razao_social -> e.nome nas rotas', () => {
  const adminRoute = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'comissoes',
    'route.ts'
  );
  const repRoute = path.join(
    ROOT,
    'app',
    'api',
    'representante',
    'comissoes',
    'route.ts'
  );
  const renovarRoute = path.join(
    ROOT,
    'app',
    'api',
    'representante',
    'vinculos',
    '[id]',
    'renovar',
    'route.ts'
  );

  it.each([adminRoute, repRoute, renovarRoute])(
    '%s nao deve referenciar e.razao_social',
    (p) => {
      expect(fs.readFileSync(p, 'utf-8')).not.toMatch(/e\.razao_social/i);
    }
  );
  it('admin route usa COALESCE(e.nome, cl.nome)', () => {
    expect(fs.readFileSync(adminRoute, 'utf-8')).toMatch(
      /COALESCE\s*\(\s*e\.nome\s*,\s*cl\.nome\s*\)/i
    );
  });
  it('rep route usa COALESCE(e.nome, cl.nome)', () => {
    expect(fs.readFileSync(repRoute, 'utf-8')).toMatch(
      /COALESCE\s*\(\s*e\.nome\s*,\s*cl\.nome\s*\)/i
    );
  });
  it('renovar route usa e.nome AS entidade_nome', () => {
    expect(fs.readFileSync(renovarRoute, 'utf-8')).toMatch(
      /e\.nome\s+AS\s+entidade_nome/i
    );
  });
});

describe('3. Paginas de comissoes — erros visiveis (sem silenciamento)', () => {
  const embed = path.join(ROOT, 'components', 'admin', 'ComissoesContent.tsx');
  const adminPage = path.join(
    ROOT,
    'app',
    'admin',
    'comissoes',
    'hooks',
    'useComissoes.ts'
  );
  const repPage = path.join(
    ROOT,
    'app',
    'representante',
    '(portal)',
    'comissoes',
    'hooks',
    'useComissoes.ts'
  );

  it.each([embed, adminPage, repPage])('%s sem "if (!res.ok) return;"', (p) => {
    expect(fs.readFileSync(p, 'utf-8')).not.toMatch(
      /if\s*\(\s*!res\.ok\s*\)\s*return\s*;/
    );
  });
  it.each([embed, adminPage, repPage])('%s chama setErro()', (p) => {
    expect(fs.readFileSync(p, 'utf-8')).toMatch(/setErro\s*\(/);
  });
  it.each([embed, adminPage, repPage])(
    '%s usa .json().catch() fallback',
    (p) => {
      expect(fs.readFileSync(p, 'utf-8')).toMatch(/\.json\(\)\.catch/);
    }
  );
  it('embed limpa erro no inicio de carregar()', () => {
    expect(fs.readFileSync(embed, 'utf-8')).toMatch(/setErro\s*\(\s*''\s*\)/);
  });
});

describe('4. Fix trigger — registrar_auditoria_comissionamento sem RAISE', () => {
  const fix = path.join(
    ROOT,
    'database',
    'migrations',
    'fix_audit_function_cpf.sql'
  );
  const m500 = path.join(
    ROOT,
    'database',
    'migrations',
    '500_sistema_comissionamento.sql'
  );

  it('arquivo fix_audit_function_cpf.sql deve existir', () => {
    expect(fs.existsSync(fix)).toBe(true);
  });
  it('fix usa current_setting com missing_ok=TRUE', () => {
    expect(fs.readFileSync(fix, 'utf-8')).toMatch(
      /current_setting\s*\(\s*'app\.current_user_cpf'\s*,\s*TRUE\s*\)/i
    );
  });
  it('fix NAO chama public.current_user_cpf() na logica de negocio (ignora comentarios)', () => {
    const src = fs.readFileSync(fix, 'utf-8');
    // Remove linhas de comentario SQL (--) e bloco COMMENT ON antes de verificar
    const noComments = src
      .replace(/^--.*$/gm, '')
      .replace(/COMMENT\s+ON\s+[\s\S]*?;/gi, '');
    expect(noComments).not.toMatch(/public\.current_user_cpf\s*\(\s*\)/i);
  });
  it('fix usa NULLIF()', () => {
    expect(fs.readFileSync(fix, 'utf-8')).toMatch(/NULLIF\s*\(/i);
  });
  it('migration 500 usa current_setting na funcao de auditoria', () => {
    expect(fs.readFileSync(m500, 'utf-8')).toMatch(
      /current_setting\s*\(\s*'app\.current_user_cpf'/i
    );
  });
});

describe('5. lib/session-representante.ts — campo cpf no bps-session', () => {
  const src = fs.readFileSync(
    path.join(ROOT, 'lib', 'session-representante.ts'),
    'utf-8'
  );

  it('interface tem cpf opcional', () => {
    expect(src).toMatch(/cpf\s*\?\s*:\s*string/);
  });
  it('extrai sess.cpf do cookie', () => {
    expect(src).toMatch(/cpf\s*:\s*sess\.cpf/);
  });
  it('extrai sess.tipo_pessoa com fallback pf', () => {
    expect(src).toMatch(
      /tipo_pessoa\s*:\s*sess\.tipo_pessoa\s*\|\|\s*['"]pf['"]/
    );
  });
});

// [Seção 6 REMOVIDA] — nf-rpa.ts deletado na migration 1212
// [Seção 7 REMOVIDA] — ComissoesContent/ComissoesTab refatorados para novo sistema

describe('8. Consistencia geral', () => {
  it.each([
    path.join(ROOT, 'app', 'api', 'admin', 'comissoes', 'route.ts'),
    path.join(ROOT, 'app', 'api', 'representante', 'comissoes', 'route.ts'),
  ])('%s usa ::text nas comparacoes de status', (p) => {
    expect(fs.readFileSync(p, 'utf-8')).toMatch(/status::text/);
  });

  it('comissionamento/comissoes.ts usa e.nome (nao e.razao_social) na query de comissoes_laudo', () => {
    const src = fs.readFileSync(
      path.join(ROOT, 'lib', 'db', 'comissionamento', 'comissoes.ts'),
      'utf-8'
    );
    // Verifica correcao: COALESCE(e.nome, cl.nome) na listagem
    expect(src).toMatch(
      /COALESCE\s*\(\s*e\.nome\s*,\s*cl\.nome\s*\)\s*AS\s*entidade_nome/i
    );
    // Extrai especificamente a funcao getComissoesByRepresentante e verifica que nao usa e.razao_social
    const fnStart = src.indexOf(
      'export async function getComissoesByRepresentante'
    );
    expect(fnStart).toBeGreaterThan(0);
    const nextFn = src.indexOf('\nexport async function', fnStart + 1);
    const fnBody = src.substring(
      fnStart,
      nextFn > fnStart ? nextFn : fnStart + 3000
    );
    expect(fnBody).not.toMatch(/e\.razao_social/i);
  });
});
