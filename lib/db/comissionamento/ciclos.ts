/**
 * lib/db/comissionamento/ciclos.ts
 *
 * Gestão de ciclos de fechamento mensal de comissões.
 * Um ciclo agrupa todas as comissões de um beneficiário num mês, permitindo
 * envio de NF/RPA consolidado (em vez de individual por comissão).
 */

import { query } from '../query';
import { registrarAuditoria } from './auditoria';

export type StatusCiclo =
  | 'aberto'
  | 'fechado'
  | 'nf_enviada'
  | 'nf_aprovada'
  | 'pago';
export type TipoBeneficiarioCiclo = 'representante' | 'vendedor';

export interface Ciclo {
  id: number;
  representante_id: number;
  vendedor_id: number | null;
  tipo_beneficiario: TipoBeneficiarioCiclo;
  mes_referencia: string;
  valor_total: number;
  qtd_comissoes: number;
  status: StatusCiclo;
  nf_path: string | null;
  nf_nome_arquivo: string | null;
  nf_enviada_em: string | null;
  nf_aprovada_em: string | null;
  nf_rejeitada_em: string | null;
  nf_motivo_rejeicao: string | null;
  data_pagamento: string | null;
  comprovante_pagamento_path: string | null;
  criado_em: string;
  atualizado_em: string;
  fechado_em: string | null;
}

/**
 * Busca ou cria o ciclo para um beneficiário num mês específico.
 * @param mesReferencia - formato 'YYYY-MM-01'
 */
export async function getOrCreateCiclo(params: {
  representante_id: number;
  vendedor_id?: number | null;
  tipo_beneficiario: TipoBeneficiarioCiclo;
  mes_referencia: string;
}): Promise<Ciclo> {
  const {
    representante_id,
    vendedor_id = null,
    tipo_beneficiario,
    mes_referencia,
  } = params;

  // Busca ciclo existente (NULL-safe compare para vendedor_id)
  const existing = await query<Ciclo>(
    `SELECT * FROM ciclos_comissao
     WHERE representante_id = $1
       AND tipo_beneficiario = $3
       AND mes_referencia = $4::date
       AND (
         ($2::int IS NULL AND vendedor_id IS NULL)
         OR ($2::int IS NOT NULL AND vendedor_id = $2::int)
       )
     LIMIT 1`,
    [representante_id, vendedor_id, tipo_beneficiario, mes_referencia]
  );

  if (existing.rows.length > 0) return existing.rows[0];

  const created = await query<Ciclo>(
    `INSERT INTO ciclos_comissao
       (representante_id, vendedor_id, tipo_beneficiario, mes_referencia, valor_total, qtd_comissoes, status)
     VALUES ($1, $2, $3, $4::date, 0, 0, 'aberto')
     RETURNING *`,
    [representante_id, vendedor_id, tipo_beneficiario, mes_referencia]
  );
  return created.rows[0];
}

/**
 * Recalcula os totais do ciclo a partir das comissões_laudo vinculadas.
 * Considera comissões com status liberada, paga, pendente_nf, nf_em_analise.
 * Atualiza valor_total e qtd_comissoes no ciclo.
 */
export async function sincronizarCiclo(cicloId: number): Promise<Ciclo | null> {
  const totals = await query<{ valor_total: string; qtd: string }>(
    `SELECT
       COALESCE(SUM(valor_comissao), 0) AS valor_total,
       COUNT(*) AS qtd
     FROM comissoes_laudo
     WHERE ciclo_id = $1
       AND status NOT IN ('cancelada', 'retida')`,
    [cicloId]
  );

  const valorTotal = parseFloat(totals.rows[0]?.valor_total ?? '0');
  const qtd = parseInt(totals.rows[0]?.qtd ?? '0', 10);

  const updated = await query<Ciclo>(
    `UPDATE ciclos_comissao
     SET valor_total = $2, qtd_comissoes = $3, atualizado_em = NOW()
     WHERE id = $1
     RETURNING *`,
    [cicloId, valorTotal, qtd]
  );
  return updated.rows[0] ?? null;
}

/**
 * Consolida todas as comissões pendentes do mês num ciclo e fecha o ciclo.
 * Vincula comissões ao ciclo (ciclo_id) e muda status do ciclo para 'fechado'.
 */
