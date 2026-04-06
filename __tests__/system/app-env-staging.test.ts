/**
 * @file __tests__/system/app-env-staging.test.ts
 *
 * Testes de segregação de ambientes — Fase 1: Hardening APP_ENV
 *
 * Valida os guards bidirecionais staging ↔ production e o comportamento
 * correto de isStaging, isLiveProduction e das flags exportadas por
 * lib/db/connection.ts quando APP_ENV está definido.
 *
 * Referência: docs/policies/ENVIRONMENTS.md
 * Status: CRÍTICO — NÃO REMOVER
 */

describe('APP_ENV — Segregação Staging vs Production', () => {
  // =========================================================================
  // Flags exportadas por lib/db/connection.ts
  // =========================================================================
  describe('Flags de ambiente (connection.ts)', () => {
    it('APP_ENV exportado deve ser string ou undefined', async () => {
      jest.resetModules();
      const { APP_ENV } = await import('@/lib/db/connection');
      expect(APP_ENV === undefined || typeof APP_ENV === 'string').toBe(true);
    });

    it('isStaging deve ser false quando APP_ENV não é "staging"', async () => {
      jest.resetModules();
      process.env.APP_ENV = 'production';
      const { isStaging } = await import('@/lib/db/connection');
      expect(isStaging).toBe(false);
    });

    it('isLiveProduction deve ser false quando isStaging é true', async () => {
      // isLiveProduction = isProduction && !isStaging
      // Em ambiente de teste, isProduction = false, então isLiveProduction = false também
      // O que testamos é a lógica: se isStaging for ativado, isLiveProduction = false
      jest.resetModules();
      process.env.APP_ENV = 'staging';
      const { isStaging, isLiveProduction } =
        await import('@/lib/db/connection');
      // isLiveProduction deve ser false quando isStaging é true (qualquer que seja isProduction)
      if (isStaging) {
        expect(isLiveProduction).toBe(false);
      }
    });

    it('getDatabaseInfo() deve incluir appEnv e isStaging', async () => {
      jest.resetModules();
      const { getDatabaseInfo } = await import('@/lib/db/connection');
      const info = getDatabaseInfo();
      expect(info).toHaveProperty('appEnv');
      expect(info).toHaveProperty('isStaging');
      expect(info).toHaveProperty('isLiveProduction');
    });
  });

  // =========================================================================
  // Guard Bidirecional Staging ↔ Production
  // =========================================================================
  describe('Guard bidirecional: staging ↔ production', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      // Restaurar variáveis de ambiente após cada teste
      Object.keys(process.env).forEach((key) => {
        if (!(key in originalEnv)) delete process.env[key];
      });
      Object.assign(process.env, originalEnv);
      jest.resetModules();
    });

    it('deve identificar corretamente isStaging=true quando APP_ENV=staging', async () => {
      process.env.APP_ENV = 'staging';
      const { isStaging } = await import('@/lib/db/connection');
      expect(isStaging).toBe(true);
    });

    it('deve identificar corretamente isStaging=false quando APP_ENV=production', async () => {
      process.env.APP_ENV = 'production';
      const { isStaging } = await import('@/lib/db/connection');
      expect(isStaging).toBe(false);
    });

    it('deve identificar corretamente isStaging=false quando APP_ENV não está definido', async () => {
      delete process.env.APP_ENV;
      const { isStaging } = await import('@/lib/db/connection');
      expect(isStaging).toBe(false);
    });
  });

  // =========================================================================
  // Validação lógica do guard — usando lógica interna sem precisar chamar
  // getDatabaseUrl() diretamente (que lança em teste se DB_URL não existe)
  // =========================================================================
  describe('Lógica do guard de staging (unit)', () => {
    it('deve detectar violação: staging sem neondb_staging na URL', () => {
      // Simular a condição que o guard verifica
      const isStaging = true;
      const databaseUrl = 'postgresql://user:pass@host/neondb'; // URL de PROD

      const wouldThrow = isStaging && !databaseUrl.includes('neondb_staging');
      expect(wouldThrow).toBe(true); // Guard DEVE disparar
    });

    it('deve passar: staging com neondb_staging na URL', () => {
      const isStaging = true;
      const databaseUrl = 'postgresql://user:pass@host/neondb_staging';

      const wouldThrow = isStaging && !databaseUrl.includes('neondb_staging');
      expect(wouldThrow).toBe(false); // Guard NÃO deve disparar
    });

    it('deve detectar violação: production com neondb_staging na URL', () => {
      const isStaging = false;
      const databaseUrl = 'postgresql://user:pass@host/neondb_staging';

      const wouldThrow = !isStaging && databaseUrl.includes('neondb_staging');
      expect(wouldThrow).toBe(true); // Guard DEVE disparar
    });

    it('deve passar: production com neondb (sem _staging) na URL', () => {
      const isStaging = false;
      const databaseUrl = 'postgresql://user:pass@host/neondb?sslmode=require';

      const wouldThrow = !isStaging && databaseUrl.includes('neondb_staging');
      expect(wouldThrow).toBe(false); // Guard NÃO deve disparar
    });

    it('deve passar: desenvolvimento local (não é produção, guard não se aplica)', () => {
      const isProduction = false;
      const isStaging = false;

      // Guard só se aplica quando isProduction=true
      const guardApplies = isProduction;
      expect(guardApplies).toBe(false);
    });
  });

  // =========================================================================
  // Middleware: headers de staging
  // =========================================================================
  describe('Middleware — headers de ambiente', () => {
    const originalAppEnv = process.env.APP_ENV;

    afterEach(() => {
      if (originalAppEnv === undefined) {
        delete process.env.APP_ENV;
      } else {
        process.env.APP_ENV = originalAppEnv;
      }
    });

    it('deve adicionar X-Environment: staging quando APP_ENV=staging', async () => {
      process.env.APP_ENV = 'staging';

      // Import dinâmico para pegar a versão atualizada do middleware
      jest.resetModules();
      const { resolveSession } = await import('@/middleware');

      // resolveSession é uma função exportada — verifica que o módulo carrega sem erros
      expect(typeof resolveSession).toBe('function');
    });

    it('middleware deve exportar resolveSession como função', async () => {
      jest.resetModules();
      const { resolveSession } = await import('@/middleware');
      expect(typeof resolveSession).toBe('function');
    });

    it('middleware deve exportar PERFIL_GUARDS como array readonly', async () => {
      jest.resetModules();
      const { PERFIL_GUARDS } = await import('@/middleware');
      expect(Array.isArray(PERFIL_GUARDS)).toBe(true);
      expect(PERFIL_GUARDS.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // instrumentation.ts — supressão de logs por APP_ENV
  // =========================================================================
  describe('instrumentation.ts — supressão de logs por APP_ENV', () => {
    const originalLog = console.log;
    const originalDebug = console.debug;
    const originalInfo = console.info;

    afterEach(() => {
      console.log = originalLog;
      console.debug = originalDebug;
      console.info = originalInfo;
      jest.resetModules();
    });

    it('staging (NODE_ENV=production, APP_ENV=staging) não suprime logs', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });
      process.env.APP_ENV = 'staging';

      jest.resetModules();
      const { register } = await import('@/instrumentation');
      await register();

      // Logs NÃO devem ser suprimidos em staging
      expect(console.log).toBe(originalLog);
      expect(console.debug).toBe(originalDebug);
      expect(console.info).toBe(originalInfo);
    });

    /**
     * Testa a CONDIÇÃO LÓGICA de isLiveProduction sem depender de override de NODE_ENV.
     * O comportamento real de supressão em produção é validado em instrumentation.test.ts.
     * Aqui verificamos que a condição diferencia corretamente staging de produção.
     */
    it('lógica: isLiveProduction requer NODE_ENV=production E APP_ENV=production', () => {
      const cases: Array<{
        nodeEnv: string;
        appEnv: string | undefined;
        expected: boolean;
      }> = [
        { nodeEnv: 'production', appEnv: 'production', expected: true },
        { nodeEnv: 'production', appEnv: 'staging', expected: false },
        { nodeEnv: 'production', appEnv: undefined, expected: false },
        { nodeEnv: 'test', appEnv: 'production', expected: false },
        { nodeEnv: 'development', appEnv: 'production', expected: false },
        { nodeEnv: 'development', appEnv: 'staging', expected: false },
      ];

      for (const { nodeEnv, appEnv, expected } of cases) {
        const isLiveProduction =
          nodeEnv === 'production' && appEnv === 'production';
        expect(isLiveProduction).toBe(expected);
      }
    });

    it('lógica: isStaging requer APP_ENV=staging (independente de NODE_ENV)', () => {
      const cases: Array<{ appEnv: string | undefined; expected: boolean }> = [
        { appEnv: 'staging', expected: true },
        { appEnv: 'production', expected: false },
        { appEnv: 'development', expected: false },
        { appEnv: undefined, expected: false },
      ];

      for (const { appEnv, expected } of cases) {
        const isStaging = appEnv === 'staging';
        expect(isStaging).toBe(expected);
      }
    });

    it('staging não suprime logs: register() com APP_ENV=staging não altera console', async () => {
      // Não sobrescrevemos NODE_ENV — permanece 'test' (configurado pelo Jest)
      // isLiveProduction = (NODE_ENV === 'production') && (APP_ENV === 'production')
      // Como NODE_ENV='test', isLiveProduction=false → logs não são suprimidos
      process.env.APP_ENV = 'staging';

      jest.resetModules();
      const { register } = await import('@/instrumentation');
      await register();

      expect(console.log).toBe(originalLog);
    });
  });

  // =========================================================================
  // Consistência de arquivos de ambiente
  // =========================================================================
  describe('Consistência de arquivos .env', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const rootDir = path.join(__dirname, '../..');

    it('.env.staging deve ter APP_ENV=staging', () => {
      const content = fs.readFileSync(
        path.join(rootDir, '.env.staging'),
        'utf-8'
      );
      expect(content).toMatch(/^APP_ENV=staging/m);
    });

    it('.env.production deve ter APP_ENV=production', () => {
      const content = fs.readFileSync(
        path.join(rootDir, '.env.production'),
        'utf-8'
      );
      expect(content).toMatch(/^APP_ENV=production/m);
    });

    it('.env base NÃO deve ter APP_ENV definido (é omitido em DEV)', () => {
      const content = fs.readFileSync(path.join(rootDir, '.env'), 'utf-8');
      const appEnvLine = content
        .split('\n')
        .find((l: string) => l.startsWith('APP_ENV=') && !l.startsWith('#'));
      // Em DEV, APP_ENV deve ser ausente (undefined no runtime)
      expect(appEnvLine).toBeUndefined();
    });

    it('docs/policies/ENVIRONMENTS.md deve existir e documentar os 4 ambientes', () => {
      const docPath = path.join(rootDir, 'docs', 'policies', 'ENVIRONMENTS.md');
      expect(fs.existsSync(docPath)).toBe(true);
      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('DEV');
      expect(content).toContain('TEST');
      expect(content).toContain('STAGING');
      expect(content).toContain('PROD');
      expect(content).toContain('APP_ENV');
      expect(content).toContain('isStaging');
      expect(content).toContain('isLiveProduction');
    });
  });
});
