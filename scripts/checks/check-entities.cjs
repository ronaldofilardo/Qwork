const { query } = require('./lib/db');

async function checkEntities() {
  try {
    const result = await query(
      "SELECT id, nome, tipo FROM tomadores WHERE tipo = 'entidade' LIMIT 5"
    );
    console.log('Entidades encontradas:', result.rows);
  } catch (e) {
    console.error('Erro:', e.message);
  }
  process.exit(0);
}

checkEntities();
