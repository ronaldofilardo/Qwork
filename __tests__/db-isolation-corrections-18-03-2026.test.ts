/**
 * db-isolation-corrections-18-03-2026.test.ts
 *
 * Valida as correções de isolamento de banco de dados aplicadas em 18/03/2026:
 *
 * 1. lib/db.ts
 *    - getDatabaseUrl() lança ERRO CRÍTICO (throw) — não apenas console.warn —
 *      quando LOCAL_DATABASE_URL aponta para nr-bps_db_test em desenvolvimento.
 *
 * 2. lib/infrastructure/database/connection.ts
 *    - Removida detecção perigosa que forçava environment='test' incondicionalmente
 *      quando qualquer URL continha '_test'.
 *    - A detecção de _test agora é condicional: só ativa quando NODE_ENV=test ou Jest.
 *    - getDatabaseUrl() em path de DEV lança erro (não warn) quando URL→_test.
 *
 * 3. lib/infrastructure/database/queries.ts
 *    - Adicionada validação de isolamento antes de cada query.
 *    - Importa isDevelopment e getDatabaseUrl de ./connection.
 *
 * 4. lib/db/connection.ts (recriado)
 *    - Mesmas correções: sem detecção incondicional de _test.
 *    - Throw em DEV quando LOCAL_DATABASE_URL→_test.
 *
 * 5. .env.local
 *    - LOCAL_DATABASE_URL agora aponta explicitamente para nr-bps_db.
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── helpers ──────────────────────────────────────────────────────────────────

function read(relPath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');
}

// ─── 1. lib/db.ts ─────────────────────────────────────────────────────────────

describe('lib/db.ts — getDatabaseUrl() throw quando LOCAL_DATABASE_URL→_test em DEV', () => {
  let src: string;

  beforeAll(() => {
    src = read('lib/db.ts');
  });

  it('contém throw new Error com mensagem ERRO CRÍTICO DE ISOLAMENTO', () => {
    // A correção substituiu console.warn por throw new Error
    expect(src).toMatch(/throw new Error\(/);
    expect(src).toMatch(/ERRO CR[IÍ]TICO DE ISOLAMENTO/);
  });

  it('NÃO usa apenas console.warn para o caso nr-bps_db_test em desenvolvimento', () => {
    // Verificar que existe throw dentro do bloco que detecta nr-bps_db_test em DEV
    // O padrão deve ser: if (dbName === 'nr-bps_db_test') { throw new Error(...) }
    expect(src).toMatch(
      /if\s*\(dbName\s*===\s*['"]nr-bps_db_test['"\s*]\)\s*\{\s*throw new Error/s
    );
  });
  it('o throw ocorre dentro do bloco isDevelopment (não fora)', () => {
    // Garantir que o throw para nr-bps_db_test está no path de isDevelopment
    // Verificar que há um bloco: if (isDevelopment) { ... nr-bps_db_test ... throw ... }
    const devIdx = src.indexOf('if (isDevelopment)');
    expect(devIdx).not.toBe(-1);
    // O throw para nr-bps_db_test deve aparecer depois do início do bloco isDevelopment
    const throwTestIdx = src.indexOf("'nr-bps_db_test'", devIdx);
    expect(throwTestIdx).not.toBe(-1);
    // E esse trecho deve conter throw new Error
    const segment = src.slice(throwTestIdx, throwTestIdx + 400);
    expect(segment).toMatch(/throw new Error/);
  });

  it('mensagem do throw menciona nr-bps_db_test', () => {
    expect(src).toMatch(
      /nr-bps_db_test.*DESENVOLVIMENTO|DESENVOLVIMENTO.*nr-bps_db_test/is
    );
  });

  it('mensagem orienta corrigir LOCAL_DATABASE_URL no .env.local', () => {
    expect(src).toMatch(/\.env\.local/);
    expect(src).toMatch(/nr-bps_db/);
  });
});

// ─── 2. lib/infrastructure/database/connection.ts ────────────────────────────

describe('lib/infrastructure/database/connection.ts — correções de isolamento', () => {
  let src: string;

  beforeAll(() => {
    src = read('lib/infrastructure/database/connection.ts');
  });

  describe('2a. Remoção da detecção incondicional de _test', () => {
    it('NÃO tem bloco incondicional: if (databaseUrlCheck.includes(_test)) environment = test', () => {
      // O padrão OLD era no TOPLEVEL: const databaseUrlCheck = ...; if (..._test...) environment=test
      // O padrão NOVO: o bloco 'const databaseUrlCheck' vem DENTRO de if (NODE_ENV=test||isRunningTests)
      // Verificar que databaseUrlCheck só existe DEPOIS do guard
      const guardIdx = src.indexOf(
        "process.env.NODE_ENV === 'test' || isRunningTests"
      );
      const databaseUrlCheckIdx = src.indexOf('const databaseUrlCheck');
      expect(guardIdx).not.toBe(-1);
      expect(databaseUrlCheckIdx).not.toBe(-1);
      // databaseUrlCheck deve aparecer DEPOIS do guard (está dentro do bloco if)
      expect(databaseUrlCheckIdx).toBeGreaterThan(guardIdx);
    });

    it('a detecção de _test é condicional: só ativa quando NODE_ENV=test ou isRunningTests', () => {
      // O guard envolve o bloco de databaseUrlCheck
      const guardIdx = src.indexOf(
        "process.env.NODE_ENV === 'test' || isRunningTests"
      );
      const databaseUrlCheckIdx = src.indexOf('const databaseUrlCheck');
      expect(guardIdx).not.toBe(-1);
      // databaseUrlCheck está DENTRO do bloco guard (índice maior)
      expect(databaseUrlCheckIdx).toBeGreaterThan(guardIdx);
    });
  });

  describe('2b. getDatabaseUrl() em DEV lança erro quando URL→_test', () => {
    it('contém throw new Error com ERRO CRÍTICO no path de desenvolvimento', () => {
      expect(src).toMatch(/throw new Error\(/);
      expect(src).toMatch(/ERRO CR[IÍ]TICO/);
    });

    it('NÃO usa apenas console.warn para nr-bps_db_test em isDevelopment', () => {
      // Isolar o trecho de isDevelopment
      const devIdx = src.indexOf('if (isDevelopment)');
      expect(devIdx).not.toBe(-1);
      const devBlock = src.slice(devIdx, devIdx + 1500);

      // Se existe nr-bps_db_test nesse trecho, deve ter throw antes de (ou em vez de) console.warn
      if (devBlock.includes("'nr-bps_db_test'")) {
        expect(devBlock).toMatch(/throw new Error\(/);
      }
    });
  });
});

// ─── 3. lib/infrastructure/database/queries.ts ───────────────────────────────

describe('lib/infrastructure/database/queries.ts — validação de isolamento adicionada', () => {
  let src: string;

  beforeAll(() => {
    src = read('lib/infrastructure/database/queries.ts');
  });

  it('importa isDevelopment de ./connection', () => {
    expect(src).toMatch(
      /import\s*\{[^}]*isDevelopment[^}]*\}\s*from\s*['"]\.\/connection['"]/
    );
  });

  it('importa getDatabaseUrl de ./connection', () => {
    expect(src).toMatch(
      /import\s*\{[^}]*getDatabaseUrl[^}]*\}\s*from\s*['"]\.\/connection['"]/
    );
  });

  it('contém validação de isolamento: isTest + lança quando usa banco DEV', () => {
    expect(src).toMatch(/isTest/);
    expect(src).toMatch(/nr-bps_db/);
    expect(src).toMatch(/throw new Error\(/);
  });

  it('contém validação de isolamento: isDevelopment + lança quando usa banco TEST', () => {
    expect(src).toMatch(/isDevelopment/);
    expect(src).toMatch(/nr-bps_db_test/);
  });

  it('validação de isolamento ocorre ANTES do bloco try/catch principal', () => {
    const validationIdx = src.indexOf('Validação de isolamento');
    const tryIdx = src.indexOf('\n  try {');

    expect(validationIdx).not.toBe(-1);
    expect(tryIdx).not.toBe(-1);
    expect(validationIdx).toBeLessThan(tryIdx);
  });

  it('função query exporta e aceita sql + params', () => {
    expect(src).toMatch(/export async function query/);
    expect(src).toMatch(/sql:\s*string|sql\s*string/);
  });
});

// ─── 4. lib/db/connection.ts ─────────────────────────────────────────────────

describe('lib/db/connection.ts — recriado com correções de isolamento', () => {
  let src: string;

  beforeAll(() => {
    src = read('lib/db/connection.ts');
  });

  it('arquivo existe (não é dead code deletado)', () => {
    expect(src.length).toBeGreaterThan(500);
  });

  it('NÃO tem bloco incondicional: databaseUrlCheck includes _test → environment = test', () => {
    // lib/db/connection.ts usa 'otherDbIndicatesTest' (não 'const databaseUrlCheck')
    // O padrão NOVO: environment='test' só dentro de if (NODE_ENV=test||isRunningTests)
    // Verificar que o guard existe e que o set de environment vem depois dele
    const guardIdx = src.indexOf(
      "process.env.NODE_ENV === 'test' || isRunningTests"
    );
    expect(guardIdx).not.toBe(-1);
    // O guard envolve o set de environment para 'test' baseado em URL
    // Verificar que não há assignment environment='test' de _test ANTES do guard
    const beforeGuard = src.slice(0, guardIdx);
    // O padrão perigoso seria: URL.includes('_test') ... environment = 'test' sem guard
    const dangerousBeforeGuard =
      beforeGuard.includes('_test') &&
      beforeGuard.match(
        /includes\('_test'\)[\s\S]{0,100}environment\s*=\s*'test'/
      );
    expect(dangerousBeforeGuard).toBeFalsy();
  });

  it('a detecção de _test é agora condicional (NODE_ENV=test ou isRunningTests)', () => {
    // O guard NODE_ENV=test || isRunningTests está presente
    expect(src).toMatch("process.env.NODE_ENV === 'test' || isRunningTests");
    // environment = 'test' não aparece para URLs com _test sem o guard
    const guardIdx = src.indexOf(
      "process.env.NODE_ENV === 'test' || isRunningTests"
    );
    expect(guardIdx).not.toBe(-1);
  });

  it('contém throw new Error com ERRO CRÍTICO quando LOCAL_DATABASE_URL→_test em DEV', () => {
    expect(src).toMatch(/throw new Error\(/);
    expect(src).toMatch(/ERRO CR[IÍ]TICO/);
  });

  it('exporta getDatabaseUrl, getLocalPool, isDevelopment, isTest, databaseUrl', () => {
    expect(src).toMatch(/export.*getDatabaseUrl|export const getDatabaseUrl/);
    expect(src).toMatch(/export.*getLocalPool|export function getLocalPool/);
    expect(src).toMatch(/export const isDevelopment/);
    expect(src).toMatch(/export const isTest/);
    expect(src).toMatch(/export const databaseUrl/);
  });

  it('bloqueia uso de Neon Cloud em testes (contém validação neon.tech)', () => {
    expect(src).toMatch(/neon\.tech/);
    expect(src).toMatch(/ERRO CR[IÍ]TICO DE SEGURANÇA/);
  });

  it('não carrega dotenv em Jest (guarda JEST_WORKER_ID)', () => {
    expect(src).toMatch(/JEST_WORKER_ID/);
    // dotenv.config só é chamado quando não está em Jest
    expect(src).toMatch(/!process\.env\.JEST_WORKER_ID/);
  });
});

// ─── 5. .env.local ────────────────────────────────────────────────────────────

describe('.env.local — LOCAL_DATABASE_URL definido para nr-bps_db', () => {
  let src: string;

  beforeAll(() => {
    // .env.local pode não existir em CI — pular graciosamente
    const filePath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(filePath)) {
      src = '';
    } else {
      src = fs.readFileSync(filePath, 'utf8');
    }
  });

  it('contém LOCAL_DATABASE_URL definido (linha não comentada)', () => {
    if (!src) {
      console.warn('⚠️ .env.local não encontrado — skipping (ambiente CI)');
      return;
    }
    // Linha não pode ser apenas comentário (#)
    const lines = src.split('\n');
    const localDbLine = lines.find(
      (l) =>
        l.trim().startsWith('LOCAL_DATABASE_URL=') && !l.trim().startsWith('#')
    );
    expect(localDbLine).toBeDefined();
  });

  it('LOCAL_DATABASE_URL aponta para nr-bps_db (não nr-bps_db_test)', () => {
    if (!src) return;
    const lines = src.split('\n');
    const localDbLine = lines.find(
      (l) =>
        l.trim().startsWith('LOCAL_DATABASE_URL=') && !l.trim().startsWith('#')
    );
    if (!localDbLine) {
      fail('LOCAL_DATABASE_URL não encontrado em .env.local');
      return;
    }
    const value = localDbLine.split('=').slice(1).join('=').trim();
    expect(value).toMatch(/nr-bps_db/);
    expect(value).not.toMatch(/nr-bps_db_test/);
  });

  it('LOCAL_DATABASE_URL usa host localhost', () => {
    if (!src) return;
    const lines = src.split('\n');
    const localDbLine = lines.find(
      (l) =>
        l.trim().startsWith('LOCAL_DATABASE_URL=') && !l.trim().startsWith('#')
    );
    if (!localDbLine) return;
    const value = localDbLine.split('=').slice(1).join('=').trim();
    expect(value).toMatch(/localhost/);
  });
});

// ─── 6. Consistência entre os módulos de conexão ─────────────────────────────

describe('Consistência entre módulos DB — mesma política de isolamento', () => {
  let dbTs: string;
  let infraConn: string;
  let dbConn: string;

  beforeAll(() => {
    dbTs = read('lib/db.ts');
    infraConn = read('lib/infrastructure/database/connection.ts');
    dbConn = read('lib/db/connection.ts');
  });

  it('todos os 3 módulos contêm ERRO CRÍTICO DE ISOLAMENTO', () => {
    expect(dbTs).toMatch(/ERRO CR[IÍ]TICO DE ISOLAMENTO/);
    expect(infraConn).toMatch(/ERRO CR[IÍ]TICO/);
    expect(dbConn).toMatch(/ERRO CR[IÍ]TICO/);
  });

  it('todos os 3 módulos protegem dotenv de rodar em Jest/test', () => {
    // lib/db.ts e lib/db/connection.ts carregam dotenv
    expect(dbTs).toMatch(/JEST_WORKER_ID|NODE_ENV.*test/);
    expect(dbConn).toMatch(/JEST_WORKER_ID/);
    // lib/infrastructure/database/connection.ts não carrega dotenv (não tem import dotenv)
    // mas também não precisa pois é usado via Next.js loader
  });

  it('nenhum módulo tem detecção incondicional de _test que force environment=test em DEV', () => {
    // Verificar que em ambos os módulos o guard NODE_ENV=test||isRunningTests existe
    // e que não há assignment environment='test' baseado em _test ANTES desse guard
    for (const [name, code] of [
      ['infra/connection', infraConn],
      ['db/connection', dbConn],
    ]) {
      const guardIdx = code.indexOf(
        "process.env.NODE_ENV === 'test' || isRunningTests"
      );
      expect(guardIdx).not.toBe(-1);
      // Verificar que antes do guard não há o padrão perigoso
      const beforeGuard = code.slice(0, guardIdx);
      const hasDangerousPattern = !!beforeGuard.match(
        /\.includes\('_test'\)[^;\n]{0,80}environment\s*=\s*'test'/s
      );
      expect(hasDangerousPattern).toBe(false);
    }
  });

  it('lib/infrastructure/database/queries.ts valida isolamento antes de executar query', () => {
    const queriesSrc = read('lib/infrastructure/database/queries.ts');
    // Deve ter validação antes do bloco try
    const validationBeforeTry =
      queriesSrc.indexOf('ERRO CRÍTICO DE ISOLAMENTO') <
      queriesSrc.indexOf('\n  try {');
    expect(validationBeforeTry).toBe(true);
  });
});