export async function fecharCiclo(
  cicloId: number,
  adminCpf?: string,
  executorPerfil?: string
): Promise<{ ciclo: Ciclo | null; erro?: string }> {
  const cicloResult = await query<Ciclo>(
    `SELECT * FROM ciclos_comissao WHERE id = $1 LIMIT 1`,
    [cicloId]
  );
  if (cicloResult.rows.length === 0) {
    return { ciclo: null, erro: 'Ciclo não encontrado.' };
  }
  const ciclo = cicloResult.rows[0];
  if (ciclo.status !== 'aberto') {
    return { ciclo: null, erro: `Ciclo já está com status '${ciclo.status}'.` };
  }

  // Vincular comissões do representante/vendedor do mês ao ciclo
  const whereClause =
    ciclo.tipo_beneficiario === 'representante'
      ? `representante_id = $1 AND (vendedor_id IS NULL OR tipo_beneficiario = 'representante') AND mes_emissao = $2::date`
      : `vendedor_id = $3 AND tipo_beneficiario = 'vendedor' AND mes_emissao = $2::date`;

  const bindParams: unknown[] =
    ciclo.tipo_beneficiario === 'representante'
      ? [ciclo.representante_id, ciclo.mes_referencia]
      : [ciclo.representante_id, ciclo.mes_referencia, ciclo.vendedor_id];

  await query(
    `UPDATE comissoes_laudo
     SET ciclo_id = $${bindParams.length + 1}
     WHERE ciclo_id IS NULL
       AND status NOT IN ('cancelada', 'retida')
       AND ${whereClause}`,
    [...bindParams, cicloId]
  );

  // Recalcular totais
  const totals = await query<{ valor_total: string; qtd: string }>(
    `SELECT COALESCE(SUM(valor_comissao), 0) AS valor_total, COUNT(*) AS qtd
     FROM comissoes_laudo
     WHERE ciclo_id = $1 AND status NOT IN ('cancelada', 'retida')`,
    [cicloId]
  );

  const valorTotal = parseFloat(totals.rows[0]?.valor_total ?? '0');
  const qtd = parseInt(totals.rows[0]?.qtd ?? '0', 10);

  const updated = await query<Ciclo>(
    `UPDATE ciclos_comissao
     SET status = 'fechado', fechado_em = NOW(),
         valor_total = $2, qtd_comissoes = $3, atualizado_em = NOW()
     WHERE id = $1
     RETURNING *`,
    [cicloId, valorTotal, qtd]
  );

  const cicloAtualizado = updated.rows[0] ?? null;

  if (cicloAtualizado) {
    await registrarAuditoria({
      tabela: 'ciclos_comissao',
      registro_id: cicloId,
      status_anterior: 'aberto',
      status_novo: 'fechado',
      triggador: adminCpf
        ? executorPerfil === 'suporte'
          ? 'suporte_action'
          : 'admin_action'
        : 'sistema',
      motivo: `Ciclo ${ciclo.mes_referencia} fechado — ${qtd} comissões, total R$ ${valorTotal.toFixed(2)}`,
      criado_por_cpf: adminCpf ?? null,
    });
  }

  return { ciclo: cicloAtualizado };
}

/**
 * Registra envio de NF para um ciclo.
 * Muda status: fechado → nf_enviada.
 */
export async function registrarNfCiclo(
  cicloId: number,
  beneficiarioId: number,
  tipoBeneficiario: TipoBeneficiarioCiclo,
  nfPath: string,
  nfNomeArquivo: string
): Promise<{ ciclo: Ciclo | null; erro?: string }> {
  const whereClause =
    tipoBeneficiario === 'representante'
      ? `id = $1 AND representante_id = $2 AND tipo_beneficiario = 'representante'`
      : `id = $1 AND vendedor_id = $2 AND tipo_beneficiario = 'vendedor'`;

  const cicloCheck = await query<Ciclo>(
    `SELECT * FROM ciclos_comissao WHERE ${whereClause} LIMIT 1`,
    [cicloId, beneficiarioId]
  );
  if (cicloCheck.rows.length === 0) {
    return { ciclo: null, erro: 'Ciclo não encontrado ou sem permissão.' };
  }
  const ciclo = cicloCheck.rows[0];
  if (!['fechado', 'nf_enviada'].includes(ciclo.status)) {
    return {
      ciclo: null,
      erro: `NF não pode ser enviada para ciclo com status '${ciclo.status}'.`,
    };
  }

  const updated = await query<Ciclo>(
    `UPDATE ciclos_comissao
     SET nf_path = $2, nf_nome_arquivo = $3, nf_enviada_em = NOW(),
         nf_rejeitada_em = NULL, nf_motivo_rejeicao = NULL,
         status = 'nf_enviada', atualizado_em = NOW()
     WHERE id = $1
     RETURNING *`,
    [cicloId, nfPath, nfNomeArquivo]
  );
  return { ciclo: updated.rows[0] ?? null };
}

