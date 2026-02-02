// Verificar todas as avaliações do CPF 16841540069
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('\n=== TODAS AS AVALIAÇÕES DO CPF 16841540069 ===\n');

    const result = await pool.query(`
      SELECT 
        a.id,
        a.lote_id,
        a.status,
        a.inicio,
        a.criado_em,
        l.codigo as lote_codigo,
        (SELECT COUNT(*) FROM respostas WHERE avaliacao_id = a.id) as respostas
      FROM avaliacoes a
      LEFT JOIN lotes_avaliacao l ON l.id = a.lote_id
      WHERE a.funcionario_cpf = '16841540069'
      ORDER BY a.inicio DESC
    `);

    console.table(result.rows);

    console.log('\n=== BUSCA DA API (status IN iniciada, em_andamento) ===\n');

    const apiResult = await pool.query(`
      SELECT 
        a.id,
        a.status,
        a.inicio,
        (SELECT COUNT(*) FROM respostas WHERE avaliacao_id = a.id) as respostas
      FROM avaliacoes
      WHERE funcionario_cpf = '16841540069'
        AND status IN ('iniciada', 'em_andamento')
        AND status != 'inativada'
      ORDER BY inicio DESC
      LIMIT 1
    `);

    console.table(apiResult.rows);

    if (apiResult.rows.length > 0) {
      const avaliacaoId = apiResult.rows[0].id;
      console.log(`\n=== RESPOSTAS DA AVALIAÇÃO #${avaliacaoId} ===\n`);

      const respostasResult = await pool.query(
        `
        SELECT item, valor, criado_em
        FROM respostas
        WHERE avaliacao_id = $1
        ORDER BY criado_em ASC
        LIMIT 10
      `,
        [avaliacaoId]
      );

      console.log(`Total de respostas: ${respostasResult.rows.length}`);
      if (respostasResult.rows.length > 0) {
        console.table(respostasResult.rows.slice(0, 10));
      }
    }
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

check();
