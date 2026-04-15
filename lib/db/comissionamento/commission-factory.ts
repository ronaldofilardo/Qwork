/**
 * lib/db/comissionamento/commission-factory.ts
 *
 * Helpers compartilhados para criarComissaoAdmin.
 * Centraliza lógica de cálculo de comissões de representante:
 *   - normalização de parcela/entidade
 *   - cálculo de base e valor da comissão
 *   - cálculo de datas (mes_emissao, mes_pagamento)
 */

import type { StatusComissao } from '../../types/comissionamento';
import { calcularPrevisaoPagamento } from './utils';

/** Parâmetros compartilhados entre admin e vendedor */
export interface ComissaoBaseParams {
  lote_pagamento_id: number;
  vinculo_id: number;
  representante_id: number;
  entidade_id?: number | null;
  clinica_id?: number | null;
  laudo_id?: number | null;
  valor_laudo: number;
  valor_parcela?: number | null;
  parcela_numero?: number;
  total_parcelas?: number;
  forcar_retida?: boolean;
  parcela_confirmada_em?: Date | null;
  admin_cpf?: string;
  /** % de comissão do comercial (copiado do vínculo no momento da geração) */
  percentual_comissao_comercial?: number | null;
}

/** Resultado da normalização + cálculos compartilhados */
export interface ComissaoCalculada {
  parcelaNum: number;
  totalParc: number;
  entId: number | null;
  clinId: number | null;
  baseCalculo: number;
  valorComissao: number;
  valorComissaoComercial: number;
  statusInicial: StatusComissao;
  mesEmissao: string;
  mes_pagamento: string;
  parcela_confirmada_em_iso: string | null;
}

/**
 * Centraliza TODA a lógica de cálculo compartilhada.
 * Os callers (admin/vendedor) usam o resultado para montar seus INSERTs específicos.
 */
export function calcularComissao(
  params: ComissaoBaseParams,
  percentual: number,
  repStatus: string
): ComissaoCalculada {
  const parcela_numero = params.parcela_numero ?? 1;
  const total_parcelas = params.total_parcelas ?? 1;
  const parcelaNum = Math.max(1, Math.min(parcela_numero, total_parcelas));
  const totalParc = Math.max(1, total_parcelas);

  const entId =
    params.entidade_id && params.entidade_id > 0 ? params.entidade_id : null;
  const clinId =
    params.clinica_id && params.clinica_id > 0 ? params.clinica_id : null;

  const baseCalculo =
    params.valor_parcela != null && params.valor_parcela > 0
      ? params.valor_parcela
      : params.valor_laudo / totalParc;
  const valorComissao =
    Math.round(((baseCalculo * percentual) / 100) * 100) / 100;

  const percComercial = params.percentual_comissao_comercial ?? 0;
  const valorComissaoComercial =
    percComercial > 0
      ? Math.round(((baseCalculo * percComercial) / 100) * 100) / 100
      : 0;

  const statusInicial: StatusComissao =
    params.forcar_retida || repStatus !== 'apto' ? 'retida' : 'pendente_consolidacao';

  const agora = new Date();
  const mesEmissao = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`;
  const { mes_pagamento: mesPagBase } = calcularPrevisaoPagamento(agora);
  const mesPagDate = new Date(mesPagBase + 'T00:00:00Z');
  mesPagDate.setUTCMonth(mesPagDate.getUTCMonth() + (parcelaNum - 1));
  const mes_pagamento = `${mesPagDate.getUTCFullYear()}-${String(mesPagDate.getUTCMonth() + 1).padStart(2, '0')}-01`;

  const parcela_confirmada_em_iso =
    params.parcela_confirmada_em != null
      ? params.parcela_confirmada_em.toISOString()
      : null;

  return {
    parcelaNum,
    totalParc,
    entId,
    clinId,
    baseCalculo,
    valorComissao,
    valorComissaoComercial,
    statusInicial,
    mesEmissao,
    mes_pagamento,
    parcela_confirmada_em_iso,
  };
}
