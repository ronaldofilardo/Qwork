// Verificar definição atual de audit_lote_change()
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env.production.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^DATABASE_URL=(.+)$/m);
    if (match) {
      DATABASE_URL = match[1].trim().replace(/["']/g, '');
    }
  }
}

async function verificar() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT pg_get_functiondef(oid) as def
      FROM pg_proc 
      WHERE proname = 'audit_lote_change';
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Função não encontrada!');
      return;
    }
    
    const def = result.rows[0].def;
    console.log('=== DEFINIÇÃO ATUAL DE audit_lote_change() ===\n');
    console.log(def);
    console.log('\n=== VERIFICAÇÃO processamento_em ===\n');
    
    const lines = def.split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes('processamento_em')) {
        console.log(`Linha ${idx + 1}: ${line.trim()}`);
      }
    });
    
  } catch (erro) {
    console.error('Erro:', erro.message);
  } finally {
    await client.end();
  }
}

verificar();
