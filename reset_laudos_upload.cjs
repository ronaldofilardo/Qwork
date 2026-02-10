#!/usr/bin/env node
/**
 * Reset laudos 1005 e 1007 - Remove metadados de arquivo remoto
 * Mantém hash_pdf e status='emitido' mas remove arquivo_remoto_* para forçar upload manual
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
const envFiles = ['.env.production.local', '.env.local', '.env'];
for (const file of envFiles) {
  const envPath = path.join(__dirname, file);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : undefined,
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

async function resetLaudos() {
  try {
    console.log('🔄 Resetando laudos 1005 e 1007...\n');

    // Mostrar estado atual
    console.log('📊 Estado ANTES do reset:');
    const before = await query(
      `SELECT 
        id,
        lote_id,
        status,
        LEFT(hash_pdf, 16) as hash_inicio,
        emitido_em,
        arquivo_remoto_key,
        arquivo_remoto_url IS NOT NULL as tem_url
      FROM laudos
      WHERE id IN (1005, 1007)
      ORDER BY id`
    );
    console.table(before.rows);

    // Executar reset
    const result = await query(
      `UPDATE laudos
       SET 
         arquivo_remoto_provider = NULL,
         arquivo_remoto_bucket = NULL,
         arquivo_remoto_key = NULL,
         arquivo_remoto_url = NULL,
         arquivo_remoto_uploaded_at = NULL,
         arquivo_remoto_size = NULL,
         atualizado_em = NOW()
       WHERE id IN (1005, 1007)
         AND status = 'emitido'
       RETURNING id, lote_id, status`
    );

    console.log(`\n✅ ${result.rowCount} laudos resetados\n`);

    // Mostrar estado após reset
    console.log('📊 Estado DEPOIS do reset:');
    const after = await query(
      `SELECT 
        id,
        lote_id,
        status,
        LEFT(hash_pdf, 16) as hash_inicio,
        emitido_em,
        arquivo_remoto_key,
        arquivo_remoto_url IS NOT NULL as tem_url,
        atualizado_em
      FROM laudos
      WHERE id IN (1005, 1007)
      ORDER BY id`
    );
    console.table(after.rows);

    console.log('\n✅ Reset concluído!');
    console.log('💡 Os emissores devem agora usar POST /api/emissor/laudos/[loteId]/upload para enviar os PDFs ao bucket');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao resetar laudos:', error);
    await pool.end();
    process.exit(1);
  }
}

resetLaudos();
