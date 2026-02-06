/**
 * Biblioteca Unificada de Notificações - Centro de Operações
 *
 * Funções centralizadas para criar, resolver e gerenciar notificações
 * com suporte a RLS, auditoria e contexto estruturado
 */

import { query } from '@/lib/db';

/**
 * Tipos de notificação suportados
 */
export type TipoNotificacao =
  // Financeiras
  | 'parcela_pendente'
  | 'parcela_vencendo'
  | 'quitacao_completa'
  // Lotes e Laudos
  | 'lote_concluido_aguardando_laudo'
  | 'laudo_enviado'
  // Legacy (sistema antigo)
  | 'pre_cadastro_criado'
  | 'valor_definido'
  | 'contrato_aceito'
  | 'pagamento_confirmado'
  | 'contratacao_ativa'
  | 'rejeicao_admin'
  | 'cancelamento_gestor'
  | 'sla_excedido'
  | 'alerta_geral';

/**
 * Tipo de destinatário
 */
export type TipoDestinatario =
  | 'admin'
  | 'contratante'
  | 'clinica'
  | 'funcionario'
  | 'gestor';

/**
 * Prioridade da notificação
 */
export type PrioridadeNotificacao = 'baixa' | 'media' | 'alta' | 'critica';

/**
 * Interface para criação de notificação
 */
export interface CriarNotificacaoParams {
  tipo: TipoNotificacao;
  destinatario_id: number;
  destinatario_tipo: TipoDestinatario;
  titulo: string;
  mensagem: string;
  dados_contexto?: Record<string, any>;
  link_acao?: string;
  botao_texto?: string;
  prioridade?: PrioridadeNotificacao;
  expira_em?: Date;
}

/**
 * Interface para resolução de notificação
 */
export interface ResolverNotificacaoParams {
  notificacao_id: number;
  cpf_resolvedor: string;
}

/**
 * Interface para resolução por contexto
 */
export interface ResolverPorContextoParams {
  chave_contexto: string;
  valor_contexto: string;
  cpf_resolvedor: string;
}

/**
 * Cria uma nova notificação no sistema
 *
 * @param params Parâmetros da notificação
 * @returns ID da notificação criada
 *
 * @example
 * ```typescript
 * const id = await criarNotificacao({
 *   tipo: 'parcela_pendente',
 *   destinatario_id: contratante.id,
 *   destinatario_tipo: 'contratante',
 *   titulo: 'Parcela 2/6 vencendo em 05/02',
 *   mensagem: 'Você tem uma parcela pendente no valor de R$ 499,90',
 *   dados_contexto: { numero_parcela: 2, total_parcelas: 6, valor: 499.90 },
 *   link_acao: '/rh/conta#pagamentos',
 *   botao_texto: 'Ver Pagamentos',
 *   prioridade: 'alta'
 * });
 * ```
 */
