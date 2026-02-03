import { loadEnv } from './load-env';
loadEnv();

import { query } from '../lib/db';

async function checkRecalcFunction() {
  try {
    const res = await query(`
      SELECT pg_get_functiondef(oid) AS definition
      FROM pg_proc
      WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update'
    `);
    
    if (res.rowCount > 0) {
      console.log('Definição da função:');
      console.log('='.repeat(80));
      console.log(res.rows[0].definition);
      console.log('='.repeat(80));
      
      const def = res.rows[0].definition;
      if (def.includes('fila_emissao')) {
        console.log('❌ FUNÇÃO AINDA INSERE EM fila_emissao');
      } else {
        console.log('✅ Função NÃO insere em fila_emissao');
      }
    } else {
      console.log('Função não encontrada');
    }
  } catch (err: any) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

checkRecalcFunction().catch((e) => {
  console.error(e);
  process.exit(1);
});
