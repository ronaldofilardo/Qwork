export type StatusPagamento =
  | 'aguardando_cobranca'
  | 'aguardando_pagamento'
  | 'pago';

export interface SolicitacaoEmissao {
  lote_id: number;
  status: string;
  status_pagamento: StatusPagamento | null;
  solicitacao_emissao_em: string | null;
  valor_por_funcionario: number | null;
  link_pagamento_token: string | null;
  link_pagamento_enviado_em: string | null;
  pagamento_metodo: string | null;
  pagamento_parcelas: number | null;
  pago_em: string | null;
  num_avaliacoes_concluidas: number;
  valor_total_calculado: number | null;
  clinica_id: number | null;
  clinica_nome: string | null;
  clinica_cnpj: string | null;
  empresa_id: number | null;
  empresa_nome: string | null;
  /** @deprecated Use entidade_id instead - legacy field for backward compatibility */
  contratante_id: number | null;
  entidade_id: number | null;
  entidade_nome: string | null;
  entidade_cnpj: string | null;
  tipo_solicitante: 'rh' | 'gestor' | null;
  solicitante_cpf: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface LinkPagamento {
  token: string;
  link_pagamento: string;
  valor_total: number;
}

export interface DadosPagamentoEmissao {
  lote_id: number;
  num_avaliacoes: number;
  valor_por_funcionario: number;
  valor_total: number;
  nome_tomador: string;
  nome_empresa: string | null;
  cnpj_tomador: string;
  enviado_em: string;
  tomador_id?: number; // Para integração Asaas
}

export interface ConfirmacaoPagamento {
  metodo_pagamento: 'pix' | 'cartao' | 'boleto' | 'transferencia';
  num_parcelas: number;
  valor_total: number;
}
