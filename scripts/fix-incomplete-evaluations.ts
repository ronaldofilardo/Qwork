import { query } from '../lib/db';

async function fixIncompleteEvaluations() {
  console.log(
    '🔍 Buscando avaliações com 37 respostas mas status incorreto...\n'
  );

  // Buscar avaliações com 37+ respostas mas não concluídas
  const result = await query(`
    SELECT 
      a.id,
      a.funcionario_cpf,
      a.status,
      a.envio,
      a.lote_id,
      COUNT(DISTINCT (r.grupo, r.item)) as total_respostas,
      l.numero_ordem
    FROM avaliacoes a
    LEFT JOIN respostas r ON a.id = r.avaliacao_id
    LEFT JOIN lotes_avaliacao l ON a.lote_id = l.id
    WHERE a.status IN ('iniciada', 'em_andamento')
    GROUP BY a.id, a.funcionario_cpf, a.status, a.envio, a.lote_id, l.numero_ordem
    HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
    ORDER BY a.id
  `);

  if (result.rows.length === 0) {
    console.log('✅ Todas as avaliações com 37 respostas já estão concluídas!');
    process.exit(0);
  }

  console.log(
    `📊 Encontradas ${result.rows.length} avaliações para corrigir:\n`
  );

  result.rows.forEach((row: any) => {
    console.log(`   Avaliação #${row.id}:`);
    console.log(`   - CPF: ${row.funcionario_cpf}`);
    console.log(`   - Status atual: ${row.status}`);
    console.log(`   - Respostas: ${row.total_respostas}/37`);
    console.log(`   - Lote: #${row.lote_id} (ordem ${row.numero_ordem})`);
    console.log(`   - Envio: ${row.envio || 'NULL'}`);
    console.log('');
  });

  console.log('🔧 Aplicando correções...\n');

  for (const row of result.rows) {
    const avaliacaoId = row.id;
    const cpf = row.funcionario_cpf;
    const loteId = row.lote_id;
    const numeroOrdem = row.numero_ordem;

    try {
      // 1. Atualizar status para concluída
      await query(
        `UPDATE avaliacoes 
         SET status = 'concluida', 
             envio = COALESCE(envio, NOW()), 
             atualizado_em = NOW() 
         WHERE id = $1`,
        [avaliacaoId]
      );

      console.log(`✅ Avaliação #${avaliacaoId}: status → 'concluida'`);

      // 2. Atualizar índice do funcionário
      if (numeroOrdem) {
        await query(
          `UPDATE funcionarios 
           SET indice_avaliacao = $1, data_ultimo_lote = NOW() 
           WHERE cpf = $2`,
          [numeroOrdem, cpf]
        );
        console.log(`   ✅ Funcionário ${cpf}: índice → ${numeroOrdem}`);
      }

      // 3. Recalcular status do lote (se existir)
      if (loteId) {
        // Buscar estatísticas do lote
        const loteStats = await query(
          `SELECT 
            COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('iniciada', 'em_andamento')) as pendentes,
            COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
            COUNT(DISTINCT a.id) as total
          FROM avaliacoes a
          WHERE a.lote_id = $1 AND a.status != 'inativada'`,
          [loteId]
        );

        const stats = loteStats.rows[0];
        let novoStatusLote = 'liberado';

        if (stats.pendentes === 0 && stats.concluidas > 0) {
          novoStatusLote = 'concluido';
        }

        await query(
          `UPDATE lotes_avaliacao 
           SET status = $1, atualizado_em = NOW() 
           WHERE id = $2 AND status NOT IN ('emitido', 'enviado', 'cancelado')`,
          [novoStatusLote, loteId]
        );

        console.log(
          `   ✅ Lote #${loteId}: status → '${novoStatusLote}' (${stats.pendentes} pendentes, ${stats.concluidas} concluídas)`
        );
      }

      console.log('');
    } catch (error) {
      console.error(`   ❌ Erro ao corrigir avaliação #${avaliacaoId}:`, error);
    }
  }

  console.log('\n✅ Correção finalizada!');
  console.log(`Total de avaliações corrigidas: ${result.rows.length}`);

  process.exit(0);
}

fixIncompleteEvaluations().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
