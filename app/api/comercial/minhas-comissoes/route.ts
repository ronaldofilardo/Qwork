/**
 * GET /api/comercial/minhas-comissoes
 *
 * Lista todos os laudos pagos que geraram comissão para o perfil comercial
 * (valor_comissao_comercial > 0 e status = 'paga').
 *
 * Auth: comercial
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole('comercial', false);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;

    const [resumoRes, totalRes, comissoesRes] = await Promise.all([
      query<{
        total_laudos: string;
        total_recebido: string;
        media_por_laudo: string;
      }>(
        `SELECT
           COUNT(*)                              AS total_laudos,
           COALESCE(SUM(valor_comissao_comercial), 0) AS total_recebido,
           COALESCE(AVG(valor_comissao_comercial), 0) AS media_por_laudo
         FROM comissoes_laudo
         WHERE valor_comissao_comercial > 0
           AND status = 'paga'`,
        [],
        session
      ),

      query<{ total: string }>(
        `SELECT COUNT(*) AS total
         FROM comissoes_laudo
         WHERE valor_comissao_comercial > 0
           AND status = 'paga'`,
        [],
        session
      ),

      query<{
        id: number;
        representante_id: number;
        representante_nome: string;
        entidade_nome: string;
        valor_laudo: string;
        percentual_comissao_comercial: string;
        valor_comissao_comercial: string;
        mes_emissao: string;
        data_aprovacao: string | null;
        data_pagamento: string | null;
        asaas_payment_id: string | null;
      }>(
        `SELECT
           cl.id,
           cl.representante_id,
           r.nome                                    AS representante_nome,

           COALESCE(ent.nome, clin.nome, '—')        AS entidade_nome,
           cl.valor_laudo,
           cl.percentual_comissao_comercial,
           cl.valor_comissao_comercial,
           cl.mes_emissao,
           cl.data_aprovacao,
           cl.data_pagamento,
           cl.asaas_payment_id
         FROM comissoes_laudo cl
         JOIN representantes r ON r.id = cl.representante_id
         LEFT JOIN vinculos_comissao vc ON vc.id = cl.vinculo_id
         LEFT JOIN entidades ent ON ent.id = vc.entidade_id
         LEFT JOIN clinicas clin ON clin.id = vc.clinica_id
         WHERE cl.valor_comissao_comercial > 0
           AND cl.status = 'paga'
         ORDER BY cl.data_pagamento DESC NULLS LAST, cl.id DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
        session
      ),
    ]);

    const resumo = resumoRes.rows[0] ?? {
      total_laudos: '0',
      total_recebido: '0',
      media_por_laudo: '0',
    };

    return NextResponse.json({
      success: true,
      comissoes: comissoesRes.rows,
      resumo,
      total: parseInt(totalRes.rows[0]?.total ?? '0'),
      page,
      limit,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    console.error('[GET /api/comercial/minhas-comissoes]', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
