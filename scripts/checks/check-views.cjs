const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function checkViews() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    console.log('=== VERIFICANDO VIEWS QUE USAM PLANOS.TIPO ===');

    // Verificar views que dependem da tabela planos
    const views = await client.query(`
      SELECT schemaname, viewname, definition
      FROM pg_views
      WHERE definition ILIKE '%planos%'
      AND schemaname = 'public'
    `);

    console.log('Views que referenciam planos:');
    views.rows.forEach((view) => {
      console.log(`\n${view.viewname}:`);
      console.log(view.definition.substring(0, 200) + '...');
    });

    // Verificar dependências específicas da coluna tipo
    const dependencies = await client.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'planos' OR ccu.table_name = 'planos'
    `);

    console.log('\nDependências da tabela planos:');
    dependencies.rows.forEach((dep) => {
      console.log(
        `  ${dep.table_name}.${dep.column_name} -> ${dep.foreign_table_name}.${dep.foreign_column_name}`
      );
    });

    await client.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await client.end();
  }
}

checkViews();
