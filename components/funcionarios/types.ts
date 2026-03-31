/**
 * components/funcionarios/types.ts
 *
 * Tipos compartilhados para o módulo de funcionários.
 */

export const formatDate = (value?: string | null): string | null => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR');
};

export interface Funcionario {
  cpf: string;
  nome: string;
  email: string;
  setor: string;
  funcao: string;
  matricula: string | null;
  nivel_cargo: 'operacional' | 'gestao' | null;
  turno: string | null;
  escala: string | null;
  ativo: boolean;
  avaliacoes_concluidas?: number;
  avaliacoes_pendentes?: number;
  ultima_avaliacao?: string | null;
  criado_em?: string;
  avaliacoes?: Array<{
    id: number;
    inicio: string;
    envio: string | null;
    status: string;
    lote_id?: number;
  }>;
  ultima_avaliacao_id?: number | null;
  ultimo_lote_id?: number | null;
  ultima_avaliacao_data_conclusao?: string | null;
  ultima_avaliacao_status?: 'concluido' | 'inativada' | null;
  ultimo_motivo_inativacao?: string | null;
  data_ultimo_lote?: string | null;
  ultima_inativacao_em?: string | null;
  ultima_inativacao_lote?: string | null;
  ultimo_lote_numero?: number | null;
  indice_avaliacao?: number;
  tem_avaliacao_recente?: boolean;
}

export interface FuncionariosSectionProps {
  contexto: 'entidade' | 'clinica';
  tomadorId?: number;
  empresaId?: number;
  empresaNome?: string;
  onRefresh?: () => void;
  defaultStatusFilter?: 'todos' | 'ativos' | 'inativos';
}

export interface FuncionariosStats {
  total: number;
  ativos: number;
  inativos: number;
}
