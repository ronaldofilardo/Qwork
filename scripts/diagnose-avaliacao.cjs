// Script Node.js para diagnosticar a avaliação do CPF 16841540069
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function diagnose() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('\n=== DIAGNÓSTICO DA AVALIAÇÃO CPF 16841540069 ===\n');

    // 1. Buscar a avaliação
    console.log('1. Estado da avaliação:');
    const avaliacaoResult = await pool.query(`
      SELECT 
        a.id as avaliacao_id,
        a.funcionario_cpf,
        a.lote_id,
        a.status,
        a.inicio,
        a.envio,
        a.criado_em,
        l.codigo as lote_codigo,
        l.status as lote_status,
        f.nome as funcionario_nome
      FROM avaliacoes a
      LEFT JOIN lotes_avaliacao l ON l.id = a.lote_id
      LEFT JOIN funcionarios f ON f.cpf = a.funcionario_cpf
      WHERE a.funcionario_cpf = '16841540069'
    `);
    console.table(avaliacaoResult.rows);

    if (avaliacaoResult.rows.length === 0) {
      console.log('❌ Nenhuma avaliação encontrada para este CPF');
      await pool.end();
      return;
    }

    const avaliacaoId = avaliacaoResult.rows[0].avaliacao_id;

    // 2. Contar respostas
    console.log('\n2. Contagem de respostas:');
    const respostasResult = await pool.query(
      `
      SELECT 
        COUNT(r.id) as total_respostas,
        COUNT(DISTINCT r.grupo) as grupos_respondidos,
        MIN(r.criado_em) as primeira_resposta,
        MAX(r.criado_em) as ultima_resposta
      FROM respostas r
      WHERE r.avaliacao_id = $1
    `,
      [avaliacaoId]
    );
    console.table(respostasResult.rows);

    // 3. Respostas por grupo
    console.log('\n3. Respostas por grupo:');
    const gruposResult = await pool.query(
      `
      SELECT 
        r.grupo,
        COUNT(*) as respostas_no_grupo
      FROM respostas r
      WHERE r.avaliacao_id = $1
      GROUP BY r.grupo
      ORDER BY r.grupo
    `,
      [avaliacaoId]
    );
    console.table(gruposResult.rows);

    // 4. Verificar resultados calculados
    console.log('\n4. Resultados calculados:');
    const resultadosResult = await pool.query(
      `
      SELECT 
        rs.grupo,
        rs.dominio,
        rs.score,
        rs.categoria
      FROM resultados rs
      WHERE rs.avaliacao_id = $1
      ORDER BY rs.grupo
    `,
      [avaliacaoId]
    );
    if (resultadosResult.rows.length > 0) {
      console.table(resultadosResult.rows);
    } else {
      console.log('❌ Nenhum resultado calculado');
    }

    // 5. Status do lote
    console.log('\n5. Status do lote:');
    const loteResult = await pool.query(
      `
      SELECT 
        l.id,
        l.codigo,
        l.status,
        l.tipo,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
        COUNT(CASE WHEN a.status = 'em_andamento' THEN 1 END) as em_andamento,
        COUNT(CASE WHEN a.status = 'iniciada' THEN 1 END) as iniciadas,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as inativadas
      FROM lotes_avaliacao l
      LEFT JOIN avaliacoes a ON a.lote_id = l.id
      WHERE l.id = $1
      GROUP BY l.id, l.codigo, l.status, l.tipo
    `,
      [avaliacaoResult.rows[0].lote_id]
    );
    console.table(loteResult.rows);

    // 6. Diagnóstico e recomendação
    console.log('\n=== DIAGNÓSTICO ===');
    const avaliacao = avaliacaoResult.rows[0];
    const respostas = respostasResult.rows[0];

    if (avaliacao.status === 'concluida') {
      console.log('✅ Status: CONCLUÍDA');
      if (!avaliacao.envio) {
        console.log('⚠️  PROBLEMA: envio (data de conclusão) está NULL');
      } else {
        console.log(
          '✅ envio (data de conclusão) preenchido:',
          avaliacao.envio
        );
      }
    } else {
      console.log(`⚠️  Status: ${avaliacao.status.toUpperCase()}`);
      console.log(`   Total de respostas: ${respostas.total_respostas}/37`);
      if (parseInt(respostas.total_respostas) < 37) {
        console.log('   ❌ Avaliação incompleta - faltam respostas');
      } else if (parseInt(respostas.total_respostas) === 37) {
        console.log('   ⚠️  Avaliação completa mas não finalizada');
        console.log('   Ação necessária: Clicar em "Finalizar" na interface');
      }
    }
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

diagnose();
