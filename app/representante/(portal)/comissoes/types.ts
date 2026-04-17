export interface Comissao {
  id: number;
  entidade_nome: string;
  valor_laudo: string;
  valor_comissao: string;
  percentual_comissao: string;
  status: string;
  mes_emissao: string;
  mes_pagamento: string;
  data_emissao_laudo: string;
  data_pagamento: string | null;
  numero_laudo: string | null;
  motivo_congelamento: string | null;
  comprovante_pagamento_path: string | null;
  parcela_numero: number | null;
  total_parcelas: number | null;
  parcela_confirmada_em: string | null;
}

export interface Resumo {
  pendentes: string;
  liberadas: string;
  pagas: string;
  valor_pendente: string;
  valor_futuro: string;
  valor_liberado: string;
  valor_pago_total: string;
}

export const STATUS_BADGE: Record<string, { label: string; cor: string }> = {
  retida: { label: 'Retida', cor: 'bg-gray-100 text-gray-600' },
  congelada_aguardando_admin: {
    label: 'Aguardando Admin',
    cor: 'bg-yellow-100 text-yellow-700',
  },
  liberada: { label: 'Liberada', cor: 'bg-purple-100 text-purple-700' },
  paga: { label: 'Paga', cor: 'bg-green-100 text-green-700' },
  cancelada: { label: 'Cancelada', cor: 'bg-red-100 text-red-600' },
};

export function fmt(v: string | number) {
  return `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}
