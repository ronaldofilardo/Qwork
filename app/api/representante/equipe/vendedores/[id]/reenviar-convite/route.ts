/**
 * POST /api/representante/equipe/vendedores/[id]/reenviar-convite
 *
 * Gera um novo token de convite para o vendedor que ainda não criou
 * sua senha / não aceitou os termos. Retorna { convite_url }.
 *
 * Regra de negócio:
 *  - Somente funciona se aceite_termos = FALSE (onboarding ainda não concluído)
 *  - Representante só pode agir sobre vendedores do próprio vínculo ativo
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import {
  gerarTokenConviteVendedor,
  logEmailConviteVendedor,
} from '@/lib/vendedores/gerar-convite';
import type { Session } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();

    const vendedorId = parseInt(params.id, 10);
    if (isNaN(vendedorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const rlsSess: Session = {
      cpf: sess.cpf ?? '',
      nome: sess.nome,
      perfil: 'representante',
      representante_id: sess.representante_id,
    };

    // Verificar que o vendedor pertence à equipe e ainda não concluiu o onboarding
    const vinculo = await query<{
      vendedor_id: number;
      vendedor_nome: string;
      vendedor_email: string | null;
      aceite_termos: boolean;
    }>(
      `SELECT hc.vendedor_id,
              u.nome        AS vendedor_nome,
              u.email       AS vendedor_email,
              COALESCE(vp.aceite_termos, FALSE) AS aceite_termos
         FROM hierarquia_comercial hc
         JOIN usuarios u ON u.id = hc.vendedor_id
         LEFT JOIN vendedores_perfil vp ON vp.usuario_id = hc.vendedor_id
        WHERE hc.vendedor_id = $1
          AND hc.representante_id = $2
          AND hc.ativo = true
        LIMIT 1`,
      [vendedorId, sess.representante_id],
      rlsSess
    );

    if (vinculo.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado na sua equipe' },
        { status: 404 }
      );
    }

    const v = vinculo.rows[0];

    if (v.aceite_termos) {
      return NextResponse.json(
        {
          error:
            'Este vendedor já concluiu o cadastro. O link de convite não é mais necessário.',
        },
        { status: 409 }
      );
    }

    // Regenerar token de convite
    const convite = await gerarTokenConviteVendedor(vendedorId, {
      query: (sql: string, args?: unknown[]) => query(sql, args, rlsSess),
    } as never);

    logEmailConviteVendedor(
      v.vendedor_nome,
      v.vendedor_email ?? '',
      convite.link,
      convite.expira_em
    );

    return NextResponse.json({ convite_url: convite.link });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    return NextResponse.json(r.body, { status: r.status });
  }
}
