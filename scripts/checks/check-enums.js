const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

async function checkEnums() {
  try {
    console.log('=== Verificando enums de status no banco de dados ===\n');

    // Listar todas as enums relacionadas a status
    const result = await pool.query(`
      SELECT t.typname, e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname LIKE '%status%' 
      ORDER BY t.typname, e.enumsortorder
    `);

    let currentType = '';
    result.rows.forEach((row) => {
      if (row.typname !== currentType) {
        console.log(`\n${row.typname}:`);
        currentType = row.typname;
      }
      console.log(`  - ${row.enumlabel}`);
    });

    console.log('\n\n=== Análise ===');
    console.log(
      'Verificando se "aguardando_pagamento" existe em alguma enum...'
    );

    const hasAguardando = result.rows.some(
      (r) => r.enumlabel === 'aguardando_pagamento'
    );
    if (hasAguardando) {
      console.log('✓ "aguardando_pagamento" ENCONTRADO');
    } else {
      console.log(
        '✗ "aguardando_pagamento" NÃO ENCONTRADO - PRECISA SER ADICIONADO'
      );
    }

    // Verificar quais valores estão sendo usados no código TypeScript
    console.log('\n=== Valores esperados pelo código TypeScript ===');
    console.log(
      'StatusAprovacao: pendente, aprovado, rejeitado, em_reanalise, aguardando_pagamento'
    );
    console.log('StatusContrato: (verificar em lib/types.ts ou similar)');
  } catch (error) {
    console.error('Erro ao verificar enums:', error.message);
  } finally {
    await pool.end();
  }
}

checkEnums();
