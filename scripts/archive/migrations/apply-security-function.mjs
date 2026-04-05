/**
 * Script para criar função validar_sessao_rls() no banco de produção
 * Executa o SQL necessário para adicionar a função de validação RLS
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
require('./load-env.cjs').loadEnv();

const { Pool } = pg;

async function applySecurityFunction() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔗 Conectando ao banco de dados...');
    const client = await pool.connect();

    console.log('📖 Lendo script SQL...');
    const sqlScript = readFileSync(
      join(__dirname, 'create-validar-sessao-rls-function.sql'),
      'utf-8'
    );

    console.log('⚙️  Executando script...');
    const result = await client.query(sqlScript);

    console.log('✅ Função validar_sessao_rls() criada com sucesso!');
    console.log('\n📊 Verificação:');

    // Verificar se a função foi criada
    const checkResult = await client.query(`
      SELECT 
        proname as function_name,
        pg_get_function_result(oid) as return_type,
        pg_get_function_arguments(oid) as arguments
      FROM pg_proc 
      WHERE proname = 'validar_sessao_rls'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✓ Função encontrada no banco:');
      console.log(checkResult.rows[0]);
    } else {
      console.log('⚠️  Função não encontrada após criação');
    }

    client.release();
  } catch (error) {
    console.error('❌ Erro ao aplicar função:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

applySecurityFunction()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script falhou:', err);
    process.exit(1);
  });
