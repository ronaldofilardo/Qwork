// Tipos de pagamento — migrados de lib/types/contratacao.ts após remoção do sistema de proposta comercial

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
