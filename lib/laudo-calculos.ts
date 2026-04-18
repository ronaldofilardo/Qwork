import { query } from './db';
import { formatarDataApenasData } from './pdf/timezone-helper';
import {
  DadosGeraisEmpresa,
  ScoreGrupo,
  CategoriaRisco,
  ClassificacaoSemaforo,
} from './laudo-tipos';

// Re-export dos módulos extraídos para manter backward compatibility
export { gruposCOPSOQ } from './consts/copsoq-grupos';
export type { GrupoCOPSOQ } from './consts/copsoq-grupos';
export {
  determinarAcaoRecomendada,
  gerarObservacoesConclusao,
  gerarInterpretacaoRecomendacoes,
} from './laudo-calculos-texto';

import { gruposCOPSOQ } from './consts/copsoq-grupos';

// Função para calcular média
function calcularMedia(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

// Função para calcular desvio padrão
function calcularDesvioPadrao(arr: number[], media: number): number {
  if (arr.length <= 1) return 0;
  const variance =
    arr.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) /
    (arr.length - 1);
  return Math.sqrt(variance);
}

// Função para determinar categoria de risco
// Metodologia: Tercis fixos de 33% e 66% da escala 0-100
//
// Grupos Positivos (maior é melhor):
// - >66% = Baixo Risco (Excelente/Verde)
// - 33-66% = Médio Risco (Monitorar/Amarelo)
// - <33% = Alto Risco (Atenção Necessária/Vermelho)
//
// Grupos Negativos (menor é melhor):
// - <33% = Baixo Risco (Excelente/Verde)
// - 33-66% = Médio Risco (Monitorar/Amarelo)
// - >66% = Alto Risco (Atenção Necessária/Vermelho)
function determinarCategoriaRisco(
  media: number,
  tipo: 'positiva' | 'negativa'
): CategoriaRisco {
  if (tipo === 'positiva') {
    // Para escalas positivas: quanto maior, melhor
    if (media > 66) return 'baixo';
    if (media >= 33) return 'medio';
    return 'alto';
  } else {
    // Para escalas negativas: quanto menor, melhor
    if (media < 33) return 'baixo';
    if (media <= 66) return 'medio';
    return 'alto';
  }
}

// Função para determinar classificação semáforo
function determinarClassificacaoSemaforo(
  categoriaRisco: CategoriaRisco
): ClassificacaoSemaforo {
  switch (categoriaRisco) {
    case 'baixo':
      return 'verde';
    case 'medio':
      return 'amarelo';
    case 'alto':
      return 'vermelho';
  }
}

// Função para gerar dados gerais da empresa (Etapa 1)
export async function gerarDadosGeraisEmpresa(
  loteId: number,
  session?: any
): Promise<DadosGeraisEmpresa> {
  // Buscar informações do lote e empresa/entidade com fallback
  // Para lotes de clínica: empresa vem de empresas_clientes (via la.empresa_id)
  // Para lotes de entidade: empresa vem de entidades (via la.entidade_id)
  const loteResult = await query(
    `
    SELECT
      la.descricao,
      la.liberado_em,
      COALESCE(e.nome, ec.nome) as empresa_nome,
      COALESCE(e.cnpj, ec.cnpj) as cnpj,
      COALESCE(e.endereco, ec.endereco) as endereco,
      COALESCE(e.cidade, ec.cidade) as cidade,
      COALESCE(e.estado, ec.estado) as estado,
      COALESCE(e.cep, ec.cep) as cep,
      c.nome as clinica_nome,
      COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) as total_avaliacoes,
      COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
      MIN(a.inicio) as primeira_avaliacao,
      MAX(CASE WHEN a.status = 'concluida' THEN a.envio END) as ultima_conclusao
    FROM lotes_avaliacao la
    LEFT JOIN entidades e ON la.entidade_id = e.id
    LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
    LEFT JOIN clinicas c ON la.clinica_id = c.id
    LEFT JOIN avaliacoes a ON la.id = a.lote_id
    WHERE la.id = $1
    GROUP BY la.id, la.descricao, la.liberado_em,
             e.nome, e.cnpj, e.endereco, e.cidade, e.estado, e.cep,
             ec.nome, ec.cnpj, ec.endereco, ec.cidade, ec.estado, ec.cep,
             c.nome
  `,
    [loteId],
    session
  );

  if (loteResult.rows.length === 0) {
    throw new Error(`Lote ${loteId} não encontrado na base de dados`);
  }

  const lote = loteResult.rows[0];

  // Validação defensiva: garantir que temos dados mínimos
  if (!lote.empresa_nome) {
    console.warn(
      `[WARN] Lote ${loteId} (${lote.id}) sem empresa/tomador associado`
    );
  }

  // Buscar contagem de funcionários por nível
  const funcionariosResult = await query(
    `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN nivel_cargo = 'operacional' THEN 1 ELSE 0 END) as operacional,
      SUM(CASE WHEN nivel_cargo = 'gestao' THEN 1 ELSE 0 END) as gestao
    FROM funcionarios f
    JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
    WHERE a.lote_id = $1 AND a.status = 'concluida'
  `,
    [loteId],
    session
  );

  const funcs = funcionariosResult.rows[0] || {
    total: 0,
    operacional: 0,
    gestao: 0,
  };

  return {
    empresaAvaliada: lote.empresa_nome,
    cnpj: lote.cnpj,
    endereco: `${lote.endereco}, ${lote.cidade} - ${lote.estado}, CEP: ${lote.cep}`,
    periodoAvaliacoes: {
      dataLiberacao: lote.primeira_avaliacao
        ? formatarDataApenasData(lote.primeira_avaliacao)
        : formatarDataApenasData(lote.liberado_em),
      dataUltimaConclusao: lote.ultima_conclusao
        ? formatarDataApenasData(lote.ultima_conclusao)
        : formatarDataApenasData(lote.liberado_em),
    },
    totalFuncionariosAvaliados: parseInt(lote.avaliacoes_concluidas),
    amostra: {
      operacional: parseInt(funcs.operacional),
      gestao: parseInt(funcs.gestao),
    },
  };
}

