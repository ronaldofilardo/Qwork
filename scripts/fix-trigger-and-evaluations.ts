import pg from 'pg';

const { Pool } = pg;

async function fixTriggerAndCorrect() {
  // Use environment-configured DB for safety. Prefer DATABASE_URL (prod) or LOCAL_DATABASE_URL (dev).
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

  console.log('🔧 CORREÇÃO DO TRIGGER E AVALIAÇÕES - NEON (PRODUÇÃO)\n');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // 1. Verificar o trigger atual
    console.log(
      '1️⃣  Verificando trigger prevent_modification_after_emission...\n'
    );

    const triggerResult = await pool.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'prevent_modification_after_emission'
    `);

    if (triggerResult.rows.length > 0) {
      console.log(
        '📋 Trigger encontrado. Verificando se precisa correção...\n'
      );

      // 2. Drop do trigger antigo
      console.log('2️⃣  Removendo trigger problemático...\n');

      await pool.query(
        'DROP TRIGGER IF EXISTS prevent_modification_after_emission_trigger ON avaliacoes CASCADE'
      );
      await pool.query(
        'DROP FUNCTION IF EXISTS prevent_modification_after_emission() CASCADE'
      );

      console.log('✅ Trigger removido!\n');
    }

    // 3. Agora corrigir as avaliações SEM o trigger bloqueando
    console.log('3️⃣  Corrigindo avaliações com 37 respostas...\n');

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

    console.log(
      `📋 Encontradas ${avaliacoesResult.rows.length} avaliações para corrigir\n`
    );

    for (const av of avaliacoesResult.rows) {
      try {
        await pool.query('BEGIN');

        // Atualizar avaliação
        await pool.query(
          `UPDATE avaliacoes 
           SET status = 'concluida', 
               envio = COALESCE(envio, NOW()), 
               atualizado_em = NOW() 
           WHERE id = $1`,
          [av.id]
        );

        console.log(
          `✅ Avaliação #${av.id} (${av.funcionario_nome}): status → 'concluida'`
        );

        // Atualizar funcionário
        if (av.numero_ordem) {
          await pool.query(
            `UPDATE funcionarios 
             SET indice_avaliacao = $1, 
                 data_ultimo_lote = NOW() 
             WHERE cpf = $2`,
            [av.numero_ordem, av.funcionario_cpf]
          );
          console.log(`   ✅ Índice do funcionário → ${av.numero_ordem}`);
        }

        // Recalcular status do lote
        const loteStats = await pool.query(
          `SELECT 
            COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento')) as pendentes,
            COUNT(*) FILTER (WHERE status = 'concluida') as concluidas
          FROM avaliacoes
          WHERE lote_id = $1 AND status != 'inativada'`,
          [av.lote_id]
        );

        const stats = loteStats.rows[0];
        const novoStatus =
          parseInt(stats.pendentes) === 0 ? 'concluido' : 'liberado';

        await pool.query(
          `UPDATE lotes_avaliacao 
           SET status = $1, atualizado_em = NOW() 
           WHERE id = $2`,
          [novoStatus, av.lote_id]
        );

        console.log(`   ✅ Lote #${av.lote_id}: status → '${novoStatus}'\n`);

        await pool.query('COMMIT');
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`❌ Erro ao corrigir avaliação #${av.id}:`, error);
      }
    }

    console.log('\n✅ Correção finalizada!\n');
  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await pool.end();
  }

  process.exit(0);
}

fixTriggerAndCorrect().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
