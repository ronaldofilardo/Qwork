import { query } from '../lib/db';

async function checkAvaliacaoProducao() {
  try {
    console.log('🔍 Verificando avaliações em produção...\n');
    
    // Verificar todas as avaliações
    const result = await query(
      `SELECT id, funcionario_cpf, status, inicio, envio, grupo_atual, lote_id
       FROM avaliacoes 
       ORDER BY id`
    );
    
    console.log(`📋 Total de avaliações: ${result.rows.length}\n`);
    
    for (const aval of result.rows) {
      // Contar respostas
      const respostasResult = await query(
        `SELECT COUNT(DISTINCT (grupo, item)) as total 
         FROM respostas 
         WHERE avaliacao_id = $1`,
        [aval.id]
      );
      
      const totalRespostas = respostasResult.rows[0]?.total || 0;
      
      console.log(`\n📊 Avaliação #${aval.id}:`);
      console.log(`   Status: ${aval.status}`);
      console.log(`   CPF: ${aval.funcionario_cpf}`);
      console.log(`   Respostas: ${totalRespostas}/37`);
      console.log(`   Envio: ${aval.envio || 'null'}`);
      console.log(`   Lote: ${aval.lote_id || 'null'}`);
      
      // Alertar sobre inconsistências
      if (totalRespostas >= 37 && aval.status !== 'concluida') {
        console.log(`   ⚠️ INCONSISTÊNCIA: ${totalRespostas} respostas mas status="${aval.status}"`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkAvaliacaoProducao();
