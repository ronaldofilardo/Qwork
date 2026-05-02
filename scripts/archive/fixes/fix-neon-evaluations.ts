import pg from 'pg';

const { Pool } = pg;

async function fixNeonEvaluations() {
  // Connection string do Neon (produção)
  const connectionString =
    process.env.DATABASE_URL;

  console.log('🔧 CORREÇÃO DE AVALIAÇÕES - BANCO NEON (PRODUÇÃO)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Buscar avaliações com 37+ respostas mas não concluídas
    const avaliacoesResult = await pool.query(`
      SELECT 
        a.id,
        a.funcionario_cpf,
        a.status,
        a.lote_id,
        l.numero_ordem,
        COUNT(DISTINCT (r.grupo, r.item)) as total_respostas,
        f.nome as funcionario_nome
      FROM avaliacoes a
      LEFT JOIN respostas r ON a.id = r.avaliacao_id
      LEFT JOIN lotes_avaliacao l ON a.lote_id = l.id
      LEFT JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.status IN ('iniciada', 'em_andamento')
      GROUP BY a.id, a.funcionario_cpf, a.status, a.lote_id, l.numero_ordem, f.nome
      HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
      ORDER BY a.id
    `);

    if (avaliacoesResult.rows.length === 0) {
      console.log('✅ Nenhuma avaliação precisa de correção!\n');
      await pool.end();
      process.exit(0);
    }

    console.log(
      `📋 Encontradas ${avaliacoesResult.rows.length} avaliações para corrigir:\n`
    );

    for (const av of avaliacoesResult.rows) {
      console.log(`  Avaliação #${av.id}:`);
      console.log(
        `    Funcionário: ${av.funcionario_nome} (${av.funcionario_cpf})`
      );
      console.log(`    Respostas: ${av.total_respostas}/37`);
      console.log(`    Status atual: ${av.status}`);
      console.log(`    Lote: #${av.lote_id} (ordem ${av.numero_ordem})`);
      console.log('');
    }

    console.log('\n🔧 Iniciando correções...\n');

    let sucessos = 0;
    let erros = 0;

    for (const av of avaliacoesResult.rows) {
      try {
        // Iniciar transação
        await pool.query('BEGIN');

        // 1. Atualizar status da avaliação para 'concluida'
        await pool.query(
          `UPDATE avaliacoes 
           SET status = 'concluida', 
               envio = COALESCE(envio, NOW()), 
               atualizado_em = NOW() 
           WHERE id = $1`,
          [av.id]
        );

        console.log(`  ✅ Avaliação #${av.id}: status → 'concluida'`);

        // 2. Atualizar índice do funcionário (se tiver numero_ordem)
        if (av.numero_ordem) {
          await pool.query(
            `UPDATE funcionarios 
             SET indice_avaliacao = $1, 
                 data_ultimo_lote = NOW() 
             WHERE cpf = $2`,
            [av.numero_ordem, av.funcionario_cpf]
          );
          console.log(`     ✅ Funcionário: índice → ${av.numero_ordem}`);
        }

        // 3. Recalcular status do lote
        if (av.lote_id) {
          const loteStats = await pool.query(
            `SELECT 
              COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('iniciada', 'em_andamento')) as pendentes,
              COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
              COUNT(DISTINCT a.id) as total
            FROM avaliacoes a
            WHERE a.lote_id = $1 AND a.status != 'inativada'`,
            [av.lote_id]
          );

          const stats = loteStats.rows[0];
          let novoStatusLote = 'liberado';

          if (
            parseInt(stats.pendentes) === 0 &&
            parseInt(stats.concluidas) > 0
          ) {
            novoStatusLote = 'concluido';
          }

          await pool.query(
            `UPDATE lotes_avaliacao 
             SET status = $1, atualizado_em = NOW() 
             WHERE id = $2 AND status NOT IN ('emitido', 'enviado', 'cancelado')`,
            [novoStatusLote, av.lote_id]
          );

          console.log(
            `     ✅ Lote #${av.lote_id}: status → '${novoStatusLote}' (${stats.pendentes} pendentes, ${stats.concluidas} concluídas)`
          );
        }

        // Commit da transação
        await pool.query('COMMIT');
        console.log('');
        sucessos++;
      } catch (error) {
        // Rollback em caso de erro
        await pool.query('ROLLBACK');
        console.error(`  ❌ Erro ao corrigir avaliação #${av.id}:`, error);
        console.log('');
        erros++;
      }
    }

    console.log(
      '\n═══════════════════════════════════════════════════════════'
    );
    console.log(
      `✅ Correções concluídas: ${sucessos} sucessos, ${erros} erros`
    );
    console.log(
      '═══════════════════════════════════════════════════════════\n'
    );
  } catch (error) {
    console.error('\n❌ Erro geral:', error);
  } finally {
    await pool.end();
  }

  process.exit(0);
}

fixNeonEvaluations().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
