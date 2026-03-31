export interface AcessoGestor {
  id: number;
  cpf: string;
  clinica_id: number | null;
  empresa_id: number | null;
  empresa_nome: string | null;
  empresa_cnpj: string | null;
  login_timestamp: string;
  logout_timestamp: string | null;
  session_duration: string | null;
  ip_address: string;
}

export interface AcessoRH {
  id: number;
  cpf: string;
  clinica_id: number;
  clinica_nome: string;
  login_timestamp: string;
  logout_timestamp: string | null;
  session_duration: string | null;
  ip_address: string;
}

export interface AuditoriaAvaliacao {
  avaliacao_id: number;
  lote_id: number;
  lote: string;
  liberado_em: string | null;
  concluida: boolean;
  inativada: boolean;
  iniciada_em: string | null;
  concluida_em: string | null;
  criado_em: string;
  empresa_nome: string | null;
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

export type AuditoriaSubTab =
  | 'acesso-gestor'
  | 'acesso-rh'
  | 'avaliacoes'
  | 'lotes'
  | 'laudos';

export interface AuditoriasContentProps {
  auditoriaSubTab: AuditoriaSubTab;
  setAuditoriaSubTab: (tab: AuditoriaSubTab) => void;
  acessosGestor: AcessoGestor[];
  acessosRH: AcessoRH[];
  auditoriaAvaliacoes: AuditoriaAvaliacao[];
  auditoriaLotes: AuditoriaLote[];
  auditoriaLaudos: AuditoriaLaudo[];
}