/**
 * Aprova NF de um ciclo (admin).
 * nf_enviada → nf_aprovada
 */
export async function aprovarNfCiclo(
  cicloId: number,
  adminCpf: string,
  executorPerfil?: string
): Promise<{ ciclo: Ciclo | null; erro?: string }> {
  const cicloCheck = await query<Ciclo>(
    `SELECT * FROM ciclos_comissao WHERE id = $1 LIMIT 1`,
    [cicloId]
  );
  if (cicloCheck.rows.length === 0)
    return { ciclo: null, erro: 'Ciclo não encontrado.' };
  const ciclo = cicloCheck.rows[0];
  if (ciclo.status !== 'nf_enviada') {
    return {
      ciclo: null,
      erro: `Ciclo deve estar em 'nf_enviada' para aprovação (atual: '${ciclo.status}').`,
    };
  }

  const updated = await query<Ciclo>(
    `UPDATE ciclos_comissao
     SET status = 'nf_aprovada', nf_aprovada_em = NOW(), atualizado_em = NOW()
     WHERE id = $1
     RETURNING *`,
    [cicloId]
  );

  if (updated.rows[0]) {
    await registrarAuditoria({
      tabela: 'ciclos_comissao',
      registro_id: cicloId,
      status_anterior: 'nf_enviada',
      status_novo: 'nf_aprovada',
      triggador:
        executorPerfil === 'suporte' ? 'suporte_action' : 'admin_action',
      motivo: `NF do ciclo aprovada`,
      criado_por_cpf: adminCpf,
    });
  }

  return { ciclo: updated.rows[0] ?? null };
}

/**
 * Rejeita NF de um ciclo (admin).
 * nf_enviada → fechado (para reenvio)
 */
export async function rejeitarNfCiclo(
  cicloId: number,
  adminCpf: string,
  motivo: string,
  executorPerfil?: string
): Promise<{ ciclo: Ciclo | null; erro?: string }> {
  const cicloCheck = await query<Ciclo>(
    `SELECT status FROM ciclos_comissao WHERE id = $1 LIMIT 1`,
    [cicloId]
  );
  if (cicloCheck.rows.length === 0)
    return { ciclo: null, erro: 'Ciclo não encontrado.' };
  if (cicloCheck.rows[0].status !== 'nf_enviada') {
    return {
      ciclo: null,
      erro: 'Ciclo deve estar em nf_enviada para rejeição.',
    };
  }

  const updated = await query<Ciclo>(
    `UPDATE ciclos_comissao
     SET status = 'fechado', nf_rejeitada_em = NOW(), nf_motivo_rejeicao = $2,
         nf_path = NULL, nf_nome_arquivo = NULL, nf_enviada_em = NULL,
         atualizado_em = NOW()
     WHERE id = $1
     RETURNING *`,
    [cicloId, motivo]
  );

  if (updated.rows[0]) {
    await registrarAuditoria({
      tabela: 'ciclos_comissao',
      registro_id: cicloId,
      status_anterior: 'nf_enviada',
      status_novo: 'fechado',
      triggador:
        executorPerfil === 'suporte' ? 'suporte_action' : 'admin_action',
      motivo: `NF rejeitada: ${motivo}`,
      criado_por_cpf: adminCpf,
    });
  }

  return { ciclo: updated.rows[0] ?? null };
}

/**
 * Registra pagamento de um ciclo (admin).
 * nf_aprovada → pago
 */
