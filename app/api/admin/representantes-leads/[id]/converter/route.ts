/**
 * POST /api/admin/representantes-leads/[id]/converter
 *
 * Admin converte lead verificado em representante oficial.
 * Executa em transação: INSERT em representantes + UPDATE no lead.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { converterLeadEmRepresentante } from '@/lib/representantes/converter-lead';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole('comercial', false);
    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    const result = await converterLeadEmRepresentante(
      leadId,
      session.cpf,
      request.nextUrl.origin
    );

    return NextResponse.json({
      success: true,
      representante_id: result.representante_id,
      nome: result.nome,
      email: result.email,
      convite_link: result.convite_link,
      message: `Representante ${result.nome} criado. Convite de criação de senha enviado para ${result.email}.`,
    });
  } catch (err: unknown) {
    const e = err as Error;

    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    if (e.message === 'Lead não encontrado')
      return NextResponse.json({ error: e.message }, { status: 404 });
    if (
      e.message.includes('não pode ser convertido') ||
      e.message.includes('já foi convertido')
    )
      return NextResponse.json({ error: e.message }, { status: 409 });
    if (e.message.includes('Já existe representante'))
      return NextResponse.json({ error: e.message }, { status: 409 });

    console.error('[POST /api/admin/representantes-leads/[id]/converter]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
