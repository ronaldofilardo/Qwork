const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

async function checkEnums() {
  try {
    console.log('=== VERIFICANDO ENUMS DE STATUS ===\n');

    // Listar todas as enums relacionadas a status
    const result = await pool.query(`
      SELECT t.typname, e.enumlabel, e.enumsortorder
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname LIKE '%status%' 
      ORDER BY t.typname, e.enumsortorder
    `);

    let currentType = '';
    const enumMap = {};

    result.rows.forEach((row) => {
      if (!enumMap[row.typname]) {
        enumMap[row.typname] = [];
      }
      enumMap[row.typname].push(row.enumlabel);

      if (row.typname !== currentType) {
        console.log(`\n${row.typname}:`);
        currentType = row.typname;
      }
      console.log(`  [${row.enumsortorder}] ${row.enumlabel}`);
    });

    console.log('\n\n=== ANÁLISE DE DISCREPÂNCIAS ===\n');

    // Verificar status_aprovacao_enum
    if (enumMap.status_aprovacao_enum) {
      console.log('status_aprovacao_enum no banco:');
      console.log('  ', enumMap.status_aprovacao_enum.join(', '));
      console.log('\nEsperado pelo TypeScript (StatusAprovacao):');
      console.log(
        '   pendente, aprovado, rejeitado, em_reanalise, aguardando_pagamento'
      );

      const missing = ['aguardando_pagamento'].filter(
        (v) => !enumMap.status_aprovacao_enum.includes(v)
      );
      if (missing.length > 0) {
        console.log('\n❌ VALORES FALTANDO:', missing.join(', '));
      } else {
        console.log('\n✓ Todos os valores esperados existem');
      }
    }

    // Verificar enum de contratos
    const contratoEnums = Object.keys(enumMap).filter(
      (k) => k.includes('contrato') || k === 'status_contrato_enum'
    );
    console.log(
      '\n\nEnums para contratos encontradas:',
      contratoEnums.length > 0 ? contratoEnums.join(', ') : 'NENHUMA'
    );

    if (contratoEnums.length === 0) {
      console.log(
        '\n⚠️  ATENÇÃO: Nenhuma enum específica para status de contratos encontrada.'
      );
      console.log(
        '    Verificar se a tabela contratos usa status_aprovacao_enum ou outra enum.'
      );
    }
  } catch (error) {
    console.error('\n❌ Erro ao verificar enums:', error.message);
  } finally {
    await pool.end();
  }
}

checkEnums();
