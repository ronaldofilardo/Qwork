/**
 * lib/db/comissionamento.ts
 *
 * Camada de acesso a dados do módulo de comissionamento.
 * Todas as queries espelham EXATAMENTE as colunas da migration
 * 500_sistema_comissionamento.sql.
 *
 * As API routes podem continuar usando queries inline ou importar
 * estas funções para centralizar a lógica de acesso.
 */

import { query } from './query';
import type { Session } from '../session';
import type {
  StatusRepresentante,
  StatusComissao,
  MotivoCongelamento,
  Triggador,
} from '../types/comissionamento';
import { COMISSIONAMENTO_CONSTANTS } from '../types/comissionamento';

// ---------------------------------------------------------------------------
// Representantes
// ---------------------------------------------------------------------------

/** Busca representante por email (login) */
export async function getRepresentanteByEmail(email: string) {
  const result = await query(
    `SELECT * FROM representantes WHERE email = $1 LIMIT 1`,
    [email]
  );
  return result.rows[0] ?? null;
}

/** Busca representante por email + codigo (autenticação) */
export async function autenticarRepresentante(email: string, codigo: string) {
  const result = await query(
    `SELECT * FROM representantes
     WHERE email = $1 AND codigo = $2 AND status NOT IN ('desativado','rejeitado')
     LIMIT 1`,
    [email, codigo]
  );
  return result.rows[0] ?? null;
}

/** Busca representante por id */
export async function getRepresentanteById(id: number) {
  const result = await query(
    `SELECT * FROM representantes WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] ?? null;
}

/** Atualiza status do representante */
export async function atualizarStatusRepresentante(
  id: number,
  novoStatus: StatusRepresentante,
  extras?: { aprovado_por_cpf?: string }
) {
  const setClauses: string[] = ['status = $2', 'atualizado_em = NOW()'];
  const params: unknown[] = [id, novoStatus];
  let i = 3;

  if (novoStatus === 'apto' && extras?.aprovado_por_cpf) {
    setClauses.push(`aprovado_em = NOW()`, `aprovado_por_cpf = $${i++}`);
    params.push(extras.aprovado_por_cpf);
  }

  const result = await query(
    `UPDATE representantes SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return result.rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

/** Verifica se já existe lead ativo para um CNPJ */
export async function getLeadAtivoPorCnpj(cnpj: string) {
  const result = await query(
    `SELECT id, representante_id, status FROM leads_representante
     WHERE cnpj = $1 AND status = 'pendente' LIMIT 1`,
    [cnpj]
  );
  return result.rows[0] ?? null;
}

/** Lista leads de um representante com paginação */
export async function getLeadsByRepresentante(
  representanteId: number,
  opts?: { status?: string; page?: number; limit?: number }
) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;

  const wheres = [`l.representante_id = $1`];
  const params: unknown[] = [representanteId];
  let i = 2;

  if (
    opts?.status &&
    ['pendente', 'convertido', 'expirado'].includes(opts.status)
  ) {
    wheres.push(`l.status = $${i++}`);
    params.push(opts.status);
  }

  const where = `WHERE ${wheres.join(' AND ')}`;

  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*) as total FROM leads_representante l ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

  params.push(limit, offset);
  const rows = await query(
    `SELECT l.*, e.razao_social AS entidade_nome
     FROM leads_representante l
     LEFT JOIN entidades e ON e.id = l.entidade_id
     ${where}
     ORDER BY l.criado_em DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    params
  );

  return { leads: rows.rows, total, page, limit };
}

/** Cria um novo lead */
export async function criarLead(
  representanteId: number,
  data: {
    cnpj: string;
    razao_social?: string | null;
    contato_nome?: string | null;
    contato_email?: string | null;
    contato_telefone?: string | null;
  }
) {
  const result = await query(
    `INSERT INTO leads_representante (representante_id, cnpj, razao_social, contato_nome, contato_email, contato_telefone)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      representanteId,
      data.cnpj,
      data.razao_social ?? null,
      data.contato_nome ?? null,
      data.contato_email ?? null,
      data.contato_telefone ?? null,
    ]
  );
  return result.rows[0];
}

