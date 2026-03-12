// ── CJS rewrite: RH types.ts ── Re-export shared + RH-specific interfaces ──

const fs = require('fs');
const path = require('path');

const TARGET = path.join(
  __dirname,
  '..',
  'app',
  'rh',
  'empresa',
  '[id]',
  'lote',
  '[loteId]',
  'types.ts'
);

const content = `// Re-export shared types/utils from lib/lote
export {
  normalizeString,
  formatDate,
  formatarData,
  getClassificacaoLabel,
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

// ── RH-specific interfaces ─────────────────────────────────────────────────

export interface LoteInfo {
  id: number;
  descricao: string | null;
  tipo: string;
  status: string;
  liberado_em: string;
  liberado_por_nome: string | null;
  empresa_nome: string;
  emitido_em?: string | null;
  laudo_id?: number | null;
  laudo_status?: string | null;
  laudo_emitido_em?: string | null;
  laudo_enviado_em?: string | null;
  emissao_solicitada?: boolean;
  emissao_solicitado_em?: string | null;
  tem_laudo?: boolean;
  emissor_nome?: string;
  hash_pdf?: string;
  arquivo_remoto_url?: string | null;
}

export interface Estatisticas {
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
  avaliacoes_pendentes: number;
}

export interface Funcionario {
  cpf: string;
  nome: string;
  setor: string;
  funcao: string;
  matricula: string | null;
  nivel_cargo: 'operacional' | 'gestao' | null;
  turno: string | null;
  escala: string | null;
  avaliacao: {
    id: number;
    status: string;
    data_inicio: string;
    data_conclusao: string | null;
    data_inativacao: string | null;
    motivo_inativacao: string | null;
  };
  grupos?: {
    g1?: number;
    g2?: number;
    g3?: number;
    g4?: number;
    g5?: number;
    g6?: number;
    g7?: number;
    g8?: number;
    g9?: number;
    g10?: number;
  };
}
`;

fs.writeFileSync(TARGET, content, 'utf8');
console.log(
  'OK: RH types.ts rewritten (' + content.split('\\n').length + ' lines)'
);