export async function criarNotificacao(
  params: CriarNotificacaoParams
): Promise<number> {
  const {
    tipo,
    destinatario_id,
    destinatario_tipo,
    titulo,
    mensagem,
    dados_contexto = {},
    link_acao = null,
    botao_texto = null,
    prioridade = 'media',
    expira_em = null,
  } = params;

  // Validações
  if (!destinatario_id || destinatario_id <= 0) {
    throw new Error('destinatario_id inválido');
  }

  if (!titulo || titulo.trim().length === 0) {
    throw new Error('titulo é obrigatório');
  }

  if (!mensagem || mensagem.trim().length === 0) {
    throw new Error('mensagem é obrigatória');
  }

  // Buscar CPF do destinatário baseado no tipo
  let destinatarioCpf: string;

  if (destinatario_tipo === 'contratante') {
    const result = await query(
      'SELECT responsavel_cpf FROM contratantes WHERE id = $1',
      [destinatario_id]
    );
    if (result.rows.length === 0) {
      throw new Error(`Contratante com ID ${destinatario_id} não encontrado`);
    }
    destinatarioCpf = result.rows[0].responsavel_cpf;
  } else if (destinatario_tipo === 'clinica') {
    // Buscar CPF do responsável através do contratante vinculado à clínica
    const result = await query(
      `SELECT c.responsavel_cpf 
       FROM clinicas cl 
       INNER JOIN contratantes c ON cl.contratante_id = c.id 
       WHERE cl.id = $1`,
      [destinatario_id]
    );
    if (result.rows.length === 0) {
      throw new Error(
        `Clínica com ID ${destinatario_id} não encontrada ou sem contratante vinculado`
      );
    }
    destinatarioCpf = result.rows[0].responsavel_cpf;
  } else if (destinatario_tipo === 'funcionario') {
    // Quando destinatário for um funcionário, o parâmetro 'destinatario_id' é o ID do funcionário
    const func = await query('SELECT cpf FROM funcionarios WHERE id = $1', [
      destinatario_id,
    ]);
    if (func.rows.length === 0) {
      throw new Error(`Funcionário com ID ${destinatario_id} não encontrado`);
    }
    destinatarioCpf = func.rows[0].cpf;
  } else {
    throw new Error(`Tipo de destinatário não suportado: ${destinatario_tipo}`);
  }

  // Determinar contratante_id baseado no tipo
  let contratanteId: number | null = null;

  if (destinatario_tipo === 'contratante') {
    contratanteId = destinatario_id;
  } else if (destinatario_tipo === 'funcionario') {
    // Buscar contratante_id do funcionário
    const funcResult = await query(
      'SELECT contratante_id FROM funcionarios WHERE cpf = $1',
      [destinatarioCpf]
    );
    contratanteId = funcResult.rows[0]?.contratante_id || null;
  }

  if (!contratanteId) {
    throw new Error(
      `Não foi possível determinar contratante_id para ${destinatario_tipo}:${destinatario_id}`
    );
  }

  // Anexar contratante_id dentro do dados_contexto (schema atual não tem coluna contratante_id)
  const payloadDadosContexto: Record<string, any> = {
    ...(dados_contexto as Record<string, any>),
    contratante_id: contratanteId,
  };

  // Deduplicação: evitar criar múltiplas notificações para a mesma parcela/pagamento
  try {
    if (payloadDadosContexto.pagamento_id) {
      let existingSql = `SELECT id FROM notificacoes WHERE destinatario_cpf = $1 AND tipo = $2 AND resolvida = FALSE AND arquivada = FALSE`;
      const existingParams: any[] = [destinatarioCpf, tipo];
      if (payloadDadosContexto.pagamento_id) {
        existingSql += ` AND dados_contexto->>'pagamento_id' = $3`;
        existingParams.push(String(payloadDadosContexto.pagamento_id));
        if (payloadDadosContexto.numero_parcela !== undefined) {
          existingSql += ` AND dados_contexto->>'numero_parcela' = $4`;
          existingParams.push(String(payloadDadosContexto.numero_parcela));
        }
      }
      existingSql += ` LIMIT 1`;

      const existing = await query(existingSql, existingParams);
      if (existing.rows.length > 0) {
        console.log(
          `[NOTIFICAÇÃO] Notificação duplicada evitada para pagamento ${payloadDadosContexto.pagamento_id} parcela ${payloadDadosContexto.numero_parcela}`
        );
        return existing.rows[0].id;
      }
    }
  } catch (dedupErr) {
    console.warn(
      '[NOTIFICAÇÃO] Erro ao checar duplicação de notificação:',
      dedupErr
    );
    // continuar normalmente se checagem falhar
  }

  // Inserir notificação (contratante_id fica dentro de dados_contexto)
  const result = await query(
    `INSERT INTO notificacoes (
      tipo, destinatario_cpf, destinatario_tipo,
      titulo, mensagem, dados_contexto,
      link_acao, botao_texto, prioridade, expira_em,
      lida, resolvida, criado_em
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      FALSE, FALSE, NOW()
    ) RETURNING id`,
    [
      tipo,
      destinatarioCpf,
      destinatario_tipo,
      titulo,
      mensagem,
      JSON.stringify(payloadDadosContexto),
      link_acao,
      botao_texto,
      prioridade,
      expira_em,
    ]
  );

  const notificacaoId = result.rows[0].id;

  console.log(
    `[NOTIFICAÇÃO] Criada: ${tipo} para ${destinatario_tipo}:${destinatario_id} (CPF: ${destinatarioCpf}, ID: ${notificacaoId})`
  );

  return notificacaoId;
}

