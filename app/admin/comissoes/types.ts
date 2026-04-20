import { COMISSAO_STATUS_BADGE } from '@/lib/status-labels';

export interface Comissao {
  id: number;
  representante_nome: string;
  representante_codigo: string;
  representante_email: string;
  representante_tipo_pessoa: string;
  entidade_nome: string;
  numero_laudo: string | null;
  lote_pagamento_id: number | null;
  lote_pagamento_metodo: string | null;
  lote_pagamento_parcelas: number | null;
  valor_laudo: string;
  valor_comissao: string;
  valor_comissao_comercial?: string | null;
  percentual_comissao: string;
  status: string;
  motivo_congelamento: string | null;
  mes_emissao: string;
  mes_pagamento: string | null;
  parcela_numero: number;
  total_parcelas: number;
  data_emissao_laudo: string;
  data_aprovacao: string | null;
  data_liberacao: string | null;
  data_pagamento: string | null;
  nf_path: string | null;
  nf_nome_arquivo: string | null;
  parcela_confirmada_em: string | null;
  comprovante_pagamento_path: string | null;
  /** Percentual atual do representante (pode diferir do histórico em percentual_comissao) */
  representante_percentual?: string | null;
  /** Percentual comercial atual do vínculo (pode ser 0 em históricos — usar derivação 40−rep%) */
  vinculo_percentual_comercial?: string | null;
}

export interface Resumo {
  total_comissoes: string;
  pendentes_consolidacao: string;
  liberadas: string;
  pagas: string;
  congeladas: string;
  valor_a_pagar: string;
  valor_pago_total: string;
  valor_liberado: string;
}

export const STATUS_BADGE = COMISSAO_STATUS_BADGE;

export const ACOES_POR_STATUS: Record<string, string[]> = {
  liberada: ['pagar', 'congelar', 'cancelar'],
  congelada_aguardando_admin: ['descongelar', 'cancelar'],
  congelada_rep_suspenso: ['descongelar', 'cancelar'],
  retida: ['cancelar'],
};

/** Ações proibidas para o perfil comercial (servidor também bloqueia). */
export const ACOES_COMERCIAL_BLOQUEADAS = ['pagar'] as const;

export const ACAO_LABEL: Record<string, string> = {
  pagar: '💰 Marcar como Paga',
  congelar: '❄ Congelar',
  cancelar: '❌ Cancelar',
  descongelar: '🔓 Descongelar',
};

export function fmt(v: string | number | null | undefined) {
  return `R$ ${parseFloat(String(v ?? '0') || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}
