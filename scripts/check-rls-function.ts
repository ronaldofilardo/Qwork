import { query } from '../lib/db';

async function checkRLSFunction() {
  console.log('🔍 Verificando função validar_sessao_rls em PRODUÇÃO\n');
  
  const result = await query(`
    SELECT 
      proname as function_name,
      prosrc as source
    FROM pg_proc
    WHERE proname = 'validar_sessao_rls'
  `);
  
  if (result.rows.length === 0) {
    console.log('❌ Função validar_sessao_rls NÃO encontrada!');
    process.exit(1);
  }
  
  const source = result.rows[0].source;
  console.log('📜 Código da função:\n');
  console.log(source);
  console.log('\n' + '='.repeat(80));
  
  console.log('\n🔍 Análise:');
  if (source.includes('current_user_perfil')) {
    console.log('✅ Função usa current_user_perfil');
  } else {
    console.log('❌ Função NÃO usa current_user_perfil');
    console.log('   Isso pode causar problemas de RLS!');
  }
  
  if (source.includes('current_user_cpf')) {
    console.log('✅ Função usa current_user_cpf');
  } else {
    console.log('❌ Função NÃO usa current_user_cpf');
  }
  
  process.exit(0);
}

checkRLSFunction().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
