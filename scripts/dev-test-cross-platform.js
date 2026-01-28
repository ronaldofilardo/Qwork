#!/usr/bin/env node

// Script cross-platform para iniciar servidor em modo teste
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';

const envVars = isWindows
  ? 'set NODE_ENV=test&& set TEST_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db_test&&'
  : 'NODE_ENV=test TEST_DATABASE_URL=postgresql://postgres:123456@localhost:5432/nr-bps_db_test';

const command = isWindows ? `${envVars} pnpm dev` : `${envVars} pnpm dev`;

console.log('🚀 Iniciando servidor em modo teste...');
console.log(
  `📊 Database: postgresql://postgres:123456@localhost:5432/nr-bps_db_test`
);
console.log(`🌍 NODE_ENV: test`);

try {
  execSync(command, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    shell: true,
  });
} catch (error) {
  console.error('❌ Erro ao iniciar servidor:', error.message);
  process.exit(1);
}
