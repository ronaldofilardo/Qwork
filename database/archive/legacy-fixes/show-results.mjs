import pg from "pg";

// Dados dos grupos (copiado de lib/questoes.ts)
const grupos = [
  {
    id: 1,
    titulo: "Grupo 1 - Demandas no Trabalho",
    dominio: "Demandas no Trabalho",
    tipo: "negativa",
  },
  {
    id: 2,
    titulo: "Grupo 2 - Organização e Conteúdo",
    dominio: "Organização e Conteúdo do Trabalho",
    tipo: "positiva",
  },
  {
    id: 3,
    titulo: "Grupo 3 - Relações Interpessoais",
    dominio: "Relações Sociais e Liderança",
    tipo: "positiva",
  },
  {
    id: 4,
    titulo: "Grupo 4 - Interface Trabalho-Indivíduo",
    dominio: "Interface Trabalho-Indivíduo",
    tipo: "negativa",
  },
  {
    id: 5,
    titulo: "Grupo 5 - Valores no Trabalho",
    dominio: "Valores Organizacionais",
    tipo: "positiva",
  },
  {
    id: 6,
    titulo: "Grupo 6 - Personalidade (Opcional)",
    dominio: "Traços de Personalidade",
    tipo: "positiva",
  },
  {
    id: 7,
    titulo: "Grupo 7 - Saúde e Bem-Estar",
    dominio: "Saúde e Bem-Estar",
    tipo: "negativa",
  },
  {
    id: 8,
    titulo: "Grupo 8 - Comportamentos Ofensivos",
    dominio: "Comportamentos Ofensivos",
    tipo: "negativa",
  },
  {
    id: 9,
    titulo: "Grupo 9 - Jogos de Apostas",
    dominio: "Comportamento de Jogo",
    tipo: "negativa",
  },
  {
    id: 10,
    titulo: "Grupo 10 - Endividamento",
    dominio: "Endividamento Financeiro",
    tipo: "negativa",
  },
];

// Funções de cálculo (simplificadas)
function calcularScoreGrupo(respostas, tipo) {
  if (respostas.length === 0) return 0;
  const soma = respostas.reduce((acc, r) => acc + r.valor, 0);
  const media = soma / respostas.length;
  return Math.round(media * 100) / 100;
}

function categorizarScore(score, tipo) {
  if (tipo === "negativa") {
    if (score > 66) return "alto";
    if (score >= 33) return "medio";
    return "baixo";
  } else {
    if (score > 66) return "alto";
    if (score >= 33) return "medio";
    return "baixo";
  }
}

const { Client } = pg;

// Configuração da conexão com o banco
const client = new Client({
  connectionString: "postgresql://postgres:123456@localhost:5432/nr-bps_db",
});

async function showResults() {
  try {
    await client.connect();
    console.log("Conectado ao banco de dados");

    // Buscar todas as avaliações dos funcionários específicos
    const cpfs = ["22222222222", "33333333333"];

    for (const cpf of cpfs) {
      console.log(`\n=== RESULTADOS PARA FUNCIONÁRIO CPF: ${cpf} ===`);

      // Buscar avaliações que possuem resultados
      const avaliacoesResult = await client.query(
        `SELECT DISTINCT a.id, a.envio
         FROM avaliacoes a
         JOIN resultados r ON a.id = r.avaliacao_id
         WHERE a.funcionario_cpf = $1 AND a.status = 'concluido'
         ORDER BY a.envio DESC`,
        [cpf]
      );

      console.log(
        `Total de avaliações com resultados: ${avaliacoesResult.rows.length}`
      );

      // Para cada avaliação, calcular scores por grupo
      for (const avaliacao of avaliacoesResult.rows) {
        console.log(
          `\nAvaliação ID: ${avaliacao.id} (Enviada: ${
            avaliacao.envio
              ? new Date(avaliacao.envio).toLocaleDateString("pt-BR")
              : "N/A"
          })`
        );

        // Buscar respostas agrupadas por grupo
        const respostasResult = await client.query(
          "SELECT grupo, item, valor FROM respostas WHERE avaliacao_id = $1 ORDER BY grupo, item",
          [avaliacao.id]
        );

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

        // Calcular score para cada grupo
        for (const grupo of grupos) {
          const respostas = respostasPorGrupo[grupo.id] || [];
          if (respostas.length === 0) continue;

          const score = calcularScoreGrupo(respostas, grupo.tipo, grupo.id);
          const categoria = categorizarScore(score, grupo.tipo);

          console.log(
            `  Grupo ${grupo.id} - ${grupo.dominio}: Score ${score.toFixed(
              2
            )} (${categoria})`
          );
        }
      }

      // Calcular médias gerais por domínio
      console.log(`\n--- MÉDIAS GERAIS POR DOMÍNIO ---`);
      for (const grupo of grupos) {
        const mediaResult = await client.query(
          `
          SELECT AVG(sub.score) as media_geral
          FROM (
            SELECT a.id,
                   AVG(r.valor) as score
            FROM avaliacoes a
            JOIN respostas r ON a.id = r.avaliacao_id
            WHERE a.funcionario_cpf = $1
              AND a.status = 'concluido'
              AND r.grupo = $2
            GROUP BY a.id
          ) sub
        `,
          [cpf, grupo.id]
        );

        const mediaGeral = parseFloat(mediaResult.rows[0].media_geral);
        if (!isNaN(mediaGeral)) {
          const categoria = categorizarScore(mediaGeral, grupo.tipo);
          console.log(
            `  ${grupo.dominio}: Média ${mediaGeral.toFixed(2)} (${categoria})`
          );
        } else {
          console.log(`  ${grupo.dominio}: Sem dados suficientes`);
        }
      }
    }
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await client.end();
    console.log("Conexão fechada");
  }
}

// Executar
showResults();