export async function registrarPagamentoCiclo(
  cicloId: number,
  comprovantePath: string,
  adminCpf: string,
  executorPerfil?: string
): Promise<{ ciclo: Ciclo | null; erro?: string }> {
  const cicloCheck = await query<Ciclo>(
    `SELECT status FROM ciclos_comissao WHERE id = $1 LIMIT 1`,
    [cicloId]
  );
  if (cicloCheck.rows.length === 0)
    return { ciclo: null, erro: 'Ciclo não encontrado.' };
  if (cicloCheck.rows[0].status !== 'nf_aprovada') {
    return {
      ciclo: null,
      erro: 'Ciclo deve estar em nf_aprovada para registrar pagamento.',
    };
  }

  const updated = await query<Ciclo>(
    `UPDATE ciclos_comissao
     SET status = 'pago', data_pagamento = NOW(),
         comprovante_pagamento_path = $2, atualizado_em = NOW()
     WHERE id = $1
     RETURNING *`,
    [cicloId, comprovantePath]
  );

  if (updated.rows[0]) {
    await registrarAuditoria({
      tabela: 'ciclos_comissao',
      registro_id: cicloId,
      status_anterior: 'nf_aprovada',
      status_novo: 'pago',
      triggador:
        executorPerfil === 'suporte' ? 'suporte_action' : 'admin_action',
      motivo: `Pagamento registrado`,
      criado_por_cpf: adminCpf,
    });
  }

  return { ciclo: updated.rows[0] ?? null };
}

/**
 * Lista ciclos de um representante, com paginação e filtros.
 */
export async function getCiclosByRepresentante(
  representanteId: number,
  opts?: { status?: StatusCiclo; ano?: number; page?: number; limit?: number }
): Promise<{ ciclos: Ciclo[]; total: number; page: number; limit: number }> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;

  const wheres = [
    `c.representante_id = $1`,
    `c.tipo_beneficiario = 'representante'`,
  ];
  const params: unknown[] = [representanteId];
  let i = 2;

  if (opts?.status) {
    wheres.push(`c.status = $${i++}`);
    params.push(opts.status);
  }
  if (opts?.ano) {
    wheres.push(`EXTRACT(YEAR FROM c.mes_referencia) = $${i++}`);
    params.push(opts.ano);
  }

  const where = `WHERE ${wheres.join(' AND ')}`;

  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*) as total FROM ciclos_comissao c ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

  params.push(limit, offset);
  const rows = await query<Ciclo>(
    `SELECT c.* FROM ciclos_comissao c ${where}
     ORDER BY c.mes_referencia DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    params
  );

  return { ciclos: rows.rows, total, page, limit };
}

/**
 * Lista ciclos de um vendedor.
 */
export async function getCiclosByVendedor(
  vendedorId: number,
  opts?: { status?: StatusCiclo; ano?: number; page?: number; limit?: number }
): Promise<{ ciclos: Ciclo[]; total: number; page: number; limit: number }> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const offset = (page - 1) * limit;

  const wheres = [`c.vendedor_id = $1`, `c.tipo_beneficiario = 'vendedor'`];
  const params: unknown[] = [vendedorId];
  let i = 2;

  if (opts?.status) {
    wheres.push(`c.status = $${i++}`);
    params.push(opts.status);
  }

  const where = `WHERE ${wheres.join(' AND ')}`;

  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*) as total FROM ciclos_comissao c ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

  params.push(limit, offset);
  const rows = await query<Ciclo>(
    `SELECT c.* FROM ciclos_comissao c ${where}
     ORDER BY c.mes_referencia DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    params
  );

  return { ciclos: rows.rows, total, page, limit };
}

export interface CicloEnriquecido extends Ciclo {
  beneficiario_nome: string;
  beneficiario_tipo_pessoa: 'PF' | 'PJ' | null;
  beneficiario_codigo: string | null;
  beneficiario_email: string | null;
}

export interface ResumoCiclosMes {
  valor_total: number;
  valor_pago: number;
  qtd_ciclos: number;
  qtd_pagos: number;
  qtd_aguardando_nf: number;
  qtd_nf_analise: number;
  qtd_aprovados: number;
}

/**
 * Lista todos os ciclos de todos os representantes/vendedores (visão admin/suporte).
 * Retorna ciclos enriquecidos com nome e dados do beneficiário.
 */