// Função principal para calcular scores por grupo
export async function calcularScoresPorGrupo(
  loteId: number,
  session?: any
): Promise<ScoreGrupo[]> {
  // Buscar todas as respostas concluídas do lote agrupadas por grupo
  const respostasPorGrupo: { [key: number]: number[] } = {};

  // Query para buscar respostas por grupo
  const queryResult = await query(
    `
    SELECT
      r.grupo,
      r.valor
    FROM respostas r
    JOIN avaliacoes a ON r.avaliacao_id = a.id
    WHERE a.lote_id = $1 AND a.status = 'concluida'
    ORDER BY r.grupo, r.avaliacao_id
  `,
    [loteId],
    session
  );

  // Organizar respostas por grupo
  queryResult.rows.forEach((row: { grupo: number; valor: number }) => {
    const grupo = row.grupo;
    const valor = row.valor;

    if (!respostasPorGrupo[grupo]) {
      respostasPorGrupo[grupo] = [];
    }
    respostasPorGrupo[grupo].push(valor);
  });

  // Calcular estatísticas para cada grupo
  const scoresCalculados: ScoreGrupo[] = [];

  for (const grupoInfo of gruposCOPSOQ) {
    const grupo = grupoInfo.grupo;
    const valores = respostasPorGrupo[grupo] || [];

    if (valores.length === 0) {
      // Se não há respostas para o grupo, usar valores padrão
      scoresCalculados.push({
        ...grupoInfo,
        media: 0,
        desvioPadrao: 0,
        mediaMenosDP: 0,
        mediaMaisDP: 0,
        categoriaRisco: 'baixo',
        classificacaoSemaforo: 'verde',
        acaoRecomendada: 'Dados insuficientes para análise',
      });
      continue;
    }

    // Calcular média
    const media = calcularMedia(valores);

    // Calcular desvio padrão
    const desvioPadrao = calcularDesvioPadrao(valores, media);

    // Calcular média ± desvio padrão
    const mediaMenosDP = Math.max(0, media - desvioPadrao);
    const mediaMaisDP = Math.min(100, media + desvioPadrao);

    // Determinar categoria de risco usando faixas fixas de 33% e 66%
    const categoriaRisco = determinarCategoriaRisco(media, grupoInfo.tipo);

    // Determinar classificação semáforo
    const classificacaoSemaforo =
      determinarClassificacaoSemaforo(categoriaRisco);

    // Determinar ação recomendada usando a recomendação específica do grupo
    const acaoRecomendada = grupoInfo.recomendacao;

    scoresCalculados.push({
      ...grupoInfo,
      media: Number(media.toFixed(1)),
      desvioPadrao: Number(desvioPadrao.toFixed(1)),
      mediaMenosDP: Number(mediaMenosDP.toFixed(1)),
      mediaMaisDP: Number(mediaMaisDP.toFixed(1)),
      categoriaRisco,
      classificacaoSemaforo,
      acaoRecomendada,
    });
  }

  return scoresCalculados;
}
