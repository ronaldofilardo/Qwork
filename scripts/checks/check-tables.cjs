require('dotenv').config({ path: '.env.test' });
const { query } = require('./lib/db.ts');

async function checkInconsistencies() {
  try {
    console.log('Verificando inconsistências em contratantes...');

    // Contratantes em análise mas ativa = false
    const result1 = await query(`
      SELECT id, nome, status, ativa
      FROM contratantes
      WHERE status IN ('pendente', 'em_reanalise', 'aguardando_pagamento') AND ativa = false
    `);
    console.log('\nContratantes em análise mas ativa = false:');
    console.log(result1.rows);

    // Contratantes com status aprovado mas ativa = false
    const result2 = await query(`
      SELECT id, nome, status, ativa
      FROM contratantes
      WHERE status = 'aprovado' AND ativa = false
    `);
    console.log('\nContratantes com status aprovado mas ativa = false:');
    console.log(result2.rows);

    // Contratantes com status pendente mas ativa = false
    const result3 = await query(`
      SELECT id, nome, status, ativa
      FROM contratantes
      WHERE status = 'pendente' AND ativa = false
    `);
    console.log('\nContratantes com status pendente mas ativa = false:');
    console.log(result3.rows);
  } catch (err) {
    console.error('Erro:', err);
  }
}

checkInconsistencies();
