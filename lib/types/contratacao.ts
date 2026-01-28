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
  contratante_id: number;
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
  contratante_id: number;
  contrato_id?: number;
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
  criado_em: string;
  atualizado_em: string;
}

// Interface estendida de Contratante
export interface ContratanteExtendido {
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
  contratante_id: number;
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

export interface AprovarContratanteDTO {
  contratante_id: number;
  admin_cpf: string;
  verificar_pagamento?: boolean; // Flag para forçar verificação de pagamento
}
