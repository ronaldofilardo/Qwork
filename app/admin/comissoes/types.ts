export interface Comissao {
  id: number;
  representante_nome: string;
  representante_codigo: string;
  representante_email: string;
  representante_tipo_pessoa: string;
  entidade_nome: string;
  numero_laudo: string | null;
  valor_laudo: string;
  valor_comissao: string;
  percentual_comissao: string;
  status: string;
  motivo_congelamento: string | null;
  mes_emissao: string;
  mes_pagamento: string;
  data_emissao_laudo: string;
  data_aprovacao: string | null;
  data_liberacao: string | null;
  data_pagamento: string | null;
  nf_path: string | null;
  nf_nome_arquivo: string | null;
  nf_rpa_enviada_em: string | null;
  nf_rpa_aprovada_em: string | null;
  nf_rpa_rejeitada_em: string | null;
  nf_rpa_motivo_rejeicao: string | null;
}

export interface Resumo {
  total_comissoes: string;
  pendentes_nf: string;
  em_analise: string;
  liberadas: string;
  pagas: string;
  congeladas: string;
  valor_a_pagar: string;
  valor_pago_total: string;
}

export const STATUS_BADGE: Record<string, { label: string; cor: string }> = {
  retida: { label: 'Retida', cor: 'bg-gray-100 text-gray-600' },
  pendente_nf: { label: 'Aguardando NF', cor: 'bg-blue-100 text-blue-700' },
  nf_em_analise: {
    label: 'NF em Análise',
    cor: 'bg-indigo-100 text-indigo-700',
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
  pendente_nf: ['congelar', 'cancelar'],
  nf_em_analise: ['liberar', 'congelar', 'cancelar'],
  liberada: ['pagar', 'congelar', 'cancelar'],
  congelada_aguardando_admin: ['descongelar', 'cancelar'],
  congelada_rep_suspenso: ['descongelar', 'cancelar'],
  retida: ['cancelar'],
};

export const ACAO_LABEL: Record<string, string> = {
  liberar: '✅ Liberar (aprovar NF)',
  pagar: '💰 Marcar como Paga',
  congelar: '❄ Congelar',
  cancelar: '❌ Cancelar',
  descongelar: '🔓 Descongelar',
};

export function fmt(v: string | number) {
  return `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}
