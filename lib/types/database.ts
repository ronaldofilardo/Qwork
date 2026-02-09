/**
 * Tipos de dados do banco de dados
 * Interfaces que representam as tabelas principais do sistema QWork
 * Sincronizadas com o esquema do PostgreSQL
 */

/**
 * Tabela: funcionarios
 * IMPORTANTE: Relacionamentos com entidades/clínicas/empresas são gerenciados via
 * tabelas intermediárias funcionarios_entidades e funcionarios_clinicas
 */
export interface Funcionario {
  id?: number;
  cpf: string;
  nome: string;
  perfil: 'funcionario' | 'rh' | 'admin' | 'emissor' | 'gestor';
  ativo: boolean;
  setor?: string;
  funcao?: string;
  matricula?: string;
  nivel_cargo?: 'operacional' | 'gestao';
  turno?: string;
  escala?: string;
  email?: string;
  senha_hash?: string;
  data_nascimento?: string;
  usuario_tipo?: 'funcionario' | 'rh' | 'gestor' | 'emissor' | 'admin';
}

/**
 * Tabela: funcionarios_entidades
 * Relacionamento M:N entre funcionários e entidades (tomadores tipo='entidade')
 * Entidades são empresas particulares que administram seus próprios funcionários
 */
export interface FuncionarioEntidade {
  id: number;
  funcionario_id: number;
  entidade_id: number;
  ativo: boolean;
  data_vinculo: string;
  data_desvinculo?: string;
}

/**
 * Tabela: funcionarios_clinicas
 * Relacionamento M:N entre funcionários e empresas clientes (via clínicas)
 * Clínicas de medicina ocupacional administram empresas (clientes) e seus funcionários
 */
export interface FuncionarioClinica {
  id: number;
  funcionario_id: number;
  clinica_id: number;
  empresa_id: number;
  ativo: boolean;
  data_vinculo: string;
  data_desvinculo?: string;
}

/**
 * Tabela: clinicas
 */
export interface Clinica {
  id: number;
  nome: string;
  cnpj: string;
}

/**
 * Tabela: empresas_clientes
 */
export interface EmpresaCliente {
  id: number;
  nome: string;
  cnpj: string;
  clinica_id: number;
  ativa: boolean;
}

/**
 * Tabela: lotes_avaliacao
 */
export interface LoteAvaliacao {
  id: number;
  descricao?: string;
  tipo: 'completo' | 'operacional' | 'gestao';
  status:
    | 'rascunho'
    | 'ativo'
    | 'concluido'
    | 'emissao_solicitada'
    | 'emissao_em_andamento'
    | 'laudo_emitido'
    | 'cancelado'
    | 'finalizado';
  liberado_em: string;
  liberado_por: string;
  empresa_id?: number;
  clinica_id?: number;
  entidade_id?: number;
  laudo_enviado_em?: string;
  emitido_em?: string;
  // Hash SHA-256 do PDF gerado para o lote (quando aplicável)
  hash_pdf?: string | null;
}

/**
 * Tabela: avaliacoes
 */
export interface Avaliacao {
  id: number;
  funcionario_cpf: string;
  lote_id: number;
  status: 'iniciada' | 'em_andamento' | 'concluida' | 'inativada';
  inicio: string;
  envio?: string;
  grupo_atual?: number;
}

/**
 * Tabela: respostas
 */
export interface Resposta {
  avaliacao_id: number;
  grupo: number;
  item: string;
  valor: number;
}

/**
 * Tabela: laudos
 */
export interface Laudo {
  id: number;
  lote_id: number;
  emissor_cpf: string;
  status: 'emitido' | 'enviado';
  emitido_em?: string;
  enviado_em?: string;
  observacoes?: string;
}

/**
 * Tipos para queries específicas e views
 */

/**
 * Dados de funcionário com avaliação (view vw_funcionarios_por_lote)
 */
export interface FuncionarioComAvaliacao extends Omit<
  Funcionario,
  'perfil' | 'ativo' | 'email' | 'senha_hash'
> {
  avaliacao_id: number;
  status_avaliacao: string;
  data_conclusao?: string;
  data_inicio: string;
  // Identificadores de contexto (entidade ou clínica)
  source_id?: number;
  source_type?: 'entidade' | 'clinica';
}

/**
 * Informações completas do lote com dados relacionados
 */
export interface LoteInfo extends Omit<LoteAvaliacao, 'liberado_por'> {
  liberado_por_nome?: string;
  empresa_nome: string;
  laudo_id?: number | null;
  laudo_status?: string | null;
  laudo_emitido_em?: string | null;
  laudo_enviado_em?: string | null;
  hash_pdf?: string | null;
  emissao_solicitada?: boolean;
  emissao_solicitado_em?: string | null;
  tem_laudo?: boolean;
}

/**
 * Estatísticas de um lote
 */
export interface LoteEstatisticas {
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
  avaliacoes_pendentes: number;
}
