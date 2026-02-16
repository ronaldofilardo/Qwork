// ==========================================
// TIPOS PARA SISTEMA DE CONTRATAÇÃO
// ==========================================

export type TipoPlano = 'fixo' | 'personalizado';

export type MetodoPagamento =
  | 'avista'
  | 'parcelado'
  | 'boleto'
  | 'pix'
  | 'cartao';

export type StatusPagamento =
  | 'pendente'
  | 'processando'
  | 'pago'
  | 'cancelado'
  | 'estornado';

// Estender status de aprovação existente
export type StatusAprovacaoExtendido =
  | 'pendente'
  | 'em_reanalise'
  | 'aguardando_pagamento'
  | 'pago'
  | 'aprovado'
  | 'rejeitado';

// ==========================================
// INTERFACES
// ==========================================

export interface Plano {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  tipo: TipoPlano;
  caracteristicas?: Record<string, any>;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Contrato {
  id: number;
  entidade_id: number;
  plano_id: number;
  conteudo: string;
  aceito: boolean;
  ip_aceite?: string;
  data_aceite?: string;
  hash_contrato?: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Pagamento {
  id: number;
  entidade_id?: number;
  clinica_id?: number;
  contrato_id?: number;
  contratante_id?: number; // Alias para entidade_id/clinica_id (unificado)
  tomador_id?: number; // Alias legado
  valor: number;
  metodo?: MetodoPagamento;
  status: StatusPagamento;
  plataforma_id?: string;
  plataforma_nome?: string;
  dados_adicionais?: Record<string, any>;
  data_pagamento?: string;
  data_confirmacao?: string;
  comprovante_path?: string;
  observacoes?: string;
  numero_parcelas?: number;
  detalhes_parcelas?: any;

  // Campos específicos do Asaas Payment Gateway
  asaas_customer_id?: string; // ID do cliente no Asaas (cus_xxx)
  asaas_payment_url?: string; // URL de checkout para cartão
  asaas_boleto_url?: string; // URL do boleto bancário
  asaas_invoice_url?: string; // URL da fatura/invoice
  asaas_pix_qrcode?: string; // Código PIX Copia e Cola
  asaas_pix_qrcode_image?: string; // Imagem QR Code em base64
  asaas_net_value?: number; // Valor líquido após taxas Asaas
  asaas_due_date?: string; // Data de vencimento (YYYY-MM-DD)

  criado_em: string;
  atualizado_em: string;
}

// Interface estendida de tomador
export interface tomadorExtendido {
  id: number;
  tipo: 'clinica' | 'entidade';
  nome: string;
  cnpj: string;
  inscricao_estadual?: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_cargo?: string;
  responsavel_email: string;
  responsavel_celular: string;
  cartao_cnpj_path?: string;
  contrato_social_path?: string;
  doc_identificacao_path?: string;
  status: StatusAprovacaoExtendido;
  motivo_rejeicao?: string;
  observacoes_reanalise?: string;
  ativa: boolean;
  criado_em: string;
  atualizado_em?: string;
  aprovado_em?: string;
  aprovado_por_cpf?: string;

  // Novos campos
  plano_id?: number;
  pagamento_confirmado: boolean;
  data_liberacao_login?: string;

  // Dados relacionados (joins)
  plano?: Plano;
  pagamento?: Pagamento;
}

// ==========================================
// DTOs PARA OPERAÇÕES
// ==========================================

export interface IniciarPagamentoDTO {
  entidade_id: number;
  contrato_id: number | null;
  valor: number;
  metodo: MetodoPagamento;
  plataforma_nome?: string;
}

export interface ConfirmarPagamentoDTO {
  pagamento_id: number;
  plataforma_id?: string;
  dados_adicionais?: Record<string, any>;
  comprovante_path?: string;
}

export interface AprovarEntidadeDTO {
  entidade_id: number;
  admin_cpf: string;
  verificar_pagamento?: boolean; // Flag para forçar verificação de pagamento
}

// Alias para compatibilidade temporária
export type AprovartomadorDTO = AprovarEntidadeDTO;

export interface EntidadeExtendida {
  id: number;
  tipo: string;
  nome: string;
  cnpj?: string;
  inscricao_estadual?: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  responsavel_nome?: string;
  responsavel_cpf?: string;
  responsavel_cargo?: string;
  responsavel_email?: string;
  responsavel_celular?: string;
  cartao_cnpj_path?: string;
  contrato_social_path?: string;
  doc_identificacao_path?: string;
  status: string;
  motivo_rejeicao?: string;
  observacoes_reanalise?: string;
  ativa: boolean;
  criado_em: string;
  atualizado_em: string;
  aprovado_em?: string;
  aprovado_por_cpf?: string;
  plano_id?: number;
  pagamento_confirmado?: boolean;
  data_liberacao_login?: string;
  plano?: {
    id: number;
    nome: string;
    descricao?: string;
    preco: number;
    tipo: string;
    ativo: boolean;
    criado_em: string;
    atualizado_em: string;
  };
  pagamento?: {
    id: number;
    entidade_id: number;
    valor: number;
    metodo?: string;
    status: string;
    data_pagamento?: string;
    criado_em: string;
  };
}
