/**
 * @fileoverview Tipos compartilhados para fixtures de testes
 * Centraliza definições de tipos mock para evitar duplicação e garantir type safety
 */

/**
 * Representa um funcionário mockado em testes
 */
export interface MockFuncionario {
  cpf: string;
  nome: string;
  setor: string;
  funcao: string;
  matricula: string;
  ativo: boolean;
  email: string;
  turno: string;
  escala: string;
  empresa_nome: string;
  nivel_cargo?: 'operacional' | 'gestao' | 'lideranca';
  avaliacoes?: unknown[];
}

/**
 * Representa uma sessão de usuário mockada
 */
export interface MockSession {
  cpf: string;
  nome: string;
  perfil: 'admin' | 'rh' | 'clinica' | 'emissor' | 'entidade';
}

/**
 * Representa uma empresa mockada
 */
export interface MockEmpresa {
  id: number;
  nome: string;
  cnpj: string;
  total_funcionarios?: number;
  avaliacoes_pendentes?: number;
}

/**
 * Representa um lote mockado
 */
export interface MockLote {
  id: number;
  codigo: string;
  titulo: string;
  tipo: string;
  liberado_em: string;
  status: 'ativo' | 'concluido' | 'inativo';
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
}

/**
 * Representa um laudo mockado
 */
export interface MockLaudo {
  id: number;
  lote_id: number;
  codigo: string;
  titulo: string;
  empresa_nome: string;
  clinica_nome: string;
  emissor_nome: string;
  enviado_em: string;
  hash: string;
}

/**
 * Resposta mockada de estatísticas do dashboard
 */
export interface MockDashboardStats {
  stats: {
    total_avaliacoes: number;
    concluidas: number;
    funcionarios_avaliados: number;
  };
  resultados: unknown[];
  distribuicao: unknown[];
}
