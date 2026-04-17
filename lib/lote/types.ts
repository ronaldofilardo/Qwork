// ── Shared types for lote detail pages (RH + Entidade) ─────────────────────

export type LotePageVariant = 'entidade' | 'rh';

export interface Estatisticas {
  total: number;
  concluidas: number;
  inativadas: number;
  pendentes: number;
}

export interface LoteInfo {
  id: number;
  status: string;
  tipo: string;
  criado_em: string | null;
  // Entidade
  status_pagamento: string | null;
  laudo_id: number | null;
  tem_laudo: boolean;
  emissao_solicitada: boolean;
  emissao_solicitado_em: string | null;
  emitido_em: string | null;
  laudo_status: string | null;
  emissor_cpf: string | null;
  emissor_nome: string | null;
  arquivo_remoto_url: string | null;
  hash_pdf: string | null;
  // RH
  empresa_nome: string | null;
  liberado_em: string | null;
  liberado_por_nome: string | null;
}

/** Funcionário completo retornado pelas APIs de lote (extends FuncionarioBase) */
export type Funcionario = FuncionarioBase;

export interface GruposData {
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
}

export interface FiltrosColuna {
  nome: string[];
  cpf: string[];
  nivel_cargo: string[];
  status: string[];
  g1: string[];
  g2: string[];
  g3: string[];
  g4: string[];
  g5: string[];
  g6: string[];
  g7: string[];
  g8: string[];
  g9: string[];
  g10: string[];
}

export const FILTROS_COLUNA_VAZIO: FiltrosColuna = {
  nome: [],
  cpf: [],
  nivel_cargo: [],
  status: [],
  g1: [],
  g2: [],
  g3: [],
  g4: [],
  g5: [],
  g6: [],
  g7: [],
  g8: [],
  g9: [],
  g10: [],
};

export interface ModalInativarState {
  avaliacaoId: number;
  funcionarioNome: string;
  funcionarioCpf: string;
}

export interface ModalResetarState {
  avaliacaoId: number;
  funcionarioNome: string;
  funcionarioCpf: string;
}

export interface ModalEmissaoState {
  loteId: number;
  gestorEmail: string | null;
  gestorCelular: string | null;
}

/** Base de funcionario compartilhada entre RH e Entidade */
export interface FuncionarioBase {
  cpf: string;
  nome: string;
  setor: string;
  funcao: string;
  nivel_cargo: string | null;
  matricula?: string | null;
  avaliacao: {
    id: number;
    status: string;
    data_inicio: string;
    data_conclusao: string | null;
    total_respostas?: number;
    motivo_inativacao?: string | null;
    inativada_em?: string | null;
    data_inativacao?: string | null;
  };
  grupos?: GruposData;
}
