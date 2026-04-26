/**
 * lib/db/comissionamento/vinculos.ts
 *
 * Gestão de vínculos de comissão entre representantes e entidades/clínicas.
 */

import { query } from '../query';

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
       v.percentual_comissao_representante,
       COUNT(c.id)                  AS total_comissoes,
       COALESCE(SUM(CASE WHEN c.status::text = 'paga' THEN c.valor_comissao ELSE 0 END), 0) AS valor_total_pago,
       COALESCE(SUM(CASE WHEN c.status::text = 'retida' AND c.parcela_confirmada_em IS NOT NULL THEN c.valor_comissao ELSE 0 END), 0) AS valor_pendente,
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

/** Resolve id numérico → representante e cria vínculo se não existe.
 * Suporta dois fluxos:
 *  - Gestor: passa entidadeId (int)
 *  - Clínica pura (RH-flow, sem entidade espelho): passa clinicaId (int)
 * Exatamente um dos dois deve ser fornecido.
 */
export async function vincularRepresentantePorId(
  representanteId: number,
  entidadeId: number | null | undefined,
  clinicaId?: number | null
): Promise<{
  vinculo_id: number;
  representante_id: number;
  representante_nome: string;
} | null> {
  if (!entidadeId && !clinicaId) return null;
  if (!Number.isFinite(representanteId)) return null;

  // Buscar representante
  const repResult = await query(
    `SELECT id, nome, status FROM representantes WHERE id = $1 AND status NOT IN ('desativado','rejeitado') LIMIT 1`,
    [representanteId]
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
