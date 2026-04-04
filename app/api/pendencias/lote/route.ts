import { NextRequest, NextResponse } from 'next/server';
import {
  getSession,
  requireRHWithEmpresaAccess,
  requireEntity,
} from '@/lib/session';
import { query } from '@/lib/db';
import { assertRoles, ROLES, isApiError } from '@/lib/authorization/policies';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pendencias/lote
 *
 * Retorna funcionários pendentes com base no último ciclo avaliativo liberado.
 *
 * Dois modos de operação:
 *  - RH  (perfil='rh')     : requer ?empresa_id=X — usa funcionarios_clinicas
 *  - Gestor (perfil='gestor'): sem empresa_id      — usa funcionarios_entidades + lotes.entidade_id
 *
 * Pendente = funcionário ativo SEM avaliação concluída em nenhum lote liberado do contexto.
 */

/** Subconsulta de campos comuns de inativação (alias f deve existir no contexto). */
const SUBQUERIES_INATIVACAO = `
  (
    SELECT a2.atualizado_em FROM avaliacoes a2
    WHERE a2.funcionario_cpf = f.cpf AND a2.status = 'inativada'
    ORDER BY a2.atualizado_em DESC LIMIT 1
  ) AS inativado_em,
  (
    SELECT la2.id FROM avaliacoes a2
    JOIN lotes_avaliacao la2 ON la2.id = a2.lote_id
    WHERE a2.funcionario_cpf = f.cpf AND a2.status = 'inativada'
    ORDER BY a2.atualizado_em DESC LIMIT 1
  ) AS inativacao_lote_id,
  (
    SELECT la2.numero_ordem FROM avaliacoes a2
    JOIN lotes_avaliacao la2 ON la2.id = a2.lote_id
    WHERE a2.funcionario_cpf = f.cpf AND a2.status = 'inativada'
    ORDER BY a2.atualizado_em DESC LIMIT 1
  ) AS inativacao_lote_numero_ordem`;

