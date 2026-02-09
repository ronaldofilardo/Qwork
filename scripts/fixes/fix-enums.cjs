const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function fixEnums() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    console.log('=== INICIANDO CORREÇÃO DOS ENUMS ===');

    // 1. Renomear enum antigo
    console.log('1. Renomeando enum tipo_plano para tipo_plano_old...');
    await client.query(`ALTER TYPE tipo_plano RENAME TO tipo_plano_old;`);

    // 2. Criar novo enum
    console.log('2. Criando novo enum tipo_plano...');
    await client.query(
      `CREATE TYPE tipo_plano AS ENUM ('fixo', 'personalizado');`
    );

    // 3. Atualizar dados existentes
    console.log('3. Atualizando dados existentes...');
    const updateResult = await client.query(`
      UPDATE tomadores
      SET plano_tipo = CASE
        WHEN plano_tipo::text = 'personalizado' THEN 'personalizado'::tipo_plano
        ELSE NULL
      END
      WHERE plano_tipo IS NOT NULL
    `);
    console.log(`   ${updateResult.rowCount} registros atualizados`);

    // 4. Remover enum antigo
    console.log('4. Removendo enum antigo...');
    await client.query(`DROP TYPE tipo_plano_old;`);

    // 5. Atualizar tabela planos para usar enum
    console.log('5. Convertendo coluna tipo em planos para usar enum...');
    await client.query(`
      ALTER TABLE planos
      ALTER COLUMN tipo TYPE tipo_plano USING tipo::tipo_plano;
    `);

    // 6. Remover enum não utilizado
    console.log('6. Removendo enum tipo_plano_enum não utilizado...');
    await client.query(`DROP TYPE IF EXISTS tipo_plano_enum;`);

    console.log('=== CORREÇÃO CONCLUÍDA COM SUCESSO ===');

    // Verificar resultado
    console.log('\n=== VERIFICAÇÃO FINAL ===');
    const enums = await client.query(`
      SELECT t.typname as enum_name, e.enumlabel as value
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'tipo_plano'
      ORDER BY e.enumsortorder
    `);

    console.log(
      'Enum tipo_plano atual:',
      enums.rows.map((r) => r.value)
    );

    const planos = await client.query(
      'SELECT id, nome, tipo FROM planos ORDER BY id'
    );
    console.log('Planos:');
    planos.rows.forEach((p) =>
      console.log(`  ID ${p.id}: ${p.nome} (${p.tipo})`)
    );

    await client.end();
  } catch (error) {
    console.error('Erro durante correção:', error.message);
    await client.end();
  }
}

fixEnums();
