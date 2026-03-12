export interface Clinica {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  ativa: boolean;
  status: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_email: string;
  criado_em: string;
  plano_personalizado_pendente?: boolean;
  numero_funcionarios_estimado?: number;
}

export interface Gestor {
  cpf: string;
  nome: string;
  email: string;
  ativo: boolean;
  total_empresas_geridas: string;
  is_responsavel?: boolean;
}

export interface Empresa {
  id: number;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  ativa: boolean;
  total_funcionarios: number;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_liberadas: number;
}

export interface ContratoPersonalizadoData {
  contratoId: number;
  tomadorNome: string;
  valorPorFuncionario: number;
  numeroFuncionarios: number;
  valorTotal: number;
}