export async function getAllCiclosAdmin(opts?: {
  status?: StatusCiclo;
  ano?: number;
  mes?: number;
  page?: number;
  limit?: number;
}): Promise<{
  ciclos: CicloEnriquecido[];
  total: number;
  page: number;
  limit: number;
}> {
  const page = opts?.page ?? 1;
  const limit = Math.min(opts?.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  const wheres: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (opts?.status) {
    wheres.push(`c.status = $${i++}`);
    params.push(opts.status);
  }
  if (opts?.ano) {
    wheres.push(`EXTRACT(YEAR FROM c.mes_referencia) = $${i++}`);
    params.push(opts.ano);
  }
  if (opts?.mes) {
    wheres.push(`EXTRACT(MONTH FROM c.mes_referencia) = $${i++}`);
    params.push(opts.mes);
  }

  const where = wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : '';

  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*) as total FROM ciclos_comissao c ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

  const dataParams = [...params, limit, offset];

  const rows = await query<CicloEnriquecido>(
    `SELECT
       c.*,
       CASE
         WHEN c.tipo_beneficiario = 'representante' THEN r.nome
         ELSE u_vend.nome
       END AS beneficiario_nome,
       CASE
         WHEN c.tipo_beneficiario = 'representante' THEN UPPER(r.tipo_pessoa::text)
         ELSE NULL
       END AS beneficiario_tipo_pessoa,
       CASE
         WHEN c.tipo_beneficiario = 'representante' THEN r.codigo
         ELSE NULL
       END AS beneficiario_codigo,
       CASE
         WHEN c.tipo_beneficiario = 'representante' THEN r.email
         ELSE u_vend.email
       END AS beneficiario_email
     FROM ciclos_comissao c
     LEFT JOIN representantes r ON r.id = c.representante_id
     LEFT JOIN usuarios u_vend ON u_vend.id = c.vendedor_id
     ${where}
     ORDER BY c.mes_referencia DESC, c.tipo_beneficiario, beneficiario_nome
     LIMIT $${i} OFFSET $${i + 1}`,
    dataParams
  );

  return { ciclos: rows.rows, total, page, limit };
}

/**
 * Retorna totais agregados dos ciclos de um determinado mês/ano (para summary cards).
 * @param mesReferencia - formato 'YYYY-MM-01'
 */
export async function getResumoCiclosMes(
  mesReferencia: string
): Promise<ResumoCiclosMes> {
  const result = await query<{
    valor_total: string;
    valor_pago: string;
    qtd_ciclos: string;
    qtd_pagos: string;
    qtd_aguardando_nf: string;
    qtd_nf_analise: string;
    qtd_aprovados: string;
  }>(
    `SELECT
       COALESCE(SUM(valor_total), 0) AS valor_total,
       COALESCE(SUM(CASE WHEN status = 'pago' THEN valor_total ELSE 0 END), 0) AS valor_pago,
       COUNT(*) AS qtd_ciclos,
       COUNT(*) FILTER (WHERE status = 'pago') AS qtd_pagos,
       COUNT(*) FILTER (WHERE status = 'fechado') AS qtd_aguardando_nf,
       COUNT(*) FILTER (WHERE status = 'nf_enviada') AS qtd_nf_analise,
       COUNT(*) FILTER (WHERE status = 'nf_aprovada') AS qtd_aprovados
     FROM ciclos_comissao
     WHERE mes_referencia = $1::date`,
    [mesReferencia]
  );

  const row = result.rows[0];
  return {
    valor_total: parseFloat(row?.valor_total ?? '0'),
    valor_pago: parseFloat(row?.valor_pago ?? '0'),
    qtd_ciclos: parseInt(row?.qtd_ciclos ?? '0', 10),
    qtd_pagos: parseInt(row?.qtd_pagos ?? '0', 10),
    qtd_aguardando_nf: parseInt(row?.qtd_aguardando_nf ?? '0', 10),
    qtd_nf_analise: parseInt(row?.qtd_nf_analise ?? '0', 10),
    qtd_aprovados: parseInt(row?.qtd_aprovados ?? '0', 10),
  };
}

/**
 * Abre ou cria ciclos para TODOS os representantes/vendedores que têm comissões
 * no mês especificado. Usado para inicializar o fechamento mensal.
 * @param mesReferencia - formato 'YYYY-MM-01'
 */
