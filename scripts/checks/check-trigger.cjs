const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function checkTrigger() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    console.log('=== VERIFICANDO TRIGGER E FUNÇÃO ===');

    // Verificar se o trigger existe
    const trigger = await client.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE trigger_name = 'trg_sync_contratante_plano_tipo'
    `);

    if (trigger.rows.length > 0) {
      console.log('Trigger encontrado:', trigger.rows[0]);
    } else {
      console.log('Trigger NÃO encontrado');
    }

    // Verificar função
    const func = await client.query(`
      SELECT proname, prosrc
      FROM pg_proc
      WHERE proname = 'sync_contratante_plano_tipo'
    `);

    if (func.rows.length > 0) {
      console.log('Função encontrada');
      console.log('Código da função:');
      console.log(func.rows[0].prosrc);
    } else {
      console.log('Função NÃO encontrada');
    }

    await client.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await client.end();
  }
}

checkTrigger();