function buildResponse(loteRef: any, rows: any[]) {
  const contadores = rows.reduce((acc: Record<string, number>, f: any) => {
    acc[f.motivo] = (acc[f.motivo] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    situacao: 'COM_PENDENCIAS',
    lote: {
      id: loteRef.id,
      numero_ordem: loteRef.numero_ordem,
      descricao: loteRef.descricao,
      liberado_em: loteRef.liberado_em,
      status: loteRef.status,
    },
    funcionarios: rows,
    total: rows.length,
    contadores,
    timestamp: new Date().toISOString(),
  });
}

const semLoteResponse = () =>
  NextResponse.json({
    situacao: 'SEM_LOTE',
    lote: null,
    funcionarios: [],
    total: 0,
    timestamp: new Date().toISOString(),
  });

export async function GET(request: NextRequest) {
  try {
    const session = getSession();
    assertRoles(session, [ROLES.RH, ROLES.GESTOR]);

    const { searchParams } = new URL(request.url);
    const empresaIdParam = searchParams.get('empresa_id');

    // ─────────────────────────────────────────────────────────
    // MODO RH: usa empresa_id + funcionarios_clinicas
    // ─────────────────────────────────────────────────────────
    if (session.perfil === 'rh') {
      if (!empresaIdParam) {
        return NextResponse.json(
          { error: 'empresa_id é obrigatório para perfil rh' },
          { status: 400 }
        );
      }
      const empresaId = parseInt(empresaIdParam, 10);

      let rhSession: any;
      try {
        rhSession = await requireRHWithEmpresaAccess(empresaId);
      } catch {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
      const clinicaId = rhSession.clinica_id;

      // Lote de referência: mais recente liberado para esta empresa
      const loteResult = await query(
        `SELECT la.id, la.numero_ordem, la.descricao, la.liberado_em, la.status
         FROM lotes_avaliacao la
         WHERE la.empresa_id = $1
           AND la.liberado_em IS NOT NULL
           AND la.status NOT IN ('rascunho', 'cancelado')
         ORDER BY la.liberado_em DESC, la.numero_ordem DESC
         LIMIT 1`,
        [empresaId]
      );

      if (loteResult.rows.length === 0) return semLoteResponse();
      const loteRef = loteResult.rows[0];

      // Funcionários pendentes para RH
      const pendentesResult = await query(
        `SELECT
           f.cpf,
           f.nome,
           f.setor,
           f.funcao,
           f.email,
           f.matricula,
           f.ativo,
           f.criado_em,
           ${SUBQUERIES_INATIVACAO},
           CASE
             WHEN EXISTS (
               SELECT 1 FROM avaliacoes a3
               WHERE a3.funcionario_cpf = f.cpf AND a3.lote_id = $3 AND a3.status = 'inativada'
             ) THEN 'INATIVADO_NO_LOTE'
             WHEN NOT EXISTS (
               SELECT 1 FROM avaliacoes a4
               JOIN lotes_avaliacao la4 ON la4.id = a4.lote_id
               WHERE a4.funcionario_cpf = f.cpf AND la4.empresa_id = $1
             ) THEN 'NUNCA_AVALIADO'
             WHEN f.criado_em > $4 THEN 'ADICIONADO_APOS_LOTE'
             ELSE 'SEM_CONCLUSAO_VALIDA'
           END AS motivo
         FROM funcionarios f
         INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
         WHERE fc.empresa_id = $1
           AND fc.clinica_id = $2
           AND (
             fc.ativo = true
             OR EXISTS (
               SELECT 1 FROM avaliacoes a_lote
               WHERE a_lote.funcionario_cpf = f.cpf AND a_lote.lote_id = $3
             )
           )
           AND NOT EXISTS (
             SELECT 1 FROM avaliacoes a5
             JOIN lotes_avaliacao la5 ON la5.id = a5.lote_id
             WHERE a5.funcionario_cpf = f.cpf
               AND a5.status IN ('concluido', 'concluida', 'concluída')
               AND la5.empresa_id = $1
               AND la5.liberado_em IS NOT NULL
               AND la5.status NOT IN ('rascunho', 'cancelado')
           )
         ORDER BY f.nome`,
        [empresaId, clinicaId, loteRef.id, loteRef.liberado_em]
      );

      return buildResponse(loteRef, pendentesResult.rows);
    }

    // ─────────────────────────────────────────────────────────
    // MODO GESTOR (ENTIDADE): usa entidade_id + funcionarios_entidades
    // ─────────────────────────────────────────────────────────
    let entity: any;
    try {
      entity = await requireEntity();
    } catch {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    const entidadeId = entity.entidade_id;

    // Lote de referência: mais recente liberado acessível via funcionarios desta entidade
    const loteEntResult = await query(
      `SELECT DISTINCT la.id, la.numero_ordem, la.descricao, la.liberado_em, la.status
       FROM lotes_avaliacao la
       INNER JOIN avaliacoes a ON a.lote_id = la.id
       INNER JOIN funcionarios f ON a.funcionario_cpf = f.cpf
       INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
       WHERE fe.entidade_id = $1
         AND fe.ativo = true
         AND la.liberado_em IS NOT NULL
         AND la.status NOT IN ('rascunho', 'cancelado')
       ORDER BY la.liberado_em DESC, la.numero_ordem DESC
       LIMIT 1`,
      [entidadeId]
    );

    if (loteEntResult.rows.length === 0) return semLoteResponse();
    const loteRef = loteEntResult.rows[0];

    // Funcionários pendentes para entidade
    const pendentesEntResult = await query(
      `SELECT
         f.cpf,
         f.nome,
         f.setor,
         f.funcao,
         f.email,
         f.matricula,
         f.ativo,
         f.criado_em,
         ${SUBQUERIES_INATIVACAO},
         CASE
           WHEN EXISTS (
             SELECT 1 FROM avaliacoes a3
             WHERE a3.funcionario_cpf = f.cpf AND a3.lote_id = $2 AND a3.status = 'inativada'
           ) THEN 'INATIVADO_NO_LOTE'
           WHEN NOT EXISTS (
             SELECT 1 FROM avaliacoes a4
             WHERE a4.funcionario_cpf = f.cpf
           ) THEN 'NUNCA_AVALIADO'
           WHEN f.criado_em > $3 THEN 'ADICIONADO_APOS_LOTE'
           ELSE 'SEM_CONCLUSAO_VALIDA'
         END AS motivo
       FROM funcionarios f
       INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
       WHERE fe.entidade_id = $1
         AND (
           fe.ativo = true
           OR EXISTS (
             SELECT 1 FROM avaliacoes a_lote
             WHERE a_lote.funcionario_cpf = f.cpf AND a_lote.lote_id = $2
           )
         )
         AND NOT EXISTS (
           SELECT 1 FROM avaliacoes a5
           JOIN lotes_avaliacao la5 ON la5.id = a5.lote_id
           WHERE a5.funcionario_cpf = f.cpf
             AND a5.status IN ('concluido', 'concluida', 'concluída')
             AND la5.liberado_em IS NOT NULL
             AND la5.status NOT IN ('rascunho', 'cancelado')
         )
       ORDER BY f.nome`,
      [entidadeId, loteRef.id, loteRef.liberado_em]
    );

    return buildResponse(loteRef, pendentesEntResult.rows);
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('[API pendencias/lote] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