export async function criarCiclosDoMes(mesReferencia: string): Promise<{
  criados: number;
  existentes: number;
}> {
  // Buscar todos representantes com comissões no mês que ainda não têm ciclo
  const representantes = await query<{ representante_id: number }>(
    `SELECT DISTINCT cl.representante_id
     FROM comissoes_laudo cl
     WHERE cl.mes_emissao = $1::date
       AND cl.tipo_beneficiario = 'representante'
       AND cl.status NOT IN ('cancelada', 'retida')
       AND cl.ciclo_id IS NULL`,
    [mesReferencia]
  );

  const vendedores = await query<{
    representante_id: number;
    vendedor_id: number;
  }>(
    `SELECT DISTINCT cl.representante_id, cl.vendedor_id
     FROM comissoes_laudo cl
     WHERE cl.mes_emissao = $1::date
       AND cl.tipo_beneficiario = 'vendedor'
       AND cl.vendedor_id IS NOT NULL
       AND cl.status NOT IN ('cancelada', 'retida')
       AND cl.ciclo_id IS NULL`,
    [mesReferencia]
  );

  let criados = 0;
  let existentes = 0;

  for (const row of representantes.rows) {
    const existing = await query(
      `SELECT id FROM ciclos_comissao
       WHERE representante_id = $1 AND tipo_beneficiario = 'representante'
         AND mes_referencia = $2::date AND vendedor_id IS NULL
       LIMIT 1`,
      [row.representante_id, mesReferencia]
    );
    if (existing.rows.length > 0) {
      existentes++;
    } else {
      await query(
        `INSERT INTO ciclos_comissao (representante_id, tipo_beneficiario, mes_referencia, valor_total, qtd_comissoes, status)
         VALUES ($1, 'representante', $2::date, 0, 0, 'aberto')`,
        [row.representante_id, mesReferencia]
      );
      criados++;
    }
  }

  for (const row of vendedores.rows) {
    const existing = await query(
      `SELECT id FROM ciclos_comissao
       WHERE representante_id = $1 AND vendedor_id = $2 AND tipo_beneficiario = 'vendedor'
         AND mes_referencia = $3::date
       LIMIT 1`,
      [row.representante_id, row.vendedor_id, mesReferencia]
    );
    if (existing.rows.length > 0) {
      existentes++;
    } else {
      await query(
        `INSERT INTO ciclos_comissao (representante_id, vendedor_id, tipo_beneficiario, mes_referencia, valor_total, qtd_comissoes, status)
         VALUES ($1, $2, 'vendedor', $3::date, 0, 0, 'aberto')`,
        [row.representante_id, row.vendedor_id, mesReferencia]
      );
      criados++;
    }
  }

  return { criados, existentes };
}

// ─── Comissões Legadas (pré-ciclo) ────────────────────────────────────────────

export interface ComissaoLegadaAgrupada {
  representante_id: number;
  representante_nome: string;
  representante_codigo: string | null;
  qtd_comissoes: number;
  valor_total: number;
}

export interface ResumoCiclosLegadas {
  itens: ComissaoLegadaAgrupada[];
  valor_total: number;
  qtd_comissoes: number;
}

/**
 * Retorna comissões pagas no mês que NÃO estão vinculadas a nenhum ciclo
 * (pré-existentes ao mecanismo de fechamento mensal).
 */
export async function getComissoesLegadasMes(
  mesReferencia: string
): Promise<ResumoCiclosLegadas> {
  const result = await query<{
    representante_id: string;
    representante_nome: string;
    representante_codigo: string | null;
    qtd_comissoes: string;
    valor_total: string;
  }>(
    `SELECT
       cl.representante_id::text,
       r.nome AS representante_nome,
       r.codigo AS representante_codigo,
       COUNT(*)::text AS qtd_comissoes,
       SUM(cl.valor_comissao)::text AS valor_total
     FROM comissoes_laudo cl
     JOIN representantes r ON r.id = cl.representante_id
     WHERE cl.mes_emissao = $1::date
       AND cl.ciclo_id IS NULL
       AND cl.status = 'paga'
     GROUP BY cl.representante_id, r.nome, r.codigo
     ORDER BY r.nome`,
    [mesReferencia]
  );

  const itens: ComissaoLegadaAgrupada[] = result.rows.map((row) => ({
    representante_id: parseInt(row.representante_id, 10),
    representante_nome: row.representante_nome,
    representante_codigo: row.representante_codigo,
    qtd_comissoes: parseInt(row.qtd_comissoes, 10),
    valor_total: parseFloat(row.valor_total ?? '0'),
  }));

  const valor_total = itens.reduce((acc, i) => acc + i.valor_total, 0);
  const qtd_comissoes = itens.reduce((acc, i) => acc + i.qtd_comissoes, 0);

  return { itens, valor_total, qtd_comissoes };
}
