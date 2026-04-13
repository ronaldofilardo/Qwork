export interface VendedorLead {
  id: number;
  status: string;
  contato_nome: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  cnpj: string | null;
  valor_negociado: number | null;
  criado_em: string;
  data_conversao: string | null;
  representante_id: number;
  representante_nome: string | null;
  representante_codigo: string | null;
}
