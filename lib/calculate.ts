// Cálculo de scores para COPSOQ III

export interface Resposta {
  item: string;
  valor: number;
}

export interface ResultadoGrupo {
  grupo: number;
  dominio: string;
  score: number;
  categoria: 'baixo' | 'medio' | 'alto';
}

// Detectar e tratar pontuações anômalas
export function detectarAnomalias(
  score: number,
  tipo: 'positiva' | 'negativa'
): {
  isAnomalous: boolean;
  reason?: string;
  adjustedScore?: number;
} {
  // Detectar pontuações impossíveis
  if (score < -100 || score > 100) {
    return {
      isAnomalous: true,
      reason: 'Pontuação fora do intervalo válido (0-100)',
      adjustedScore: Math.max(0, Math.min(100, score)),
    };
  }

  // Detectar pontuações negativas em escalas positivas
  if (score < 0 && tipo === 'positiva') {
    return {
      isAnomalous: true,
      reason: 'Pontuação negativa em escala positiva',
      adjustedScore: 0,
    };
  }

  // Detectar padrões suspeitos (todas respostas iguais)
  if (
    score === 0 ||
    score === 25 ||
    score === 50 ||
    score === 75 ||
    score === 100
  ) {
    return {
      isAnomalous: true,
      reason: 'Possível padrão de resposta uniforme',
      adjustedScore: score,
    };
  }

  return { isAnomalous: false };
}

// Tratamento específico por grupo
function tratarGrupoEspecifico(score: number, grupoId: number): number {
  switch (grupoId) {
    case 1: // Demandas no Trabalho
      // Se muito baixo, pode indicar subreporte
      if (score < 10) {
        console.warn('Score muito baixo em Demandas - possível subreporte');
        return Math.max(score, 15); // Mínimo realístico
      }
      break;

    case 2: // Organização e Conteúdo
      // Grupo positivo - score negativo é problemático
      if (score < 0) {
        console.warn('Score negativo em Organização - ajustando para 0');
        return 0;
      }
      break;

    case 8: // Comportamentos Ofensivos
      // Qualquer pontuação > 0 é séria
      if (score > 0) {
        console.warn('Comportamentos ofensivos detectados');
        return Math.max(score, 25); // Garantir visibilidade do problema
      }
      break;

    case 9: // Jogos de Apostas
      // Pontuações altas precisam atenção especial
      if (score > 50) {
        console.warn('Alto risco de Jogos de Apostas detectado');
      }
      break;

    case 10: // Endividamento
      // Similar aos jogos, pontuações altas são críticas
      if (score > 75) {
        console.warn('Endividamento crítico detectado');
      }
      break;
  }

  return score;
}

// Calcular score de um grupo com tratamento de negativos
export function calcularScoreGrupo(
  respostas: Resposta[],
  tipo: 'positiva' | 'negativa',
  grupoId?: number
): number {
  if (respostas.length === 0) return 0;

  const soma = respostas.reduce((acc, r) => acc + r.valor, 0);
  let media = soma / respostas.length;

  // Detectar e corrigir anomalias
  const anomalia = detectarAnomalias(media, tipo);
  if (anomalia.isAnomalous && anomalia.adjustedScore !== undefined) {
    console.warn(`Anomalia detectada no grupo ${grupoId}: ${anomalia.reason}`);
    media = anomalia.adjustedScore;
  }

  // Tratamento específico para grupos problemáticos
  if (grupoId) {
    media = tratarGrupoEspecifico(media, grupoId);
  }

  return Math.round(media * 100) / 100; // Arredondar para 2 casas decimais
}

// Categorizar score (semáforo) com tratamento para grupos negativos
export function categorizarScore(
  score: number,
  tipo: 'positiva' | 'negativa',
  handleNegative: boolean = true
): 'baixo' | 'medio' | 'alto' {
  // Tratar pontuações negativas ou muito baixas
  if (handleNegative && score < 0) {
    // Pontuação negativa indica problema crítico
    return 'alto';
  }

  if (tipo === 'negativa') {
    // Para negativas: alto = problema sério (>66 vermelho, 33-66 amarelo, <33 verde)
    if (score > 66) return 'alto';
    if (score >= 33) return 'medio';
    return 'baixo';
  } else {
    // Para positivas: alto = ótimo (>66 verde, 33-66 amarelo, <33 vermelho)
    if (score > 66) return 'alto';
    if (score >= 33) return 'medio';
    return 'baixo';
  }
}

// Análise estatística avançada para grupos negativos
export interface AnaliseEstatistica {
  mediaGeral: number;
  mediana: number;
  desvio: number;
  outliers: number[];
  distribuicao: {
    baixo: number;
    medio: number;
    alto: number;
  };
  alertas: string[];
  recomendacoes: string[];
}

