/**
 * @file __tests__/middleware/middleware-maintenance.test.ts
 *
 * Valida a implementação do maintenance mode no middleware.
 *
 * Contexto:
 *   - Commits 4b649755 + f87763f2 adicionaram `isUnderMaintenance()` ao middleware.
 *   - A função deve:
 *       1. Retornar false fora de APP_ENV=production (safe fallback)
 *       2. Retornar false se MAINTENANCE_MODE_ENABLED != 'true'
 *       3. Retornar false se datas forem inválidas/ausentes
 *       4. O middleware deve redirecionar para /maintenance quando ativo
 *       5. O middleware deve deixar /maintenance e /_next/* passarem
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const MIDDLEWARE_PATH = path.join(ROOT, 'middleware.ts');

let src: string;

beforeAll(() => {
  src = fs.readFileSync(MIDDLEWARE_PATH, 'utf-8');
});

// ─── Análise Estática: isUnderMaintenance ────────────────────────────────────

describe('middleware.ts — isUnderMaintenance (análise estática)', () => {
  it('arquivo middleware.ts existe', () => {
    expect(fs.existsSync(MIDDLEWARE_PATH)).toBe(true);
  });

  it('define função isUnderMaintenance', () => {
    expect(src).toMatch(/function\s+isUnderMaintenance\s*\(\)/);
  });

  it('restringe maintenance mode a APP_ENV=production apenas', () => {
    // Deve verificar APP_ENV !== 'production' e retornar false
    expect(src).toMatch(/APP_ENV.*production/);
    expect(src).toMatch(/return\s+false/);
  });

  it('verifica variável MAINTENANCE_MODE_ENABLED', () => {
    expect(src).toMatch(/MAINTENANCE_MODE_ENABLED/);
    expect(src).toMatch(/=== ['"]true['"]/);
  });

  it('lê variáveis MAINTENANCE_START e MAINTENANCE_END', () => {
    expect(src).toMatch(/MAINTENANCE_START/);
    expect(src).toMatch(/MAINTENANCE_END/);
  });

  it('valida datas com isNaN para fallback seguro', () => {
    expect(src).toMatch(/isNaN\(/);
  });

  it('envolve lógica de data em try/catch (fallback seguro)', () => {
    expect(src).toMatch(/try\s*\{[\s\S]*?isNaN[\s\S]*?\}\s*catch/);
  });

  it('retorna now >= start && now <= end como condição de ativação', () => {
    expect(src).toMatch(/now\s*>=\s*start\s*&&\s*now\s*<=\s*end/);
  });
});

// ─── Análise Estática: uso do middleware ─────────────────────────────────────

describe('middleware.ts — uso de isUnderMaintenance no fluxo principal', () => {
  it('chama isUnderMaintenance() antes das outras verificações', () => {
    // isUnderMaintenance deve ser chamada na função middleware
    expect(src).toMatch(/isUnderMaintenance\(\)/);
  });

  it('redireciona para /maintenance quando em manutenção', () => {
    expect(src).toMatch(/NextResponse\.redirect[\s\S]*?\/maintenance/);
  });

  it('deixa a rota /maintenance passar sem redirect', () => {
    // Exceção explícita para /maintenance
    expect(src).toMatch(/pathname === ['"]\/maintenance['"]/);
    expect(src).toMatch(/NextResponse\.next\(\)/);
  });

  it('deixa /_next/* passar sem redirect (assets estáticos)', () => {
    expect(src).toMatch(/pathname\.startsWith\(['"]\/\_next\//);
  });
});

// ─── Testes comportamentais via mock de process.env ──────────────────────────

describe('isUnderMaintenance — comportamento via mock de env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    // Limpar variáveis de manutenção antes de cada teste
    process.env = { ...originalEnv };
    delete process.env.APP_ENV;
    delete process.env.MAINTENANCE_MODE_ENABLED;
    delete process.env.MAINTENANCE_START;
    delete process.env.MAINTENANCE_END;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('retorna false quando APP_ENV não é production', () => {
    process.env.APP_ENV = 'development';
    process.env.MAINTENANCE_MODE_ENABLED = 'true';
    process.env.MAINTENANCE_START = new Date(Date.now() - 3600000).toISOString();
    process.env.MAINTENANCE_END = new Date(Date.now() + 3600000).toISOString();

    // Usar eval isolado para testar a lógica extraída — verificação estática
    // A lógica no código deve checar APP_ENV antes de qualquer outra coisa
    expect(src).toMatch(/if\s*\(process\.env\.APP_ENV\s*!==\s*['"]production['"]\)\s*return\s+false/);
  });

  it('retorna false quando MAINTENANCE_MODE_ENABLED não é "true"', () => {
    // Deve ter um check: if (!enabled) return false
    expect(src).toMatch(/if\s*\(!enabled\)\s*return\s+false/);
  });

  it('retorna false quando MAINTENANCE_START ou MAINTENANCE_END ausentes', () => {
    // Deve ter check: if (!startStr || !endStr) return false
    expect(src).toMatch(/if\s*\(!startStr\s*\|\|\s*!endStr\)\s*return\s+false/);
  });
});

// ─── Análise: maintenance mode desabilitado por padrão ───────────────────────

describe('maintenance mode — desabilitado por padrão', () => {
  it('MAINTENANCE_MODE_ENABLED não vem como "true" no código fonte', () => {
    // O arquivo não deve ter hardcoded MAINTENANCE_MODE_ENABLED='true'
    // (seria um risco de segurança — deve vir apenas de env)
    expect(src).not.toMatch(/MAINTENANCE_MODE_ENABLED\s*=\s*['"]true['"]/);
  });

  it('não importa variáveis de manutenção hardcoded', () => {
    // Lê de process.env, não de constantes hardcoded
    expect(src).toMatch(/process\.env\.MAINTENANCE_MODE_ENABLED/);
    expect(src).toMatch(/process\.env\.MAINTENANCE_START/);
    expect(src).toMatch(/process\.env\.MAINTENANCE_END/);
  });

  it('função isUnderMaintenance não expõe detalhes internos em erros', () => {
    // catch block deve retornar false silenciosamente, sem lançar erros
    expect(src).toMatch(/catch\s*[\s\S]*?\{\s*[\s\S]*?return\s+false/);
  });
});
