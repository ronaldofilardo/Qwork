/**
 * POST /api/admin/representantes-leads/[id]/converter
 *
 * Suporte ou Comercial converte lead verificado em representante oficial.
 * Executa em transação: INSERT em representantes + UPDATE no lead.
 *
 * Regras de acesso:
 * - suporte: pode converter qualquer lead
 * - comercial: só converte leads atribuídos a ele (comercial_cpf = session.cpf)
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { converterLeadEmRepresentante } from '@/lib/representantes/converter-lead';

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

    // Verificar existência e ownership
    const ownership = await query<{ comercial_cpf: string | null }>(
      `SELECT comercial_cpf FROM representantes_cadastro_leads WHERE id = $1`,
      [leadId]
    );

    if (ownership.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    // Comercial só pode converter leads atribuídos a ele
    // Suporte pode converter qualquer lead sem restrição de ownership
    if (
      session.perfil === 'comercial' &&
      ownership.rows[0].comercial_cpf !== null &&
      ownership.rows[0].comercial_cpf !== session.cpf
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
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
