/**
 * Testes do sistema — Fase 2 (Pirâmide de Testes) + Fase 4 (Pipeline CI/CD)
 *
 * Passo 4: Reorganização dos testes correcoes-* para subpastas temáticas
 * Passo 5: Coverage thresholds elevados em jest.config.cjs
 * Passo 6: Testes unitários adicionais (session, rate-limit, audit-logger, health-check)
 * Passo 7: Correção doc Vitest→Jest no copilot-instructions.md
 * Passo 13: Job API route tests no ci.yml
 * Passo 14: Job DB tests no ci.yml
 * Passo 15: Tags @critical/@regression nos specs Cypress
 * Passo 16: Expansão E2E de ~2 para ~10 specs críticos no CI
 * Passo 17: Endpoint /api/health
 * Passo 18: Workflow staging-smoke.yml
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

// ======================================================================
// PASSO 4: Reorganização correcoes-* → subpastas temáticas
// ======================================================================
describe('Passo 4 — Reorganização de testes correcoes-*', () => {
  const MOVED_FILES: [string, string][] = [
    ['correcoes-04-03-2026.test.ts', '__tests__/db/migrations/'],
    ['correcoes-06-03-2026.test.ts', '__tests__/db/views/'],
    ['correcoes-08-02-2026.test.ts', '__tests__/db/schema/'],
    ['correcoes-23-03-2026.test.ts', '__tests__/db/comissionamento/'],
    ['correcoes-09-02-2026-entidade-id.test.ts', '__tests__/integration/lotes/'],
    ['correcoes-27-02-2026.test.ts', '__tests__/integration/avaliacao/'],
    ['correcoes-17-03-2026.test.ts', '__tests__/lib/db/'],
    ['correcoes-26-03-2026-mudanca-funcao-importacao.test.ts', '__tests__/lib/importacao/'],
    ['correcoes-card-laudo-bucket-16-02-2026.test.ts', '__tests__/lib/laudo/'],
    ['correcoes-18-03-2026.test.ts', '__tests__/api/representante/'],
    ['correcoes-20-03-2026.test.ts', '__tests__/api/vendedor/'],
    ['correcoes-22-03-2026.test.ts', '__tests__/api/admin/'],
    ['correcoes-comissionamento-auditoria.test.ts', '__tests__/api/admin/comissoes/'],
    ['correcoes-28-02-2026.test.ts', '__tests__/api/rh/'],
    ['correcoes-31-01-2026.test.ts', '__tests__/api/avaliacao/'],
    ['correcoes-ux-27-02-2026.test.ts', '__tests__/ui/'],
  ];

  it('nenhum arquivo correcoes-*.test.ts deve existir na raiz __tests__/', () => {
    const rootTests = fs.readdirSync(path.join(ROOT, '__tests__'));
    const remainingCorrecoes = rootTests.filter(
      (f) => f.startsWith('correcoes-') && f.endsWith('.test.ts')
    );
    expect(remainingCorrecoes).toEqual([]);
  });

  it.each(MOVED_FILES)(
    '%s deve existir em %s',
    (fileName, targetDir) => {
      expect(fileExists(path.join(targetDir, fileName))).toBe(true);
    }
  );

  it('subpastas temáticas devem existir', () => {
    const dirs = [
      '__tests__/db/migrations',
      '__tests__/db/views',
      '__tests__/db/schema',
      '__tests__/db/comissionamento',
      '__tests__/integration/lotes',
      '__tests__/integration/avaliacao',
      '__tests__/lib/db',
      '__tests__/lib/importacao',
      '__tests__/lib/laudo',
      '__tests__/api/representante',
      '__tests__/api/vendedor',
      '__tests__/api/admin',
      '__tests__/api/admin/comissoes',
      '__tests__/api/rh',
      '__tests__/api/avaliacao',
      '__tests__/ui',
    ];
    for (const dir of dirs) {
      expect(fileExists(dir)).toBe(true);
    }
  });
});

// ======================================================================
// PASSO 5: Coverage thresholds elevados
// ======================================================================
describe('Passo 5 — Coverage thresholds em jest.config.cjs', () => {
  const config = readFile('jest.config.cjs');

  it('deve ter branches >= 20', () => {
    const match = config.match(/branches:\s*(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(20);
  });

  it('deve ter functions >= 30', () => {
    const match = config.match(/functions:\s*(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(30);
  });

  it('deve ter lines >= 35', () => {
    const match = config.match(/lines:\s*(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(35);
  });

  it('deve ter statements >= 35', () => {
    const match = config.match(/statements:\s*(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(35);
  });

  it('deve referenciar Sprint no comentário', () => {
    expect(config).toMatch(/Sprint/i);
  });
});

// ======================================================================
// PASSO 6: Testes unitários adicionais existem
// ======================================================================
describe('Passo 6 — Testes unitários faltantes adicionados', () => {
  it('deve existir __tests__/lib/session.test.ts', () => {
    expect(fileExists('__tests__/lib/session.test.ts')).toBe(true);
  });

  it('deve existir __tests__/lib/rate-limit.test.ts', () => {
    expect(fileExists('__tests__/lib/rate-limit.test.ts')).toBe(true);
  });

  it('deve existir __tests__/lib/audit-logger.test.ts', () => {
    expect(fileExists('__tests__/lib/audit-logger.test.ts')).toBe(true);
  });

  it('deve existir __tests__/lib/health-check.test.ts', () => {
    expect(fileExists('__tests__/lib/health-check.test.ts')).toBe(true);
  });

  it('session.test.ts deve testar createSession e getSession', () => {
    const content = readFile('__tests__/lib/session.test.ts');
    expect(content).toContain('createSession');
    expect(content).toContain('getSession');
  });

  it('rate-limit.test.ts deve testar rateLimitAsync e RATE_LIMIT_CONFIGS', () => {
    const content = readFile('__tests__/lib/rate-limit.test.ts');
    expect(content).toContain('rateLimitAsync');
    expect(content).toContain('RATE_LIMIT_CONFIGS');
  });

  it('audit-logger.test.ts deve testar logAudit', () => {
    const content = readFile('__tests__/lib/audit-logger.test.ts');
    expect(content).toContain('logAudit');
    expect(content).toContain('INSERT INTO auditoria');
  });
});

// ======================================================================
// PASSO 7: Correção doc Vitest→Jest
// ======================================================================
describe('Passo 7 — copilot-instructions.md diz Jest (não Vitest)', () => {
  const content = readFile('.github/copilot-instructions.md');

  it('não deve mencionar Vitest como test runner', () => {
    // Verifica que não há "Vitest" na linha da stack de testes
    const lines = content.split('\n');
    const testLine = lines.find((l) => l.includes('Testes:') && l.includes('unitario'));
    expect(testLine).toBeDefined();
    expect(testLine).not.toContain('Vitest');
  });

  it('deve mencionar Jest como test runner unitário', () => {
    const lines = content.split('\n');
    const testLine = lines.find((l) => l.includes('Testes:') && l.includes('unitario'));
    expect(testLine).toContain('Jest');
  });
});

// ======================================================================
// PASSO 13+14: Jobs de API Route e DB tests no ci.yml
// ======================================================================
describe('Passo 13 — Job API route tests no ci.yml', () => {
  const ci = readFile('.github/workflows/ci.yml');

  it('deve conter job api-route-tests', () => {
    expect(ci).toContain('api-route-tests:');
  });

  it('deve executar jest __tests__/api', () => {
    expect(ci).toMatch(/jest\s+__tests__\/api/);
  });

  it('job deve depender de lint-and-typecheck', () => {
    // Buscar a seção api-route-tests e verificar needs
    const apiSection = ci.split('api-route-tests:')[1]?.split(/\n  \w+.*-.*:$/m)[0] ?? '';
    expect(apiSection).toContain('lint-and-typecheck');
  });
});

describe('Passo 14 — Job DB tests no ci.yml', () => {
  const ci = readFile('.github/workflows/ci.yml');

  it('deve conter job db-schema-tests', () => {
    expect(ci).toContain('db-schema-tests:');
  });

  it('deve executar jest __tests__/db', () => {
    expect(ci).toMatch(/jest.*__tests__\/db/);
  });

  it('deve aplicar schemas modulares antes dos testes', () => {
    const dbSection = ci.split('db-schema-tests:')[1]?.split(/\n  \w+.*-.*:$/m)[0] ?? '';
    expect(dbSection).toContain('01-foundation.sql');
  });
});

// ======================================================================
// PASSO 15: Tags nos specs Cypress
// ======================================================================
describe('Passo 15 — Tags @critical/@regression nos specs Cypress', () => {
  const criticalSpecs = [
    'cypress/e2e/fluxo-cadastro-entidade-senha.cy.ts',
    'cypress/e2e/fluxo-contratacao-completo.cy.ts',
    'cypress/e2e/security-rbac.cy.ts',
    'cypress/e2e/smoke-tests.cy.ts',
    'cypress/e2e/fluxo-funcionario-lote-emissao.cy.ts',
    'cypress/e2e/entidade-conta-fluxo-completo.cy.ts',
    'cypress/e2e/avaliacao-auto-conclusao.cy.ts',
    'cypress/e2e/liberacao-lote.cy.ts',
    'cypress/e2e/lote-permission.cy.ts',
    'cypress/e2e/indice-avaliacao.cy.ts',
  ];

  it.each(criticalSpecs)('%s deve ter tag @tags critical', (spec) => {
    const content = readFile(spec);
    expect(content).toMatch(/@tags.*critical/);
  });

  const regressionSpecs = [
    'cypress/e2e/regressao/fluxo-cadastro-regressao.cy.ts',
    'cypress/e2e/seguranca/rbac-operacoes-criticas.cy.ts',
  ];

  it.each(regressionSpecs)('%s deve ter tag @tags regression', (spec) => {
    const content = readFile(spec);
    expect(content).toMatch(/@tags.*regression/);
  });
});

// ======================================================================
// PASSO 16: E2E expandido no CI
// ======================================================================
describe('Passo 16 — E2E expandido para ~10+ specs críticos no CI', () => {
  const ci = readFile('.github/workflows/ci.yml');

  it('deve ter pelo menos 8 steps E2E @critical', () => {
    const criticalSteps = ci.match(/E2E @critical/g) || [];
    expect(criticalSteps.length).toBeGreaterThanOrEqual(8);
  });

  it('deve ter job e2e-regression separado', () => {
    expect(ci).toContain('e2e-regression:');
  });

  it('e2e-regression deve rodar apenas em push para main', () => {
    const regrSection = ci.split('e2e-regression:')[1]?.split(/\n  \w+.*-.*:$/m)[0] ?? '';
    expect(regrSection).toContain("refs/heads/main");
  });
});

// ======================================================================
// PASSO 17: Endpoint /api/health
// ======================================================================
describe('Passo 17 — Endpoint /api/health', () => {
  it('deve existir app/api/health/route.ts', () => {
    expect(fileExists('app/api/health/route.ts')).toBe(true);
  });

  it('deve exportar GET handler', () => {
    const content = readFile('app/api/health/route.ts');
    expect(content).toMatch(/export\s+async\s+function\s+GET/);
  });

  it('deve usar performHealthCheck do lib/health-check', () => {
    const content = readFile('app/api/health/route.ts');
    expect(content).toContain('performHealthCheck');
  });

  it('deve retornar X-Robots-Tag noindex', () => {
    const content = readFile('app/api/health/route.ts');
    expect(content).toContain('X-Robots-Tag');
    expect(content).toContain('noindex');
  });

  it('não deve expor dados sensíveis (credenciais, tokens)', () => {
    const content = readFile('app/api/health/route.ts');
    expect(content).not.toMatch(/password|secret|token|DATABASE_URL/i);
  });

  it('deve retornar 503 quando unhealthy', () => {
    const content = readFile('app/api/health/route.ts');
    expect(content).toContain('503');
  });

  it('deve ser force-dynamic (sem cache)', () => {
    const content = readFile('app/api/health/route.ts');
    expect(content).toContain("force-dynamic");
  });
});

// ======================================================================
// PASSO 18: Workflow staging-smoke.yml
// ======================================================================
describe('Passo 18 — Workflow staging-smoke.yml', () => {
  it('deve existir .github/workflows/staging-smoke.yml', () => {
    expect(fileExists('.github/workflows/staging-smoke.yml')).toBe(true);
  });

  const smoke = readFile('.github/workflows/staging-smoke.yml');

  it('deve disparar após Deploy Staging', () => {
    expect(smoke).toContain('Deploy Staging');
    expect(smoke).toContain('workflow_run');
  });

  it('deve permitir dispatch manual', () => {
    expect(smoke).toContain('workflow_dispatch');
  });

  it('deve verificar /api/health (5a)', () => {
    expect(smoke).toContain('/api/health');
  });

  it('deve verificar login page (5b)', () => {
    expect(smoke).toContain('/login');
  });

  it('deve verificar endpoints protegidos retornam 401/403 (5b)', () => {
    expect(smoke).toContain('/api/admin/usuarios');
    expect(smoke).toContain('/api/rh/funcionarios');
  });

  it('deve verificar banner staging (5c)', () => {
    expect(smoke).toMatch(/staging/i);
  });

  it('deve gerar relatório de smoke tests', () => {
    expect(smoke).toContain('GITHUB_STEP_SUMMARY');
  });

  it('não deve ter secrets hardcoded', () => {
    expect(smoke).not.toMatch(/VERCEL_TOKEN\s*[:=]\s*["'][^$]/);
  });
});

// ======================================================================
// INTEGRIDADE: package.json scripts
// ======================================================================
describe('Integridade — Scripts no package.json', () => {
  const pkg = JSON.parse(readFile('package.json'));

  it('deve ter script test:api', () => {
    expect(pkg.scripts['test:api']).toBeDefined();
    expect(pkg.scripts['test:api']).toContain('__tests__/api');
  });

  it('deve ter script test:db', () => {
    expect(pkg.scripts['test:db']).toBeDefined();
    expect(pkg.scripts['test:db']).toContain('__tests__/db');
  });

  it('deve ter script test:unit existente', () => {
    expect(pkg.scripts['test:unit']).toBeDefined();
  });
});

// ======================================================================
// INTEGRIDADE: ci.yml quality-report inclui novos jobs
// ======================================================================
describe('Integridade — Quality report no ci.yml', () => {
  const ci = readFile('.github/workflows/ci.yml');

  it('quality-report deve incluir api-route-tests', () => {
    expect(ci).toContain('needs.api-route-tests.result');
  });

  it('quality-report deve incluir db-schema-tests', () => {
    expect(ci).toContain('needs.db-schema-tests.result');
  });
});
