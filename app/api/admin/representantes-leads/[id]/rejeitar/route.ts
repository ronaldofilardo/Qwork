/**
 * POST /api/admin/representantes-leads/[id]/rejeitar
 *
 * Admin rejeita cadastro de um lead: status → 'rejeitado'
 * Requer motivo da rejeição.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'suporte'], false);
    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    // Parsear body
    let body: { motivo?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Body JSON inválido' },
        { status: 400 }
      );
    }

    const motivo = (body.motivo ?? '').trim();
    if (!motivo || motivo.length < 5) {
      return NextResponse.json(
        { error: 'Motivo da rejeição obrigatório (mínimo 5 caracteres)' },
        { status: 400 }
      );
    }

    // Verificar que lead existe e pode ser rejeitado
    const current = await query<{ status: string }>(
      `SELECT status FROM representantes_cadastro_leads WHERE id = $1`,
      [leadId]
    );

    if (current.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    const statusAtual = current.rows[0].status;
    if (
      statusAtual !== 'pendente_verificacao' &&
      statusAtual !== 'verificado'
    ) {
      return NextResponse.json(
        { error: `Lead não pode ser rejeitado — status atual: ${statusAtual}` },
        { status: 409 }
      );
    }

    // Rejeitar
    await query(
      `UPDATE representantes_cadastro_leads
       SET status = 'rejeitado',
           motivo_rejeicao = $2,
           verificado_em = NOW(),
           verificado_por = $3
       WHERE id = $1`,
      [leadId, motivo, session.cpf]
    );

    console.log(
      `[ADMIN] Lead ${leadId} rejeitado por ${session.cpf}: ${motivo}`
    );

    return NextResponse.json({ success: true, status: 'rejeitado' });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[POST /api/admin/representantes-leads/[id]/rejeitar]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
