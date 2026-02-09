const { query } = require('./lib/db.js');

async function checkInconsistencies() {
  try {
    console.log('Verificando inconsistências em tomadores...');

    // tomadores em análise mas ativa = false
    const result1 = await query(`
      SELECT id, nome, status, ativa
      FROM tomadores
      WHERE status IN ('pendente', 'em_reanalise', 'aguardando_pagamento') AND ativa = false
    `);
    console.log('\ntomadores em análise mas ativa = false:');
    console.log(result1.rows);

    // tomadores com status aprovado mas ativa = false
    const result2 = await query(`
      SELECT id, nome, status, ativa
      FROM tomadores
      WHERE status = 'aprovado' AND ativa = false
    `);
    console.log('\ntomadores com status aprovado mas ativa = false:');
    console.log(result2.rows);

    // tomadores com status pendente mas ativa = false
    const result3 = await query(`
      SELECT id, nome, status, ativa
      FROM tomadores
      WHERE status = 'pendente' AND ativa = false
    `);
    console.log('\ntomadores com status pendente mas ativa = false:');
    console.log(result3.rows);
  } catch (err) {
    console.error('Erro:', err);
  }
}

checkInconsistencies();
