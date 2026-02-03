/**
 * Teste rápido: Verificar se a API /api/entidade/lotes retorna pode_emitir_laudo correto
 */
import { query } from '../lib/db';

async function testarAPI() {
  try {
    console.log('🧪 Testando lógica da API /api/entidade/lotes\n');

    // Simular o que a API faz
    const lotes = await query(
      `
      SELECT DISTINCT
        la.id,
        la.codigo,
        la.titulo,
        la.status
      FROM lotes_avaliacao la
      WHERE la.status = 'concluido'
      ORDER BY la.id DESC
      LIMIT 5
      `
    );

    console.log(`📊 Testando ${lotes.rows.length} lotes concluídos:\n`);

    for (const lote of lotes.rows) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Lote ${lote.codigo} (ID: ${lote.id})`);
      console.log(`Status no banco: ${lote.status}`);

      // Somente validar quando lote estiver concluído
      if (lote.status !== 'concluido') {
        console.log('⚠️ Lote não concluído - pulando validação');
        continue;
      }

      try {
        const validacaoRes = await query(
          `SELECT * FROM validar_lote_pre_laudo($1)`,
          [lote.id]
        );
        const validacao = validacaoRes.rows[0];

        // Aplicar a lógica corrigida da API
        const podeEmitir = !!(
          validacao?.valido ??
          validacao?.pode_emitir ??
          validacao?.pode_emitir_laudo ??
          false
        );

        console.log(`\n📋 Campos retornados pela função SQL:`);
        console.log(`   - valido: ${validacao.valido}`);
        console.log(`   - bloqueante: ${validacao.bloqueante}`);
        console.log(`   - funcionarios_pendentes: ${validacao.funcionarios_pendentes}`);

        console.log(`\n✅ Resultado da lógica corrigida:`);
        console.log(`   pode_emitir_laudo: ${podeEmitir ? '✅ true' : '❌ false'}`);
        console.log(`   Status no card: ${podeEmitir ? '✅ Pronto' : '⚠️ Pendente'}`);

        if (!podeEmitir && validacao.valido) {
          console.log(`\n❌ ERRO: validacao.valido é true mas podeEmitir é false!`);
        } else if (podeEmitir) {
          console.log(`\n✅ OK: Lote concluído será exibido como "Pronto"`);
        }
      } catch (error) {
        console.error(`❌ Erro ao validar lote ${lote.id}:`, error);
      }

      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Teste concluído!\n');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }

  process.exit(0);
}

testarAPI();
