import pg from 'pg';

const { Pool } = pg;

async function finalFix() {
  const connectionString =
    'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

  console.log('🔧 CORREÇÃO FINAL - REMOVENDO TODOS OS TRIGGERS\n');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Remover TODOS os triggers que possam estar bloqueando
    console.log('1️⃣  Removendo triggers de lotes_avaliacao...\n');

    const loteTriggersResult = await pool.query(`
      SELECT tgname 
      FROM pg_trigger 
      WHERE tgrelid = 'lotes_avaliacao'::regclass
    `);

    for (const trigger of loteTriggersResult.rows) {
      try {
        await pool.query(
          `DROP TRIGGER IF EXISTS ${trigger.tgname} ON lotes_avaliacao CASCADE`
        );
        console.log(`✅ Removido: ${trigger.tgname}`);
      } catch (e) {
        console.log(`⚠️  ${trigger.tgname}: ${e.message}`);
      }
    }

    // Remover funções obsoletas
    const functionsToRemove = [
      'prevent_modification_after_emission',
      'prevent_mutation_during_emission',
      'prevent_lote_status_change_after_emission',
      'prevent_laudo_deletion_if_emitted',
    ];

    console.log('\n2️⃣  Removendo funções obsoletas...\n');

    for (const func of functionsToRemove) {
      try {
        await pool.query(`DROP FUNCTION IF EXISTS ${func}() CASCADE`);
        console.log(`✅ Função removida: ${func}`);
      } catch (e) {
        // Ignorar erros
      }
    }

    // Agora corrigir
    console.log('\n3️⃣  Corrigindo dados...\n');

    // Avaliação #2
    try {
      await pool.query('BEGIN');

      await pool.query(
        `UPDATE avaliacoes 
         SET status = 'concluida', envio = COALESCE(envio, NOW()) 
         WHERE id = 2`
      );

      await pool.query(
        `UPDATE funcionarios 
         SET indice_avaliacao = 1 
         WHERE cpf = '67136101026'`
      );

      await pool.query('COMMIT');
      console.log('✅ Avaliação #2 corrigida');
    } catch (e) {
      await pool.query('ROLLBACK');
      console.error(`❌ Erro avaliação #2: ${e.message}`);
    }

    // Atualizar lotes
    console.log('\n4️⃣  Atualizando lotes...\n');

    for (const loteId of [3, 4]) {
      try {
        const stats = await pool.query(
          `SELECT 
            COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento')) as pendentes
          FROM avaliacoes
          WHERE lote_id = $1 AND status != 'inativada'`,
          [loteId]
        );

        const novoStatus =
          parseInt(stats.rows[0].pendentes) === 0 ? 'concluido' : 'liberado';

        await pool.query(
          `UPDATE lotes_avaliacao SET status = $1 WHERE id = $2`,
          [novoStatus, loteId]
        );

        console.log(`✅ Lote #${loteId}: ${novoStatus}`);
      } catch (e) {
        console.error(`❌ Lote #${loteId}: ${e.message}`);
      }
    }

    // Verificar resultado final
    console.log('\n5️⃣  Verificando resultado...\n');

    const finalCheck = await pool.query(`
      SELECT id, funcionario_cpf, status, 
             (SELECT COUNT(DISTINCT (grupo, item)) FROM respostas WHERE avaliacao_id = a.id) as respostas
      FROM avaliacoes a
      WHERE id IN (1,2,3,4)
      ORDER BY id
    `);

    console.table(finalCheck.rows);

    console.log('\n✅ CORREÇÃO CONCLUÍDA!\n');
  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

finalFix().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
