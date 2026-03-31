// ── Shared types for lote detail pages (RH + Entidade) ─────────────────────

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
}

export const FILTROS_COLUNA_VAZIO: FiltrosColuna = {
  nome: [],
  cpf: [],
  nivel_cargo: [],
  status: [],
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
  avaliacao: {
    id: number;
    status: string;
    data_inicio: string;
    data_conclusao: string | null;
  };
  grupos?: GruposData;
}
