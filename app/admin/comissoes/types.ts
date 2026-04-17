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
}

export interface Resumo {
  total_comissoes: string;
  pendentes_consolidacao: string;
  liberadas: string;
  pagas: string;
  congeladas: string;
  valor_a_pagar: string;
  valor_pago_total: string;
}

export const STATUS_BADGE: Record<string, { label: string; cor: string }> = {
  retida: { label: 'Retida', cor: 'bg-gray-100 text-gray-600' },
  // pendente_consolidacao: mantido como legado para exibir dados antigos do DB
  pendente_consolidacao: {
    label: 'Legado (Ciclo)',
    cor: 'bg-gray-200 text-gray-500',
  },
  pendente_nf: {
    label: 'Legado (NF)',
    cor: 'bg-gray-200 text-gray-500',
  },
  nf_em_analise: {
    label: 'Legado (Análise)',
    cor: 'bg-gray-200 text-gray-500',
  },
  congelada_rep_suspenso: {
    label: 'Congelada (Suspensão)',
    cor: 'bg-orange-100 text-orange-700',
  },
  congelada_aguardando_admin: {
    label: 'Aguardando Admin',
    cor: 'bg-yellow-100 text-yellow-700',
  },
  liberada: { label: 'Liberada', cor: 'bg-purple-100 text-purple-700' },
  paga: { label: 'Paga', cor: 'bg-green-100 text-green-700' },
  cancelada: { label: 'Cancelada', cor: 'bg-red-100 text-red-600' },
};

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

export function fmt(v: string | number) {
  return `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}
