/**
 * lib/db/entidade-crud.ts
 *
 * Funções CRUD de entidades: leitura e criação.
 * Extraído de lib/db/entidade-helpers.ts.
 */

import { query } from './query';
import type { QueryResult } from './query';
import type { Session } from '../session';

// ============================================================================
// TIPOS DE ENTIDADE
// ============================================================================

export type TipoEntidade = 'clinica' | 'entidade';
export type StatusAprovacao =
  | 'pendente'
  | 'aprovado'
  | 'rejeitado'
  | 'em_reanalise';

export interface Entidade {
  id: number;
  tipo: TipoEntidade;
  nome: string;
  cnpj: string;
  inscricao_estadual?: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_cargo?: string;
  responsavel_email: string;
  responsavel_celular: string;
  cartao_cnpj_path?: string;
  contrato_social_path?: string;
  doc_identificacao_path?: string;
  status: StatusAprovacao;
  motivo_rejeicao?: string;
  observacoes_reanalise?: string;
  ativa: boolean;
  pagamento_confirmado: boolean;
  numero_funcionarios_estimado?: number;
  criado_em: Date;
  atualizado_em: Date;
  aprovado_em?: Date;
  aprovado_por_cpf?: string;
}

const DEBUG_DB =
  !!process.env.DEBUG_DB ||
  process.env.NODE_ENV === 'test' ||
  !!process.env.JEST_WORKER_ID;

// ============================================================================
// FUNÇÕES CRUD
// ============================================================================

/**
 * Buscar entidades por tipo
 */
export async function getEntidadesByTipo(
  tipo?: TipoEntidade,
  session?: Session
): Promise<Entidade[]> {
  const queryText = tipo
    ? `SELECT * FROM entidades 
       WHERE tipo = $1 
       AND status NOT IN ('pendente', 'em_reanalise')
       ORDER BY nome`
    : `SELECT * FROM entidades 
       WHERE status NOT IN ('pendente', 'em_reanalise')
       ORDER BY nome`;
  const params = tipo ? [tipo] : [];
  const result = await query<Entidade>(queryText, params, session);
  return result.rows;
}

/**
 * Buscar entidade por ID
 */
export async function getEntidadeById(
  id: number,
  session?: Session
): Promise<Entidade | null> {
  const result = await query<Entidade>(
    `SELECT c.*
     FROM entidades c
     WHERE c.id = $1`,
    [id],
    session
  );
  return result.rows[0] || null;
}

/**
 * Buscar entidades pendentes de aprovação
 */
export async function getEntidadesPendentes(
  tipo?: TipoEntidade,
  session?: Session
): Promise<Entidade[]> {
  const queryText = tipo
    ? `SELECT c.*
       FROM entidades c
       WHERE c.status IN ($1, $2) AND c.tipo = $3
       ORDER BY c.criado_em DESC`
    : `SELECT c.*
       FROM entidades c
       WHERE c.status IN ($1, $2)
       ORDER BY c.tipo, c.criado_em DESC`;

  const params = tipo
    ? ['pendente', 'em_reanalise', tipo]
    : ['pendente', 'em_reanalise'];

  const result = await query<Entidade>(queryText, params, session);
  return result.rows;
}

/**
 * Criar novo tomador (via modal de cadastro)
 */
