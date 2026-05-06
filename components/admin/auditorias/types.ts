export interface AcessoGestorUnificado {
  id: number;
  cpf: string;
  tipo: 'gestor' | 'rh';
  login_timestamp: string;
  logout_timestamp: string | null;
  ip_address: string;
  // gestor fields
  empresa_nome: string | null;
  empresa_cnpj: string | null;
  entidade_id: number | null;
  // rh fields
  clinica_id: number | null;
  clinica_nome: string | null;
}

export interface AcessoOperacional {
  id: number;
  cpf: string;
  perfil: 'suporte' | 'comercial' | 'representante' | 'vendedor';
  nome: string | null;
  cnpj: string | null;
  login_timestamp: string;
  logout_timestamp: string | null;
  ip_address: string;
}

export interface AuditoriaAvaliacao {
  avaliacao_id: number;
  cpf: string;
  lote: string;
  liberado_em: string | null;
  avaliacao_status: string;
  concluida_em: string | null;
  criado_em: string;
  empresa_nome: string | null;
  entidade_nome: string | null;
  clinica_nome: string | null;
}

export interface AuditoriaLote {
  lote_id: number;
  numero_lote: string;
  clinica_id: number | null;
  empresa_id: number | null;
  entidade_id: number | null;
  status: string;
  tipo: string | null;
  liberado_em: string | null;
  criado_em: string;
  clinica_nome: string | null;
  empresa_nome: string | null;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  mudancas_status: number;
}

export interface AuditoriaLaudo {
  laudo_id: number;
  lote_id: number;
  numero_lote: string | null;
  status: string;
  hash_pdf: string | null;
  criado_em: string;
  emitido_em: string | null;
  enviado_em: string | null;
  clinica_id: number | null;
  clinica_nome: string | null;
  empresa_id: number | null;
  empresa_cliente_nome: string | null;
  tomador_nome: string | null;
  entidade_id: number | null;
  solicitado_em: string | null;
}

// ── Cadeia de Custódia ─────────────────────────────────────────────────────

export type TimelineEventTipo = 'lote' | 'avaliacao' | 'laudo' | 'envio';

export interface TimelineEvent {
  tipo: TimelineEventTipo;
  label: string;
  timestamp: string;
  actor?: string;
  ip?: string;
  detalhe?: string;
}

export interface AuditoriaLaudoDetalhe {
  laudo: {
    laudo_id: number;
    status: string;
    hash_pdf: string | null;
    observacoes: string | null;
    criado_em: string;
    emitido_em: string | null;
    enviado_em: string | null;
    tamanho_pdf_kb: number | null;
    tem_arquivo_pdf: boolean;
    emissor_nome: string;
    emissor_cpf: string;
    arquivo_remoto_uploaded_at: string | null;
  };
  lote: {
    lote_id: number;
    status: string;
    tipo: string;
    liberado_em: string | null;
    liberado_por_nome: string | null;
    liberado_por_cpf: string | null;
    solicitacao_emissao_em: string | null;
    pago_em: string | null;
  };
  tomador: {
    nome: string;
    cnpj: string;
    tipo: 'clinica' | 'empresa' | 'entidade';
  };
  empresa_nome: string | null;
  avaliacoes_resumo: {
    concluidas: number;
  };
  timeline: TimelineEvent[];
}

export interface AuditoriaFuncionario {
  funcionario_id: number;
  cpf: string;
  nome: string;
  data_inclusao: string; // ISO date
  status_atual: boolean; // true = ativo, false = inativo
  tomador_tipo: 'rh' | 'entidade';
  tomador_nome: string;
  empresa_nome: string | null;
  setor: string | null;
}

export interface FilterStateFuncionarios {
  tomadorTipoFilter: string;
  tomadorNomeSearchText: string;
  cpfSearchText: string;
  nomeSearchText: string;
  statusFilter: string;
}

export type AuditoriaSubTab =
  | 'gestores'
  | 'avaliacoes'
  | 'lotes'
  | 'laudos'
  | 'operacionais'
  | 'aceites'
  | 'funcionarios'
  | 'delecao';

// ── Acesso Suporte ────────────────────────────────────────────────────────────

export interface AcessoSuporte {
  id: number;
  cpf: string;
  login_timestamp: string;
  logout_timestamp: string | null;
  session_duration: string | null;
  ip_address: string | null;
  user_agent: string | null;
  nome: string | null;
}

// ── Lead Abaixo do Custo Mínimo ─────────────────────────────────────────────

export interface LeadComissaoGeral {
  id: number;
  cnpj: string | null;
  razao_social: string | null;
  tipo_cliente: string;
  valor_negociado: number | null;
  percentual_comissao_representante: number | null;
  valor_custo_fixo_snapshot: number | null;
  requer_aprovacao_comercial: boolean;
  status: string;
  criado_em: string;
  representante_nome: string | null;
  representante_id: number | null;
  modelo_comissionamento: string | null;
}

export interface LeadAbaixoMinimo {
  id: number;
  cnpj: string;
  razao_social: string | null;
  contato_nome: string | null;
  tipo_cliente: string;
  valor_negociado: number | null;
  percentual_comissao: number | null;
  percentual_comissao_representante: number | null;
  num_vidas_estimado: number | null;
  requer_aprovacao_comercial: boolean;
  status: string;
  criado_em: string;
  representante_nome: string;
  representante_id: number;
}

// ── Deleção de Tomador ────────────────────────────────────────────────────

export interface DelecaoHistoricoItem {
  id: number;
  cnpj: string;
  nome: string;
  tipo: string;
  tomador_id: number;
  admin_cpf: string;
  admin_nome: string;
  resumo: Record<string, number>;
  criado_em: string;
}

export interface DelecaoPreview {
  tomador: {
    id: number;
    nome: string;
    cnpj: string;
    tipo: string;
    responsavel_cpf: string | null;
    status: string | null;
  };
  contagens: Record<string, number>;
}

// ── Aceites (consolidado por usuário) ─────────────────────────────────────

export interface AceiteUsuario {
  cpf: string;
  nome: string | null;
  perfil: string;
  aceite_contrato: boolean | null;
  aceite_contrato_em: string | null;
  aceite_termos: boolean | null;
  aceite_termos_em: string | null;
  aceite_politica_privacidade: boolean | null;
  aceite_politica_privacidade_em: string | null;
  aceite_disclaimer_nv: boolean | null;
  aceite_disclaimer_nv_em: string | null;
  confirmacao_identificacao: boolean | null;
  confirmacao_identificacao_em: string | null;
}

export interface AuditoriasContentProps {
  auditoriaSubTab: AuditoriaSubTab;
  setAuditoriaSubTab: (tab: AuditoriaSubTab) => void;
  gestores: AcessoGestorUnificado[];
  operacionais: AcessoOperacional[];
  auditoriaAvaliacoes: AuditoriaAvaliacao[];
  auditoriaLotes: AuditoriaLote[];
  auditoriaLaudos: AuditoriaLaudo[];
}

// ── Filtros para Lotes e Laudos ───────────────────────────────────────────

export interface FilterStateLotes {
  tomadorSearchText: string;
  statusFilter: string;
}

export interface FilterStateLaudos {
  tomadorSearchText: string;
  statusFilter: string;
}
