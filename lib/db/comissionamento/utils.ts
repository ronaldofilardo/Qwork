/**
 * lib/db/comissionamento/utils.ts
 *
 * Funções utilitárias de cálculo de datas para o módulo de comissionamento.
 */

import { COMISSIONAMENTO_CONSTANTS } from '../../types/comissionamento';

/** Calcula previsão de pagamento com base na regra das 18h do dia 5 */
export function calcularPrevisaoPagamento(dataReferencia?: Date): {
  mes_pagamento: string;
  data_prevista_pagamento: string;
  prazo_nf: string;
} {
  const agora = dataReferencia ?? new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth(); // 0-indexed

  // Data de corte: dia 5 do mês seguinte ao de emissão, às 18h
  const mesPagamento = mes + 1; // mês seguinte
  const anoPagamento = mesPagamento > 11 ? ano + 1 : ano;
  const mesNormalizado = mesPagamento > 11 ? 0 : mesPagamento;

  // Primeiro dia do mês de pagamento (formato YYYY-MM-DD)
  const mesPagStr = `${anoPagamento}-${String(mesNormalizado + 1).padStart(2, '0')}-01`;

  // Dia 5 do mês de pagamento = prazo para NF
  const prazoNf = `${anoPagamento}-${String(mesNormalizado + 1).padStart(2, '0')}-${String(COMISSIONAMENTO_CONSTANTS.DIA_CORTE_NF).padStart(2, '0')}`;

  // Dia 15 do mês de pagamento = data prevista do pagamento
  const dataPrevista = `${anoPagamento}-${String(mesNormalizado + 1).padStart(2, '0')}-${String(COMISSIONAMENTO_CONSTANTS.DIA_PAGAMENTO).padStart(2, '0')}`;

  return {
    mes_pagamento: mesPagStr,
    data_prevista_pagamento: dataPrevista,
    prazo_nf: prazoNf,
  };
}

/**
 * Recalcula mes_pagamento com base no momento do envio da NF.
 * Regra: se NF enviada antes das 18h do dia 5 → ciclo do mês corrente;
 *        caso contrário → ciclo do mês seguinte.
 */
export function calcularMesPagamentoPorEnvioNf(dataEnvioNf: Date): {
  mes_pagamento: string;
  data_prevista_pagamento: string;
} {
  const dia = dataEnvioNf.getDate();
  const hora = dataEnvioNf.getHours();
  const ano = dataEnvioNf.getFullYear();
  const mes = dataEnvioNf.getMonth(); // 0-indexed

  // Enviou antes das 18h do dia 5 → ciclo deste mês
  const dentroDoPrazo =
    dia < COMISSIONAMENTO_CONSTANTS.DIA_CORTE_NF ||
    (dia === COMISSIONAMENTO_CONSTANTS.DIA_CORTE_NF &&
      hora < COMISSIONAMENTO_CONSTANTS.HORA_CORTE_NF);

  let mesAlvo: number;
  let anoAlvo: number;

  if (dentroDoPrazo) {
    mesAlvo = mes;
    anoAlvo = ano;
  } else {
    // Próximo ciclo
    mesAlvo = mes + 1;
    if (mesAlvo > 11) {
      mesAlvo = 0;
      anoAlvo = ano + 1;
    } else {
      anoAlvo = ano;
    }
  }

  const mesPagStr = `${anoAlvo}-${String(mesAlvo + 1).padStart(2, '0')}-01`;
  const dataPrevista = `${anoAlvo}-${String(mesAlvo + 1).padStart(2, '0')}-${String(COMISSIONAMENTO_CONSTANTS.DIA_PAGAMENTO).padStart(2, '0')}`;

  return { mes_pagamento: mesPagStr, data_prevista_pagamento: dataPrevista };
}
