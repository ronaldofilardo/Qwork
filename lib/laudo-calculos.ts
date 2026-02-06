// Import necessário para queries
import { query } from './db';
import {
  DadosGeraisEmpresa,
  ScoreGrupo,
  CategoriaRisco,
  ClassificacaoSemaforo,
  ObservacoesConclusao,
  InterpretacaoRecomendacoes,
} from './laudo-tipos';

// Definição dos grupos COPSOQ conforme especificado
// Metodologia: Tercis fixos de 33% e 66% da escala 0-100
export const gruposCOPSOQ = [
  {
    grupo: 1,
    dominio: 'Demandas no Trabalho',
    descricao: 'Avaliação das exigências quantitativas e ritmo de trabalho',
    tipo: 'negativa' as const,
    recomendacao:
      'Para equilibrar exigências quantitativas e ritmo acelerado, revisar metas com participação da equipe via reuniões participativas, dimensionar adequadamente os quadros de pessoal com análise de turnover e carga horária pelo SESMT, implementar pausas regulares e planejadas conforme NR-17 (ergonomia), registrar tudo no Inventário de Riscos do PGR com matriz de priorização por severidade/probabilidade. Abordagem acolher o bem-estar diário dos trabalhadores, complementar por orientação contínua em saúde com clínicos gerais e profissionais multidisciplinares para acolher sinais iniciais de fadiga física/emocional, ajudar todos manterem o ritmo produtivo sem desgaste excessivo ou afastamentos por LER/DORT.',
  },
  {
    grupo: 2,
    dominio: 'Organização e Conteúdo do Trabalho',
    descricao:
      'Influência, desenvolvimento de habilidades e significado do trabalho',
    tipo: 'positiva' as const,
    recomendacao:
      'Criar comitês participativos permanentes para decisões sobre processos produtivos, oferecer capacitações regulares certificadas pelo RH em desenvolvimento de competências técnicas e comportamentais, definir papéis claros com feedback estruturado quinzenal sobre o impacto do trabalho nos objetivos organizacionais, documentar avanços no PGR para fomentar desenvolvimento contínuo e significado profissional mensurável. Estrutura valorizar cada contribuição individual e coletiva, orientação acessível em saúde com orientadores profissionais para esclarecer dúvidas sobre crescimento profissional, trilhas de carreira e equilíbrio cotidiano entre tarefas e aspirações, criar ciclo virtuoso de motivação e retenção de talentos.',
  },
  {
    grupo: 3,
    dominio: 'Relações Sociais e Liderança',
    descricao: 'Apoio social, feedback e reconhecimento no trabalho',
    tipo: 'positiva' as const,
    recomendacao:
      'Investir em treinamentos acolhedores para gestores sobre feedback construtivo (modelo SBI), mediação de conflitos certificada por psicólogos organizacionais e rituais de equipe semanais para apoio social e reconhecimento genuíno via programas de bonificação não financeira, registrar resultados no PGR com pesquisas de clima organizacional trimestrais validadas. Práticas construir laços sólidos e respeitosos entre pares e liderança, apoiar por suporte psicológico breve com psicólogos clínicos especializados em dinâmicas laborais para navegar tensões interpessoais com serenidade, confiança renovada e redução de litígios trabalhistas.',
  },
  {
    grupo: 4,
    dominio: 'Interface Trabalho-Indivíduo',
    descricao: 'Insegurança no trabalho e conflito trabalho-família',
    tipo: 'negativa' as const,
    recomendacao:
      'Adotar políticas de flexibilidade horária flexível (banco de horas, home office regulado), transparência em reestruturações com comunicação empática prévia por escrito e reuniões town hall, integrar ao PGR para minimizar insegurança laboral e conflitos trabalho-família com análise de jornadas pelo SESMT. Cuidado equilibrar vida profissional e pessoal de forma humanizada e legalmente sustentável, complementar por terapia focada com psicólogos especializados em equilíbrio vida-trabalho oferecer ferramentas rápidas e comprovadas para harmonizar esses mundos com mais leveza e menor impacto na saúde familiar.',
  },
  {
    grupo: 5,
    dominio: 'Valores Organizacionais',
    descricao: 'Confiança, justiça e respeito mútuo na organização',
    tipo: 'positiva' as const,
    recomendacao:
      'Elaborar e divulgar código de ética robusto aprovado pelo Comitê de Compliance, manter canais confidenciais de denúncia 24h com fluxos de apuração em até 72h e critérios transparentes de avaliação 360° e recompensas por mérito documentados, atualizar PGR com evidências de aplicação e auditorias internas semestrais. Base fortalecer confiança mútua e respeito diário entre todos os níveis hierárquicos, enriquecer por acompanhamento psicológico com especialistas em ética organizacional acolher percepções de injustiça ou verticalização excessiva, promover senso renovado de pertencimento e alinhamento cultural.',
  },
  {
    grupo: 6,
    dominio: 'Traços de Personalidade',
    descricao: 'Autoeficácia e autoconfiança',
    tipo: 'positiva' as const,
    recomendacao:
      'Oferecer oficinas voluntárias e integradas ao PCMSO para desenvolver autoeficácia via metodologias cognitivo-comportamentais e confiança com assessments psicométricos validados, enfatizar resultados agregados anônimos no PGR, evitar individualizações estigmatizantes com foco exclusivo em prevenção coletiva. Iniciativa empoderar de dentro para fora com suporte técnico-científico, suporte psicológico direcionado com psicólogos do trabalho nutrir autoconfiança sob pressões operacionais rotineiras, permitir cada colaborador florescer no seu melhor potencial produtivo sustentável.',
  },
  {
    grupo: 7,
    dominio: 'Saúde e Bem-Estar',
    descricao: 'Avaliação de estresse, burnout e sintomas somáticos',
    tipo: 'negativa' as const,
    recomendacao:
      'Lançar campanhas permanentes sobre ergonomia certificada NR-17, sono restaurador com orientações do médico do trabalho, atividade física leve via programas corporativos com educadores físicos, estabelecer fluxos claros para PCMSO com exames admissionais/periodicos ampliados, monitorar sintomas no PGR para prevenção proativa de burnout e somatizações. Ações cuidar corpo e mente de forma integrada e holística, avaliação clínica geral com médicos, orientação nutricional personalizada com nutricionistas e suporte amplo em saúde com equipes multidisciplinares aliviar estresse crônico e burnout com passos simples, eficazes e mensuráveis por indicadores de saúde ocupacional.',
  },
  {
    grupo: 8,
    dominio: 'Comportamentos Ofensivos',
    descricao: 'Exposição a assédio e violência no trabalho',
    tipo: 'negativa' as const,
    recomendacao:
      'Instituir política de tolerância zero ao assédio moral/sexual e violência (Lei 14.457/22), realizar treinamentos anuais obrigatórios com psicólogos organizacionais e apurações ágeis e imparciais em até 5 dias úteis com comitês bipartites, documentar incidentes e ações corretivas no PGR para proteção coletiva auditável. Compromisso proteger dignidade de todos os trabalhadores, apoiar por terapia psicológica especializada com psicólogos clínicos em trauma laboral restaurar paz interior após exposições a situações agressivas ou abusivas, com acompanhamento pós-intervenção e reinserção segura.',
  },
  {
    grupo: 9,
    dominio: 'Comportamento de Jogo',
    descricao: 'Avaliação de comportamentos relacionados a Jogos de Apostas',
    tipo: 'negativa' as const,
    recomendacao:
      'Promover campanhas educativas sobre riscos de apostas patológicas com psiquiatras especializados, implementar bloqueios técnicos em ambientes corporativos (redes WI-FI, terminais) e avaliar impactos via PCMSO com exames neuropsicológicos quando indicado, registrar no PGR com foco preventivo e indicadores comportamentais. Prevenção gentil e firme com embasamento científico, complementar por suporte psicológico breve com psicólogos cognitivo-comportamentais guiar padrões comportamentais compulsivos para escolhas mais conscientes, equilibradas no dia a dia laboral e pessoal.',
  },
  {
    grupo: 10,
    dominio: 'Endividamento Financeiro',
    descricao: 'Avaliação do nível de endividamento e estresse financeiro',
    tipo: 'negativa' as const,
    recomendacao:
      'Realizar workshops práticos de educação financeira com planejadores financeiros certificados (CFP), revisar políticas de consignados e adiantamentos com auditoria interna para evitar superendividamento, monitorar no PGR ligado a estresse somático com indicadores de absentismo por motivos financeiros. Ajuda estrutural aliviar pesos reais e crônicos das famílias trabalhadoras, consulta clínica geral com médicos ocupacionais ou orientação contínua com equipes de saúde cuidar ecos físicos do estresse financeiro prolongado (hipertensão, insônia), restaurar estabilidade com empatia técnica e acompanhamento longitudinal.',
  },
];

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
  loteId: number
): Promise<DadosGeraisEmpresa> {
  // Buscar informações do lote e empresa/entidade com fallback
  const loteResult = await query(
    `
    SELECT
      la.descricao,
      
      la.liberado_em,
      COALESCE(ec.nome, cont.nome) as empresa_nome,
      COALESCE(ec.cnpj, cont.cnpj) as cnpj,
      COALESCE(ec.endereco, cont.endereco) as endereco,
      COALESCE(ec.cidade, cont.cidade) as cidade,
      COALESCE(ec.estado, cont.estado) as estado,
      COALESCE(ec.cep, cont.cep) as cep,
      COALESCE(c.nome, cont.nome) as clinica_nome,
      COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) as total_avaliacoes,
      COUNT(CASE WHEN a.status = 'concluido' THEN 1 END) as avaliacoes_concluidas,
      MIN(a.inicio) as primeira_avaliacao,
      MAX(CASE WHEN a.status = 'concluido' THEN a.envio END) as ultima_conclusao
    FROM lotes_avaliacao la
    LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
    LEFT JOIN clinicas c ON ec.clinica_id = c.id
    LEFT JOIN contratantes cont ON la.contratante_id = cont.id
    LEFT JOIN avaliacoes a ON la.id = a.lote_id
    WHERE la.id = $1
    GROUP BY la.id, la.descricao, la.liberado_em, ec.nome, ec.cnpj, ec.endereco, ec.cidade, ec.estado, ec.cep, c.nome, cont.nome, cont.cnpj, cont.endereco, cont.cidade, cont.estado, cont.cep
  `,
    [loteId]
  );

  if (loteResult.rows.length === 0) {
    throw new Error(`Lote ${loteId} não encontrado na base de dados`);
  }

  const lote = loteResult.rows[0];

  // Validação defensiva: garantir que temos dados mínimos
  if (!lote.empresa_nome) {
    console.warn(
      `[WARN] Lote ${loteId} (${lote.id}) sem empresa/contratante associado`
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
    WHERE a.lote_id = $1 AND a.status = 'concluido'
  `,
    [loteId]
  );

  const funcs = funcionariosResult.rows[0] || {
    total: 0,
    operacional: 0,
    gestao: 0,
  };

  const percentualConclusao =
    lote.total_avaliacoes > 0
      ? Math.round((lote.avaliacoes_concluidas / lote.total_avaliacoes) * 100)
      : 0;

  return {
    empresaAvaliada: lote.empresa_nome,
    cnpj: lote.cnpj,
    endereco: `${lote.endereco}, ${lote.cidade} - ${lote.estado}, CEP: ${lote.cep}`,
    periodoAvaliacoes: {
      dataLiberacao: lote.primeira_avaliacao
        ? new Date(lote.primeira_avaliacao).toLocaleDateString('pt-BR')
        : new Date(lote.liberado_em).toLocaleDateString('pt-BR'),
      dataUltimaConclusao: lote.ultima_conclusao
        ? new Date(lote.ultima_conclusao).toLocaleDateString('pt-BR')
        : new Date(lote.liberado_em).toLocaleDateString('pt-BR'),
    },
    totalFuncionariosAvaliados: parseInt(lote.avaliacoes_concluidas),
    percentualConclusao,
    amostra: {
      operacional: parseInt(funcs.operacional),
      gestao: parseInt(funcs.gestao),
    },
  };
}

// Função principal para calcular scores por grupo
export async function calcularScoresPorGrupo(
  loteId: number
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
    WHERE a.lote_id = $1 AND a.status = 'concluido'
    ORDER BY r.grupo, r.avaliacao_id
  `,
    [loteId]
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

// Função para determinar ação recomendada
export function determinarAcaoRecomendada(
  classificacao: ClassificacaoSemaforo
): string {
  switch (classificacao) {
    case 'verde':
      return 'Manter; monitorar anualmente';
    case 'amarelo':
      return 'Atenção; intervenções preventivas (treinamentos)';
    case 'vermelho':
      return 'Ação imediata; plano de mitigação (PGR/NR-1)';
  }
}

// Função para gerar observações e conclusão (Etapa 4)
export function gerarObservacoesConclusao(
  _observacoesEmissor?: string
): ObservacoesConclusao {
  const textoConclusao = `Este laudo, por si só, não pode diagnosticar uma patologia, mas pode indicar a presença de sintomas, do ponto de vista coletivo.
Um diagnóstico clínico de cada avaliado somente pode ser feito pelo seu psicólogo, médico do trabalho, psiquiatra ou outro profissional de saúde qualificado.

Declaro que os dados são estritamente agregados e anônimos, em conformidade com a LGPD e o Código de Ética Profissional do Psicólogo.`;

  const dataEmissao = new Date();
  const dataEmissaoFormatada = dataEmissao.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Calcular data de validade: data de emissão + 364 dias
  const dataValidade = new Date(dataEmissao);
  dataValidade.setDate(dataValidade.getDate() + 364);
  const dataValidadeFormatada = dataValidade.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const observacoesLaudo = `O PCMSO é um programa contínuo previsto na NR 7, voltado à prevenção e ao controle de danos à saúde relacionados ao trabalho, devendo ser elaborado com base nos riscos identificados no PGR. A norma não fixa um "vencimento" pontual do programa, mas exige planejamento e acompanhamento ao longo de cada ano, com integração aos riscos ocupacionais atualizados. Para fins de PGR e fiscalização (inclusive no MT), recomenda se considerar que: 1. O PCMSO deve estar sempre vigente e coerente com o PGR atual. 2. Na prática, é renovado/analisado ao menos uma vez por ano, com relatório analítico anual. 3. Qualquer alteração de riscos ou atualização do PGR exige revisão imediata do PCMSO, ainda que antes de 1 ano. Portanto, <strong>o presente laudo tem uma validade sugerida de doze meses ou até <span style="font-size: 14pt; font-weight: bold;">${dataValidadeFormatada}</span></strong>.`;

  return {
    observacoesLaudo,
    textoConclusao,
    dataEmissao: `São Paulo, ${dataEmissaoFormatada}`,
    assinatura: {
      nome: 'Dr. Marcelo Oliveira',
      titulo: 'Psicólogo',
      registro: 'CRP 06/123456',
      empresa: 'Coordenador Responsável Técnico – Qwork',
    },
  };
}

// Função para gerar interpretação e recomendações (Etapa 3)
export function gerarInterpretacaoRecomendacoes(
  empresaNome: string,
  scores: ScoreGrupo[]
): InterpretacaoRecomendacoes {
  // Classificar grupos por categoria de risco
  const gruposBaixoRisco = scores.filter((s) => s.categoriaRisco === 'baixo');
  const gruposMedioRisco = scores.filter((s) => s.categoriaRisco === 'medio');
  const gruposAltoRisco = scores.filter((s) => s.categoriaRisco === 'alto');

  // Gerar texto principal na ordem: baixo risco → médio risco → alto risco
  let textoPrincipal = `A ${empresaNome} apresenta `;

  // 1. Primeiro: dimensões de baixo risco (Excelente)
  if (gruposBaixoRisco.length > 0) {
    const nomesBaixoRisco = gruposBaixoRisco
      .map((g) => `${g.grupo} - ${g.dominio}`)
      .join(', ');
    textoPrincipal += `os indicadores Excelente nos grupos ${nomesBaixoRisco} que são importantes fatores de proteção e devem ser valorizados e mantidos. `;
  }

  // 2. Segundo: dimensões de risco médio (Atenção Necessária)
  if (gruposMedioRisco.length > 0) {
    const nomesMedioRisco = gruposMedioRisco
      .map((g) => `${g.grupo} - ${g.dominio}`)
      .join(', ');
    textoPrincipal += `${gruposMedioRisco.length} dimensão(ões) classificada(s) como Atenção Necessária (${nomesMedioRisco}) onde essa(s) área(s) requer(em) atenção por parte da instituição com intervenção imediata para prevenção de riscos psicossociais. `;
  }

  // 3. Terceiro: dimensões de alto risco
  if (gruposAltoRisco.length > 0) {
    const nomesAltoRisco = gruposAltoRisco
      .map((g) => `${g.grupo} - ${g.dominio}`)
      .join(', ');
    textoPrincipal += `Além disso, apresenta ${gruposAltoRisco.length} dimensão(ões) de alto risco (${nomesAltoRisco}) que requerem ação corretiva urgente.`;
  }

  // Conclusão padrão
  const conclusao = `A amostragem foi submetida à avaliação psicossocial utilizando o questionário COPSOQ III (médio). Para cada grupo do COPSOQ III seguem recomendações e práticas para inclusão imediata no Programa de Gerenciamento de Riscos (PGR), alinhadas à NR-1. Priorizar medidas coletivas preventivas, com monitoramento de eficácia por indicadores claros (como redução de escores no questionário, absenteísmo ou relatos), responsáveis definidos (ex.: RH, SESMT, gestores) e prazos sugeridos (30-90 dias iniciais, com revisão anual). Combinar intervenções organizacionais acolhedoras com suporte complementar em saúde, promover ambiente de trabalho mais equilibrado e sustentável, em conformidade com as fiscalizações do Ministério do Trabalho.`;

  return {
    textoPrincipal,
    gruposAtencao: gruposMedioRisco, // manter compatibilidade com interface existente
    gruposMonitoramento: gruposMedioRisco,
    gruposExcelente: gruposBaixoRisco,
    gruposAltoRisco,
    conclusao,
  };
}
