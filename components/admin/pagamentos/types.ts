export interface ParcelaDetalhe {
  numero: number;
  valor: number;
  data_vencimento: string;
  pago: boolean;
  data_pagamento: string | null;
  status?: 'pago' | 'pendente' | 'cancelado';
}

export interface Solicitacao {
  lote_id: number;
  status_pagamento: 'aguardando_cobranca' | 'aguardando_pagamento' | 'pago';
  solicitacao_emissao_em: string;
  valor_por_funcionario: number | null;
  link_pagamento_token: string | null;
  link_pagamento_enviado_em: string | null;
  link_disponibilizado_em: string | null;
  pagamento_metodo: string | null;
  pagamento_parcelas: number | null;
  pago_em: string | null;
  isento_pagamento?: boolean;
  empresa_nome: string;
  nome_tomador: string;
  solicitante_nome: string;
  solicitante_cpf: string;
  num_avaliacoes_concluidas: number;
  valor_total_calculado: number | null;
  lote_criado_em: string;
  lote_liberado_em: string;
  lote_status: string;
  // Dados do representante vinculado (vem da view atualizada)
  vinculo_id: number | null;
  representante_id: number | null;
  representante_nome: string | null;
  representante_codigo: string | null;
  representante_tipo_pessoa: string | null;
  representante_percentual_comissao: number | null;
  representante_percentual_comissao_comercial: number | null;
  comissao_gerada: boolean;
  /** Quantas comissões já foram geradas para este lote (inclui provisionadas futuras). */
  comissoes_geradas_count: number;
  /** Quantas comissões têm parcela_confirmada_em IS NOT NULL (parcela efetivamente paga). */
  comissoes_ativas_count: number;
  // Dados do laudo (já existiam na view)
  laudo_id?: number | null;
  laudo_status?: string | null;
  laudo_ja_emitido?: boolean;
  entidade_id?: number | null;
  clinica_id?: number | null;
  lead_valor_negociado?: number | null;
  modelo_comissionamento?: 'percentual' | 'custo_fixo' | null;
  valor_custo_fixo_snapshot?: number | null;
  valor_negociado_vinculo?: number | null;
  detalhes_parcelas?: ParcelaDetalhe[] | null;
  tipo_cobranca?: 'laudo' | 'manutencao' | null;
}

export type FilterTab =
  | 'todos'
  | 'aguardando_cobranca'
  | 'aguardando_pagamento'
  | 'pago'
  | 'a_vencer'
  | 'manutencao';

export interface ModalLinkState {
  isOpen: boolean;
  token: string;
  loteId: number;
  nomeTomador: string;
  valorTotal: number;
  numAvaliacoes: number;
}
