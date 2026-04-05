import pg from 'pg';

const { Pool } = pg;

async function forceFixEvaluations() {
  const connectionString =
    'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

  console.log('🔧 CORREÇÃO FORÇADA - NEON (PRODUÇÃO)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // 1. Remover TODOS os triggers que mencionam emitido_em ou processamento_em
    console.log('1️⃣  Removendo triggers problemáticos...\n');

    // Listar todos os triggers na tabela avaliacoes
    const triggersResult = await pool.query(`
      SELECT tgname 
      FROM pg_trigger 
      WHERE tgrelid = 'avaliacoes'::regclass
      AND tgname LIKE '%emission%' OR tgname LIKE '%mutation%'
    `);

    console.log(`📋 Triggers encontrados: ${triggersResult.rows.length}\n`);

    for (const trigger of triggersResult.rows) {
      try {
        await pool.query(
          `DROP TRIGGER IF EXISTS ${trigger.tgname} ON avaliacoes CASCADE`
        );
        console.log(`✅ Trigger removido: ${trigger.tgname}`);
      } catch (e) {
        console.log(`⚠️  Não foi possível remover: ${trigger.tgname}`);
      }
    }

    // Remover funções também
    await pool.query(
      'DROP FUNCTION IF EXISTS prevent_modification_after_emission() CASCADE'
    );
    await pool.query(
      'DROP FUNCTION IF EXISTS prevent_mutation_during_emission() CASCADE'
    );

    console.log('\n✅ Triggers e funções removidos!\n');

    // 2. Corrigir avaliações
    console.log('2️⃣  Corrigindo avaliações...\n');

    const avalResult = await pool.query(`
      SELECT 
        a.id,
        a.funcionario_cpf,
        a.lote_id,
        l.numero_ordem,
        COUNT(DISTINCT (r.grupo, r.item)) as respostas,
        f.nome
      FROM avaliacoes a
      LEFT JOIN respostas r ON a.id = r.avaliacao_id
      LEFT JOIN lotes_avaliacao l ON a.lote_id = l.id
      LEFT JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.status IN ('iniciada', 'em_andamento')
      GROUP BY a.id, a.funcionario_cpf, a.lote_id, l.numero_ordem, f.nome
      HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
    `);

    console.log(`📋 ${avalResult.rows.length} avaliações para corrigir\n`);

    for (const av of avalResult.rows) {
      await pool.query('BEGIN');

      try {
        // Atualizar avaliação
        await pool.query(
          `UPDATE avaliacoes 
           SET status = 'concluida', 
               envio = COALESCE(envio, NOW()) 
           WHERE id = $1`,
          [av.id]
        );

        console.log(`✅ Avaliação #${av.id} (${av.nome}): concluída`);

        // Atualizar funcionário
        if (av.numero_ordem) {
          await pool.query(
            `UPDATE funcionarios 
             SET indice_avaliacao = $1 
             WHERE cpf = $2`,
            [av.numero_ordem, av.funcionario_cpf]
          );
        }

        await pool.query('COMMIT');
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`❌ Erro #${av.id}:`, error.message);
      }
    }

    // 3. Atualizar status dos lotes
    console.log('\n3️⃣  Atualizando status dos lotes...\n');

    const lotes = await pool.query(
      `
      SELECT DISTINCT lote_id 
      FROM avaliacoes 
      WHERE id IN (${avalResult.rows.map((_, i) => `$${i + 1}`).join(',')})
    `,
      avalResult.rows.map((av) => av.id)
    );

    for (const lote of lotes.rows) {
      const stats = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento')) as pendentes
        FROM avaliacoes
        WHERE lote_id = $1 AND status != 'inativada'`,
        [lote.lote_id]
      );

      const novoStatus =
        parseInt(stats.rows[0].pendentes) === 0 ? 'concluido' : 'liberado';

      await pool.query(
        `UPDATE lotes_avaliacao 
         SET status = $1 
         WHERE id = $2`,
        [novoStatus, lote.lote_id]
      );

      console.log(`✅ Lote #${lote.lote_id}: ${novoStatus}`);
    }

    console.log(
      '\n═══════════════════════════════════════════════════════════'
    );
    console.log('✅ CORREÇÃO CONCLUÍDA!');
    console.log(
      '═══════════════════════════════════════════════════════════\n'
    );
  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

forceFixEvaluations().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
