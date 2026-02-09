#!/usr/bin/env node

/**
 * Script para corrigir o schema do banco de dados
 * Aplica correções necessárias para manter consistência
 */

import { config } from 'dotenv';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: '.env.local' });

async function fixDatabaseSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔧 Conectado ao banco de dados...');

    // Ler o arquivo SQL de correção
    const sqlPath = path.join(__dirname, 'fix-database-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Executar as correções
    await client.query(sql);

    console.log('✅ Schema do banco corrigido com sucesso!');
    console.log('📋 Correções aplicadas:');
    console.log(
      '   - Colunas adicionadas à tabela usuarios (email, senha_hash, atualizado_em)'
    );
    console.log('   - Coluna role renomeada para tipo_usuario');
    console.log('   - entidade_id da auditoria permite NULL');
    console.log('   - View v_tomadors_stats criada');
  } catch (error) {
    console.error('❌ Erro ao corrigir schema:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixDatabaseSchema();
