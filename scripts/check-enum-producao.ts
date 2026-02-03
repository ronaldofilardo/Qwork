import { query } from '../lib/db';

async function checkEnum() {
  try {
    console.log('🔍 Verificando enum usuario_tipo_enum em produção...\n');
    
    // Verificar valores do enum
    const enumResult = await query(`
      SELECT e.enumlabel 
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'usuario_tipo_enum'
      ORDER BY e.enumsortorder
    `);
    
    console.log('📋 Valores aceitos pelo enum usuario_tipo_enum:');
    enumResult.rows.forEach((row: any) => {
      console.log(`   - "${row.enumlabel}"`);
    });
    
    console.log('\n🔍 Verificando perfis na tabela funcionarios:');
    const perfilResult = await query(`
      SELECT DISTINCT perfil, COUNT(*) as total
      FROM funcionarios
      GROUP BY perfil
      ORDER BY total DESC
    `);
    
    console.log('📊 Valores de perfil em uso:');
    perfilResult.rows.forEach((row: any) => {
      console.log(`   - "${row.perfil}" (${row.total} registros)`);
    });
    
    console.log('\n🔍 Verificando usuario_tipo na tabela funcionarios:');
    const tipoResult = await query(`
      SELECT DISTINCT usuario_tipo, COUNT(*) as total
      FROM funcionarios
      GROUP BY usuario_tipo
      ORDER BY total DESC
    `);
    
    console.log('📊 Valores de usuario_tipo em uso:');
    tipoResult.rows.forEach((row: any) => {
      console.log(`   - "${row.usuario_tipo}" (${row.total} registros)`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkEnum();
