import pg from 'pg';

const { Client } = pg;

// Grupos de questões baseados no sistema
const grupos = [
  { id: 1, dominio: 'Demandas no Trabalho', tipo: 'negativa' },
  { id: 2, dominio: 'Organização e Conteúdo do Trabalho', tipo: 'positiva' },
  { id: 3, dominio: 'Relações Sociais e Liderança', tipo: 'positiva' },
  { id: 4, dominio: 'Interface Trabalho-Indivíduo', tipo: 'positiva' },
  { id: 5, dominio: 'Valores Organizacionais', tipo: 'positiva' },
  { id: 6, dominio: 'Traços de Personalidade', tipo: 'positiva' },
  { id: 7, dominio: 'Saúde e Bem-Estar', tipo: 'positiva' },
  { id: 8, dominio: 'Comportamentos Ofensivos', tipo: 'negativa' },
  { id: 9, dominio: 'Comportamento de Jogo', tipo: 'negativa' },
  { id: 10, dominio: 'Endividamento Financeiro', tipo: 'negativa' },
];

// Função para calcular score de um grupo
function calcularScoreGrupo(respostas) {
  if (respostas.length === 0) return 0;
  const soma = respostas.reduce((acc, r) => acc + r.valor, 0);
  const media = soma / respostas.length;
  return Math.round(media * 100) / 100;
}

// Função para categorizar score
function categorizarScore(score, tipo) {
  if (tipo === 'negativa') {
    if (score > 66) return 'alto';
    if (score >= 33) return 'medio';
    return 'baixo';
  } else {
    if (score > 66) return 'alto';
    if (score >= 33) return 'medio';
    return 'baixo';
  }
}

const client = new Client({
  connectionString:
    process.env.TEST_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db_test',
});

async function fixResultadosFaltantes() {
  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Buscar avaliações concluídas sem resultados
    const avaliacoesSemResultados = await client.query(`
      SELECT a.id, a.funcionario_cpf
      FROM avaliacoes a
      LEFT JOIN resultados r ON a.id = r.avaliacao_id
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.status = 'concluida' 
        AND r.id IS NULL
      ORDER BY a.id
    `);

    console.log(
      `Encontradas ${avaliacoesSemResultados.rows.length} avaliações sem resultados`
    );

    let processadas = 0;
    let resultadosInseridos = 0;

    for (const avaliacao of avaliacoesSemResultados.rows) {
      console.log(`\nProcessando avaliação ${avaliacao.id}...`);

      // Buscar respostas da avaliação
      const respostasResult = await client.query(
        'SELECT grupo, item, valor FROM respostas WHERE avaliacao_id = $1 ORDER BY grupo, item',
        [avaliacao.id]
      );

      if (respostasResult.rows.length === 0) {
        console.log(
          `  ⚠️  Avaliação ${avaliacao.id} não tem respostas, pulando...`
        );
        continue;
      }

      // Agrupar respostas por grupo
      const respostasPorGrupo = {};
      respostasResult.rows.forEach((row) => {
        if (!respostasPorGrupo[row.grupo]) {
          respostasPorGrupo[row.grupo] = [];
        }
        respostasPorGrupo[row.grupo].push({
          item: row.item,
          valor: row.valor,
        });
      });

      // Calcular e inserir resultados para cada grupo
      for (const grupo of grupos) {
        const respostas = respostasPorGrupo[grupo.id] || [];

        if (respostas.length === 0) {
          console.log(`  ⚠️  Grupo ${grupo.id} não tem respostas`);
          continue;
        }

        const score = calcularScoreGrupo(respostas);
        const categoria = categorizarScore(score, grupo.tipo);

        // Inserir resultado
        await client.query(
          'INSERT INTO resultados (avaliacao_id, grupo, dominio, score, categoria) VALUES ($1, $2, $3, $4, $5)',
          [avaliacao.id, grupo.id, grupo.dominio, score, categoria]
        );

        resultadosInseridos++;
        console.log(
          `    ✅ Grupo ${grupo.id} - ${grupo.dominio}: Score ${score.toFixed(
            2
          )} (${categoria})`
        );
      }

      processadas++;
    }

    console.log(`\n🎉 Processamento concluído!`);
    console.log(`📊 Avaliações processadas: ${processadas}`);
    console.log(`📈 Resultados inseridos: ${resultadosInseridos}`);

    // Verificar contagens finais
    const estatisticasFinais = await client.query(`
      SELECT 
        COUNT(DISTINCT a.id) as total_avaliacoes,
        COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN a.id END) as concluidas,
        COUNT(DISTINCT r.avaliacao_id) as com_resultados
      FROM avaliacoes a
      LEFT JOIN resultados r ON a.id = r.avaliacao_id
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE f.clinica_id = 1
    `);

    const stats = estatisticasFinais.rows[0];
    console.log(`\n📋 Estatísticas finais:`);
    console.log(`   Total de avaliações: ${stats.total_avaliacoes}`);
    console.log(`   Concluídas: ${stats.concluidas}`);
    console.log(`   Com resultados: ${stats.com_resultados}`);

    if (stats.concluidas === stats.com_resultados) {
      console.log(
        `✅ Sucesso! Todas as avaliações concluídas agora têm resultados.`
      );
    } else {
      console.log(
        `⚠️  Ainda existem ${
          stats.concluidas - stats.com_resultados
        } avaliações concluídas sem resultados.`
      );
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

// Executar o script
fixResultadosFaltantes();
