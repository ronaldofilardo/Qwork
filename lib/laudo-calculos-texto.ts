/**
 * Funções de geração de texto para laudos COPSOQ III.
 * Inclui: ação recomendada, observações/conclusão e interpretação/recomendações.
 *
 * Extraído de lib/laudo-calculos.ts para separar lógica de texto/apresentação
 * da lógica de cálculo estatístico.
 */

import { formatarDataApenasData } from './pdf/timezone-helper';
import type {
  ScoreGrupo,
  ClassificacaoSemaforo,
  ObservacoesConclusao,
  InterpretacaoRecomendacoes,
} from './laudo-tipos';

/** Retorna texto de ação recomendada com base na classificação semáforo */
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

/** Gera observações legais e conclusão do laudo (Etapa 4) */
export function gerarObservacoesConclusao(
  _observacoesEmissor?: string
): ObservacoesConclusao {
  const textoConclusao = `Este laudo, por si só, não pode diagnosticar uma patologia, mas pode indicar a presença de sintomas, do ponto de vista coletivo.
Um diagnóstico clínico de cada avaliado somente pode ser feito pelo seu psicólogo, médico do trabalho, psiquiatra ou outro profissional de saúde qualificado.

Declaro que os dados são estritamente agregados e anônimos, em conformidade com a LGPD e o Código de Ética Profissional do Psicólogo.`;

  const dataEmissao = new Date();
  const dataEmissaoFormatada = formatarDataApenasData(dataEmissao);

  // Calcular data de validade: data de emissão + 364 dias
  const dataValidade = new Date(dataEmissao);
  dataValidade.setDate(dataValidade.getDate() + 364);
  const dataValidadeFormatada = formatarDataApenasData(dataValidade);

  const observacoesLaudo = `O PCMSO é um programa contínuo previsto na NR 7, voltado à prevenção e ao controle de danos à saúde relacionados ao trabalho, devendo ser elaborado com base nos riscos identificados no PGR. A norma não fixa um "vencimento" pontual do programa, mas exige planejamento e acompanhamento ao longo de cada ano, com integração aos riscos ocupacionais atualizados. Para fins de PGR e fiscalização (inclusive no MT), recomenda se considerar que: 1. O PCMSO deve estar sempre vigente e coerente com o PGR atual. 2. Na prática, é renovado/analisado ao menos uma vez por ano, com relatório analítico anual. 3. Qualquer alteração de riscos ou atualização do PGR exige revisão imediata do PCMSO, ainda que antes de 1 ano. Portanto, <strong>o presente laudo tem uma validade sugerida de doze meses ou até <span style="font-size: 14pt; font-weight: bold;">${dataValidadeFormatada}</span></strong>.`;

  return {
    observacoesLaudo,
    textoConclusao,
    dataEmissao: `Curitiba, ${dataEmissaoFormatada}`,
    assinatura: {
      nome: 'GILSON DANTAS DAMASCENO',
      titulo: 'Psicólogo',
      registro: 'CRP 08/4053',
      empresa: 'Responsável Técnico',
    },
  };
}

/** Gera interpretação narrativa e recomendações agrupadas por risco (Etapa 3) */
export function gerarInterpretacaoRecomendacoes(
  empresaNome: string,
  scores: ScoreGrupo[]
): InterpretacaoRecomendacoes {
  const gruposBaixoRisco = scores.filter((s) => s.categoriaRisco === 'baixo');
  const gruposMedioRisco = scores.filter((s) => s.categoriaRisco === 'medio');
  const gruposAltoRisco = scores.filter((s) => s.categoriaRisco === 'alto');

  let textoPrincipal = `A ${empresaNome} apresenta `;

  if (gruposBaixoRisco.length > 0) {
    const nomesBaixoRisco = gruposBaixoRisco
      .map((g) => `${g.grupo} - ${g.dominio}`)
      .join(', ');
    textoPrincipal += `os indicadores Excelente nos grupos ${nomesBaixoRisco} que são importantes fatores de proteção e devem ser valorizados e mantidos. `;
  }

  if (gruposMedioRisco.length > 0) {
    const nomesMedioRisco = gruposMedioRisco
      .map((g) => `${g.grupo} - ${g.dominio}`)
      .join(', ');
    textoPrincipal += `${gruposMedioRisco.length} dimensão(ões) classificada(s) como Atenção Necessária (${nomesMedioRisco}) onde essa(s) área(s) requer(em) atenção por parte da instituição com intervenção imediata para prevenção de riscos psicossociais. `;
  }

  if (gruposAltoRisco.length > 0) {
    const nomesAltoRisco = gruposAltoRisco
      .map((g) => `${g.grupo} - ${g.dominio}`)
      .join(', ');
    textoPrincipal += `Além disso, apresenta ${gruposAltoRisco.length} dimensão(ões) de alto risco (${nomesAltoRisco}) que requerem ação corretiva urgente.`;
  }

  const conclusao = `A amostragem foi submetida à avaliação psicossocial utilizando o questionário COPSOQ III (médio). Para cada grupo do COPSOQ III seguem recomendações e práticas para inclusão imediata no Programa de Gerenciamento de Riscos (PGR), alinhadas à NR-1. Priorizar medidas coletivas preventivas, com monitoramento de eficácia por indicadores claros (como redução de escores no questionário, absenteísmo ou relatos), responsáveis definidos (ex.: RH, SESMT, gestores) e prazos sugeridos (30-90 dias iniciais, com revisão anual). Combinar intervenções organizacionais acolhedoras com suporte complementar em saúde, promover ambiente de trabalho mais equilibrado e sustentável, em conformidade com as fiscalizações do Ministério do Trabalho.`;

  return {
    textoPrincipal,
    gruposAtencao: gruposMedioRisco,
    gruposMonitoramento: gruposMedioRisco,
    gruposExcelente: gruposBaixoRisco,
    gruposAltoRisco,
    conclusao,
  };
}
