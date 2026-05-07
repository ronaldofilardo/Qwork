/**
 * app/emissor/types.ts
 *
 * Types and utilities shared by the Emissor dashboard components.
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface Lote {
  id: number;
  tipo: string;
  status: string;
  empresa_nome: string;
  clinica_nome: string;
  liberado_em: string;
  total_avaliacoes: number;
  /** Percentual de conclusão calculado pelo backend (0-100) — Política 70% Migration 1130 */
  taxa_conclusao?: number;
  pagamento_pendente?: boolean;
  emissao_automatica?: boolean;
  solicitado_por?: string | null;
  solicitado_em?: string | null;
  tipo_solicitante?: string | null;
  previsao_emissao?: {
    data: string;
    formatada: string;
  } | null;
  laudo: {
    id: number;
    observacoes: string;
    status: string;
    emitido_em: string | null;
    enviado_em: string | null;
    hash_pdf: string | null;
    _emitido?: boolean;
    emissor_nome?: string;
    arquivo_remoto_key?: string | null;
    arquivo_remoto_url?: string | null;
    arquivo_remoto_uploaded_at?: string | null;
  } | null;
  notificacoes?: NotificacaoLote[];
}

export interface NotificacaoLote {
  id: string;
  tipo: 'lote_liberado' | 'lote_finalizado';
  mensagem: string;
  data_evento: string;
  visualizada: boolean;
}

export type ActiveTab =
  | 'laudo-para-emitir'
  | 'laudo-emitido'
  | 'laudos-enviados';

// ============================================================================
// UTILITIES
// ============================================================================

/** Returns Tailwind CSS border+bg classes based on lote effective status */
export function getStatusColor(lote: Lote): string {
  const effectiveStatus =
    lote.status === 'concluido' && lote.laudo?.status === 'enviado'
      ? 'finalizado'
      : lote.status;

  switch (effectiveStatus) {
    case 'rascunho':
      return 'border-gray-500 bg-gray-50';
    case 'ativo':
      return 'border-amber-500 bg-amber-50';
    case 'concluido':
      return 'border-blue-500 bg-blue-50';
    case 'finalizado':
      return 'border-green-500 bg-green-50';
    case 'cancelado':
      return 'border-red-500 bg-red-50';
    default:
      return 'border-gray-500 bg-gray-50';
  }
}