/** Gera (ou regenera) token on-demand para lead */
export async function gerarTokenLead(leadId: number) {
  const result = await query(
    `UPDATE leads_representante
     SET token_atual      = public.gerar_token_lead(),
         token_gerado_em  = NOW(),
         token_expiracao  = LEAST(data_expiracao, NOW() + INTERVAL '90 days')
     WHERE id = $1
     RETURNING token_atual, token_expiracao`,
    [leadId]
  );
  return result.rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Resolução de lead por cadastro (vínculo automático)
// ---------------------------------------------------------------------------

export interface LeadResolucao {
  lead_id: number;
  representante_id: number;
  representante_nome: string;
  representante_codigo: string;
  tipo_vinculo: 'codigo_representante' | 'verificacao_cnpj';
}

/**
 * Tenta encontrar um lead ativo que corresponda ao CNPJ cadastrado.
 * Prioridade 1: código manual do representante + CNPJ
 * Prioridade 2: CNPJ na lista de leads ativos de qualquer representante
 *
 * Nunca lança exceção — retorna null se não encontrar.
 */
export async function resolverLeadPorCadastro(
  cnpj: string,
  codigoRepresentante?: string
): Promise<LeadResolucao | null> {
  try {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (!/^\d{14}$/.test(cnpjLimpo)) return null;

    // Prioridade 1: código manual + CNPJ
    if (codigoRepresentante?.trim()) {
      const codigoNorm = codigoRepresentante.trim().toUpperCase();
      const codigoResult = await query(
        `SELECT
           l.id            AS lead_id,
           l.representante_id,
           r.nome          AS representante_nome,
           r.codigo        AS representante_codigo
         FROM leads_representante l
         JOIN representantes r ON r.id = l.representante_id
         WHERE r.codigo = $1
           AND l.cnpj   = $2
           AND l.status = 'pendente'
           AND l.data_expiracao > NOW()
         LIMIT 1`,
        [codigoNorm, cnpjLimpo]
      );

      if (codigoResult.rows.length > 0) {
        const row = codigoResult.rows[0];
        return {
          lead_id: row.lead_id,
          representante_id: row.representante_id,
          representante_nome: row.representante_nome,
          representante_codigo: row.representante_codigo,
          tipo_vinculo: 'codigo_representante',
        };
      }
    }

    // Prioridade 2: CNPJ na lista de leads ativos
    const cnpjResult = await query(
      `SELECT
         l.id            AS lead_id,
         l.representante_id,
         r.nome          AS representante_nome,
         r.codigo        AS representante_codigo
       FROM leads_representante l
       JOIN representantes r ON r.id = l.representante_id
       WHERE l.cnpj = $1
         AND l.status = 'pendente'
         AND l.data_expiracao > NOW()
       ORDER BY l.criado_em ASC
       LIMIT 1`,
      [cnpjLimpo]
    );

    if (cnpjResult.rows.length > 0) {
      const row = cnpjResult.rows[0];
      return {
        lead_id: row.lead_id,
        representante_id: row.representante_id,
        representante_nome: row.representante_nome,
        representante_codigo: row.representante_codigo,
        tipo_vinculo: 'verificacao_cnpj',
      };
    }

    return null;
  } catch (err) {
    console.error('[resolverLeadPorCadastro] Erro (não-bloqueante):', err);
    return null;
  }
}

/**
 * Converte um lead em vínculo: marca o lead como 'convertido' e cria a
 * entrada em vinculos_comissao. Não lança exceção — loga e retorna false.
 */
export async function converterLeadEmVinculo(
  leadId: number,
  representanteId: number,
  entidadeId: number,
  tipoVinculo: string
): Promise<boolean> {
  try {
    // 1. Marcar lead como convertido
    await query(
      `UPDATE leads_representante
       SET status = 'convertido',
           entidade_id = $2,
           data_conversao = NOW(),
           tipo_conversao = $3
       WHERE id = $1 AND status = 'pendente'`,
      [leadId, entidadeId, tipoVinculo]
    );

    // 2. Criar vínculo de comissão (1 ano)
    // Nota: Não usar ON CONFLICT pois usando índices parciais (PostgreSQL não suporta)
    // Se duplicata existir, o índice vinculo_unico_entidade vai gerar erro 23505,
    // que é capturado no catch e retorna false normalmente.
    await query(
      `INSERT INTO vinculos_comissao (representante_id, entidade_id, lead_id, data_inicio, data_expiracao)
       VALUES ($1, $2, $3, NOW()::DATE, (NOW()::DATE + INTERVAL '1 year')::DATE)`,
      [representanteId, entidadeId, leadId]
    );

    console.info(
      JSON.stringify({
        event: 'lead_convertido_vinculo_criado',
        lead_id: leadId,
        representante_id: representanteId,
        entidade_id: entidadeId,
        tipo_vinculo: tipoVinculo,
      })
    );

    return true;
  } catch (err) {
    console.error(
      JSON.stringify({
        event: 'lead_conversao_erro',
        lead_id: leadId,
        representante_id: representanteId,
        entidade_id: entidadeId,
        error: String(err),
      })
    );
    return false;
  }
}

/**
 * Auto-converte leads pendentes em vínculos de comissão por match de CNPJ.
 * Chamada em pontos de ativação do tomador (cadastro, aceite de contrato, pagamento).
 * Não lança exceção — loga e retorna resultado.
 */
export async function autoConvertirLeadPorCnpj(
  cnpj: string,
  entidadeId: number | null,
  clinicaId: number | null
): Promise<{
  representante_id: number;
  lead_id: number;
  vinculo_id: number;
} | null> {
  try {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (!/^\d{14}$/.test(cnpjLimpo)) return null;
    if (!entidadeId && !clinicaId) return null;

    // Buscar todos os leads pendentes que correspondam ao CNPJ
    const leadsResult = await query<{
      id: number;
      representante_id: number;
      valor_negociado: number | null;
    }>(
      `SELECT id, representante_id, valor_negociado
       FROM leads_representante
       WHERE cnpj = $1
         AND status = 'pendente'
         AND data_expiracao > NOW()
       ORDER BY criado_em ASC`,
      [cnpjLimpo]
    );

    if (leadsResult.rows.length === 0) return null;

    let resultado: {
      representante_id: number;
      lead_id: number;
      vinculo_id: number;
    } | null = null;

    for (const lead of leadsResult.rows) {
      try {
        // Criar vínculo de comissão (1 ano)
        const dataInicio = new Date().toISOString().split('T')[0];
        const dataExpiracao = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        // Usar entidade_id ou clinica_id conforme o tipo do tomador
        const insertFields = entidadeId
          ? 'representante_id, entidade_id, lead_id, data_inicio, data_expiracao, status'
          : 'representante_id, clinica_id, lead_id, data_inicio, data_expiracao, status';
        const targetId = entidadeId ?? clinicaId;

        const vinculoResult = await query<{ id: number }>(
          `INSERT INTO vinculos_comissao (${insertFields})
           VALUES ($1, $2, $3, $4, $5, 'ativo')
           RETURNING id`,
          [lead.representante_id, targetId, lead.id, dataInicio, dataExpiracao]
        );

        const vinculoId = vinculoResult.rows[0]?.id;

        // Marcar lead como convertido
        const updateFields = entidadeId
          ? `entidade_id = ${entidadeId}`
          : `entidade_id = NULL`;

        await query(
          `UPDATE leads_representante
           SET status = 'convertido',
               ${updateFields},
               data_conversao = NOW(),
               tipo_conversao = 'verificacao_cnpj'
           WHERE id = $1 AND status = 'pendente'`,
          [lead.id]
        );

        console.info(
          JSON.stringify({
            event: 'auto_lead_convertido_por_cnpj',
            lead_id: lead.id,
            representante_id: lead.representante_id,
            entidade_id: entidadeId,
            clinica_id: clinicaId,
            vinculo_id: vinculoId,
          })
        );

        if (!resultado && vinculoId) {
          resultado = {
            representante_id: lead.representante_id,
            lead_id: lead.id,
            vinculo_id: vinculoId,
          };
        }
      } catch (vinculoErr) {
        // 23505 = duplicata — vínculo já existe, apenas converter o lead
        if ((vinculoErr as any)?.code === '23505') {
          await query(
            `UPDATE leads_representante
             SET status = 'convertido', data_conversao = NOW(), tipo_conversao = 'verificacao_cnpj'
             WHERE id = $1 AND status = 'pendente'`,
            [lead.id]
          ).catch(() => {});
          console.info(
            JSON.stringify({
              event: 'auto_lead_convertido_vinculo_existente',
              lead_id: lead.id,
              representante_id: lead.representante_id,
            })
          );
        } else {
          console.error(
            JSON.stringify({
              event: 'auto_lead_conversao_erro',
              lead_id: lead.id,
              representante_id: lead.representante_id,
              error: String(vinculoErr),
            })
          );
        }
      }
    }

    return resultado;
  } catch (err) {
    console.error(
      JSON.stringify({
        event: 'auto_convertir_lead_cnpj_erro',
        cnpj: cnpj.replace(/\D/g, '').slice(0, 8) + '...',
        error: String(err),
      })
    );
    return null;
  }
}

// Vínculos
// ---------------------------------------------------------------------------

/** Lista vínculos de um representante com dados agregados */
export async function getVinculosByRepresentante(
  representanteId: number,
  opts?: { status?: string; page?: number; limit?: number }
) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;

  const wheres = [`v.representante_id = $1`];
  const params: unknown[] = [representanteId];
  let i = 2;

  if (
    opts?.status &&
    ['ativo', 'inativo', 'suspenso', 'encerrado'].includes(opts.status)
  ) {
    wheres.push(`v.status = $${i++}`);
    params.push(opts.status);
  }

  const where = `WHERE ${wheres.join(' AND ')}`;

  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*) as total FROM vinculos_comissao v ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

  params.push(limit, offset);
  const rows = await query(
    `SELECT
       v.*,
       e.razao_social               AS entidade_nome,
       e.cnpj                       AS entidade_cnpj,
       COUNT(c.id)                  AS total_comissoes,
       COALESCE(SUM(CASE WHEN c.status::text = 'paga' THEN c.valor_comissao ELSE 0 END), 0) AS valor_total_pago,
       COALESCE(SUM(CASE WHEN c.status::text IN ('pendente_nf','nf_em_analise','liberada') THEN c.valor_comissao ELSE 0 END), 0) AS valor_pendente,
       (v.data_expiracao - CURRENT_DATE) AS dias_para_expirar
     FROM vinculos_comissao v
     JOIN entidades e ON e.id = v.entidade_id
     LEFT JOIN comissoes_laudo c ON c.vinculo_id = v.id
     ${where}
     GROUP BY v.id, e.razao_social, e.cnpj
     ORDER BY v.data_expiracao ASC
     LIMIT $${i} OFFSET $${i + 1}`,
    params
  );

  return { vinculos: rows.rows, total, page, limit };
}

