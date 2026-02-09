import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos
export interface Plano {
  id: number;
  tipo: 'personalizado' | 'basico' | 'premium';
  nome: string;
  descricao?: string;
  valor_por_funcionario?: number;
  valor_fixo_anual?: number;
  limite_funcionarios?: number;
  ativo: boolean;
}

export interface ContratoPlano {
  id: number;
  plano_id: number;
  clinica_id?: number;
  tomador_id?: number;
  tipo_tomador: 'clinica' | 'entidade';
  valor_personalizado_por_funcionario?: number;
  data_contratacao: string;
  data_fim_vigencia: string;
  numero_funcionarios_estimado: number;
  numero_funcionarios_atual: number;
  forma_pagamento: 'anual' | 'mensal';
  numero_parcelas: number;
  status: 'ativo' | 'vencido' | 'cancelado' | 'renovacao_pendente';
  bloqueado: boolean;
  plano_nome?: string;
  plano_tipo?: string;
}

export interface NotificacaoFinanceira {
  id: number;
  tipo:
    | 'limite_excedido'
    | 'renovacao_proxima'
    | 'pagamento_vencido'
    | 'alerta_geral';
  titulo: string;
  mensagem: string;
  lida: boolean;
  prioridade: 'baixa' | 'normal' | 'alta' | 'critica';
  created_at: string;
  lida_em?: string;
}

interface PlanosState {
  // Estado
  planos: Plano[];
  contratos: ContratoPlano[];
  notificacoes: NotificacaoFinanceira[];
  loading: boolean;
  error: string | null;

  // Ações para planos
  setPlanos: (planos: Plano[]) => void;
  addPlano: (plano: Plano) => void;
  updatePlano: (id: number, plano: Partial<Plano>) => void;

  // Ações para contratos
  setContratos: (contratos: ContratoPlano[]) => void;
  addContrato: (contrato: ContratoPlano) => void;
  updateContrato: (id: number, contrato: Partial<ContratoPlano>) => void;

  // Ações para notificações
  setNotificacoes: (notificacoes: NotificacaoFinanceira[]) => void;
  addNotificacao: (notificacao: NotificacaoFinanceira) => void;
  marcarComoLida: (id: number) => void;
  getNotificacoesNaoLidas: () => NotificacaoFinanceira[];

  // Utilitários
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  planos: [],
  contratos: [],
  notificacoes: [],
  loading: false,
  error: null,
};

export const usePlanosStore = create<PlanosState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Ações para planos
      setPlanos: (planos) => set({ planos }),

      addPlano: (plano) =>
        set((state) => ({
          planos: [...state.planos, plano],
        })),

      updatePlano: (id, plano) =>
        set((state) => ({
          planos: state.planos.map((p) =>
            p.id === id ? { ...p, ...plano } : p
          ),
        })),

      // Ações para contratos
      setContratos: (contratos) => set({ contratos }),

      addContrato: (contrato) =>
        set((state) => ({
          contratos: [...state.contratos, contrato],
        })),

      updateContrato: (id, contrato) =>
        set((state) => ({
          contratos: state.contratos.map((c) =>
            c.id === id ? { ...c, ...contrato } : c
          ),
        })),

      // Ações para notificações
      setNotificacoes: (notificacoes) => set({ notificacoes }),

      addNotificacao: (notificacao) =>
        set((state) => ({
          notificacoes: [notificacao, ...state.notificacoes],
        })),

      marcarComoLida: (id) =>
        set((state) => ({
          notificacoes: state.notificacoes.map((n) =>
            n.id === id
              ? { ...n, lida: true, lida_em: new Date().toISOString() }
              : n
          ),
        })),

      getNotificacoesNaoLidas: () => {
        const { notificacoes } = get();
        return notificacoes.filter((n) => !n.lida);
      },

      // Utilitários
      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'planos-storage',
      partialize: (state) => ({
        // Persistir apenas dados essenciais, não loading/error
        planos: state.planos,
        contratos: state.contratos,
        notificacoes: state.notificacoes,
      }),
    }
  )
);
