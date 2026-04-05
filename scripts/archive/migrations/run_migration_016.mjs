import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, ".env.development") });

// Configuração do banco de dados
const isTest =
  process.env.NODE_ENV === "test" || !!process.env.TEST_DATABASE_URL;
const databaseUrl = isTest
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

// Segurança: evitar rodar migrações de teste contra o banco de desenvolvimento
if (process.env.NODE_ENV === "test") {
  if (!process.env.TEST_DATABASE_URL) {
    console.error(
      "❌ ERRO: Executando em NODE_ENV=test mas TEST_DATABASE_URL não está definido. Aborting to avoid modifying development DB."
    );
    process.exit(2);
  }
  try {
    const parsed = new URL(process.env.TEST_DATABASE_URL);
    const dbName = parsed.pathname.replace(/^\//, "");
    if (dbName === "nr-bps_db" || dbName === "nr-bps-db") {
      console.error(
        "❌ ERRO: TEST_DATABASE_URL aponta para o banco de desenvolvimento (nr-bps_db). Configure TEST_DATABASE_URL para apontar para um banco de testes (ex: nr-bps_db_test)."
      );
      process.exit(2);
    }
  } catch (err) {
    console.error("❌ ERRO ao analisar TEST_DATABASE_URL:", err.message || err);
    process.exit(2);
  }
}

// Proteção adicional: evitar rodar migração contra banco de desenvolvimento sem confirmação
try {
  const candidateUrl =
    databaseUrl || "postgresql://postgres:123456@localhost:5432/nr-bps_db";
  const parsed = new URL(candidateUrl);
  const dbName = parsed.pathname.replace(/^\//, "");
  const runningInDev = dbName === "nr-bps_db" || dbName === "nr-bps-db";
  if (runningInDev && !process.env.ALLOW_DEV_MIGRATION) {
    console.error(
      "❌ Segurança: O script detectou que a migração seria executada no banco de desenvolvimento (nr-bps_db)."
    );
    console.error(
      "Se você realmente deseja rodar a migração no banco de desenvolvimento, exporte ALLOW_DEV_MIGRATION=1 e execute novamente."
    );
    process.exit(2);
  }
} catch (err) {
  // se parsing falhar, ignorar; a validação principal está acima
}

let config;
if (databaseUrl) {
  // Parse DATABASE_URL
  const url = new URL(databaseUrl);
  config = {
    host: url.hostname,
    port: parseInt(url.port),
    database: url.pathname.slice(1), // Remove leading slash
    user: url.username,
    password: url.password,
  };
} else {
  // Fallback para configuração hardcoded
  config = {
    host: "localhost",
    port: 5432,
    database: isTest ? "nr-bps_db_test" : "nr-bps_db",
    user: "postgres",
    password: "123456", // Ou use process.env.POSTGRES_PASSWORD se configurado
  };
}

const { Client } = pg;

async function runMigration() {
  const client = new Client(config);

  try {
    console.log("🔌 Conectando ao banco de dados...");
    await client.connect();
    console.log("✅ Conectado com sucesso!\n");

    // Executar migration 016
    console.log("📝 Executando MIGRATION 016 - Campos de Índice...");
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, "database", "migration-016-indice-avaliacao.sql"),
      "utf8"
    );
    await client.query(migrationSQL);
    console.log("✅ MIGRATION 016 concluída!\n");

    // Executar functions 016
    console.log("⚙️  Executando FUNCTIONS 016 - Funções de Negócio...");
    const functionsSQL = fs.readFileSync(
      path.join(__dirname, "database", "functions-016-indice-avaliacao.sql"),
      "utf8"
    );
    await client.query(functionsSQL);
    console.log("✅ FUNCTIONS 016 concluídas!\n");

    // Verificar estrutura criada
    console.log("🔍 Verificando estrutura...\n");

    // Verificar campos em funcionarios
    const funcionariosResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'funcionarios'
      AND column_name IN ('indice_avaliacao', 'data_ultimo_lote')
      ORDER BY column_name
    `);
    console.log("📊 Campos adicionados em funcionarios:");
    console.table(funcionariosResult.rows);

    // Verificar campo em lotes_avaliacao
    const lotesResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'lotes_avaliacao'
      AND column_name = 'numero_ordem'
    `);
    console.log("\n📊 Campo adicionado em lotes_avaliacao:");
    console.table(lotesResult.rows);

    // Verificar funções criadas
    const functionsResult = await client.query(`
      SELECT proname as nome_funcao, pg_get_function_arguments(oid) as argumentos
      FROM pg_proc
      WHERE proname IN (
        'calcular_elegibilidade_lote',
        'verificar_inativacao_consecutiva',
        'detectar_anomalias_indice',
        'validar_lote_pre_laudo',
        'obter_proximo_numero_ordem'
      )
      ORDER BY proname
    `);
    console.log("\n⚙️  Funções PostgreSQL criadas:");
    console.table(functionsResult.rows);

    // Estatísticas
    const statsResult = await client.query(`
      SELECT 
        'Funcionários por índice' AS categoria,
        indice_avaliacao,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE ativo = true) AS ativos
      FROM funcionarios
      GROUP BY indice_avaliacao
      ORDER BY indice_avaliacao
    `);
    console.log("\n📈 Estatísticas de Índices de Avaliação:");
    console.table(statsResult.rows);

    console.log("\n🎉 MIGRATION 016 INSTALADA COM SUCESSO!");
    console.log("✅ Sistema de Índice de Avaliação está operacional");
    console.log("💡 Próximos passos: Executar as APIs e atualizar frontend\n");
  } catch (error) {
    console.error("❌ Erro durante migração:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log("🔌 Conexão fechada");
  }
}

// Executar migration
runMigration().catch(console.error);
