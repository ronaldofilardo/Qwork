/**
 * __tests__/seeds/002-staging-representantes-suporte-comercial.test.ts
 *
 * Testes de estrutura e idempotência para o seed
 * database/seeds/002_staging_representantes_suporte_comercial.sql
 *
 * Objetivo:
 *   Garantir que o seed contém todas as fases acordadas, usa transação,
 *   respeita os guards de idempotência e não altera banco em teste.
 *
 * NÃO conecta ao banco — apenas lê e inspeciona o código SQL.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SEED_PATH = path.join(
  ROOT,
  'database',
  'seeds',
  '002_staging_representantes_suporte_comercial.sql'
);

let src: string;

beforeAll(() => {
  src = fs.readFileSync(SEED_PATH, 'utf-8');
});

// ---------------------------------------------------------------------------
// 1. Existência e transação
// ---------------------------------------------------------------------------

describe('1. Existência e transação', () => {
  it('arquivo 002 deve existir', () => {
    expect(fs.existsSync(SEED_PATH)).toBe(true);
  });

  it('deve envolver tudo em BEGIN/COMMIT', () => {
    expect(src).toMatch(/^\s*BEGIN\s*;/im);
    expect(src).toMatch(/^\s*COMMIT\s*;/im);
  });

  it('não usa ROLLBACK implícito — não deve conter erros esperados sem tratamento', () => {
    // Garante que não há RAISE EXCEPTION sem estar dentro de bloco de teste
    const raiseException = src.match(/RAISE EXCEPTION/gi) ?? [];
    expect(raiseException.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Fase 1 — Disable/Enable trigger
// ---------------------------------------------------------------------------

describe('2. Disable/Enable trigger trg_representante_codigo (OBSOLETO — removido na migration 1227)', () => {
  it.skip('desabilita trigger antes dos INSERTs', () => {
    expect(src).toMatch(/DISABLE TRIGGER trg_representante_codigo/i);
  });

  it.skip('reabilita trigger após INSERTs', () => {
    expect(src).toMatch(/ENABLE TRIGGER trg_representante_codigo/i);
  });

  it.skip('DISABLE aparece antes do ENABLE', () => {
    const disablePos = src.search(/DISABLE TRIGGER trg_representante_codigo/i);
    const enablePos = src.search(/ENABLE TRIGGER trg_representante_codigo/i);
    expect(disablePos).toBeGreaterThan(-1);
    expect(enablePos).toBeGreaterThan(disablePos);
  });
});

// ---------------------------------------------------------------------------
// 3. Fase 2 — Renumeração Ronaldo '1' → '3'
// ---------------------------------------------------------------------------

describe('3. Renumeração representante Ronaldo (88593998070) (OBSOLETO — campo codigo removido)', () => {
  it.skip('atualiza cpf 88593998070 de código "1" para "3"', () => {
    expect(src).toMatch(/UPDATE.*representantes.*SET.*codigo\s*=\s*'3'/is);
    expect(src).toMatch(/cpf\s*=\s*'88593998070'/);
  });

  it.skip('guard: só atualiza se código atual é "1"', () => {
    expect(src).toMatch(
      /codigo\s*=\s*'1'.*88593998070|88593998070.*codigo\s*=\s*'1'/is
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Fase 3 e 4 — INSERT representantes Suporte e Comercial
// ---------------------------------------------------------------------------

describe('4. INSERT representante Suporte (11111111111) (OBSOLETO — campo codigo removido)', () => {
  it('insere CPF 11111111111', () => {
    expect(src).toMatch(/'11111111111'/);
  });

  it.skip('define codigo = "1"', () => {
    // Verifica que o bloco do suporte atribui código '1'
    const suporteBlock = src.substring(
      src.indexOf('11111111111'),
      src.indexOf('22222222222')
    );
    expect(suporteBlock).toMatch(/'1'/);
  });

  it('usa IF NOT EXISTS guard (idempotência)', () => {
    expect(src).toMatch(
      /NOT EXISTS.*SELECT 1 FROM.*representantes.*WHERE.*cpf\s*=\s*'11111111111'/is
    );
  });

  it('email placeholder suporte@qwork.app.br', () => {
    expect(src).toMatch(/suporte@qwork\.app\.br/);
  });
});

describe('5. INSERT representante Comercial (22222222222) (OBSOLETO — campo codigo removido)', () => {
  it('insere CPF 22222222222', () => {
    expect(src).toMatch(/'22222222222'/);
  });

  it.skip('define codigo = "2"', () => {
    const comercialBlock = src.substring(src.indexOf('22222222222'));
    expect(comercialBlock).toMatch(/'2'/);
  });

  it('usa IF NOT EXISTS guard (idempotência)', () => {
    expect(src).toMatch(
      /NOT EXISTS.*SELECT 1 FROM.*representantes.*WHERE.*cpf\s*=\s*'22222222222'/is
    );
  });

  it('email placeholder comercial@qwork.app.br', () => {
    expect(src).toMatch(/comercial@qwork\.app\.br/);
  });
});

// ---------------------------------------------------------------------------
// 5. Fase 6 — Ajuste da sequence
// ---------------------------------------------------------------------------

describe('6. Ajuste de seq_representante_codigo (OBSOLETO — removido na migration 1227)', () => {
  it.skip('chama setval com valor 3', () => {
    expect(src).toMatch(
      /setval\s*\(\s*'(public\.)?seq_representante_codigo'\s*,\s*3\s*\)/i
    );
  });

  it.skip('contém guard que só ajusta se current < 3', () => {
    expect(src).toMatch(/v_current\s*<\s*3/);
  });
});

// ---------------------------------------------------------------------------
// 6. Fases 7 e 8 — Vínculos em hierarquia_comercial
// ---------------------------------------------------------------------------

describe('7. Vínculo Suporte em hierarquia_comercial', () => {
  it('busca usuário 11111111111 em usuarios', () => {
    expect(src).toMatch(/FROM.*usuarios.*WHERE.*cpf\s*=\s*'11111111111'/is);
  });

  it('insere em hierarquia_comercial com vendedor_id e representante_id', () => {
    expect(src).toMatch(
      /INSERT INTO.*hierarquia_comercial.*vendedor_id.*representante_id/is
    );
  });

  it('guard de idempotência: não insere se já existe e ativo=true', () => {
    expect(src).toMatch(
      /ativo\s*=\s*true.*hierarquia_comercial|hierarquia_comercial.*ativo\s*=\s*true/is
    );
  });

  it('reativa vínculo antigo se ativo=false (UPDATE antes do INSERT)', () => {
    expect(src).toMatch(
      /UPDATE.*hierarquia_comercial.*SET.*ativo\s*=\s*true/is
    );
  });
});

describe('8. Vínculo Comercial em hierarquia_comercial', () => {
  it('busca usuário 22222222222 em usuarios', () => {
    expect(src).toMatch(/FROM.*usuarios.*WHERE.*cpf\s*=\s*'22222222222'/is);
  });

  it('insere em hierarquia_comercial para Comercial', () => {
    // O seed tem dois blocos de INSERT hierarquia_comercial (um por linha) — não usa flag 's'
    const matches = src.match(/INSERT INTO[^\n]*hierarquia_comercial/gi) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// 7. Verificação final — seção de queries \echo
// ---------------------------------------------------------------------------

describe('9. Seção de verificação final', () => {
  it('contém SELECT final de representantes ordenado por codigo::integer', () => {
    expect(src).toMatch(/ORDER BY.*codigo::integer/i);
  });

  it('contém JOIN entre hierarquia_comercial, usuarios e representantes', () => {
    expect(src).toMatch(/JOIN.*usuarios/i);
    expect(src).toMatch(/JOIN.*representantes/i);
  });

  it('contém query de proximo código (last_value + 1)', () => {
    expect(src).toMatch(/last_value\s*\+\s*1/i);
  });

  it('exibe mensagem de conclusão com ✓', () => {
    expect(src).toMatch(/✓.*Seed 002/u);
  });
});

// ---------------------------------------------------------------------------
// 8. Integridade geral — sem código legado ou artefatos de debug
// ---------------------------------------------------------------------------

describe('10. Integridade geral', () => {
  it('não contém DROP TABLE ou DROP SEQUENCE', () => {
    expect(src).not.toMatch(/DROP\s+TABLE/i);
    expect(src).not.toMatch(/DROP\s+SEQUENCE/i);
  });

  it('não contém TRUNCATE', () => {
    expect(src).not.toMatch(/TRUNCATE/i);
  });

  it('não referencia banco de produção (neondb sem sufixo _staging)', () => {
    expect(src).not.toMatch(/neondb(?!_staging)/i);
  });

  it('não contém credenciais hardcoded', () => {
    expect(src).not.toMatch(/password\s*=\s*'[^']+'/i);
    expect(src).not.toMatch(/npg_/i);
  });
});
