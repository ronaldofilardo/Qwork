/* ------------------------------------------------------------------ */
/* Tipos compartilhados: Representantes + Leads/Candidatos            */
/* ------------------------------------------------------------------ */

export interface Representante {
  id: number;
  nome: string;
  email: string;
  status: string;
  tipo_pessoa: string;
  criado_em: string;
  total_leads: string;
  leads_convertidos: string;
  vinculos_ativos: string;
  valor_total_pago: string;
  comissoes_pendentes_pagamento: string | null;
  percentual_comissao?: string | null;
  dados_bancarios_status?: string | null;
  dados_bancarios_solicitado_em?: string | null;
  dados_bancarios_confirmado_em?: string | null;
}

export interface Lead {
  id: string;
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  email: string;
  telefone: string;
  cpf: string | null;
  cnpj: string | null;
  razao_social: string | null;
  cpf_responsavel: string | null;
  doc_cpf_filename: string | null;
  doc_cpf_key: string | null;
  doc_cpf_url: string | null;
  doc_cnpj_filename: string | null;
  doc_cnpj_key: string | null;
  doc_cnpj_url: string | null;
  doc_cpf_resp_filename: string | null;
  doc_cpf_resp_key: string | null;
  doc_cpf_resp_url: string | null;
  status: string;
  motivo_rejeicao: string | null;
  verificado_em: string | null;
  verificado_por: string | null;
  convertido_em: string | null;
  representante_id: number | null;
  ip_origem: string | null;
  criado_em: string;
  cpf_conflict: { origem: string; tipo_usuario: string } | null;
  convite_token?: string | null;
  aceite_termos?: boolean | null;
}

export type TabAtiva = 'representantes' | 'candidatos';

export type RepDocItem = { url: string; filename: string } | null;
export type RepDocsCache = {
  tipo_pessoa: string;
  documentos: {
    doc_cpf?: RepDocItem;
    doc_cnpj?: RepDocItem;
    doc_cpf_resp?: RepDocItem;
  };
} | null;
