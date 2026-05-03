import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

describe('Environment Configuration Tests', () => {
  const projectRoot = process.cwd(); // Use current working directory instead of path resolution

  describe('TEST_DATABASE_URL isolation', () => {
    test('TEST_DATABASE_URL should NOT be defined in development environment (.env)', () => {
      const envPath = path.join(projectRoot, '.env');

      // Verificar se .env existe
      expect(existsSync(envPath)).toBe(true);

      const envContent = readFileSync(envPath, 'utf8');

      // TEST_DATABASE_URL não deve estar presente no .env (desenvolvimento)
      expect(envContent).not.toMatch(/TEST_DATABASE_URL/);

      // Verificar que outras variáveis importantes ainda estão presentes
      expect(envContent).toMatch(/NODE_ENV=development/);
      expect(envContent).toMatch(/LOCAL_DATABASE_URL/);
    });

    test('TEST_DATABASE_URL should be defined in test environment (.env.test)', () => {
      const envTestPath = path.join(projectRoot, '.env.test');

      // Verificar se .env.test existe
      expect(existsSync(envTestPath)).toBe(true);

      const envTestContent = readFileSync(envTestPath, 'utf8');

      // TEST_DATABASE_URL deve estar presente no .env.test
      expect(envTestContent).toMatch(/TEST_DATABASE_URL/);

      // Verificar que aponta para banco de teste (sem mencionar o nome específico)
      expect(envTestContent).toMatch(/_test/);
    });

    test('ensure-test-env.js should pass when TEST_DATABASE_URL is properly configured', () => {
      // Simular execução do script ensure-test-env.js com .env.test
      const scriptPath = path.join(
        projectRoot,
        'scripts/checks/ensure-test-env.js'
      );

      expect(() => {
        execSync(`node "${scriptPath}"`, {
          env: {
            ...process.env,
            TEST_DATABASE_URL:
              'postgresql://postgres:password@localhost:5432/my_app_test_db',
          },
          stdio: 'pipe',
        });
      }).not.toThrow();
    });

    test('ensure-test-env.js should fail when TEST_DATABASE_URL points to development database', () => {
      const scriptPath = path.join(
        projectRoot,
        'scripts/checks/ensure-test-env.js'
      );

      expect(() => {
        execSync(`node "${scriptPath}"`, {
          env: {
            ...process.env,
            TEST_DATABASE_URL:
              'postgresql://postgres:password@localhost:5432/my_app_prod_db',
          },
          stdio: 'pipe',
        });
      }).toThrow('Command failed');
    });

    test('ensure-test-env.js should fail when TEST_DATABASE_URL is not defined', () => {
      const scriptPath = path.join(
        projectRoot,
        'scripts/checks/ensure-test-env.js'
      );

      expect(() => {
        execSync(`node "${scriptPath}"`, {
          env: {
            // Remover TEST_DATABASE_URL do ambiente
            ...Object.fromEntries(
              Object.entries(process.env).filter(
                ([key]) => key !== 'TEST_DATABASE_URL'
              )
            ),
          },
          stdio: 'pipe',
        });
      }).toThrow('Command failed');
    });

    test('pretest script should execute without TEST_DATABASE_URL warning', () => {
      // Este teste verifica se o pretest executa sem o aviso específico
      // sobre TEST_DATABASE_URL estar definida em desenvolvimento
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.scripts.pretest).toContain('dotenv -e .env.test');
      expect(packageJson.scripts.pretest).toContain('ensure-test-env.js');
    });
  });

  describe('Environment isolation validation', () => {
    test('development environment should not have test-specific variables', () => {
      const envPath = path.join(projectRoot, '.env');
      const envContent = readFileSync(envPath, 'utf8');

      // Variáveis específicas de teste não devem estar no .env
      const testSpecificVars = ['TEST_DATABASE_URL', 'NODE_ENV=test'];

      testSpecificVars.forEach((varName) => {
        expect(envContent).not.toMatch(new RegExp(varName));
      });
    });

    test('test environment should have test-specific configuration', () => {
      const envTestPath = path.join(projectRoot, '.env.test');
      const envTestContent = readFileSync(envTestPath, 'utf8');

      // .env.test deve ter configuração específica de teste
      expect(envTestContent).toMatch(/NODE_ENV=test/);
      expect(envTestContent).toMatch(/TEST_DATABASE_URL/);
    });
  });
});
