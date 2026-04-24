import type { TipoCliente } from '@/lib/leads-config';

export interface Lead {
  id: number;
  cnpj: string;
  razao_social: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  status: string;
  criado_em: string;
  data_expiracao: string;
  data_conversao: string | null;
  token_atual: string | null;
  token_expiracao: string | null;
  valor_negociado: number;
  tipo_cliente: TipoCliente;
  requer_aprovacao_comercial: boolean;
}

export const STATUS_COR: Record<string, string> = {
  pendente: 'bg-blue-100 text-blue-700',
  convertido: 'bg-green-100 text-green-700',
  expirado: 'bg-gray-100 text-gray-500',
  rejeitado: 'bg-red-100 text-red-700',
};

export interface NovoLeadForm {
  cnpj: string;
  razao_social: string;
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  valor_negociado: string;
  tipo_cliente: TipoCliente;
  num_vidas_estimado: string;
}

export interface ErrosCampos {
  cnpj: string;
  contato_email: string;
  contato_telefone: string;
  tipo_cliente?: string;
}