/** Renovar vínculo (ativo/inativo → ativo + 1 ano) */
export async function renovarVinculo(vinculoId: number) {
  const novaExpiracao = new Date();
  novaExpiracao.setFullYear(novaExpiracao.getFullYear() + 1);
  novaExpiracao.setHours(0, 0, 0, 0);

  const result = await query(
    `UPDATE vinculos_comissao
     SET data_expiracao = $2, status = 'ativo', atualizado_em = NOW()
     WHERE id = $1
     RETURNING *`,
    [vinculoId, novaExpiracao.toISOString()]
  );
  return result.rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Comissões
// ---------------------------------------------------------------------------

/** Lista comissões de um representante com resumo */
export async function getComissoesByRepresentante(
  representanteId: number,
  opts?: { status?: string; mes?: string; page?: number; limit?: number }
) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 30;
  const offset = (page - 1) * limit;

  const wheres = [`c.representante_id = $1`];
  const params: unknown[] = [representanteId];
  let i = 2;

  const statusValidos: StatusComissao[] = [
    'retida',
    'pendente_nf',
    'nf_em_analise',
    'congelada_rep_suspenso',
    'congelada_aguardando_admin',
    'liberada',
    'paga',
    'cancelada',
  ];
  if (opts?.status && statusValidos.includes(opts.status as StatusComissao)) {
    wheres.push(`c.status = $${i++}`);
    params.push(opts.status);
  }

  if (opts?.mes) {
    wheres.push(`c.mes_emissao = $${i++}::date`);
    params.push(`${opts.mes}-01`);
  }

  const where = `WHERE ${wheres.join(' AND ')}`;

  const resumo = await query(
    `SELECT
       COUNT(*) FILTER (WHERE c.status::text IN ('pendente_nf','nf_em_analise','retida'))      AS pendentes,
       COUNT(*) FILTER (WHERE c.status::text = 'liberada')                                      AS liberadas,
       COUNT(*) FILTER (WHERE c.status::text = 'paga')                                          AS pagas,
       -- valor_pendente: apenas comissões ativas no pipeline (parcela já paga ou à vista)
       COALESCE(SUM(c.valor_comissao) FILTER (WHERE
         c.status::text IN ('pendente_nf','nf_em_analise')
         OR (c.status::text = 'retida' AND c.parcela_confirmada_em IS NOT NULL)
       ), 0) AS valor_pendente,
       -- valor_futuro: comissões provisionadas aguardando pagamento da parcela
       COALESCE(SUM(c.valor_comissao) FILTER (WHERE
         c.status::text = 'retida' AND c.parcela_confirmada_em IS NULL
       ), 0) AS valor_futuro,
       COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status::text = 'liberada'), 0)            AS valor_liberado,
       COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status::text = 'paga'), 0)                AS valor_pago_total
     FROM comissoes_laudo c
     WHERE c.representante_id = $1`,
    [representanteId]
  );

  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*) as total FROM comissoes_laudo c ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

  params.push(limit, offset);
  const rows = await query(
    `SELECT
       c.*,
       COALESCE(e.nome, cl.nome) AS entidade_nome
     FROM comissoes_laudo c
     LEFT JOIN entidades e  ON e.id  = c.entidade_id
     LEFT JOIN clinicas  cl ON cl.id = c.clinica_id
     ${where}
     ORDER BY c.criado_em DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    params
  );

  return { comissoes: rows.rows, total, page, limit, resumo: resumo.rows[0] };
}

/** Atualiza status de comissão (admin) */
export async function atualizarStatusComissao(
  comissaoId: number,
  novoStatus: StatusComissao,
  extras?: {
    motivo_congelamento?: MotivoCongelamento;
    comprovante_pagamento_path?: string;
  }
) {
  const setClauses: string[] = [`status = $2`, `atualizado_em = NOW()`];
  const params: unknown[] = [comissaoId, novoStatus];
  let i = 3;

  if (novoStatus === 'liberada') {
    setClauses.push(`data_liberacao = NOW()`);
    setClauses.push(`nf_rpa_aprovada_em = NOW()`);
  }
  if (novoStatus === 'paga') setClauses.push(`data_pagamento = NOW()`);

  if (
    (novoStatus === 'congelada_aguardando_admin' ||
      novoStatus === 'congelada_rep_suspenso') &&
    extras?.motivo_congelamento
  ) {
    setClauses.push(`motivo_congelamento = $${i++}`);
    params.push(extras.motivo_congelamento);
  }

  if (extras?.comprovante_pagamento_path) {
    setClauses.push(`comprovante_pagamento_path = $${i++}`);
    params.push(extras.comprovante_pagamento_path);
  }

  // Limpar campos ao descongelar (F-13: forçar reenvio de NF)
  if (novoStatus === 'pendente_nf') {
    setClauses.push(`motivo_congelamento = NULL`);
    setClauses.push(`nf_rpa_enviada_em = NULL`);
    setClauses.push(`nf_rpa_aprovada_em = NULL`);
    setClauses.push(`nf_rpa_rejeitada_em = NULL`);
    setClauses.push(`nf_rpa_motivo_rejeicao = NULL`);
    setClauses.push(`nf_path = NULL`);
    setClauses.push(`nf_nome_arquivo = NULL`);
  }

  const result = await query(
    `UPDATE comissoes_laudo SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return result.rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Auditoria
// ---------------------------------------------------------------------------

/** Registra transição de status na tabela de auditoria */
export async function registrarAuditoria(data: {
  tabela: string;
  registro_id: number;
  status_anterior?: string | null;
  status_novo: string;
  triggador: Triggador;
  motivo?: string | null;
  dados_extras?: Record<string, unknown> | null;
  criado_por_cpf?: string | null;
}) {
  await query(
    `INSERT INTO comissionamento_auditoria
       (tabela, registro_id, status_anterior, status_novo, triggador, motivo, dados_extras, criado_por_cpf)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      data.tabela,
      data.registro_id,
      data.status_anterior ?? null,
      data.status_novo,
      data.triggador,
      data.motivo ?? null,
      data.dados_extras ? JSON.stringify(data.dados_extras) : null,
      data.criado_por_cpf ?? null,
    ]
  );
}

// ---------------------------------------------------------------------------
// Efeitos colaterais de mudança de status do representante
// ---------------------------------------------------------------------------

/** Congelar comissões quando representante é suspenso */
export async function congelarComissoesRepSuspenso(representanteId: number) {
  return query(
    `UPDATE comissoes_laudo
     SET status = 'congelada_rep_suspenso', motivo_congelamento = 'rep_suspenso', atualizado_em = NOW()
     WHERE representante_id = $1 AND status::text IN ('retida', 'pendente_nf', 'nf_em_analise', 'liberada')
     RETURNING id`,
    [representanteId]
  );
}

/** Suspender vínculos ativos quando representante é suspenso */
export async function suspenderVinculosRep(representanteId: number) {
  return query(
    `UPDATE vinculos_comissao SET status = 'suspenso', atualizado_em = NOW()
     WHERE representante_id = $1 AND status = 'ativo'
     RETURNING id`,
    [representanteId]
  );
}

/** Restaurar vínculos ao reverter suspensão */
export async function restaurarVinculosRep(representanteId: number) {
  return query(
    `UPDATE vinculos_comissao SET status = 'ativo', atualizado_em = NOW()
     WHERE representante_id = $1 AND status = 'suspenso'
     RETURNING id`,
    [representanteId]
  );
}

/** Liberar comissões retidas quando rep se torna apto (somente vínculos ativos/inativos).
 *  Só libera parcelas cuja parcela_confirmada_em IS NOT NULL (parcela efetivamente paga).
 *  Comissões provisionadas de parcelas futuras (parcela_confirmada_em IS NULL) aguardam
 *  o webhook da respectiva parcela para serem ativadas automaticamente.
 */
export async function liberarComissoesRetidas(representanteId: number) {
  return query(
    `UPDATE comissoes_laudo
     SET status = 'pendente_nf', data_aprovacao = NOW(), atualizado_em = NOW()
     WHERE representante_id = $1
       AND status = 'retida'
       AND parcela_confirmada_em IS NOT NULL
       AND vinculo_id IN (
         SELECT id FROM vinculos_comissao
         WHERE representante_id = $1 AND status IN ('ativo','inativo')
       )
     RETURNING id`,
    [representanteId]
  );
}

/** Encerrar vínculos e cancelar comissões quando rep é desativado */
export async function encerrarTudoRep(representanteId: number) {
  await query(
    `UPDATE vinculos_comissao
     SET status = 'encerrado', encerrado_em = NOW(), encerrado_motivo = 'Representante desativado', atualizado_em = NOW()
     WHERE representante_id = $1 AND status IN ('ativo','inativo','suspenso')`,
    [representanteId]
  );
  await query(
    `UPDATE comissoes_laudo
     SET status = 'cancelada', atualizado_em = NOW()
     WHERE representante_id = $1 AND status::text IN ('retida','pendente_nf','nf_em_analise','liberada','congelada_rep_suspenso','congelada_aguardando_admin')`,
    [representanteId]
  );
}

// ---------------------------------------------------------------------------
// Geração de comissão (admin)
// ---------------------------------------------------------------------------

/** Calcula previsão de pagamento com base na regra das 18h do dia 5 */
export function calcularPrevisaoPagamento(dataReferencia?: Date): {
  mes_pagamento: string;
  data_prevista_pagamento: string;
  prazo_nf: string;
} {
  const agora = dataReferencia ?? new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth(); // 0-indexed

  // Data de corte: dia 5 do mês seguinte ao de emissão, às 18h
  const mesPagamento = mes + 1; // mês seguinte
  const anoPagamento = mesPagamento > 11 ? ano + 1 : ano;
  const mesNormalizado = mesPagamento > 11 ? 0 : mesPagamento;

  // Primeiro dia do mês de pagamento (formato YYYY-MM-DD)
  const mesPagStr = `${anoPagamento}-${String(mesNormalizado + 1).padStart(2, '0')}-01`;

  // Dia 5 do mês de pagamento = prazo para NF
  const prazoNf = `${anoPagamento}-${String(mesNormalizado + 1).padStart(2, '0')}-${String(COMISSIONAMENTO_CONSTANTS.DIA_CORTE_NF).padStart(2, '0')}`;

  // Dia 15 do mês de pagamento = data prevista do pagamento
  const dataPrevista = `${anoPagamento}-${String(mesNormalizado + 1).padStart(2, '0')}-${String(COMISSIONAMENTO_CONSTANTS.DIA_PAGAMENTO).padStart(2, '0')}`;

  return {
    mes_pagamento: mesPagStr,
    data_prevista_pagamento: dataPrevista,
    prazo_nf: prazoNf,
  };
}

/**
 * Recalcula mes_pagamento com base no momento do envio da NF.
 * Regra: se NF enviada antes das 18h do dia 5 → ciclo do mês corrente;
 *        caso contrário → ciclo do mês seguinte.
 */
export function calcularMesPagamentoPorEnvioNf(dataEnvioNf: Date): {
  mes_pagamento: string;
  data_prevista_pagamento: string;
} {
  const dia = dataEnvioNf.getDate();
  const hora = dataEnvioNf.getHours();
  const ano = dataEnvioNf.getFullYear();
  const mes = dataEnvioNf.getMonth(); // 0-indexed

  // Enviou antes das 18h do dia 5 → ciclo deste mês
  const dentroDoPrazo =
    dia < COMISSIONAMENTO_CONSTANTS.DIA_CORTE_NF ||
    (dia === COMISSIONAMENTO_CONSTANTS.DIA_CORTE_NF &&
      hora < COMISSIONAMENTO_CONSTANTS.HORA_CORTE_NF);

  let mesAlvo: number;
  let anoAlvo: number;

  if (dentroDoPrazo) {
    mesAlvo = mes;
    anoAlvo = ano;
  } else {
    // Próximo ciclo
    mesAlvo = mes + 1;
    if (mesAlvo > 11) {
      mesAlvo = 0;
      anoAlvo = ano + 1;
    } else {
      anoAlvo = ano;
    }
  }

  const mesPagStr = `${anoAlvo}-${String(mesAlvo + 1).padStart(2, '0')}-01`;
  const dataPrevista = `${anoAlvo}-${String(mesAlvo + 1).padStart(2, '0')}-${String(COMISSIONAMENTO_CONSTANTS.DIA_PAGAMENTO).padStart(2, '0')}`;

  return { mes_pagamento: mesPagStr, data_prevista_pagamento: dataPrevista };
}

/**
 * Cria comissão para um lote pago, associada a uma parcela específica.
 * Pode ser chamada manualmente pelo admin ou automaticamente via webhook.
 * Fórmula: valor_comissao = base_calculo × percentual_comissao / 100
 *   base_calculo = valor_parcela (se informado) OU valor_laudo / total_parcelas
 * Previne duplicata por (lote_pagamento_id, parcela_numero).
 */
export async function criarComissaoAdmin(params: {
  lote_pagamento_id: number;
  vinculo_id: number;
  representante_id: number;
  entidade_id?: number | null;
  clinica_id?: number | null;
  laudo_id?: number | null;
  valor_laudo: number;
  /** Valor líquido da parcela (ex: netValue do Asaas). Usado diretamente no cálculo. */
  valor_parcela?: number | null;
  /** Número da parcela 1-based. Padrão 1 (à vista). */
  parcela_numero?: number;
  /** Total de parcelas. Padrão 1 (à vista). */
  total_parcelas?: number;
  admin_cpf?: string;
  /**
   * Quando true, força status inicial = 'retida' mesmo que o rep seja 'apto'.
   * Usado no provisionamento antecipado de parcelas futuras de lotes parcelados.
   */
  forcar_retida?: boolean;
  /**
   * Timestamp em que a parcela foi confirmada como paga.
   * NULL (padrão) = provisionada para parcela futura.
   * Date = parcela efetivamente paga (ex: à vista confirmado pelo admin).
   */
  parcela_confirmada_em?: Date | null;
}): Promise<{ comissao: Record<string, unknown> | null; erro?: string }> {
  const {
    lote_pagamento_id,
    vinculo_id,
    representante_id,
    entidade_id,
    clinica_id,
    laudo_id,
    valor_laudo,
    valor_parcela = null,
    parcela_numero = 1,
    total_parcelas = 1,
    admin_cpf,
    forcar_retida = false,
    parcela_confirmada_em = undefined,
  } = params;

  const parcelaNum = Math.max(1, Math.min(parcela_numero, total_parcelas));
  const totalParc = Math.max(1, total_parcelas);

  // Exige ao menos entidade_id ou clinica_id
  const entId = entidade_id && entidade_id > 0 ? entidade_id : null;
  const clinId = clinica_id && clinica_id > 0 ? clinica_id : null;
  if (!entId && !clinId) {
    return {
      comissao: null,
      erro: 'É necessário informar entidade_id ou clinica_id para gerar comissão.',
    };
  }

  // Verificar duplicata: uma comissão por (lote, parcela)
  const dup = await query(
    `SELECT id FROM comissoes_laudo WHERE lote_pagamento_id = $1 AND parcela_numero = $2 LIMIT 1`,
    [lote_pagamento_id, parcelaNum]
  );
  if (dup.rows.length > 0) {
    return {
      comissao: null,
      erro: `Comissão já gerada para este lote (parcela ${parcelaNum}/${totalParc}).`,
    };
  }

  // Verificar vínculo ativo
  const vinculoResult = await query(
    `SELECT id, status, data_expiracao FROM vinculos_comissao WHERE id = $1 LIMIT 1`,
    [vinculo_id]
  );
  if (vinculoResult.rows.length === 0) {
    return { comissao: null, erro: 'Vínculo de comissão não encontrado.' };
  }
  const vinculo = vinculoResult.rows[0];
  if (!['ativo', 'inativo'].includes(vinculo.status)) {
    return {
      comissao: null,
      erro: `Vínculo com status '${vinculo.status}' não permite geração de comissão.`,
    };
  }

  // Verificar representante e buscar percentual de comissão
  const repResult = await query(
    `SELECT id, status, percentual_comissao FROM representantes WHERE id = $1 LIMIT 1`,
    [representante_id]
  );
  if (repResult.rows.length === 0) {
    return { comissao: null, erro: 'Representante não encontrado.' };
  }
  const rep = repResult.rows[0];
  if (['desativado', 'rejeitado'].includes(rep.status)) {
    return {
      comissao: null,
      erro: `Representante com status '${rep.status}' não pode receber comissão.`,
    };
  }

  // Verificar percentual de comissão definido
  const percentualRep =
    rep.percentual_comissao != null
      ? parseFloat(rep.percentual_comissao)
      : null;
  if (percentualRep == null) {
    return {
      comissao: null,
      erro: 'Percentual de comissão não definido para este representante. Defina o percentual na página do representante antes de gerar comissões.',
    };
  }

  // Cálculo: base_calculo × percentual / 100
  // Se valor_parcela informado (ex: netValue Asaas), usar diretamente.
  // Caso contrário, distribuir: valor_laudo / total_parcelas.
  const baseCalculo =
    valor_parcela != null && valor_parcela > 0
      ? valor_parcela
      : valor_laudo / totalParc;
  const valorComissao =
    Math.round(((baseCalculo * percentualRep) / 100) * 100) / 100;

  // Status inicial:
  //   forcar_retida=true → sempre retida (provisionamento antecipado de parcelas futuras)
  //   forcar_retida=false → pendente_nf se rep é apto, retida caso contrário
  const statusInicial: StatusComissao =
    forcar_retida || rep.status !== 'apto' ? 'retida' : 'pendente_nf';

  // Mês de emissão e pagamento
  const agora = new Date();
  const mesEmissao = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`;
  const { mes_pagamento: mesPagBase } = calcularPrevisaoPagamento(agora);
  // Parcelado: cada parcela N tem previsão deslocada em (N-1) meses
  // parcela 1 → base, parcela 2 → base+1 mês, etc.
  const mesPagDate = new Date(mesPagBase + 'T00:00:00Z');
  mesPagDate.setUTCMonth(mesPagDate.getUTCMonth() + (parcelaNum - 1));
  const mes_pagamento = `${mesPagDate.getUTCFullYear()}-${String(mesPagDate.getUTCMonth() + 1).padStart(2, '0')}-01`;

  const result = await query(
    `INSERT INTO comissoes_laudo (
       vinculo_id, representante_id, entidade_id, clinica_id, laudo_id, lote_pagamento_id,
       valor_laudo, percentual_comissao, valor_comissao,
       status, mes_emissao, mes_pagamento, data_emissao_laudo,
       data_aprovacao, parcela_numero, total_parcelas, parcela_confirmada_em
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9,
       $10::status_comissao, $11::date, $12::date, NOW(),
       CASE WHEN $10::status_comissao = 'pendente_nf' THEN NOW() ELSE NULL END,
       $13, $14, $15
     ) RETURNING *`,
    [
      vinculo_id,
      representante_id,
      entId,
      clinId,
      laudo_id ?? null,
      lote_pagamento_id,
      valor_laudo,
      percentualRep,
      valorComissao,
      statusInicial,
      mesEmissao,
      mes_pagamento,
      parcelaNum,
      totalParc,
      parcela_confirmada_em != null
        ? parcela_confirmada_em.toISOString()
        : null,
    ]
  );

  const comissaoCriada = result.rows[0];

  // Registrar auditoria
  if (comissaoCriada) {
    await registrarAuditoria({
      tabela: 'comissoes_laudo',
      registro_id: comissaoCriada.id,
      status_anterior: null,
      status_novo: statusInicial,
      triggador: 'admin_action',
      motivo:
        admin_cpf === 'WEBHOOK'
          ? `Comissão automática parcela ${parcelaNum}/${totalParc} via webhook — lote ${lote_pagamento_id}`
          : `Comissão parcela ${parcelaNum}/${totalParc} gerada pelo admin — lote ${lote_pagamento_id}`,
      dados_extras: {
        valor_laudo,
        percentual_comissao: percentualRep,
        valor_comissao: valorComissao,
      },
      criado_por_cpf: admin_cpf ?? null,
    });

    // Atualizar ultimo_laudo_em no vínculo
    await query(
      `UPDATE vinculos_comissao SET ultimo_laudo_em = NOW(), status = CASE WHEN status = 'inativo' THEN 'ativo' ELSE status END WHERE id = $1`,
      [vinculo_id]
    );
  }

  return { comissao: comissaoCriada };
}

// ---------------------------------------------------------------------------
// Ativação de parcela paga (retida → pendente_nf)
// ---------------------------------------------------------------------------

/**
 * Ativa a comissão de uma parcela específica ao confirmar o seu pagamento.
 * Transição: retida → pendente_nf (se rep apto) ou retida + parcela_confirmada_em (se rep não apto).
 *
 * Idempotente: se parcela_confirmada_em já está preenchida, retorna ok:true/ja_ativada.
 * Nunca lança exceção.
 */
export async function ativarComissaoParcelaPaga(params: {
  lote_id: number;
  parcela_numero: number;
}): Promise<{ ok: boolean; motivo?: string }> {
  const { lote_id, parcela_numero } = params;

  try {
    const result = await query(
      `SELECT cl.id, cl.status, cl.parcela_confirmada_em, r.status AS rep_status
       FROM comissoes_laudo cl
       JOIN representantes r ON r.id = cl.representante_id
       WHERE cl.lote_pagamento_id = $1 AND cl.parcela_numero = $2
       LIMIT 1`,
      [lote_id, parcela_numero]
    );

    if (result.rows.length === 0) {
      console.warn(
        `[Comissionamento] Comissão não encontrada para lote ${lote_id} parcela ${parcela_numero}`
      );
      return { ok: false, motivo: 'comissao_nao_encontrada' };
    }

    const comissao = result.rows[0];

    // Idempotente: parcela já foi ativada anteriormente
    if (comissao.parcela_confirmada_em !== null) {
      console.log(
        `[Comissionamento] Parcela ${parcela_numero} do lote ${lote_id} já ativada — ignorando (idempotente)`
      );
      return { ok: true, motivo: 'ja_ativada' };
    }

    const repApto = comissao.rep_status === 'apto';
    const statusAnterior: string = comissao.status;
    const statusNovo: StatusComissao = repApto ? 'pendente_nf' : 'retida';

    await query(
      `UPDATE comissoes_laudo
       SET parcela_confirmada_em = NOW(),
           atualizado_em = NOW(),
           status = CASE WHEN $2::boolean THEN 'pendente_nf'::status_comissao ELSE status END,
           data_aprovacao = CASE WHEN $2::boolean THEN NOW() ELSE data_aprovacao END
       WHERE id = $1`,
      [comissao.id, repApto]
    );

    await registrarAuditoria({
      tabela: 'comissoes_laudo',
      registro_id: comissao.id,
      status_anterior: statusAnterior,
      status_novo: statusNovo,
      triggador: 'sistema',
      motivo: `Parcela ${parcela_numero} confirmada como paga via webhook${
        repApto
          ? ' — transicionada para pendente_nf'
          : ' — mantida retida (rep não apto ainda)'
      }`,
    });

    console.log(
      `[Comissionamento] ✅ Parcela ${parcela_numero} do lote ${lote_id} ativada — status: ${statusNovo}`
    );
    return { ok: true };
  } catch (err) {
    console.error(
      `[Comissionamento] Erro ao ativar parcela ${parcela_numero} do lote ${lote_id}:`,
      err
    );
    return { ok: false, motivo: 'erro_interno' };
  }
}

// ---------------------------------------------------------------------------
// Criação automática de comissão via webhook
// ---------------------------------------------------------------------------

/**
 * Gerencia comissões automaticamente ao confirmar pagamento via webhook Asaas.
 *
 * FLUXO PARCELADO (total_parcelas > 1):
 *   - 1ª chamada (nenhuma comissão no lote): provisiona TODAS as N comissões
 *     como 'retida' com parcela_confirmada_em=NULL (parcelas futuras).
 *   - Toda chamada: ativa a parcela_numero recém-paga via ativarComissaoParcelaPaga
 *     (retida → pendente_nf se rep apto; ou apenas seta parcela_confirmada_em se não apto).
 *
 * FLUXO À VISTA (total_parcelas = 1):
 *   - Comportamento original: cria 1 comissão com parcela_confirmada_em=NOW().
 *     Status = pendente_nf se rep apto; retida caso contrário.
 *
 * Nunca lança exceção. Idempotente.
 */
export async function criarComissaoAutomatica(params: {
  lote_id: number;
  entidade_id: number | null;
  clinica_id: number | null;
  valor_total_lote: number;
  /** Valor líquido da parcela recebido do Asaas (netValue). */
  valor_parcela_liquida: number;
  parcela_numero: number;
  total_parcelas: number;
}): Promise<{
  ok: boolean;
  motivo?: string;
  comissao?: Record<string, unknown>;
}> {
  const {
    lote_id,
    entidade_id,
    clinica_id,
    valor_total_lote,
    valor_parcela_liquida,
    parcela_numero,
    total_parcelas,
  } = params;

  try {
    const entId = entidade_id && entidade_id > 0 ? entidade_id : null;
    const clinId = clinica_id && clinica_id > 0 ? clinica_id : null;

    if (!entId && !clinId) {
      console.log(
        `[Comissionamento] Sem entidade_id nem clinica_id para lote ${lote_id} — sem comissão`
      );
      return { ok: false, motivo: 'sem_entidade_clinica' };
    }

    // Buscar vínculo ativo para a entidade ou clínica
    const vinculoResult = await query(
      `SELECT vc.id, vc.representante_id, vc.entidade_id, vc.clinica_id
       FROM vinculos_comissao vc
       WHERE vc.status = 'ativo'
         AND vc.data_expiracao > CURRENT_DATE
         AND (
           ($1::int IS NOT NULL AND vc.entidade_id = $1)
           OR
           ($2::int IS NOT NULL AND vc.clinica_id = $2)
         )
       ORDER BY vc.criado_em DESC
       LIMIT 1`,
      [entId, clinId]
    );

    if (vinculoResult.rows.length === 0) {
      console.log(
        `[Comissionamento] Nenhum vínculo ativo para entidade_id=${entId}, clinica_id=${clinId} — sem comissão para lote ${lote_id}`
      );
      return { ok: false, motivo: 'sem_vinculo' };
    }

    const vinculo = vinculoResult.rows[0];

    // Verificar quantas comissões já existem para este lote
    const existingResult = await query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM comissoes_laudo WHERE lote_pagamento_id = $1`,
      [lote_id]
    );
    const existingCount = parseInt(existingResult.rows[0]?.total ?? '0', 10);

    if (existingCount === 0) {
      if (total_parcelas > 1) {
        // PARCELADO: primeira chamada — provisionar TODAS as N parcelas como retida
        // parcela_confirmada_em = NULL (futuras); ativarComissaoParcelaPaga vai setar a atual
        console.log(
          `[Comissionamento] Lote ${lote_id}: provisionando ${total_parcelas} comissões antecipadamente`
        );
        for (let p = 1; p <= total_parcelas; p++) {
          const res = await criarComissaoAdmin({
            lote_pagamento_id: lote_id,
            vinculo_id: vinculo.id,
            representante_id: vinculo.representante_id,
            entidade_id: vinculo.entidade_id ?? null,
            clinica_id: vinculo.clinica_id ?? null,
            laudo_id: null,
            valor_laudo: valor_total_lote,
            // Só a parcela paga tem valor líquido real; as futuras usam distribuição proporcional
            valor_parcela: p === parcela_numero ? valor_parcela_liquida : null,
            parcela_numero: p,
            total_parcelas,
            admin_cpf: 'WEBHOOK',
            forcar_retida: true, // sempre retida (ativação feita via ativarComissaoParcelaPaga)
            parcela_confirmada_em: null, // futura até o webhook da parcela chegar
          });
          if (res.erro && !res.erro.includes('já gerada')) {
            console.warn(
              `[Comissionamento] Erro ao provisionar parcela ${p}/${total_parcelas} do lote ${lote_id}: ${res.erro}`
            );
          }
        }
        console.log(
          `[Comissionamento] ✅ ${total_parcelas} comissões provisionadas para lote ${lote_id}`
        );
      } else {
        // À VISTA: comportamento original — cria 1 comissão com parcela_confirmada_em=NOW()
        const result = await criarComissaoAdmin({
          lote_pagamento_id: lote_id,
          vinculo_id: vinculo.id,
          representante_id: vinculo.representante_id,
          entidade_id: vinculo.entidade_id ?? null,
          clinica_id: vinculo.clinica_id ?? null,
          laudo_id: null,
          valor_laudo: valor_total_lote,
          valor_parcela: valor_parcela_liquida,
          parcela_numero: 1,
          total_parcelas: 1,
          admin_cpf: 'WEBHOOK',
          parcela_confirmada_em: new Date(), // à vista: confirmada imediatamente
          // forcar_retida não definido → status depende do rep (pendente_nf se apto)
        });

        if (result.erro) {
          if (result.erro.includes('já gerada')) {
            return { ok: false, motivo: 'duplicata' };
          }
          console.warn(
            `[Comissionamento] Erro ao gerar comissão à vista para lote ${lote_id}: ${result.erro}`
          );
          return { ok: false, motivo: result.erro };
        }

        console.log(
          `[Comissionamento] ✅ Comissão à vista criada: lote=${lote_id} valor_comissao=${String(result.comissao?.valor_comissao)}`
        );
        return { ok: true, comissao: result.comissao ?? undefined };
      }
    }

    // Ativar a parcela recém-paga (retida → pendente_nf se rep apto)
    // Cobre tanto o fluxo parcelado (após provisionar ou em chamadas subsequentes)
    // quanto edge cases em que existingCount > 0 mas a parcela não foi ativada.
    const ativacao = await ativarComissaoParcelaPaga({
      lote_id,
      parcela_numero,
    });
    if (!ativacao.ok && ativacao.motivo !== 'ja_ativada') {
      console.warn(
        `[Comissionamento] Aviso ao ativar parcela ${parcela_numero}/${total_parcelas} do lote ${lote_id}: ${ativacao.motivo}`
      );
    }

    return { ok: true };
  } catch (err) {
    console.error(
      `[Comissionamento] Erro inesperado ao criar comissão automática para lote ${lote_id}:`,
      err
    );
    return { ok: false, motivo: 'erro_interno' };
  }
}

// ---------------------------------------------------------------------------
// Percentual de comissão do representante (admin)
// ---------------------------------------------------------------------------

/** Atualiza o percentual de comissão individual de um representante */
export async function atualizarPercentualComissaoRep(
  representanteId: number,
  percentual: number
): Promise<{ representante: Record<string, unknown> | null; erro?: string }> {
  if (percentual < 0 || percentual > 100) {
    return {
      representante: null,
      erro: 'Percentual deve estar entre 0 e 100.',
    };
  }
  const result = await query(
    `UPDATE representantes
     SET percentual_comissao = $2, atualizado_em = NOW()
     WHERE id = $1
     RETURNING id, nome, percentual_comissao`,
    [representanteId, percentual]
  );
  if (result.rows.length === 0) {
    return { representante: null, erro: 'Representante não encontrado.' };
  }
  return { representante: result.rows[0] };
}

// ---------------------------------------------------------------------------
// Vincular representante por código (admin)
// ---------------------------------------------------------------------------

/** Resolve código → representante e cria vínculo se não existe.
 * Suporta dois fluxos:
 *  - Gestor: passa entidadeId (int)
 *  - Clínica pura (RH-flow, sem entidade espelho): passa clinicaId (int)
 * Exatamente um dos dois deve ser fornecido.
 */
export async function vincularRepresentantePorCodigo(
  codigo: string,
  entidadeId: number | null | undefined,
  clinicaId?: number | null
): Promise<{
  vinculo_id: number;
  representante_id: number;
  representante_nome: string;
} | null> {
  if (!entidadeId && !clinicaId) return null;

  const codigoNorm = codigo.trim().toUpperCase();

  // Buscar representante
  const repResult = await query(
    `SELECT id, nome, status FROM representantes WHERE codigo = $1 AND status NOT IN ('desativado','rejeitado') LIMIT 1`,
    [codigoNorm]
  );
  if (repResult.rows.length === 0) return null;
  const rep = repResult.rows[0];

  if (entidadeId) {
    // ---- Fluxo gestor: vínculo por entidade_id ----
    const vinculoExistente = await query(
      `SELECT id FROM vinculos_comissao WHERE representante_id = $1 AND entidade_id = $2 LIMIT 1`,
      [rep.id, entidadeId]
    );
    if (vinculoExistente.rows.length > 0) {
      return {
        vinculo_id: vinculoExistente.rows[0].id,
        representante_id: rep.id,
        representante_nome: rep.nome,
      };
    }
    const novoVinculo = await query(
      `INSERT INTO vinculos_comissao (representante_id, entidade_id, data_inicio, data_expiracao)
       VALUES ($1, $2, NOW()::DATE, (NOW()::DATE + INTERVAL '1 year')::DATE)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [rep.id, entidadeId]
    );
    // ON CONFLICT DO NOTHING pode retornar 0 linhas — re-buscar
    const idFinal =
      novoVinculo.rows[0]?.id ??
      (
        await query(
          `SELECT id FROM vinculos_comissao WHERE representante_id = $1 AND entidade_id = $2 LIMIT 1`,
          [rep.id, entidadeId]
        )
      ).rows[0]?.id;
    return {
      vinculo_id: idFinal,
      representante_id: rep.id,
      representante_nome: rep.nome,
    };
  } else {
    // ---- Fluxo clínica pura: vínculo por clinica_id ----
    const vinculoExistente = await query(
      `SELECT id FROM vinculos_comissao WHERE representante_id = $1 AND clinica_id = $2 LIMIT 1`,
      [rep.id, clinicaId]
    );
    if (vinculoExistente.rows.length > 0) {
      return {
        vinculo_id: vinculoExistente.rows[0].id,
        representante_id: rep.id,
        representante_nome: rep.nome,
      };
    }
    const novoVinculo = await query(
      `INSERT INTO vinculos_comissao (representante_id, clinica_id, data_inicio, data_expiracao)
       VALUES ($1, $2, NOW()::DATE, (NOW()::DATE + INTERVAL '1 year')::DATE)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [rep.id, clinicaId]
    );
    const idFinal =
      novoVinculo.rows[0]?.id ??
      (
        await query(
          `SELECT id FROM vinculos_comissao WHERE representante_id = $1 AND clinica_id = $2 LIMIT 1`,
          [rep.id, clinicaId]
        )
      ).rows[0]?.id;
    return {
      vinculo_id: idFinal,
      representante_id: rep.id,
      representante_nome: rep.nome,
    };
  }
}

// ---------------------------------------------------------------------------
// NF/RPA — Representante
// ---------------------------------------------------------------------------

/** Registra envio de NF pelo representante e recalcula mes_pagamento */
export async function registrarNfRep(
  comissaoId: number,
  representanteId: number,
  nfPath: string,
  nfNomeArquivo: string,
  cpf?: string
): Promise<{
  comissao: Record<string, unknown> | null;
  previsao: { mes_pagamento: string; data_prevista_pagamento: string } | null;
  erro?: string;
}> {
  // Verificar comissão pertence ao rep e está em status válido
  const comissaoResult = await query(
    `SELECT id, status, nf_rpa_enviada_em FROM comissoes_laudo WHERE id = $1 AND representante_id = $2 LIMIT 1`,
    [comissaoId, representanteId]
  );
  if (comissaoResult.rows.length === 0) {
    return { comissao: null, previsao: null, erro: 'Comissão não encontrada.' };
  }
  const comissao = comissaoResult.rows[0];

  // Status válidos para envio de NF
  const statusPermitidos = ['pendente_nf', 'congelada_aguardando_admin'];
  if (!statusPermitidos.includes(comissao.status)) {
    return {
      comissao: null,
      previsao: null,
      erro: `NF não pode ser enviada para comissão com status '${comissao.status}'.`,
    };
  }

  // Recalcular mes_pagamento pela regra das 18h do dia 5
  const agora = new Date();
  const previsao = calcularMesPagamentoPorEnvioNf(agora);

  // Se temos CPF do representante, passamos como sessão mínima para o wrapper
  // executar SET LOCAL app.current_user_cpf antes do UPDATE, satisfazendo o trigger de auditoria.
  const querySession = cpf
    ? ({ cpf, perfil: 'representante', nome: '' } as unknown as Session)
    : undefined;

  // Atualizar comissão
  const updated = await query(
    `UPDATE comissoes_laudo
     SET nf_path = $3,
         nf_nome_arquivo = $4,
         nf_rpa_enviada_em = NOW(),
         nf_rpa_rejeitada_em = NULL,
         nf_rpa_motivo_rejeicao = NULL,
         mes_pagamento = $5::date,
         status = 'nf_em_analise',
         motivo_congelamento = NULL,
         atualizado_em = NOW()
     WHERE id = $1 AND representante_id = $2
     RETURNING *`,
    [
      comissaoId,
      representanteId,
      nfPath,
      nfNomeArquivo,
      previsao.mes_pagamento,
    ],
    querySession
  );

  return { comissao: updated.rows[0] ?? null, previsao };
}

// ---------------------------------------------------------------------------
// NF/RPA — Admin
// ---------------------------------------------------------------------------

/** Admin aprova ou rejeita NF de uma comissão */
export async function processarNfAdmin(
  comissaoId: number,
  acao: 'aprovar' | 'rejeitar',
  motivo?: string,
  adminCpf?: string
): Promise<{ comissao: Record<string, unknown> | null; erro?: string }> {
  const comissaoResult = await query(
    `SELECT * FROM comissoes_laudo WHERE id = $1 LIMIT 1`,
    [comissaoId]
  );
  if (comissaoResult.rows.length === 0) {
    return { comissao: null, erro: 'Comissão não encontrada.' };
  }
  const comissao = comissaoResult.rows[0];

  if (!comissao.nf_rpa_enviada_em) {
    return {
      comissao: null,
      erro: 'Nenhuma NF/RPA foi enviada para esta comissão.',
    };
  }

  if (acao === 'aprovar') {
    if (comissao.status !== 'nf_em_analise') {
      return {
        comissao: null,
        erro: `Só é possível aprovar NF de comissão com status 'nf_em_analise'. Status atual: '${comissao.status}'.`,
      };
    }

    const updated = await query(
      `UPDATE comissoes_laudo
       SET status = 'liberada',
           nf_rpa_aprovada_em = NOW(),
           data_liberacao = NOW(),
           atualizado_em = NOW()
       WHERE id = $1 RETURNING *`,
      [comissaoId]
    );

    await registrarAuditoria({
      tabela: 'comissoes_laudo',
      registro_id: comissaoId,
      status_anterior: comissao.status,
      status_novo: 'liberada',
      triggador: 'admin_action',
      motivo: 'NF/RPA aprovada pelo admin',
      criado_por_cpf: adminCpf ?? null,
    });

    return { comissao: updated.rows[0] ?? null };
  }

  // Rejeitar — exige status nf_em_analise (F-03)
  if (comissao.status !== 'nf_em_analise') {
    return {
      comissao: null,
      erro: `Só é possível rejeitar NF de comissão com status 'nf_em_analise'. Status atual: '${comissao.status}'.`,
    };
  }

  if (!motivo?.trim()) {
    return {
      comissao: null,
      erro: 'Motivo é obrigatório para rejeição de NF.',
    };
  }

  const updated = await query(
    `UPDATE comissoes_laudo
     SET status = 'pendente_nf',
         motivo_congelamento = NULL,
         nf_rpa_rejeitada_em = NOW(),
         nf_rpa_motivo_rejeicao = $2,
         nf_rpa_aprovada_em = NULL,
         atualizado_em = NOW()
     WHERE id = $1 RETURNING *`,
    [comissaoId, motivo.trim()]
  );

  await registrarAuditoria({
    tabela: 'comissoes_laudo',
    registro_id: comissaoId,
    status_anterior: comissao.status,
    status_novo: 'pendente_nf',
    triggador: 'admin_action',
    motivo: `NF/RPA rejeitada: ${motivo.trim()}`,
    criado_por_cpf: adminCpf ?? null,
  });

  return { comissao: updated.rows[0] ?? null };
}
