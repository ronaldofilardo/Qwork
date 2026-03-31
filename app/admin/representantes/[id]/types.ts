export interface RepProfile {
  id: number;
  nome: string;
  email: string;
  codigo: string;
  status: string;
  tipo_pessoa: string;
  cpf: string | null;
  cnpj: string | null;
  telefone: string | null;
  criado_em: string;
  aprovado_em: string | null;
  pix_chave: string | null;
  pix_tipo: string | null;
  banco_codigo: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: string | null;
  titular_conta: string | null;
  dados_bancarios_status: string | null;
  dados_bancarios_solicitado_em: string | null;
  dados_bancarios_confirmado_em: string | null;
  percentual_comissao: string | null;
  total_leads: string;
  leads_convertidos: string;
  leads_pendentes: string;
  leads_expirados: string;
  leads_a_vencer_30d: string;
  total_vinculos: string;
  vinculos_ativos: string;
  vinculos_suspensos: string;
  vinculos_inativos: string;
  vinculos_a_vencer_30d: string;
  total_comissoes: string;
  valor_total_pago: string;
  valor_pendente: string;
}

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
  entidade_nome: string | null;
  tipo_conversao: string | null;
  vence_em_breve: boolean;
  valor_negociado?: number | null;
}

export interface Vinculo {
  id: number;
  entidade_id: number;
  entidade_nome: string | null;
  entidade_cnpj: string | null;
  lead_razao_social: string | null;
  lead_valor_negociado: number | null;
  status: string;
  data_inicio: string;
  data_expiracao: string;
  ultimo_laudo_em: string | null;
  criado_em: string;
  encerrado_em: string | null;
  encerrado_motivo: string | null;
  vence_em_breve: boolean;
  sem_laudo_recente: boolean;
}