export function analisarGruposNegativos(
  resultados: ResultadoGrupo[]
): AnaliseEstatistica {
  const scores = resultados.map((r) => r.score);
  const alertas: string[] = [];
  const recomendacoes: string[] = [];

  // Cálculos estatísticos
  const mediaGeral = scores.reduce((a, b) => a + b, 0) / scores.length;
  const scoresSorted = [...scores].sort((a, b) => a - b);
  const mediana = scoresSorted[Math.floor(scoresSorted.length / 2)];

  // Desvio padrão
  const variancia =
    scores.reduce((acc, score) => acc + Math.pow(score - mediaGeral, 2), 0) /
    scores.length;
  const desvio = Math.sqrt(variancia);

  // Detectar outliers (método IQR)
  const q1 = scoresSorted[Math.floor(scoresSorted.length * 0.25)];
  const q3 = scoresSorted[Math.floor(scoresSorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = scores.filter(
    (score) => score < lowerBound || score > upperBound
  );

  // Distribuição por categoria
  const distribuicao = {
    baixo: resultados.filter((r) => r.categoria === 'baixo').length,
    medio: resultados.filter((r) => r.categoria === 'medio').length,
    alto: resultados.filter((r) => r.categoria === 'alto').length,
  };

  // Análise de grupos problemáticos
  const gruposAltos = resultados.filter((r) => r.categoria === 'alto');
  if (gruposAltos.length > 0) {
    alertas.push(
      `${gruposAltos.length} grupo(s) com pontuação alta detectado(s)`
    );

    gruposAltos.forEach((grupo) => {
      if (grupo.dominio.includes('Demandas')) {
        alertas.push('Alta carga de trabalho detectada');
        recomendacoes.push('Revisar distribuição de tarefas e prazos');
      }

      if (grupo.dominio.includes('Comportamentos Ofensivos')) {
        alertas.push('Comportamentos ofensivos no ambiente de trabalho');
        recomendacoes.push(
          'Investigar casos e implementar políticas de prevenção'
        );
      }

      if (
        grupo.dominio.includes('Jogos') ||
        grupo.dominio.includes('Endividamento')
      ) {
        alertas.push('Questões financeiras/comportamentais detectadas');
        recomendacoes.push('Oferecer suporte e orientação especializada');
      }
    });
  }

  // Análise de outliers
  if (outliers.length > 0) {
    alertas.push(`${outliers.length} pontuação(ões) anômala(s) detectada(s)`);
    recomendacoes.push(
      'Revisar respostas e considerar entrevistas individuais'
    );
  }

  // Análise de variabilidade
  if (desvio > 25) {
    alertas.push('Alta variabilidade nas respostas');
    recomendacoes.push('Analisar diferenças entre grupos e setores');
  }

  return {
    mediaGeral: Math.round(mediaGeral * 100) / 100,
    mediana: Math.round(mediana * 100) / 100,
    desvio: Math.round(desvio * 100) / 100,
    outliers,
    distribuicao,
    alertas,
    recomendacoes,
  };
}

// Calcular todos os resultados de uma avaliação
export function calcularResultados(
  respostasPorGrupo: Map<number, Resposta[]>,
  gruposTipo: Map<number, { dominio: string; tipo: 'positiva' | 'negativa' }>
): ResultadoGrupo[] {
  const resultados: ResultadoGrupo[] = [];

  respostasPorGrupo.forEach((respostas, grupoId) => {
    const grupoInfo = gruposTipo.get(grupoId);
    if (!grupoInfo) return;

    const score = calcularScoreGrupo(respostas, grupoInfo.tipo, grupoId);
    const categoria = categorizarScore(score, grupoInfo.tipo);

    resultados.push({
      grupo: grupoId,
      dominio: grupoInfo.dominio,
      score,
      categoria,
    });
  });

  return resultados;
}

// Obter cor do semáforo
export function getCorSemaforo(
  categoria: 'baixo' | 'medio' | 'alto',
  tipo: 'positiva' | 'negativa'
): string {
  if (tipo === 'negativa') {
    // Negativa: alto = vermelho (ruim)
    if (categoria === 'alto') return '#EF4444';
    if (categoria === 'medio') return '#F59E0B';
    return '#10B981';
  } else {
    // Positiva: alto = verde (bom)
    if (categoria === 'alto') return '#10B981';
    if (categoria === 'medio') return '#F59E0B';
    return '#EF4444';
  }
}

// Obter texto descritivo
export function getTextoCategoria(
  categoria: 'baixo' | 'medio' | 'alto',
  tipo: 'positiva' | 'negativa'
): string {
  if (tipo === 'negativa') {
    if (categoria === 'alto') return 'Atenção Necessária';
    if (categoria === 'medio') return 'Monitorar';
    return 'Adequado';
  } else {
    if (categoria === 'alto') return 'Excelente';
    if (categoria === 'medio') return 'Adequado';
    return 'Precisa Melhorar';
  }
}
