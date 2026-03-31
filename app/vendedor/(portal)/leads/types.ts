import type { TipoCliente } from '@/lib/leads-config';

export interface VendedorLead {
  id: number;
  status: string;
  contato_nome: string;
  contato_email: string | null;
  contato_telefone: string | null;
  cnpj: string | null;
  valor_negociado: string | null;
  criado_em: string;
  data_conversao: string | null;
  representante_id: number;
  representante_nome: string;
  representante_codigo: string;
  tipo_cliente?: TipoCliente;
  requer_aprovacao_comercial?: boolean;
}

export interface NovoLeadVendedorForm {
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  cnpj: string;
  valor_negociado: string;
  observacoes: string;
  tipo_cliente: TipoCliente;
  num_vidas_estimado: string;
}

export interface ErrosCamposVendedor {
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  cnpj: string;
}
