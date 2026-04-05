/**
 * Script para aplicar migração 1000 - Reverter status_avaliacao para 'concluida'
 *
 * Aplica a migração que corrige o enum status_avaliacao no banco de testes
 */

require('dotenv').config({ path: '.env.test', override: true });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
  });

  try {
    console.log('🔄 Conectando ao banco de testes...');
    console.log(
      `📦 Banco: ${process.env.TEST_DATABASE_URL?.split('@')[1] || 'nr-bps_db_test'}`
    );

    // Ler arquivo de migração
    const migrationPath = path.join(
      __dirname,
      '../database/migrations/1000_reverter_status_avaliacao_para_concluida.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('\n📝 Aplicando migração 1000...\n');

    // Executar migração
    const result = await pool.query(migrationSQL);

    console.log('\n✅ Migração aplicada com sucesso!');
    console.log('\n📊 Verificando enum atualizado...');

    // Verificar enum
    const enumCheck = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = 'status_avaliacao'::regtype 
      ORDER BY enumlabel
    `);

    console.log('\n📋 Valores do enum status_avaliacao:');
    enumCheck.rows.forEach((row) => {
      const marker = row.enumlabel === 'concluida' ? '✓' : ' ';
      console.log(`  ${marker} ${row.enumlabel}`);
    });

    // Verificar dados
    const dataCheck = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM avaliacoes
      WHERE status IN ('concluida', 'concluido')
      GROUP BY status
    `);

    if (dataCheck.rows.length > 0) {
      console.log('\n📊 Status das avaliações:');
      dataCheck.rows.forEach((row) => {
        console.log(`  ${row.status}: ${row.count} avaliações`);
      });
    } else {
      console.log(
        '\n📊 Nenhuma avaliação com status concluída/concluído no banco'
      );
    }
  } catch (error) {
    console.error('\n❌ Erro ao aplicar migração:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Enum já pode estar no estado correto. Verificando...');

      const enumCheck = await pool.query(`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = 'status_avaliacao'::regtype 
        ORDER BY enumlabel
      `);

      console.log('\n📋 Valores atuais do enum:');
      enumCheck.rows.forEach((row) => console.log(`  - ${row.enumlabel}`));
    }
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
