/**
 * Repository Pattern para Contratantes
 * Abstrai acesso ao banco e otimiza queries
 */

import { query } from '../db';
import { queryWithRLS, RLSContext } from '../security/rls-context';

export interface Contratante {
  id: number;
  tipo: 'clinica' | 'entidade';
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_email: string;
  responsavel_celular: string;
  status: string;
  ativa: boolean;
  pagamento_confirmado: boolean;
  plano_id?: number;
  data_liberacao_login?: string;
  criado_em: string;
  atualizado_em?: string;
  aprovado_em?: string;
  aprovado_por_cpf?: string;
}

export interface ContratanteComRelacionamentos extends Contratante {
  plano?: {
    id: number;
    nome: string;
    tipo: string;
    preco: number;
  };
  pagamento?: {
    id: number;
    valor: number;
    status: string;
    data_pagamento?: string;
  };
  contrato?: {
    id: number;
    aceito: boolean;
    data_aceite?: string;
  };
  total_funcionarios?: number;
}

/**
 * Busca contratante por ID com eager loading (evita N+1)
 */
export async function findContratanteById(
  id: number,
  options: {
    includeRelations?: boolean;
    rlsContext?: RLSContext;
  } = {}
): Promise<ContratanteComRelacionamentos | null> {
  const { includeRelations = false, rlsContext } = options;

  const sql = `
    SELECT c.*
    ${
      includeRelations
        ? `,
      jsonb_build_object(
        'id', p.id,
        'nome', p.nome,
        'tipo', p.tipo,
        'preco', p.preco
      ) as plano,
      jsonb_build_object(
        'id', pg.id,
        'valor', pg.valor,
        'status', pg.status,
        'data_pagamento', pg.data_pagamento
      ) as pagamento,
      jsonb_build_object(
        'id', ct.id,
        'aceito', ct.aceito,
        'data_aceite', ct.data_aceite
      ) as contrato,
      (
        SELECT COUNT(*)
        FROM contratantes_funcionarios cf
        WHERE cf.contratante_id = c.id AND cf.vinculo_ativo = true
      ) as total_funcionarios
    `
        : ''
    }
    FROM contratantes c
    ${
      includeRelations
        ? `
      LEFT JOIN planos p ON c.plano_id = p.id
      LEFT JOIN pagamentos pg ON pg.contratante_id = c.id
      LEFT JOIN contratos ct ON ct.contratante_id = c.id
    `
        : ''
    }
    WHERE c.id = $1
  `;

  const executeQuery = rlsContext
    ? (querySql: string, queryParams: any[]) =>
        queryWithRLS<ContratanteComRelacionamentos>(
          querySql,
          queryParams,
          rlsContext
        )
    : query<ContratanteComRelacionamentos>;

  const result = await executeQuery(sql, [id]);

  return result.rows[0] || null;
}

/**
 * Lista contratantes com paginação e filtros
 */
export async function findContratantes(
  options: {
    page?: number;
    limit?: number;
    tipo?: 'clinica' | 'entidade';
    status?: string;
    ativa?: boolean;
    search?: string;
    rlsContext?: RLSContext;
  } = {}
): Promise<{
  contratantes: Contratante[];
  total: number;
  page: number;
  limit: number;
}> {
  const {
    page = 1,
    limit = 50,
    tipo,
    status,
    ativa,
    search,
    rlsContext,
  } = options;

  const offset = (page - 1) * limit;

  // Construir WHERE clause dinamicamente
  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let paramIndex = 1;

  if (tipo) {
    conditions.push(`tipo = $${paramIndex}`);
    params.push(tipo);
    paramIndex++;
  }

  if (status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (ativa !== undefined) {
    conditions.push(`ativa = $${paramIndex}`);
    params.push(ativa);
    paramIndex++;
  }

  if (search) {
    conditions.push(
      `(nome ILIKE $${paramIndex} OR cnpj ILIKE $${paramIndex} OR responsavel_nome ILIKE $${paramIndex})`
    );
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Query de contagem
  const countSql = `SELECT COUNT(*) as total FROM contratantes WHERE ${whereClause}`;

  const executeQuery = rlsContext
    ? (querySql: string, queryParams: any[]) =>
        queryWithRLS(querySql, queryParams, rlsContext)
    : query;

  const countResult = await executeQuery<{ total: string }>(countSql, params);
  const total = parseInt(countResult.rows[0].total);

  // Query principal com paginação
  const sql = `
    SELECT * FROM contratantes
    WHERE ${whereClause}
    ORDER BY criado_em DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  const result = await executeQuery<Contratante>(sql, params);

  return {
    contratantes: result.rows,
    total,
    page,
    limit,
  };
}

/**
 * Atualiza contratante (apenas campos permitidos)
 */
export async function updateContratante(
  id: number,
  data: Partial<Contratante>,
  rlsContext?: RLSContext
): Promise<Contratante> {
  // Campos permitidos para atualização
  const allowedFields = [
    'nome',
    'email',
    'telefone',
    'endereco',
    'cidade',
    'estado',
    'cep',
    'responsavel_nome',
    'responsavel_email',
    'responsavel_celular',
    'status',
    'ativa',
    'pagamento_confirmado',
    'plano_id',
  ];

  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    throw new Error('Nenhum campo válido para atualização');
  }

  params.push(id);

  const sql = `
    UPDATE contratantes
    SET ${updates.join(', ')}, atualizado_em = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const executeQuery = rlsContext
    ? (querySql: string, queryParams: any[]) =>
        queryWithRLS<Contratante>(querySql, queryParams, rlsContext)
    : query<Contratante>;

  const result = await executeQuery(sql, params);

  if (result.rows.length === 0) {
    throw new Error('Contratante não encontrado ou sem permissão');
  }

  return result.rows[0];
}

/**
 * Busca contratantes pendentes de aprovação (para admin)
 */
export async function findContratantesPendentes(): Promise<Contratante[]> {
  const result = await query<Contratante>(
    `SELECT * FROM contratantes 
     WHERE status = 'pendente' OR status = 'aguardando_pagamento'
     ORDER BY criado_em DESC`,
    []
  );

  return result.rows;
}

/**
 * Verifica se contratante pode ser ativado
 */
export async function canActivateContratante(id: number): Promise<{
  canActivate: boolean;
  errors: string[];
}> {
  const contratante = await findContratanteById(id, { includeRelations: true });

  if (!contratante) {
    return { canActivate: false, errors: ['Contratante não encontrado'] };
  }

  const errors: string[] = [];

  if (contratante.status !== 'aprovado') {
    errors.push(`Status deve ser "aprovado", atual: "${contratante.status}"`);
  }

  if (!contratante.pagamento_confirmado) {
    errors.push('Pagamento não foi confirmado');
  }

  if (!contratante.plano_id) {
    errors.push('Plano não foi associado');
  }

  if (!contratante.contrato?.aceito) {
    errors.push('Contrato não foi aceito');
  }

  return {
    canActivate: errors.length === 0,
    errors,
  };
}
