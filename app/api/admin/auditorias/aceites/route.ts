import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/aceites
 *
 * Retorna lista consolidada de aceites por usuário, agrupando as 4 fontes:
 *   1. RH / Gestor  — via aceites_termos_usuario + usuarios
 *   2. Representante — via representantes + contratos
 *   3. Vendedor      — via vendedores_perfil
 *   4. Funcionário   — via funcionarios + avaliacoes.identificacao_confirmada
 *
 * Exibição: uma linha por (cpf, perfil), colunas para cada tipo de aceite.
 * Tipos não aplicáveis a um perfil retornam null.
 */
export async function GET(): Promise<NextResponse> {
  try {
    await requireRole('admin');

    const result = await query(`
      WITH rh_gestor AS (
        SELECT
          u.cpf,
          u.nome,
          u.tipo_usuario::varchar                                                            AS perfil,
          NULL::boolean       AS aceite_contrato,
          NULL::timestamptz   AS aceite_contrato_em,
          BOOL_OR(atu.termo_tipo = 'termos_uso')                                          AS aceite_termos,
          MAX(CASE WHEN atu.termo_tipo = 'termos_uso' THEN atu.aceito_em END)             AS aceite_termos_em,
          BOOL_OR(atu.termo_tipo = 'politica_privacidade')                                AS aceite_politica_privacidade,
          MAX(CASE WHEN atu.termo_tipo = 'politica_privacidade' THEN atu.aceito_em END)   AS aceite_politica_privacidade_em,
          NULL::boolean       AS aceite_disclaimer_nv,
          NULL::timestamptz   AS aceite_disclaimer_nv_em,
          NULL::boolean       AS confirmacao_identificacao,
          NULL::timestamptz   AS confirmacao_identificacao_em
        FROM usuarios u
        LEFT JOIN aceites_termos_usuario atu ON atu.usuario_cpf = u.cpf
        WHERE u.tipo_usuario IN ('rh', 'gestor')
        GROUP BY u.cpf, u.nome, u.tipo_usuario
      ),
      representantes_aceites AS (
        SELECT
          r.cpf::varchar                                                                    AS cpf,
          r.nome,
          'representante'::varchar                                                          AS perfil,
          EXISTS(
            SELECT 1 FROM contratos c
            WHERE c.criado_por_cpf = r.cpf::varchar AND c.aceito = true
          )                                                                                 AS aceite_contrato,
          (
            SELECT MAX(c.aceito_em)
            FROM contratos c
            WHERE c.criado_por_cpf = r.cpf::varchar AND c.aceito = true
          )::timestamptz                                                                    AS aceite_contrato_em,
          r.aceite_termos,
          r.aceite_termos_em::timestamptz,
          r.aceite_politica_privacidade,
          r.aceite_politica_privacidade_em::timestamptz,
          r.aceite_disclaimer_nv,
          r.aceite_disclaimer_nv_em::timestamptz,
          NULL::boolean                                                                     AS confirmacao_identificacao,
          NULL::timestamptz                                                                 AS confirmacao_identificacao_em
        FROM representantes r
      ),
      vendedores_aceites AS (
        SELECT
          u.cpf,
          u.nome,
          'vendedor'::varchar                                                               AS perfil,
          NULL::boolean                                                                     AS aceite_contrato,
          NULL::timestamptz                                                                 AS aceite_contrato_em,
          vp.aceite_termos,
          vp.aceite_termos_em::timestamptz,
          vp.aceite_politica_privacidade,
          vp.aceite_politica_privacidade_em::timestamptz,
          vp.aceite_disclaimer_nv,
          vp.aceite_disclaimer_nv_em::timestamptz,
          NULL::boolean                                                                     AS confirmacao_identificacao,
          NULL::timestamptz                                                                 AS confirmacao_identificacao_em
        FROM vendedores_perfil vp
        JOIN usuarios u ON u.id = vp.usuario_id
      ),
      funcionarios_aceites AS (
        SELECT
          f.cpf::varchar                                                                    AS cpf,
          f.nome,
          'funcionario'::varchar                                                            AS perfil,
          NULL::boolean                                                                     AS aceite_contrato,
          NULL::timestamptz                                                                 AS aceite_contrato_em,
          NULL::boolean                                                                     AS aceite_termos,
          NULL::timestamptz                                                                 AS aceite_termos_em,
          NULL::boolean                                                                     AS aceite_politica_privacidade,
          NULL::timestamptz                                                                 AS aceite_politica_privacidade_em,
          NULL::boolean                                                                     AS aceite_disclaimer_nv,
          NULL::timestamptz                                                                 AS aceite_disclaimer_nv_em,
          EXISTS(
            SELECT 1 FROM confirmacao_identidade ci
            WHERE ci.funcionario_cpf = f.cpf
          )                                                                                 AS confirmacao_identificacao,
          (
            SELECT MIN(ci.confirmado_em)
            FROM confirmacao_identidade ci
            WHERE ci.funcionario_cpf = f.cpf
          )                                                                                 AS confirmacao_identificacao_em
        FROM funcionarios f
        WHERE f.perfil = 'funcionario' AND f.ativo = true
      )
      SELECT * FROM rh_gestor
      UNION ALL SELECT * FROM representantes_aceites
      UNION ALL SELECT * FROM vendedores_aceites
      UNION ALL SELECT * FROM funcionarios_aceites
      ORDER BY perfil, nome
      LIMIT 5000
    `);

    return NextResponse.json({
      success: true,
      aceites: result.rows,
    });
  } catch (error) {
    console.error('[admin/auditorias/aceites] Erro ao buscar aceites:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
