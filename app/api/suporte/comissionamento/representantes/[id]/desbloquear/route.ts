/**
 * POST /api/suporte/comissionamento/representantes/[id]/desbloquear
 *
 * Desbloqueia manualmente um representante que foi bloqueado por não enviar
 * NF/RPA até o dia 10 (status 'apto_bloqueado').
 *
 * Body: { motivo?: string }
 *
 * Acesso: suporte, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  motivo: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte', 'admin'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    const motivo = parsed.success ? (parsed.data.motivo ?? null) : null;

    const existing = await query(
      `SELECT id, status FROM representantes WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );
    }

    const rep = existing.rows[0] as { id: number; status: string };
    if (rep.status !== 'apto_bloqueado') {
      return NextResponse.json(
        {
          error: `Representante está com status '${rep.status}'. Apenas 'apto_bloqueado' pode ser desbloqueado manualmente.`,
          code: 'STATUS_INVALIDO',
        },
        { status: 409 }
      );
    }

    await query(
      `UPDATE representantes
       SET status = 'apto',
           atualizado_em = NOW()
       WHERE id = $1`,
      [id]
    );

    console.info(
      JSON.stringify({
        event: 'suporte_desbloqueou_representante',
        representante_id: id,
        motivo,
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({
      ok: true,
      message: 'Representante desbloqueado com sucesso.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error(
      '[POST /api/suporte/comissionamento/representantes/[id]/desbloquear]',
      e
    );
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