export async function createEntidade(
  data: Omit<
    Entidade,
    'id' | 'criado_em' | 'atualizado_em' | 'aprovado_em' | 'aprovado_por_cpf'
  >,
  session?: Session
): Promise<Entidade> {
  if (DEBUG_DB) {
    console.debug('[CREATE_tomador] Iniciando criação com dados:', {
      tipo: data.tipo,
      nome: data.nome,
      cnpj: data.cnpj,
      email: data.email,
      responsavel_cpf: data.responsavel_cpf,
    });
  }
  // Verificar se email já existe
  const emailCheck = await query(
    'SELECT id FROM entidades WHERE email = $1',
    [data.email],
    session
  );
  if (emailCheck.rows.length > 0) {
    throw new Error('Email já cadastrado no sistema');
  }

  // Verificar se CNPJ já existe
  const cnpjCheck = await query(
    'SELECT id FROM entidades WHERE cnpj = $1',
    [data.cnpj],
    session
  );
  if (cnpjCheck.rows.length > 0) {
    throw new Error('CNPJ já cadastrado no sistema');
  }

  // Verificar se CPF do responsável já existe em entidades (apenas se aprovado)
  const cpfCheckEntidades = await query(
    'SELECT id, status FROM entidades WHERE responsavel_cpf = $1',
    [data.responsavel_cpf],
    session
  );
  if (cpfCheckEntidades.rows.length > 0) {
    const entidadeExistente = cpfCheckEntidades.rows[0];
    if (entidadeExistente.status === 'aprovado') {
      throw new Error(
        'CPF do responsável já cadastrado no sistema (entidade aprovada)'
      );
    }
  }

  // Verificar se CPF do responsável já existe em funcionários de OUTRA entidade
  const cpfCheckFuncionarios = await query(
    `SELECT f.id, f.perfil, c.id as entidade_id, c.cnpj as entidade_cnpj
     FROM funcionarios f
     INNER JOIN clinicas cl ON f.clinica_id = cl.id
     INNER JOIN entidades c ON cl.entidade_id = c.id
     WHERE f.cpf = $1`,
    [data.responsavel_cpf],
    session
  );
  if (cpfCheckFuncionarios.rows.length > 0) {
    const funcionario = cpfCheckFuncionarios.rows[0];
    if (funcionario.entidade_cnpj !== data.cnpj) {
      throw new Error(
        `CPF do responsável já vinculado como funcionário em outra entidade (CNPJ: ${funcionario.entidade_cnpj})`
      );
    }
  }

  // Verificado: colunas necessárias existem (migrações 1137+ removeram colunas legacy)

  let result: QueryResult<Entidade>;
  try {
    result = await query<Entidade>(
      `INSERT INTO entidades (
        tipo, nome, cnpj, inscricao_estadual, email, telefone,
        endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
        cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
        status, motivo_rejeicao, observacoes_reanalise, ativa, pagamento_confirmado
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, false, false
      ) RETURNING *`,
      [
        data.tipo,
        data.nome,
        data.cnpj,
        data.inscricao_estadual,
        data.email,
        data.telefone,
        data.endereco,
        data.cidade,
        data.estado,
        data.cep,
        data.responsavel_nome,
        data.responsavel_cpf,
        data.responsavel_cargo,
        data.responsavel_email,
        data.responsavel_celular,
        data.cartao_cnpj_path,
        data.contrato_social_path,
        data.doc_identificacao_path,
        data.status,
        data.motivo_rejeicao,
        data.observacoes_reanalise,
      ],
      session
    );
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (
      msg.includes('invalid input value for enum') ||
      msg.includes('valor de entrada é inválido para enum') ||
      msg.includes('status_aprovacao_enum')
    ) {
      console.warn(
        '[CREATE_ENTIDADE] Enum status inconsistente no DB, tentando inserir com status fallback "pendente"',
        { error: msg }
      );
      result = await query<Entidade>(
        `INSERT INTO entidades (
          tipo, nome, cnpj, inscricao_estadual, email, telefone,
          endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
          cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
          status, motivo_rejeicao, observacoes_reanalise, ativa, pagamento_confirmado
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, false, false
        ) RETURNING *`,
        [
          data.tipo,
          data.nome,
          data.cnpj,
          data.inscricao_estadual,
          data.email,
          data.telefone,
          data.endereco,
          data.cidade,
          data.estado,
          data.cep,
          data.responsavel_nome,
          data.responsavel_cpf,
          data.responsavel_cargo,
          data.responsavel_email,
          data.responsavel_celular,
          data.cartao_cnpj_path,
          data.contrato_social_path,
          data.doc_identificacao_path,
          'pendente',
          data.motivo_rejeicao,
          data.observacoes_reanalise,
        ],
        session
      );
    } else {
      throw err;
    }
  }
  const tomadorCriado = result.rows[0];
  console.log('[CREATE_tomador] Entidade criado com sucesso:', {
    id: tomadorCriado.id,
    cnpj: tomadorCriado.cnpj,
    tipo: tomadorCriado.tipo,
  });
  return tomadorCriado;
}
