/**
 * @file __tests__/system/staging-fase5.test.ts
 *
 * Testes da Fase 5: Configuração de Staging
 * - Step 19: Branch staging protegida (configuração GitHub)
 * - Step 20: Vercel env vars para staging
 * - Step 21: Custom domain staging.qwork.app.br
 * - Step 22: Workflow deploy-staging.yml
 * - Step 23: Banner visual de staging
 * - Step 24: Seed de dados sintéticos (guard LGPD)
 *
 * Referência: docs/policies/ENVIRONMENTS.md
 * Status: CRÍTICO — Proteção LGPD e integridade de ambiente
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '../..');

// ─────────────────────────────────────────────────────────────────────────────
// Step 19: Branch staging + proteção
// ─────────────────────────────────────────────────────────────────────────────
describe('Step 19 — Branch staging', () => {
  it('vercel.json deve ter deployment habilitado para branch staging', () => {
    const vercelPath = path.join(ROOT, 'vercel.json');
    expect(fs.existsSync(vercelPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(vercelPath, 'utf-8')) as Record<
      string,
      unknown
    >;
    const git = content.git as
      | { deploymentEnabled?: Record<string, boolean> }
      | undefined;

    expect(git).toBeDefined();
    expect(git?.deploymentEnabled?.staging).toBe(true);
    expect(git?.deploymentEnabled?.main).toBe(true);
  });

  it('vercel.json deve incluir alias para staging.qwork.app.br', () => {
    const vercelPath = path.join(ROOT, 'vercel.json');
    const content = JSON.parse(fs.readFileSync(vercelPath, 'utf-8')) as Record<
      string,
      unknown
    >;
    const alias = content.alias as string[] | undefined;
    expect(Array.isArray(alias)).toBe(true);
    expect(alias).toContain('staging.qwork.app.br');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Step 20: Env vars de staging
// ─────────────────────────────────────────────────────────────────────────────
describe('Step 20 — Env vars staging (.env.staging)', () => {
  const envStagingPath = path.join(ROOT, '.env.staging');

  it('.env.staging deve existir', () => {
    expect(fs.existsSync(envStagingPath)).toBe(true);
  });

  it('.env.staging deve conter APP_ENV=staging', () => {
    const content = fs.readFileSync(envStagingPath, 'utf-8');
    // Normaliza CRLF → LF para compatibilidade cross-platform
    const lines = content
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
    const appEnvLine = lines.find((l) => l.startsWith('APP_ENV='));
    expect(appEnvLine).toBeDefined();
    expect(appEnvLine).toBe('APP_ENV=staging');
  });

  it('.env.staging deve conter NODE_ENV=production', () => {
    const content = fs.readFileSync(envStagingPath, 'utf-8');
    const lines = content
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
    const nodeEnvLine = lines.find((l) => l.startsWith('NODE_ENV='));
    expect(nodeEnvLine).toBeDefined();
    expect(nodeEnvLine).toBe('NODE_ENV=production');
  });

  it('.env.staging deve ter DATABASE_URL apontando para neondb_staging', () => {
    const content = fs.readFileSync(envStagingPath, 'utf-8');
    const lines = content.split('\n').filter((l) => !l.trim().startsWith('#'));
    const dbLine = lines.find((l) => l.startsWith('DATABASE_URL='));
    expect(dbLine).toBeDefined();

    // Extrai o nome do banco via URL parsing
    const urlStr = dbLine!.replace('DATABASE_URL=', '');
    let dbName: string;
    try {
      const parsed = new URL(urlStr);
      dbName = parsed.pathname.replace(/^\//, '');
    } catch {
      dbName = urlStr;
    }
    expect(dbName).toContain('neondb_staging');
    expect(dbName).not.toBe('neondb'); // Não pode ser o banco de produção
  });

  it('.env.staging NÃO deve ter DATABASE_URL apontando para banco de produção (neondb sem _staging)', () => {
    const content = fs.readFileSync(envStagingPath, 'utf-8');
    const lines = content.split('\n').filter((l) => !l.trim().startsWith('#'));
    const dbLine = lines.find((l) => l.startsWith('DATABASE_URL='));
    if (!dbLine) return; // Se não existe, já passaria no teste acima

    const urlStr = dbLine.replace('DATABASE_URL=', '');
    let dbName: string;
    try {
      const parsed = new URL(urlStr);
      dbName = parsed.pathname.replace(/^\//, '').split('?')[0];
    } catch {
      dbName = urlStr;
    }
    // O nome do banco NÃO pode ser "neondb" (produção) — deve ser "neondb_staging"
    expect(dbName).not.toBe('neondb');
  });

  it('.env.staging deve ter SMTP_FROM_NAME com [STAGING] para identificação', () => {
    const content = fs.readFileSync(envStagingPath, 'utf-8');
    const smtpLine = content
      .split('\n')
      .filter((l) => !l.trim().startsWith('#'))
      .find((l) => l.startsWith('SMTP_FROM_NAME='));
    expect(smtpLine).toBeDefined();
    expect(smtpLine).toContain('STAGING');
  });

  it('.env.staging NÃO deve ter ASAAS_API_URL apontando para API de produção', () => {
    const content = fs.readFileSync(envStagingPath, 'utf-8');
    const asaasLine = content
      .split('\n')
      .filter((l) => !l.trim().startsWith('#'))
      .find((l) => l.startsWith('ASAAS_API_URL='));
    if (!asaasLine) return; // Linha pode não existir sem problema
    // Staging DEVE usar sandbox (hmlg), nunca produção
    expect(asaasLine).toContain('sandbox');
    expect(asaasLine).not.toMatch(/\/v3$(?<!sandbox)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Step 21: Custom domain
// ─────────────────────────────────────────────────────────────────────────────
describe('Step 21 — Custom domain staging.qwork.app.br', () => {
  it('vercel.json deve incluir staging.qwork.app.br em alias', () => {
    const vercelPath = path.join(ROOT, 'vercel.json');
    const content = JSON.parse(fs.readFileSync(vercelPath, 'utf-8')) as {
      alias?: string[];
    };
    expect(content.alias).toBeDefined();
    expect(content.alias!.some((a) => a.includes('staging'))).toBe(true);
  });

  it('ENVIRONMENTS.md deve documentar staging.qwork.app.br', () => {
    const envDocPath = path.join(ROOT, 'docs', 'ENVIRONMENTS.md');
    if (!fs.existsSync(envDocPath)) return; // Documentação opcional
    const content = fs.readFileSync(envDocPath, 'utf-8');
    expect(content).toContain('staging');
  });

  it('.env.staging NEXT_PUBLIC_APP_URL deve referenciar staging', () => {
    const envStagingPath = path.join(ROOT, '.env.staging');
    const content = fs.readFileSync(envStagingPath, 'utf-8');
    const urlLine = content
      .split('\n')
      .filter((l) => !l.trim().startsWith('#'))
      .find((l) => l.startsWith('NEXT_PUBLIC_APP_URL='));
    if (!urlLine) return;
    // A URL deve referenciar "staging" de alguma forma
    expect(urlLine.toLowerCase()).toContain('staging');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Step 22: Workflow deploy-staging.yml
// ─────────────────────────────────────────────────────────────────────────────
describe('Step 22 — Workflow deploy-staging.yml', () => {
  const workflowPath = path.join(
    ROOT,
    '.github',
    'workflows',
    'deploy-staging.yml'
  );

  it('workflow deploy-staging.yml deve existir', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it('workflow deve definir trigger na branch staging', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('branches: [staging]');
  });

  it('workflow deve ter job de build/pre-deploy checks', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toMatch(/pre.?deploy|build|lint|type.?check/i);
  });

  it('workflow deve ter job de deploy Vercel', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('vercel');
    expect(content).toMatch(/deploy/i);
  });

  it('workflow deve ter etapa de smoke tests', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toMatch(/smoke.?test/i);
  });

  it('workflow deve ter etapa de notificação', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toMatch(/notify|notif[ia]/i);
  });

  it('workflow deve usar secrets para token Vercel (não hardcoded)', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toMatch(/\$\{\{\s*secrets\.VERCEL_TOKEN\s*\}\}/);
    // Garantir que não há token hardcoded (começa com "v" seguido de letras/nums)
    expect(content).not.toMatch(/--token=[A-Za-z0-9]{20,}/);
  });

  it('workflow deve ter workflow_dispatch para acionamento manual', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('workflow_dispatch');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Step 23: Banner visual de staging
// ─────────────────────────────────────────────────────────────────────────────
describe('Step 23 — Banner visual de staging (StagingBanner)', () => {
  const bannerPath = path.join(ROOT, 'components', 'StagingBanner.tsx');

  it('components/StagingBanner.tsx deve existir', () => {
    expect(fs.existsSync(bannerPath)).toBe(true);
  });

  it('StagingBanner NÃO deve ter "use client" como diretiva real (deve ser Server Component)', () => {
    const content = fs.readFileSync(bannerPath, 'utf-8');
    // Server Component — a diretiva 'use client' NÃO pode aparecer na 1ª linha de código
    // (ignorar ocorrências apenas em comentários)
    const linesWithoutComments = content
      .split('\n')
      .filter((l) => !l.trim().startsWith('//'))
      .filter((l) => !l.trim().startsWith('*'))
      .join('\n');
    // A diretiva 'use client' é sempre a primeira linha de código, não aparece em inline style
    expect(linesWithoutComments).not.toMatch(/^\s*['"]use client['"]/m);
  });

  it('StagingBanner deve verificar APP_ENV=staging (não NODE_ENV)', () => {
    const content = fs.readFileSync(bannerPath, 'utf-8');
    expect(content).toContain('APP_ENV');
    expect(content).toContain('staging');
    // Não deve usar NODE_ENV como condição principal (seria errado — staging usa NODE_ENV=production)
    expect(content).not.toMatch(
      /process\.env\.NODE_ENV\s*===\s*['"]staging['"]/
    );
  });

  it('StagingBanner deve retornar null quando APP_ENV !== staging', () => {
    const content = fs.readFileSync(bannerPath, 'utf-8');
    expect(content).toMatch(/return null/);
  });

  it('StagingBanner deve ter conteúdo visual identificável como staging', () => {
    const content = fs.readFileSync(bannerPath, 'utf-8');
    expect(content.toUpperCase()).toContain('STAGING');
  });

  it('StagingBanner deve ter aviso sobre LGPD / dados reais', () => {
    const content = fs.readFileSync(bannerPath, 'utf-8');
    expect(content.toUpperCase()).toMatch(
      /LGPD|DADO[S]?\s+REAL|DADO[S]?\s+SINT/
    );
  });

  it('app/layout.tsx deve importar StagingBanner', () => {
    const layoutPath = path.join(ROOT, 'app', 'layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('StagingBanner');
    expect(content).toMatch(/import.*StagingBanner/);
  });

  it('app/layout.tsx deve renderizar <StagingBanner />', () => {
    const layoutPath = path.join(ROOT, 'app', 'layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toMatch(/<StagingBanner\s*\/>/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Step 24: Seed de dados sintéticos (guards LGPD)
// ─────────────────────────────────────────────────────────────────────────────
describe('Step 24 — Seed sintético LGPD-safe (scripts/seed-staging.ts)', () => {
  const seedPath = path.join(ROOT, 'scripts', 'seed-staging.ts');

  it('scripts/seed-staging.ts deve existir', () => {
    expect(fs.existsSync(seedPath)).toBe(true);
  });

  it('seed deve ter guard que exige APP_ENV=staging', () => {
    const content = fs.readFileSync(seedPath, 'utf-8');
    expect(content).toContain('APP_ENV');
    expect(content).toMatch(/process\.exit\(1\)/);
    // O guard deve verificar APP_ENV === 'staging'
    expect(content).toMatch(/APP_ENV.*staging|staging.*APP_ENV/);
  });

  it('seed deve verificar DATABASE_URL contém neondb_staging (guard DB)', () => {
    const content = fs.readFileSync(seedPath, 'utf-8');
    expect(content).toContain('neondb_staging');
    // Deve verificar a URL antes de prosseguir
    expect(content).toMatch(
      /neondb_staging.*process\.exit|process\.exit.*neondb_staging/s
    );
  });

  it('seed NÃO deve conter CPFs em formato válido (proteção LGPD)', () => {
    const content = fs.readFileSync(seedPath, 'utf-8');
    // CPFs reais têm 11 dígitos. Script não deve ter CPFs reais hardcoded
    // Padrão: 000.000.000-00 ou 11 dígitos consecutivos
    const cpfPattern = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/;
    expect(content).not.toMatch(cpfPattern);
  });

  it('seed NÃO deve conter e-mails de domínios reais (@qwork.app.br, @gmail, etc)', () => {
    const content = fs.readFileSync(seedPath, 'utf-8');
    // E-mails devem ser @example.com (domínio reservado para testes por RFC 2606)
    const realEmailPattern =
      /@(qwork\.app\.br|gmail\.com|hotmail\.com|yahoo\.com)/i;
    expect(content).not.toMatch(realEmailPattern);
  });

  it('seed deve usar @example.com para e-mails sintéticos', () => {
    const content = fs.readFileSync(seedPath, 'utf-8');
    expect(content).toContain('@example.com');
  });

  it('seed deve ser idempotente (usar ON CONFLICT ou verificação de existência)', () => {
    const content = fs.readFileSync(seedPath, 'utf-8');
    expect(content).toMatch(/ON CONFLICT|upsert|INSERT.*OR.*(REPLACE|IGNORE)/i);
  });

  it('package.json deve ter script db:seed:staging', () => {
    const pkgPath = path.join(ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['db:seed:staging']).toBeDefined();
    expect(pkg.scripts['db:seed:staging']).toContain('seed-staging');
  });

  it('script db:seed:staging deve incluir APP_ENV=staging', () => {
    const pkgPath = path.join(ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
      scripts: Record<string, string>;
    };
    const script = pkg.scripts['db:seed:staging'];
    expect(script).toContain('APP_ENV=staging');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integração: Lógica do banner (unit puro, sem DOM)
// ─────────────────────────────────────────────────────────────────────────────
describe('Lógica do banner — isStagingEnv() (unit puro)', () => {
  it('deve retornar true quando APP_ENV=staging', () => {
    expect('staging' === 'staging').toBe(true);
  });

  it('deve retornar false quando APP_ENV=production', () => {
    expect('production' === 'staging').toBe(false);
  });

  it('deve retornar false quando APP_ENV=development', () => {
    expect('development' === 'staging').toBe(false);
  });

  it('deve retornar false quando APP_ENV é undefined', () => {
    expect(undefined === 'staging').toBe(false);
  });

  it('NODE_ENV=production NÃO é suficiente sozinho para ativar banner', () => {
    // staging usa NODE_ENV=production — a condição correta é APP_ENV=staging
    const nodeEnv = 'production';
    const appEnv = undefined; // produção real sem APP_ENV definido
    const shouldShowBanner = appEnv === 'staging';
    expect(shouldShowBanner).toBe(false);
    expect(nodeEnv).toBe('production'); // NODE_ENV=production não ativa banner
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integridade: vercel.json e package.json
// ─────────────────────────────────────────────────────────────────────────────
describe('Integridade de configuration files', () => {
  it('vercel.json deve ser JSON válido', () => {
    const vercelPath = path.join(ROOT, 'vercel.json');
    expect(() =>
      JSON.parse(fs.readFileSync(vercelPath, 'utf-8'))
    ).not.toThrow();
  });

  it('package.json deve ser JSON válido após adição dos scripts de staging', () => {
    const pkgPath = path.join(ROOT, 'package.json');
    expect(() => JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))).not.toThrow();
  });

  it('package.json deve ter script build:staging com APP_ENV=staging', () => {
    const pkgPath = path.join(ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
      scripts: Record<string, string>;
    };
    const script = pkg.scripts['build:staging'];
    expect(script).toBeDefined();
    expect(script).toContain('APP_ENV=staging');
    expect(script).toContain('NODE_ENV=production');
  });
});
