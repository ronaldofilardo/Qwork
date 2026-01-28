import { query } from '../lib/db';

async function checkClinicas() {
  try {
    const result = await query('SELECT id, nome FROM clinicas LIMIT 5');
    console.log('Clínicas encontradas:', result.rows);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkClinicas();
