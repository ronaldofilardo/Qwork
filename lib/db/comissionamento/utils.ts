/**
 * lib/db/comissionamento/utils.ts
 *
 * Funções utilitárias de cálculo de datas para o módulo de comissionamento.
 */

import { COMISSIONAMENTO_CONSTANTS } from '../../types/comissionamento';

/** Calcula previsão de pagamento: mês seguinte ao de emissão, dia 15 */
export function calcularPrevisaoPagamento(dataReferencia?: Date): {
  mes_pagamento: string;
  data_prevista_pagamento: string;
} {
  const agora = dataReferencia ?? new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth(); // 0-indexed

  const mesPagamento = mes + 1; // mês seguinte
  const anoPagamento = mesPagamento > 11 ? ano + 1 : ano;
  const mesNormalizado = mesPagamento > 11 ? 0 : mesPagamento;

  const mesPagStr = `${anoPagamento}-${String(mesNormalizado + 1).padStart(2, '0')}-01`;
  const dataPrevista = `${anoPagamento}-${String(mesNormalizado + 1).padStart(2, '0')}-${String(COMISSIONAMENTO_CONSTANTS.DIA_PAGAMENTO).padStart(2, '0')}`;

  return {
    mes_pagamento: mesPagStr,
    data_prevista_pagamento: dataPrevista,
  };
}
