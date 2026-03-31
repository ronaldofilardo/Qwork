// Re-export shared types/utils from lib/lote
export {
  normalizeString,
  formatDate,
  formatarData,
  getClassificacaoStyle,
  getStatusBadgeInfo,
} from '@/lib/lote/utils';

export {
  FILTROS_COLUNA_VAZIO,
  type FiltrosColuna,
  type ModalInativarState,
  type ModalResetarState,
  type ModalEmissaoState,
  type GruposData,
} from '@/lib/lote/types';

import type { GruposData } from '@/lib/lote/types';

// ── Entidade-specific interfaces ─────────────────────────────────────────

export interface LoteInfoEntidade {
  id: number;
  titulo: string;
  tipo: string;
  status: string;
  status_pagamento?: string | null;
  criado_em: string;
  liberado_em: string | null;
  emitido_em?: string | null;
  emissao_solicitada?: boolean;
  emissao_solicitado_em?: string | null;
  tem_laudo?: boolean;
  laudo_status?: string | null;
  laudo_id?: number | null;
  hash_pdf?: string | null;
  emissor_cpf?: string | null;
  arquivo_remoto_url?: string | null;
  boleto_asaas_id_pendente?: string | null;
}

export interface EstatisticasEntidade {
  total_funcionarios: number;
  funcionarios_concluidos: number;
  funcionarios_pendentes: number;
}

export interface FuncionarioEntidade {
  cpf: string;
  nome: string;
  setor: string;
  funcao: string;
  nivel_cargo: string | null;
  avaliacao: {
    id: number;
    status: string;
    data_inicio: string;
    data_conclusao: string | null;
    motivo_inativacao?: string | null;
    inativada_em?: string | null;
    total_respostas?: number;
  };
  grupos?: GruposData;
}
