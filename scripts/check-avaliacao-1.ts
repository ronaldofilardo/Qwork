import { query } from '../lib/db';

async function checkAvaliacao1() {
  try {
    // Verificar avaliação #1
    const result = await query(
      `SELECT id, funcionario_cpf, status, inicio, envio, grupo_atual 
       FROM avaliacoes 
       WHERE id = 1`
    );
    
    console.log('🔍 Avaliação #1:', JSON.stringify(result.rows[0], null, 2));
    
    // Verificar total de respostas
    const respostasResult = await query(
      `SELECT COUNT(DISTINCT (grupo, item)) as total 
       FROM respostas 
       WHERE avaliacao_id = 1`
    );
    
    console.log('📊 Total de respostas únicas:', respostasResult.rows[0]?.total);
    
    // Verificar se lote foi atualizado
    if (result.rows[0]?.lote_id) {
      const loteResult = await query(
        `SELECT id, status, liberado_em, emitido_em 
         FROM lotes_avaliacao 
         WHERE id = $1`,
        [result.rows[0].lote_id]
      );
      console.log('📦 Status do lote:', JSON.stringify(loteResult.rows[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkAvaliacao1();
