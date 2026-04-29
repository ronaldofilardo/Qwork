/**
 * lib/db/comissionamento/leads.ts
 *
 * Gestão de leads de representantes: criação, busca, resolução e conversão.
 */

import { query } from '../query';

export interface LeadResolucao {
  lead_id: number;
  representante_id: number;
  representante_nome: string;
  tipo_vinculo: 'codigo_representante' | 'verificacao_cnpj';
}

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

/**
 * Tenta encontrar um lead ativo que corresponda ao CNPJ cadastrado.
 * Prioridade 1: id numérico do representante + CNPJ
 * Prioridade 2: CNPJ na lista de leads ativos de qualquer representante
 *
 * Nunca lança exceção — retorna null se não encontrar.
 */
export async function resolverLeadPorCadastro(
  cnpj: string,
  representanteId?: number
): Promise<LeadResolucao | null> {
  try {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (!/^\d{14}$/.test(cnpjLimpo)) return null;

    // Prioridade 1: id do representante + CNPJ
    if (representanteId && Number.isFinite(representanteId)) {
      const codigoResult = await query(
        `SELECT
           l.id            AS lead_id,
           l.representante_id,
           r.nome          AS representante_nome
         FROM leads_representante l
         JOIN representantes r ON r.id = l.representante_id
         WHERE r.id = $1
           AND l.cnpj   = $2
           AND l.status = 'pendente'
           AND l.data_expiracao > NOW()
         LIMIT 1`,
        [representanteId, cnpjLimpo]
      );

      if (codigoResult.rows.length > 0) {
        const row = codigoResult.rows[0];
        return {
          lead_id: row.lead_id,
          representante_id: row.representante_id,
          representante_nome: row.representante_nome,
          tipo_vinculo: 'codigo_representante',
        };
      }
    }

    // Prioridade 2: CNPJ na lista de leads ativos
    const cnpjResult = await query(
      `SELECT
         l.id            AS lead_id,
         l.representante_id,
         r.nome          AS representante_nome
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

    // Buscar percentual do lead para propagar ao vínculo
    const leadData = await query(
      `SELECT percentual_comissao_representante, percentual_comissao
       FROM leads_representante WHERE id = $1 LIMIT 1`,
      [leadId]
    );
    const lead = leadData.rows[0];
    const percRep =
      lead?.percentual_comissao_representante != null
        ? lead.percentual_comissao_representante
        : (lead?.percentual_comissao ?? 0);

    await query(
      `INSERT INTO vinculos_comissao (representante_id, entidade_id, lead_id, data_inicio, data_expiracao, percentual_comissao_representante)
       VALUES ($1, $2, $3, NOW()::DATE, (NOW()::DATE + INTERVAL '1 year')::DATE, $4)`,
      [representanteId, entidadeId, leadId, percRep]
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
      percentual_comissao_representante: number | null;
      percentual_comissao: number | null;
      num_vidas_estimado: number | null;
    }>(
      `SELECT id, representante_id, valor_negociado,
              percentual_comissao_representante, percentual_comissao,
              num_vidas_estimado
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
        const percRep =
          lead.percentual_comissao_representante ??
          lead.percentual_comissao ??
          0;
        const numVidas = lead.num_vidas_estimado ?? null;
        const valorNegociado = lead.valor_negociado ?? null;
        const insertFields = entidadeId
          ? 'representante_id, entidade_id, lead_id, data_inicio, data_expiracao, status, percentual_comissao_representante, num_vidas_estimado, valor_negociado'
          : 'representante_id, clinica_id, lead_id, data_inicio, data_expiracao, status, percentual_comissao_representante, num_vidas_estimado, valor_negociado';
        const targetId = entidadeId ?? clinicaId;

        const vinculoResult = await query<{ id: number }>(
          `INSERT INTO vinculos_comissao (${insertFields})
           VALUES ($1, $2, $3, $4, $5, 'ativo', $6, $7, $8)
           RETURNING id`,
          [
            lead.representante_id,
            targetId,
            lead.id,
            dataInicio,
            dataExpiracao,
            percRep,
            numVidas,
            valorNegociado,
          ]
        );

        const vinculoId = vinculoResult.rows[0]?.id;

        // Marcar lead como convertido
        await query(
          `UPDATE leads_representante
           SET status = 'convertido',
               entidade_id = $2,
               data_conversao = NOW(),
               tipo_conversao = 'verificacao_cnpj'
           WHERE id = $1 AND status = 'pendente'`,
          [lead.id, entidadeId ?? null]
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
        // 23505 = duplicata — vínculo já existe, atualizar lead_id no vínculo se NULL e converter o lead
        if ((vinculoErr as any)?.code === '23505') {
          // Backfill: vinculo existente pode ter lead_id = NULL (criado via rota admin sem lead)
          // Atualizar para garantir que comissões apareçam em "Minhas Vendas" do representante
          if (entidadeId) {
            await query(
              `UPDATE vinculos_comissao
               SET lead_id = $1, atualizado_em = NOW()
               WHERE representante_id = $2 AND entidade_id = $3 AND lead_id IS NULL`,
              [lead.id, lead.representante_id, entidadeId]
            ).catch(() => {});
          } else if (clinicaId) {
            await query(
              `UPDATE vinculos_comissao
               SET lead_id = $1, atualizado_em = NOW()
               WHERE representante_id = $2 AND clinica_id = $3 AND lead_id IS NULL`,
              [lead.id, lead.representante_id, clinicaId]
            ).catch(() => {});
          }
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
