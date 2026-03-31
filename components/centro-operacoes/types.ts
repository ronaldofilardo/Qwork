export interface LoteMonitor {
  id: number;
  descricao: string;
  tipo: string;
  status: string;
  liberado_em: string | null;
  empresa_id: number;
  empresa_nome: string;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
  avaliacoes_pendentes: number;
  laudo_id: number | null;
  laudo_status: string | null;
  emitido_em: string | null;
  enviado_em: string | null;
  emissao_solicitada: boolean;
  emissao_solicitado_em: string | null;
  solicitado_por: string | null;
}

export interface LaudoMonitor {
  id: number;
  lote_id: number;
  lote_descricao: string;
  lote_tipo: string;
  lote_status: string;
  laudo_status: string;
  empresa_id: number;
  empresa_nome: string;
  emissor_nome: string | null;
  liberado_em: string | null;
  criado_em: string;
  emitido_em: string | null;
  enviado_em: string | null;
  hash_pdf: string | null;
  arquivo_remoto_url: string | null;
  arquivo_remoto_uploaded_at: string | null;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
}

export interface CentroOperacoesProps {
  tipoUsuario: 'tomador' | 'clinica' | 'funcionario';
  onNavigate?: (url: string) => void;
}

export type TabAtiva = 'lotes' | 'laudos';
