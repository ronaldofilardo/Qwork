import { query, Session } from './db';
import type {
  Plano,
  Contrato,
  Pagamento,
  ContratanteExtendido,
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
 * Buscar contratos de um contratante
 */
export async function getContratosByContratante(
  contratanteId: number,
  session?: Session
): Promise<Contrato[]> {
  const result = await query<Contrato>(
    'SELECT * FROM contratos WHERE contratante_id = $1 ORDER BY criado_em DESC',
    [contratanteId],
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
      data.contratante_id,
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

  // Atualizar flag de pagamento confirmado no contratante
  await query(
    `UPDATE contratantes 
     SET pagamento_confirmado = true,
         status = 'pago'
     WHERE id = $1`,
    [result.rows[0].contratante_id],
    session
  );

  return result.rows[0];
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
 * Buscar pagamentos de um contratante
 */
export async function getPagamentosByContratante(
  contratanteId: number,
  session?: Session
): Promise<Pagamento[]> {
  const result = await query<Pagamento>(
    'SELECT * FROM pagamentos WHERE contratante_id = $1 ORDER BY criado_em DESC',
    [contratanteId],
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
// FUNÇÕES AUXILIARES PARA CONTRATANTES
// ==========================================

/**
 * Verificar se contratante pode fazer login
 */
export async function contratantePodeLogar(
  contratanteId: number,
  session?: Session
): Promise<boolean> {
  const result = await query<{ pode_logar: boolean }>(
    'SELECT contratante_pode_logar($1) as pode_logar',
    [contratanteId],
    session
  );

  return result.rows[0]?.pode_logar || false;
}

/**
 * Buscar contratante com dados completos (incluindo plano, contrato, pagamento)
 */
export async function getContratanteCompleto(
  contratanteId: number,
  session?: Session
): Promise<ContratanteExtendido | null> {
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
     FROM contratantes c
     LEFT JOIN planos p ON c.plano_id = p.id
     LEFT JOIN pagamentos pg ON pg.contratante_id = c.id
     WHERE c.id = $1
     ORDER BY pg.criado_em DESC
     LIMIT 1`,
    [contratanteId],
    session
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  // Montar objeto completo
  const contratante: ContratanteExtendido = {
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
    contratante.plano = {
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
    contratante.pagamento = {
      id: row.pagamento_id,
      contratante_id: row.id,
      valor: parseFloat(row.pagamento_valor),
      status: row.pagamento_status,
      data_pagamento: row.pagamento_data,
      criado_em: '',
      atualizado_em: '',
    };
  }

  return contratante;
}
