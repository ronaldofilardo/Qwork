import pg from 'pg';

const { Pool } = pg;

async function queryNeonProduction() {
  // Connection string do Neon (produção)
  const connectionString =
    'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

  console.log('🔍 Conectando no NEON (PRODUÇÃO)...\n');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Verificar conexão
    const dbInfo = await pool.query('SELECT current_database(), version()');
    console.log('✅ Database:', dbInfo.rows[0].current_database);
    console.log(
      '✅ Version:',
      dbInfo.rows[0].version.split(' ').slice(0, 2).join(' ')
    );
    console.log('');

    // Consultar as avaliações 1-4
    console.log('═══════════════════════════════════════════════════════════');
    console.log('AVALIAÇÕES #1, #2, #3, #4 - BANCO NEON (PRODUÇÃO)');
    console.log(
      '═══════════════════════════════════════════════════════════\n'
    );

    const result = await pool.query(
      'SELECT id, funcionario_cpf, status, inicio, envio FROM avaliacoes WHERE id IN (1,2,3,4) ORDER BY id'
    );

    if (result.rows.length === 0) {
      console.log('⚠️  Nenhuma avaliação encontrada com IDs 1-4');
    } else {
      console.table(result.rows);

      // Contar respostas
      console.log('\n📝 Contagem de respostas:\n');

      for (const av of result.rows) {
        const countResult = await pool.query(
          'SELECT COUNT(DISTINCT (grupo, item)) as total FROM respostas WHERE avaliacao_id = $1',
          [av.id]
        );
        const total = parseInt(countResult.rows[0].total);
        const statusIcon =
          av.status === 'concluida'
            ? '✅'
            : av.status === 'inativada'
              ? '❌'
              : '⏳';
        const responseIcon = total >= 37 ? '✅' : total > 0 ? '⏳' : '❌';

        console.log(
          `  ${statusIcon} Avaliação #${av.id}: ${responseIcon} ${total}/37 respostas (status: ${av.status})`
        );
      }

      // Verificar inconsistências
      console.log('\n🔍 Verificando inconsistências:\n');

      let temInconsistencias = false;
      for (const av of result.rows) {
        const countResult = await pool.query(
          'SELECT COUNT(DISTINCT (grupo, item)) as total FROM respostas WHERE avaliacao_id = $1',
          [av.id]
        );
        const total = parseInt(countResult.rows[0].total);

        if (total >= 37 && av.status !== 'concluida') {
          console.log(
            `  ❌ Avaliação #${av.id}: TEM 37 respostas mas status = '${av.status}'`
          );
          temInconsistencias = true;
        } else if (total < 37 && av.status === 'concluida') {
          console.log(
            `  ❌ Avaliação #${av.id}: Status 'concluida' mas só tem ${total} respostas`
          );
          temInconsistencias = true;
        }
      }

      if (!temInconsistencias) {
        console.log('  ✅ Todas as avaliações estão consistentes!');
      }
    }
  } catch (error) {
    console.error('\n❌ Erro ao consultar:', error);
  } finally {
    await pool.end();
  }

  process.exit(0);
}

queryNeonProduction().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
