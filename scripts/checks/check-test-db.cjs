require('dotenv').config({path: '.env.test'});
const {query} = require('./lib/db.ts');

async function check() {
  try {
    const result = await query("SELECT id, nome, cnpj FROM contratantes WHERE cnpj LIKE '999%'");
    console.log('Existing test contractors:');
    console.log(result.rows);
  } catch (err) {
    console.error('Error:', err);
  }
}

check();