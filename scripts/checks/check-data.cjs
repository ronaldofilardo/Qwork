const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://postgres:123456@localhost:5432/nr-bps_db",
});

async function checkData() {
  try {
    await client.connect();

    // Buscar informações do lote
    const loteQuery = `
      SELECT 
        la.id,
        ec.nome as empresa,
        ec.cnpj,
        la.liberado_em,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
        COUNT(CASE WHEN f.nivel_cargo = 'operacional' THEN 1 END) as operacional,
        COUNT(CASE WHEN f.nivel_cargo = 'gestao' THEN 1 END) as gestao
      FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN avaliacoes a ON a.lote_id = la.id
      LEFT JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE ec.nome LIKE '%Metalurgica%' OR ec.nome LIKE '%Metalúrgica%'
      GROUP BY la.id, ec.nome, ec.cnpj, la.liberado_em
      ORDER BY la.liberado_em DESC
      LIMIT 1
    `;

    const loteResult = await client.query(loteQuery);
    console.log("\n=== INFORMAÇÕES DO LOTE ===");
    console.log(JSON.stringify(loteResult.rows[0], null, 2));

    const loteId = loteResult.rows[0].id;

    // Buscar scores por grupo
    const scoresQuery = `
      SELECT
        r.grupo,
        COUNT(r.id) as total_respostas,
        AVG(r.valor)::numeric(10,1) as media,
        STDDEV(r.valor)::numeric(10,1) as desvio_padrao,
        MIN(r.valor) as min_valor,
        MAX(r.valor) as max_valor,
        PERCENTILE_CONT(0.33) WITHIN GROUP (ORDER BY r.valor)::numeric(10,1) as percentil_33,
        PERCENTILE_CONT(0.66) WITHIN GROUP (ORDER BY r.valor)::numeric(10,1) as percentil_66
      FROM respostas r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      WHERE a.lote_id = $1 AND a.status = 'concluida'
      GROUP BY r.grupo
      ORDER BY r.grupo
    `;

    const scoresResult = await client.query(scoresQuery, [loteId]);
    console.log("\n=== SCORES POR GRUPO ===");
    console.log(JSON.stringify(scoresResult.rows, null, 2));

    // Buscar detalhes das respostas do grupo 6 (Traços de Personalidade)
    const grupo6Query = `
      SELECT
        r.grupo,
        r.valor,
        a.funcionario_cpf,
        f.nivel_cargo
      FROM respostas r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.lote_id = $1 AND a.status = 'concluida' AND r.grupo = 6
      ORDER BY r.valor
    `;

    const grupo6Result = await client.query(grupo6Query, [loteId]);
    console.log("\n=== DETALHES GRUPO 6 (Traços de Personalidade) ===");
    console.log(JSON.stringify(grupo6Result.rows, null, 2));

    // Verificar cálculo global dos percentis
    const percentisQuery = `
      SELECT
        PERCENTILE_CONT(0.33) WITHIN GROUP (ORDER BY r.valor)::numeric(10,1) as percentil_33_global,
        PERCENTILE_CONT(0.66) WITHIN GROUP (ORDER BY r.valor)::numeric(10,1) as percentil_66_global
      FROM respostas r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      WHERE a.lote_id = $1 AND a.status = 'concluida'
    `;

    const percentisResult = await client.query(percentisQuery, [loteId]);
    console.log("\n=== PERCENTIS GLOBAIS ===");
    console.log(JSON.stringify(percentisResult.rows[0], null, 2));

    await client.end();
  } catch (err) {
    console.error("Erro:", err);
    process.exit(1);
  }
}

checkData();
