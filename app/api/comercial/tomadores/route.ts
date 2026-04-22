/**
 * GET /api/comercial/tomadores
 * Lista todos os tomadores (entidades + clínicas) com info de representante,
 * datas do lead e do cadastro, valor negociado, nº de vidas e empresas filhas.
 * Tomadores sem representante são incluídos (representante_id null).
 * Auth: comercial
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export interface TomadorEmpresa {
  empresa_id: number;
  empresa_nome: string;
  empresa_cnpj: string | null;
  empresa_responsavel: string | null;
  empresa_contato_fone: string | null;
  empresa_contato_email: string | null;
}

export interface TomadorRow {
  tomador_id: number;
  tomador_nome: string;
  tomador_cnpj: string;
  tipo: 'entidade' | 'clinica';
  cadastro_em: string;
  rep_nome: string | null;
  lead_data: string | null;
  valor_negociado: string | null;
  num_vidas_estimado: number | null;
  vinculo_id: number | null;
  vinculo_status: string | null;
  empresas: TomadorEmpresa[];
}

export async function GET(): Promise<NextResponse> {
  try {
    await requireRole('comercial', false);

    // Entidades
    const entidadesResult = await query<{
      tomador_id: number;
      tomador_nome: string;
      tomador_cnpj: string;
      tipo: 'entidade';
      cadastro_em: string;
      rep_nome: string | null;
      lead_data: string | null;
      valor_negociado: string | null;
      num_vidas_estimado: number | null;
      vinculo_id: number | null;
      vinculo_status: string | null;
    }>(
      `SELECT
         e.id              AS tomador_id,
         e.nome            AS tomador_nome,
         e.cnpj            AS tomador_cnpj,
         'entidade'::text  AS tipo,
         e.criado_em       AS cadastro_em,
         r.nome            AS rep_nome,
         lr.criado_em      AS lead_data,
         COALESCE(lr.valor_negociado, vc.valor_negociado) AS valor_negociado,
         COALESCE(vc.num_vidas_estimado, lr.num_vidas_estimado) AS num_vidas_estimado,
         vc.id             AS vinculo_id,
         vc.status::text   AS vinculo_status
       FROM entidades e
       LEFT JOIN LATERAL (
         SELECT v.*
         FROM public.vinculos_comissao v
         WHERE v.entidade_id = e.id
         ORDER BY
           CASE WHEN v.status = 'ativo' THEN 0 ELSE 1 END,
           v.criado_em DESC,
           v.id DESC
         LIMIT 1
       ) vc ON true
       LEFT JOIN public.representantes r ON r.id = vc.representante_id
       LEFT JOIN public.leads_representante lr ON lr.id = vc.lead_id
       ORDER BY e.criado_em DESC`,
      []
    );

    // Clínicas
    const clinicasResult = await query<{
      tomador_id: number;
      tomador_nome: string;
      tomador_cnpj: string;
      tipo: 'clinica';
      cadastro_em: string;
      rep_nome: string | null;
      lead_data: string | null;
      valor_negociado: string | null;
      num_vidas_estimado: number | null;
      vinculo_id: number | null;
      vinculo_status: string | null;
    }>(
      `SELECT
         cl.id             AS tomador_id,
         cl.nome           AS tomador_nome,
         cl.cnpj           AS tomador_cnpj,
         'clinica'::text   AS tipo,
         cl.criado_em      AS cadastro_em,
         r.nome            AS rep_nome,
         lr.criado_em      AS lead_data,
         COALESCE(lr.valor_negociado, vc.valor_negociado) AS valor_negociado,
         COALESCE(vc.num_vidas_estimado, lr.num_vidas_estimado) AS num_vidas_estimado,
         vc.id             AS vinculo_id,
         vc.status::text   AS vinculo_status
       FROM clinicas cl
       LEFT JOIN LATERAL (
         SELECT v.*
         FROM public.vinculos_comissao v
         WHERE v.clinica_id = cl.id
         ORDER BY
           CASE WHEN v.status = 'ativo' THEN 0 ELSE 1 END,
           v.criado_em DESC,
           v.id DESC
         LIMIT 1
       ) vc ON true
       LEFT JOIN public.representantes r ON r.id = vc.representante_id
       LEFT JOIN public.leads_representante lr ON lr.id = vc.lead_id
       ORDER BY cl.criado_em DESC`,
      []
    );

    // Empresas filhas de cada clínica
    const clinicaIds = clinicasResult.rows.map((c) => c.tomador_id);
    const empresasMap = new Map<number, TomadorEmpresa[]>();

    if (clinicaIds.length > 0) {
      try {
        const empresasResult = await query<{
          clinica_id: number;
          empresa_id: number;
          empresa_nome: string;
          empresa_cnpj: string | null;
          empresa_responsavel: string | null;
          empresa_contato_fone: string | null;
          empresa_contato_email: string | null;
        }>(
          `SELECT
             em.clinica_id,
             em.id                  AS empresa_id,
             em.nome                AS empresa_nome,
             em.cnpj                AS empresa_cnpj,
             em.representante_nome  AS empresa_responsavel,
             em.representante_fone  AS empresa_contato_fone,
             COALESCE(em.representante_email, em.responsavel_email) AS empresa_contato_email
           FROM empresas_clientes em
           WHERE em.clinica_id = ANY($1::int[])
           ORDER BY em.nome`,
          [clinicaIds]
        );
        for (const row of empresasResult.rows) {
          const list = empresasMap.get(row.clinica_id) ?? [];
          list.push({
            empresa_id: row.empresa_id,
            empresa_nome: row.empresa_nome,
            empresa_cnpj: row.empresa_cnpj,
            empresa_responsavel: row.empresa_responsavel,
            empresa_contato_fone: row.empresa_contato_fone,
            empresa_contato_email: row.empresa_contato_email,
          });
          empresasMap.set(row.clinica_id, list);
        }
      } catch (empresasErr: unknown) {
        // Fallback: tabela empresas pode não existir em ambiente de DEV
        // Continuar sem empresas filhas
        const err = empresasErr as any;
        if (err?.code !== '42P01') {
          // 42P01 = relation does not exist
          throw empresasErr;
        }
        // Se for 42P01, apenas ignorar e continuar
      }
    }

    const tomadores: TomadorRow[] = [
      ...entidadesResult.rows.map((r) => ({
        ...r,
        tipo: 'entidade' as const,
        empresas: [],
      })),
      ...clinicasResult.rows.map((r) => ({
        ...r,
        tipo: 'clinica' as const,
        empresas: empresasMap.get(r.tomador_id) ?? [],
      })),
    ].sort(
      (a, b) =>
        new Date(b.cadastro_em).getTime() - new Date(a.cadastro_em).getTime()
    );

    return NextResponse.json({ tomadores });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado')
      return NextResponse.json({ error: e.message }, { status: 401 });
    console.error('[GET /api/comercial/tomadores]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
