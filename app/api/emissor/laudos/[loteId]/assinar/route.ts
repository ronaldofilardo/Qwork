import { requireRole } from '@/lib/session';
import { NextResponse } from 'next/server';
import { enviarParaAssinaturaZapSign } from '@/lib/laudo-auto';
import { isZapSignHabilitado } from '@/lib/integrations/zapsign/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/emissor/laudos/[loteId]/assinar
 *
 * Envia o PDF do laudo (previamente gerado, status='pdf_gerado') para assinatura
 * digital via ZapSign.
 *
 * Fluxo esperado:
 *   1. Emissor clica em "Gerar PDF" → POST /api/emissor/laudos/[loteId] → status='pdf_gerado'
 *   2. Emissor clica em "Assinar Digitalmente" → POST (este endpoint) → status='aguardando_assinatura'
 *   3. ZapSign webhook recebe assinatura → PUT /api/webhooks/zapsign → status='enviado'
 */
export const POST = async (
  _req: Request,
  { params }: { params: { loteId: string } }
) => {
  const user = await requireRole('emissor');
  if (!user) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  if (!isZapSignHabilitado()) {
    return NextResponse.json(
      {
        error: 'Assinatura digital não disponível',
        success: false,
        detalhes:
          'ZapSign está desabilitado (DISABLE_ZAPSIGN=1). Use o fluxo legado.',
      },
      { status: 409 }
    );
  }

  const loteId = parseInt(params.loteId);
  if (isNaN(loteId)) {
    return NextResponse.json(
      { error: 'ID do lote inválido', success: false },
      { status: 400 }
    );
  }

  try {
    const resultado = await enviarParaAssinaturaZapSign(loteId, user.cpf, user);

    return NextResponse.json(
      {
        success: true,
        message: resultado.mensagem,
        laudo_id: resultado.laudoId,
        status: resultado.status,
        sign_url: resultado.signUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `[POST /api/emissor/laudos/${loteId}/assinar] Erro ao enviar para assinatura:`,
      error
    );

    const msg = error instanceof Error ? error.message : 'Erro desconhecido';

    // Erros de negócio (status inválido, PDF não encontrado) → 400
    if (
      msg.includes('status') ||
      msg.includes('não encontrado') ||
      msg.includes('inativo') ||
      msg.includes('email')
    ) {
      return NextResponse.json({ error: msg, success: false }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: 'Erro ao enviar laudo para assinatura',
        success: false,
        detalhes: msg,
      },
      { status: 500 }
    );
  }
};
