/**
 * GET /api/emissor/laudos/[loteId]/status-assinatura
 *
 * Retorna o status atual do processo de assinatura digital de um laudo.
 * Usado pela UI para polling a cada ~10s enquanto status='aguardando_assinatura'.
 *
 * Resposta inclui sign_url como fallback caso o emissor não receba o email.
 */

import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface StatusAssinaturaRow {
  id: number;
  lote_id: number;
  status: string;
  zapsign_status: string | null;
  zapsign_signer_token: string | null;
  zapsign_doc_token: string | null;
  assinado_em: string | null;
  emitido_em: string | null;
  enviado_em: string | null;
  hash_pdf: string | null;
  arquivo_remoto_url: string | null;
}

export const GET = async (
  _req: Request,
  { params }: { params: { loteId: string } }
): Promise<NextResponse> => {
  const user = await requireRole('emissor');
  if (!user) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  const loteId = parseInt(params.loteId, 10);
  if (isNaN(loteId)) {
    return NextResponse.json(
      { error: 'ID do lote inválido', success: false },
      { status: 400 }
    );
  }

  const result = await query<StatusAssinaturaRow>(
    `SELECT
       l.id,
       l.lote_id,
       l.status,
       l.zapsign_status,
       l.zapsign_signer_token,
       l.zapsign_doc_token,
       l.assinado_em,
       l.emitido_em,
       l.enviado_em,
       l.hash_pdf,
       l.arquivo_remoto_url
     FROM laudos l
     WHERE l.lote_id = $1 AND l.emissor_cpf = $2
     LIMIT 1`,
    [loteId, user.cpf],
    user
  );

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: 'Laudo não encontrado para este lote', success: false },
      { status: 404 }
    );
  }

  const laudo = result.rows[0];

  // Construir sign_url a partir do signer_token quando disponível
  const zapSignBaseApp =
    process.env.ZAPSIGN_APP_URL ?? 'https://sandbox.app.zapsign.com.br';
  const signUrl = laudo.zapsign_signer_token
    ? `${zapSignBaseApp}/verificar/${laudo.zapsign_signer_token}`
    : null;

  return NextResponse.json({
    success: true,
    laudo: {
      id: laudo.id,
      lote_id: laudo.lote_id,
      status: laudo.status,
      zapsign_status: laudo.zapsign_status,
      assinado_em: laudo.assinado_em,
      emitido_em: laudo.emitido_em,
      enviado_em: laudo.enviado_em,
      hash_pdf: laudo.hash_pdf,
      arquivo_remoto_url: laudo.arquivo_remoto_url,
      /** Link direto de assinatura (fallback se email não chegou) */
      sign_url: signUrl,
    },
  });
};
