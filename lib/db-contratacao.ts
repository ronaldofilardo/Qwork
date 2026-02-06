import { query, Session } from './db';
import type {
  Plano,
  Contrato,
  Pagamento,
  EntidadeExtendida,
  IniciarPagamentoDTO,
  StatusPagamento,
} from './types/contratacao';

// ==========================================
// FUNÇÕES PARA PLANOS (Mantidas - ainda necessárias)
// ==========================================

/**
 * Listar todos os planos ativos
 */
export async function getPlanos(session?: Session): Promise<Plano[]> {
  const result = await query<Plano>(
    'SELECT * FROM planos WHERE ativo = true ORDER BY preco ASC',
    [],
    session
  );
  return result.rows;
}

/**
 * Buscar plano por ID
 */
export async function getPlanoById(
  id: number,
  session?: Session
): Promise<Plano | null> {
  const result = await query<Plano>(
    'SELECT * FROM planos WHERE id = $1',
    [id],
    session
  );
  return result.rows[0] || null;
}

// ==========================================
// FUNÇÕES PARA CONTRATOS (mantidas para consulta de histórico)
// ==========================================

/**
 * Buscar contrato por ID
 */
export async function getContratoById(
  id: number,
  session?: Session
): Promise<Contrato | null> {
  const result = await query<Contrato>(
    'SELECT * FROM contratos WHERE id = $1',
    [id],
    session
  );
  return result.rows[0] || null;
}

/**
 * Buscar contratos de uma entidade
 */
export async function getContratosByEntidade(
  entidadeId: number,
  session?: Session
): Promise<Contrato[]> {
  const result = await query<Contrato>(
    'SELECT * FROM contratos WHERE contratante_id = $1 ORDER BY criado_em DESC',
    [entidadeId],
    session
  );
  return result.rows;
}

// ==========================================
// FUNÇÕES PARA PAGAMENTOS
// ==========================================

/**
 * Iniciar novo pagamento
 */
export async function iniciarPagamento(
  data: IniciarPagamentoDTO,
  session?: Session
): Promise<Pagamento> {
  const result = await query<Pagamento>(
    `INSERT INTO pagamentos (contratante_id, valor, metodo, plataforma_nome, status)
     VALUES ($1, $2, $3, $4, 'pendente')
     RETURNING *`,
    [
      data.entidade_id,
      data.valor,
      data.metodo,
      data.plataforma_nome || 'Simulado',
    ],
    session
  );

  return result.rows[0];
}

/**
 * Confirmar pagamento
 */
export async function confirmarPagamento(
  pagamentoId: number,
  plataformaId?: string,
  dadosAdicionais?: Record<string, any>,
  comprovantePath?: string,
  session?: Session
): Promise<Pagamento> {
  const result = await query<Pagamento>(
    `UPDATE pagamentos 
     SET status = 'pago',
         data_pagamento = CURRENT_TIMESTAMP,
         data_confirmacao = CURRENT_TIMESTAMP,
         plataforma_id = COALESCE($2, plataforma_id),
         dados_adicionais = COALESCE($3::jsonb, dados_adicionais),
         comprovante_path = COALESCE($4, comprovante_path)
     WHERE id = $1
     RETURNING *`,
    [
      pagamentoId,
      plataformaId || null,
      dadosAdicionais ? JSON.stringify(dadosAdicionais) : null,
      comprovantePath || null,
    ],
    session
  );

  if (result.rows.length === 0) {
    throw new Error('Pagamento não encontrado');
  }

  const pagamento = result.rows[0];

  // Buscar contratante_id através do contrato
  const contratoRes = await query<{ contratante_id: number }>(
    `SELECT contratante_id FROM contratos WHERE id = $1`,
    [pagamento.contrato_id],
    session
  );

  if (contratoRes.rows.length === 0) {
    throw new Error('Contrato não encontrado para este pagamento');
  }

  // Atualizar flag de pagamento confirmado na entidade
  await query(
    `UPDATE entidades 
     SET pagamento_confirmado = true,
         status = 'pago'
     WHERE id = $1`,
    [contratoRes.rows[0].contratante_id],
    session
  );

  return pagamento;
}

/**
 * Buscar pagamento por ID
 */
export async function getPagamentoById(
  id: number,
  session?: Session
): Promise<Pagamento | null> {
  const result = await query<Pagamento>(
    'SELECT * FROM pagamentos WHERE id = $1',
    [id],
    session
  );
  return result.rows[0] || null;
}

/**
 * Buscar pagamentos de uma entidade
 */
export async function getPagamentosByEntidade(
  entidadeId: number,
  session?: Session
): Promise<Pagamento[]> {
  const result = await query<Pagamento>(
    'SELECT * FROM pagamentos WHERE contratante_id = $1 ORDER BY criado_em DESC',
    [entidadeId],
    session
  );
  return result.rows;
}

/**
 * Atualizar status de pagamento
 */
export async function atualizarStatusPagamento(
  pagamentoId: number,
  novoStatus: StatusPagamento,
  observacoes?: string,
  session?: Session
): Promise<Pagamento> {
  const result = await query<Pagamento>(
    `UPDATE pagamentos 
     SET status = $2,
         observacoes = COALESCE($3, observacoes)
     WHERE id = $1
     RETURNING *`,
    [pagamentoId, novoStatus, observacoes || null],
    session
  );

  if (result.rows.length === 0) {
    throw new Error('Pagamento não encontrado');
  }

  return result.rows[0];
}