/**
 * Marca uma notificação como resolvida
 *
 * @param params Parâmetros de resolução
 * @returns true se resolvida com sucesso, false se já estava resolvida
 *
 * @example
 * ```typescript
 * const resolvida = await resolverNotificacao({
 *   notificacao_id: 123,
 *   cpf_resolvedor: '12345678901'
 * });
 * ```
 */
export async function resolverNotificacao(
  params: ResolverNotificacaoParams
): Promise<boolean> {
  const { notificacao_id, cpf_resolvedor } = params;

  const result = await query(
    `SELECT resolver_notificacao($1, $2) as resolvida`,
    [notificacao_id, cpf_resolvedor]
  );

  return result.rows[0].resolvida;
}

/**
 * Resolve múltiplas notificações com base em critério de contexto
 *
 * @param params Parâmetros de resolução em massa
 * @returns Quantidade de notificações resolvidas
 *
 * @example
 * ```typescript
 * // Resolver todas as notificações de um lote específico
 * const count = await resolverNotificacoesPorContexto({
 *   chave_contexto: 'lote_id',
 *   valor_contexto: '123',
 *   cpf_resolvedor: '12345678901'
 * });
 * console.log(`${count} notificações resolvidas`);
 * ```
 */
export async function resolverNotificacoesPorContexto(
  params: ResolverPorContextoParams
): Promise<number> {
  const { chave_contexto, valor_contexto, cpf_resolvedor } = params;

  const result = await query(
    `SELECT resolver_notificacoes_por_contexto($1, $2, $3) as count`,
    [chave_contexto, valor_contexto, cpf_resolvedor]
  );

  const count = result.rows[0].count;

  console.log(
    `[NOTIFICAÇÃO] Resolvidas em massa: ${count} notificações (${chave_contexto}=${valor_contexto})`
  );

  return count;
}

/**
 * Busca notificações não resolvidas de um destinatário
 *
 * @param destinatario_id ID do destinatário
 * @param destinatario_tipo Tipo do destinatário
 * @param filtros Filtros opcionais (tipo, prioridade)
 * @returns Lista de notificações
 *
 * @example
 * ```typescript
 * const notificacoes = await buscarNotificacoesNaoResolvidas(123, 'contratante', {
 *   tipo: 'parcela_pendente'
 * });
 * ```
 */
