import { COMISSAO_STATUS_BADGE } from '@/lib/status-labels';

export interface Comissao {
  id: number;
  entidade_nome: string;
  laudo_id: number | null;
  lote_pagamento_id: number | null;
  valor_laudo: string;
  valor_parcela: string;
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

export const STATUS_BADGE = COMISSAO_STATUS_BADGE;

export function fmt(v: string | number | null | undefined) {
  return `R$ ${parseFloat(String(v ?? '0') || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}