// ==========================================
// FUNÇÕES AUXILIARES PARA ENTIDADES
// ==========================================

/**
 * Verificar se entidade pode fazer login
 */
export async function entidadePodeLogar(
  entidadeId: number,
  session?: Session
): Promise<boolean> {
  const result = await query<{ pode_logar: boolean }>(
    'SELECT entidade_pode_logar($1) as pode_logar',
    [entidadeId],
    session
  );

  return result.rows[0]?.pode_logar || false;
}

/**
 * Buscar entidade com dados completos (incluindo plano, contrato, pagamento)
 */
export async function getEntidadeCompleta(
  entidadeId: number,
  session?: Session
): Promise<any> {
  // Detectar dinamicamente quais colunas de preço existem na tabela `planos`
  const planColsRes = await query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'planos' AND column_name IN ('preco','valor_por_funcionario','valor_base','valor_fixo_anual')`,
    [],
    session
  );
  const availablePlanCols = planColsRes.rows.map((r: any) => r.column_name);

  // Montar expressão segura para plano_preco sem referenciar colunas inexistentes
  let planoPrecoExpr = '';
  if (
    availablePlanCols.includes('valor_por_funcionario') &&
    availablePlanCols.includes('valor_base')
  ) {
    planoPrecoExpr =
      "CASE WHEN p.tipo = 'fixo' THEN 20.00 ELSE COALESCE(p.valor_por_funcionario, p.valor_base) END";
  } else if (availablePlanCols.includes('valor_por_funcionario')) {
    planoPrecoExpr =
      "CASE WHEN p.tipo = 'fixo' THEN 20.00 ELSE COALESCE(p.valor_por_funcionario) END";
  } else if (availablePlanCols.includes('preco')) {
    planoPrecoExpr =
      "CASE WHEN p.tipo = 'fixo' THEN 20.00 ELSE COALESCE(p.preco) END";
  } else if (availablePlanCols.includes('valor_fixo_anual')) {
    planoPrecoExpr = '20.00'; // fallback static
  } else {
    planoPrecoExpr = '20.00';
  }

  const result = await query<any>(
    `SELECT c.*,
            p.nome as plano_nome,
            p.descricao as plano_descricao,
            ${planoPrecoExpr} as plano_preco,
            p.tipo as plano_tipo,
            pg.id as pagamento_id,
            pg.status as pagamento_status,
            pg.valor as pagamento_valor,
            pg.data_pagamento as pagamento_data
     FROM entidades c
     LEFT JOIN planos p ON c.plano_id = p.id
     LEFT JOIN pagamentos pg ON pg.contratante_id = c.id
     WHERE c.id = $1
     ORDER BY pg.criado_em DESC
     LIMIT 1`,
    [entidadeId],
    session
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  // Montar objeto completo
  const entidade: EntidadeExtendida = {
    id: row.id,
    tipo: row.tipo,
    nome: row.nome,
    cnpj: row.cnpj,
    inscricao_estadual: row.inscricao_estadual,
    email: row.email,
    telefone: row.telefone,
    endereco: row.endereco,
    cidade: row.cidade,
    estado: row.estado,
    cep: row.cep,
    responsavel_nome: row.responsavel_nome,
    responsavel_cpf: row.responsavel_cpf,
    responsavel_cargo: row.responsavel_cargo,
    responsavel_email: row.responsavel_email,
    responsavel_celular: row.responsavel_celular,
    cartao_cnpj_path: row.cartao_cnpj_path,
    contrato_social_path: row.contrato_social_path,
    doc_identificacao_path: row.doc_identificacao_path,
    status: row.status,
    motivo_rejeicao: row.motivo_rejeicao,
    observacoes_reanalise: row.observacoes_reanalise,
    ativa: row.ativa,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
    aprovado_em: row.aprovado_em,
    aprovado_por_cpf: row.aprovado_por_cpf,
    plano_id: row.plano_id,
    pagamento_confirmado: row.pagamento_confirmado,
    data_liberacao_login: row.data_liberacao_login,
  };

  // Adicionar dados relacionados se existirem
  if (row.plano_id) {
    entidade.plano = {
      id: row.plano_id,
      nome: row.plano_nome,
      descricao: row.plano_descricao,
      preco: parseFloat(row.plano_preco),
      tipo: row.plano_tipo,
      ativo: true,
      criado_em: '',
      atualizado_em: '',
    };
  }

  if (row.pagamento_id) {
    entidade.pagamento = {
      id: row.pagamento_id,
      entidade_id: row.id,
      valor: parseFloat(row.pagamento_valor),
      status: row.pagamento_status as StatusPagamento,
      data_pagamento: row.pagamento_data,
      criado_em: '',
      atualizado_em: '',
    } as Pagamento;
  }

  return entidade;
}

// === RETROCOMPATIBILIDADE - DEPRECATED ===
/** @deprecated Use getContratosByEntidade instead */
export const getContratosByContratante = getContratosByEntidade;
/** @deprecated Use getPagamentosByEntidade instead */
export const getPagamentosByContratante = getPagamentosByEntidade;
/** @deprecated Use entidadePodeLogar instead */
export const contratantePodeLogar = entidadePodeLogar;
/** @deprecated Use getEntidadeCompleta instead */
export const getContratanteCompleto = getEntidadeCompleta;
