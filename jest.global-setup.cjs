/* Jest global setup: aplicador de migrations para TEST_DATABASE_URL */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

module.exports = async function globalSetup() {
  const dbUrl = process.env.TEST_DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      'TEST_DATABASE_URL não definida. Execute os testes com dotenv -e .env.test -- jest'
    );
  }

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
  } catch (connErr) {
    console.warn(
      '[jest globalSetup] Não foi possível conectar ao DB de testes:',
      connErr.message
    );

    // Se ativado, tentar levantar um container Postgres via Docker (opcional)
    if (process.env.ENABLE_TEST_DB_DOCKER === '1') {
      try {
        console.log(
          '[jest globalSetup] Tentando criar Postgres temporário via Docker (testcontainers)'
        );
        const { PostgreSqlContainer } = require('testcontainers');
        const pgContainer = await new PostgreSqlContainer('postgres:15')
          .withDatabase('nr-bps_db_test')
          .withUsername(process.env.TEST_DB_USER || 'postgres')
          .withPassword(process.env.TEST_DB_PASSWORD || 'postgres')
          .start();

        const host = pgContainer.getHost();
        const port = pgContainer.getPort();
        const username = pgContainer.getUsername();
        const password = pgContainer.getPassword();
        const dbName = pgContainer.getDatabase();

        const newDbUrl = `postgresql://${username}:${password}@${host}:${port}/${dbName}`;
        process.env.TEST_DATABASE_URL = newDbUrl;

        // Persist container id for teardown
        const infoPath = path.resolve(__dirname, '.test_container_info.json');
        require('fs').writeFileSync(
          infoPath,
          JSON.stringify({ containerId: pgContainer.getId() })
        );

        console.log(
          '[jest globalSetup] Test Postgres container started:',
          newDbUrl.replace(/:[^@]+@/, ':***@')
        );

        // Recreate client with new URL
        client = new Client({ connectionString: newDbUrl });
        await client.connect();
      } catch (dockerErr) {
        console.warn(
          '[jest globalSetup] Falha ao iniciar container Docker para DB de testes:',
          dockerErr.message || dockerErr
        );
        console.warn(
          '[jest globalSetup] Pulando aplicação de migrations e continuando (SKIP_TEST_DB_MIGRATIONS=1)'
        );
        process.env.SKIP_TEST_DB_MIGRATIONS = '1';
        return;
      }
    } else {
      console.warn(
        '[jest globalSetup] Pulando aplicação de migrations e continuando (SKIP_TEST_DB_MIGRATIONS=1)'
      );
      // Sinalizar para os scripts que o DB não está acessível
      process.env.SKIP_TEST_DB_MIGRATIONS = '1';
      return;
    }
  }

  try {
    // Segurança: garantir que estamos aplicando apenas no banco de testes
    // Permitir ignorar essa proteção localmente definindo ALLOW_JEST_ON_NON_TEST_DB=1
    if (
      !process.env.ALLOW_JEST_ON_NON_TEST_DB ||
      process.env.ALLOW_JEST_ON_NON_TEST_DB !== '1'
    ) {
      if (!/(__test|test)$/i.test(dbUrl)) {
        throw new Error(
          'Refusing to apply migrations on non-test database: ' + dbUrl
        );
      }
    } else {
      console.warn(
        '[jest globalSetup] ALLOW_JEST_ON_NON_TEST_DB=1 — ignorando proteção de banco de teste para execução local.'
      );
    }

    const migrationsDir = path.resolve(__dirname, 'database', 'migrations');
    const schemaFile = path.resolve(
      __dirname,
      'database',
      'schema-complete.sql'
    );

    // Verificar se o esquema base existe (checar por tabela crítica)
    const tblCheck = await client.query(
      "SELECT to_regclass('public.funcionarios') as exists"
    );
    if (!tblCheck.rows[0].exists) {
      // tentar aplicar schema-complete.sql se disponível
      if (fs.existsSync(schemaFile)) {
        try {
          console.log(
            '[jest globalSetup] Encontrado DB vazio: aplicando schema-complete.sql (one-time)'
          );
          const { execSync } = require('child_process');
          execSync(`psql "${dbUrl}" -f "${schemaFile}"`, {
            stdio: 'inherit',
            shell: true,
          });
          console.log('[jest globalSetup] schema-complete aplicado');
        } catch (err) {
          console.warn(
            '[jest globalSetup] Falha ao aplicar schema-complete:',
            err && err.message ? err.message : err
          );
        }
      }

      // Re-checar após tentar aplicar schema
      const tblCheck2 = await client.query(
        "SELECT to_regclass('public.funcionarios') as exists"
      );
      if (!tblCheck2.rows[0].exists) {
        throw new Error(
          'Test DB parece não estar inicializado (tabela "funcionarios" ausente). Rode `psql "$TEST_DATABASE_URL" -f database/schema-complete.sql` manualmente na sua máquina/CI antes de executar os testes.'
        );
      }
    }

    // Fast path: allow skipping heavy migrations in frequent local test runs
    if (
      process.env.SKIP_TEST_DB_MIGRATIONS === '1' ||
      process.env.SKIP_TEST_DB_MIGRATIONS === 'true'
    ) {
      console.log(
        '[jest globalSetup] SKIP_TEST_DB_MIGRATIONS detectado — pulando aplicação de migrations.'
      );
      // still ensure admin exists
      try {
        await client.query(
          `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo)
           VALUES ('00000000000', 'Admin', 'admin@bps.com.br', '$2a$10$1FmG9Rn0QJ9T78GbvS/Yf.AfR9tp9qTxBznhUWLwBhsP8BChtmSVW','admin', true)
           ON CONFLICT (cpf) DO UPDATE SET senha_hash = EXCLUDED.senha_hash;`
        );
        console.log('[jest globalSetup] ensured admin account (fast path)');
      } catch (e) {
        console.warn(
          '[jest globalSetup] could not ensure admin account (fast path):',
          e.message
        );
      }
      await client.end();
      console.log('[jest globalSetup] DB client closed (fast path)');
      return;
    }

    // If core post-migration tables exist, skip full migration application to speed up tests
    const coreCheck = await client.query(
      "SELECT to_regclass('public.contratantes_senhas') as cs, to_regclass('public.planos') as planos, to_regclass('public.contratacao_personalizada') as cp"
    );
    if (
      coreCheck.rows[0].cs &&
      coreCheck.rows[0].planos &&
      coreCheck.rows[0].cp &&
      !process.env.FORCE_REAPPLY_TEST_MIGRATIONS
    ) {
      console.log(
        '[jest globalSetup] Core migrations parecem aplicadas — pulando aplicação completa para acelerar testes. Set FORCE_REAPPLY_TEST_MIGRATIONS=1 para ignorar.'
      );
      try {
        await client.query(
          `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo)
           VALUES ('00000000000', 'Admin', 'admin@bps.com.br', '$2a$10$1FmG9Rn0QJ9T78GbvS/Yf.AfR9tp9qTxBznhUWLwBhsP8BChtmSVW','admin', true)
           ON CONFLICT (cpf) DO UPDATE SET senha_hash = EXCLUDED.senha_hash;`
        );
        console.log('[jest globalSetup] ensured admin account (core-check)');
      } catch (e) {
        console.warn(
          '[jest globalSetup] could not ensure admin account (core-check):',
          e.message
        );
      }
      await client.end();
      console.log('[jest globalSetup] DB client closed (core-check)');
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(
      `[jest globalSetup] Aplicando ${files.length} arquivos de migration em ${dbUrl}`
    );

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      try {
        // First attempt: use psql CLI which understands psql meta-commands and complex scripts
        const { execSync } = require('child_process');
        let appliedBy = null;
        try {
          execSync(`psql "${dbUrl}" -f "${fullPath}"`, {
            stdio: 'inherit',
            env: process.env,
            shell: true,
          });
          appliedBy = 'psql';
        } catch (cliErr) {
          // fallback to executing via pg client (useful when psql is not available)
          try {
            await client.query(sql);
            appliedBy = 'pg-client';
          } catch (err) {
            throw err;
          }
        }

        console.log(`[migrations] Applied ${file} (${appliedBy})`);
      } catch (err) {
        const msg = err && err.message ? err.message.toLowerCase() : '';
        const ignorable =
          msg.includes('already exists') ||
          msg.includes('duplicate') ||
          (msg.includes('constraint') && msg.includes('already exists')) ||
          (msg.includes('type') && msg.includes('already exists')) ||
          (msg.includes('column') && msg.includes('already exists')) ||
          (msg.includes('function') && msg.includes('already exists')) ||
          (msg.includes('relation') && msg.includes('already exists')) ||
          (msg.includes('trigger') && msg.includes('already exists'));

        if (ignorable) {
          console.log(
            `[migrations] Skipped (already applied): ${file} - ${err.message}`
          );
        } else {
          console.error(`[migrations] Error applying ${file}:`, err);
          throw err;
        }
      }
    }

    // Garantir admin (fallback seguro para dev/test)
    try {
      await client.query(
        `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo)
         VALUES ('00000000000', 'Admin', 'admin@bps.com.br', '$2a$10$1FmG9Rn0QJ9T78GbvS/Yf.AfR9tp9qTxBznhUWLwBhsP8BChtmSVW','admin', true)
         ON CONFLICT (cpf) DO UPDATE SET senha_hash = EXCLUDED.senha_hash;`
      );
      console.log('[jest globalSetup] ensured admin account');
    } catch (e) {
      console.warn(
        '[jest globalSetup] could not ensure admin account:',
        e.message
      );
    }
  } finally {
    await client.end();
    console.log('[jest globalSetup] DB client closed');
  }
};
