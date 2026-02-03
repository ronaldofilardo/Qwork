/**
 * Script para debugar status dos lotes e validação
 * Verifica se os lotes estão sendo exibidos corretamente nos cards
 */

import { query } from '../lib/db';

async function debugLotesStatus() {
  try {
    console.log('🔍 Verificando status dos lotes...\n');

    // Buscar lotes concluídos
    const lotes = await query(
      `
      SELECT 
        la.id,
        la.codigo,
        la.titulo,
        la.status,
        la.liberado_em,
        COUNT(a.id) FILTER (WHERE a.status != 'rascunho') as total_avaliacoes,
        COUNT(a.id) FILTER (WHERE a.status = 'concluida') as avaliacoes_concluidas,
        COUNT(a.id) FILTER (WHERE a.status = 'inativada') as avaliacoes_inativadas,
        COUNT(a.id) FILTER (WHERE a.status IN ('iniciada', 'em_andamento')) as avaliacoes_pendentes
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON a.lote_id = la.id
      WHERE la.status = 'concluido'
      GROUP BY la.id, la.codigo, la.titulo, la.status, la.liberado_em
      ORDER BY la.id DESC
      LIMIT 10
      `
    );

    console.log(`📊 Encontrados ${lotes.rows.length} lotes concluídos:\n`);

    for (const lote of lotes.rows) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Lote ${lote.codigo} - ${lote.titulo}`);
      console.log(`ID: ${lote.id}`);
      console.log(`Status: ${lote.status}`);
      console.log(`Total de avaliações: ${lote.total_avaliacoes}`);
      console.log(`Concluídas: ${lote.avaliacoes_concluidas}`);
      console.log(`Inativadas: ${lote.avaliacoes_inativadas}`);
      console.log(`Pendentes: ${lote.avaliacoes_pendentes}`);

      // Executar validação
      try {
        const validacao = await query(
          `SELECT * FROM validar_lote_pre_laudo($1)`,
          [lote.id]
        );

        const resultado = validacao.rows[0];
        console.log(`\n✅ Validação:`);
        console.log(`   - Válido: ${resultado.valido ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`   - Bloqueante: ${resultado.bloqueante ? '⚠️ SIM' : '✅ NÃO'}`);
        console.log(`   - Funcionários pendentes: ${resultado.funcionarios_pendentes}`);
        console.log(`   - Taxa de conclusão: ${resultado.detalhes?.taxa_conclusao}%`);
        
        if (resultado.alertas && resultado.alertas.length > 0) {
          console.log(`   - Alertas:`);
          resultado.alertas.forEach((alerta: string) => {
            console.log(`     • ${alerta}`);
          });
        }

        // Verificar o que deveria aparecer no card
        const isPronto = resultado.valido;
        console.log(`\n🎯 Status no card deveria ser: ${isPronto ? '✅ Pronto' : '⚠️ Pendente'}`);

      } catch (validacaoError) {
        console.error(`❌ Erro ao validar lote ${lote.id}:`, validacaoError);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log('✅ Verificação concluída!\n');

  } catch (error) {
    console.error('❌ Erro ao debugar lotes:', error);
    process.exit(1);
  }

  process.exit(0);
}

debugLotesStatus();