export async function buscarNotificacoesNaoResolvidas(
  destinatario_id: number,
  destinatario_tipo: TipoDestinatario,
  filtros?: {
    tipo?: TipoNotificacao;
    prioridade?: PrioridadeNotificacao;
  }
): Promise<any[]> {
  // Buscar CPF do destinatário baseado no tipo
  let destinatarioCpf: string;

  if (destinatario_tipo === 'contratante') {
    const result = await query(
      'SELECT responsavel_cpf FROM contratantes WHERE id = $1',
      [destinatario_id]
    );
    if (result.rows.length === 0) {
      throw new Error(`Contratante com ID ${destinatario_id} não encontrado`);
    }
    destinatarioCpf = result.rows[0].responsavel_cpf;
  } else if (destinatario_tipo === 'clinica') {
    // Para clínicas, usar um CPF fixo de responsável
    destinatarioCpf = '12345678901'; // CPF padrão para clínica
  } else {
    throw new Error(`Tipo de destinatário não suportado: ${destinatario_tipo}`);
  }

  let sql = `
    SELECT
      id, tipo, prioridade, titulo, mensagem,
      dados_contexto, link_acao, botao_texto,
      lida, data_leitura, criado_em
    FROM notificacoes
    WHERE destinatario_cpf = $1
      AND destinatario_tipo = $2
      AND resolvida = FALSE
      AND arquivada = FALSE
      AND (expira_em IS NULL OR expira_em > NOW())
  `;

  const params: any[] = [destinatarioCpf, destinatario_tipo];
  let paramCount = 2;

  if (filtros?.tipo) {
    paramCount++;
    sql += ` AND tipo = $${paramCount}`;
    params.push(filtros.tipo);
  }

  if (filtros?.prioridade) {
    paramCount++;
    sql += ` AND prioridade = $${paramCount}`;
    params.push(filtros.prioridade);
  }

  sql += ` ORDER BY 
    CASE prioridade 
      WHEN 'critica' THEN 1
      WHEN 'alta' THEN 2
      WHEN 'media' THEN 3
      WHEN 'baixa' THEN 4
    END,
    criado_em DESC
  `;

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Conta notificações não resolvidas por tipo
 *
 * @param destinatario_id ID do destinatário
 * @param destinatario_tipo Tipo do destinatário
 * @returns Objeto com contagem por tipo
 *
 * @example
 * ```typescript
 * const contadores = await contarNotificacoesNaoResolvidas(123, 'contratante');
 * console.log(contadores); // { parcela_pendente: 3, lote_concluido: 1, total: 4 }
 * ```
 */
export async function contarNotificacoesNaoResolvidas(
  destinatario_id: number,
  destinatario_tipo: TipoDestinatario
): Promise<Record<string, number>> {
  // Buscar CPF do destinatário baseado no tipo
  let destinatarioCpf: string;

  if (destinatario_tipo === 'contratante') {
    const result = await query(
      'SELECT responsavel_cpf FROM contratantes WHERE id = $1',
      [destinatario_id]
    );
    if (result.rows.length === 0) {
      throw new Error(`Contratante com ID ${destinatario_id} não encontrado`);
    }
    destinatarioCpf = result.rows[0].responsavel_cpf;
  } else if (destinatario_tipo === 'clinica') {
    // Para clínicas, usar um CPF fixo de responsável
    destinatarioCpf = '12345678901'; // CPF padrão para clínica
  } else {
    throw new Error(`Tipo de destinatário não suportado: ${destinatario_tipo}`);
  }

  const result = await query(
    `SELECT
      tipo::text as tipo,
      COUNT(*) as count
    FROM notificacoes
    WHERE destinatario_cpf = $1
      AND destinatario_tipo = $2
      AND resolvida = FALSE
      AND arquivada = FALSE
      AND (expira_em IS NULL OR expira_em > NOW())
    GROUP BY tipo
    ORDER BY count DESC`,
    [destinatarioCpf, destinatario_tipo]
  );

  const contadores: Record<string, number> = {};
  let total = 0;

  result.rows.forEach((row) => {
    contadores[row.tipo] = parseInt(row.count);
    total += parseInt(row.count);
  });

  contadores.total = total;

  return contadores;
}

/**
 * Marca notificação como lida (sem resolver)
 *
 * @param notificacao_id ID da notificação
 * @returns true se marcada como lida
 */
export async function marcarComoLida(notificacao_id: number): Promise<boolean> {
  const result = await query(
    `UPDATE notificacoes
    SET lida = TRUE, data_leitura = NOW()
    WHERE id = $1 AND lida = FALSE
    RETURNING id`,
    [notificacao_id]
  );

  return result.rowCount > 0;
}

/**
 * Limpa notificações resolvidas antigas (auditoria)
 *
 * @returns Quantidade de notificações arquivadas
 */
export async function limparNotificacoesAntigas(): Promise<number> {
  const result = await query(
    `SELECT limpar_notificacoes_resolvidas_antigas() as count`
  );
  return result.rows[0].count;
}
