import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function diagnose() {
  try {
    console.log('\n=== DIAGNÓSTICO DO BANCO DE DADOS ===\n');

    // 1. Qual banco estamos conectados?
    const dbInfo = await pool.query(
      'SELECT current_database(), current_user, current_schema()'
    );
    console.log('1. Conexão atual:');
    console.log('   Banco:', dbInfo.rows[0].current_database);
    console.log('   Usuário:', dbInfo.rows[0].current_user);
    console.log('   Schema:', dbInfo.rows[0].current_schema);

    // 2. A tabela existe e em qual schema?
    const tableInfo = await pool.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE tablename = 'aceites_termos_usuario'
    `);
    console.log('\n2. Tabela aceites_termos_usuario:');
    if (tableInfo.rows.length > 0) {
      console.log('   ✅ Encontrada no schema:', tableInfo.rows[0].schemaname);
    } else {
      console.log('   ❌ NÃO ENCONTRADA em nenhum schema');
    }

    // 3. Qual é o search_path?
    const searchPath = await pool.query('SHOW search_path');
    console.log('\n3. Search path atual:', searchPath.rows[0].search_path);

    // 4. Listar todos os schemas disponíveis
    const schemas = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      ORDER BY schema_name
    `);
    console.log('\n4. Schemas disponíveis:');
    schemas.rows.forEach((row) => console.log('   -', row.schema_name));

    // 5. Tentar acessar a tabela diretamente
    console.log('\n5. Tentando acessar a tabela:');
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM aceites_termos_usuario'
      );
      console.log('   ✅ Sucesso! Registros:', result.rows[0].count);
    } catch (err) {
      console.log('   ❌ Erro:', err.message);

      // Tentar com schema público explícito
      try {
        const result = await pool.query(
          'SELECT COUNT(*) FROM public.aceites_termos_usuario'
        );
        console.log(
          '   ✅ Sucesso com public.aceites_termos_usuario! Registros:',
          result.rows[0].count
        );
      } catch (err2) {
        console.log(
          '   ❌ Também falhou com public.aceites_termos_usuario:',
          err2.message
        );
      }
    }

    console.log('\n=================================\n');
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    await pool.end();
  }
}

diagnose();
