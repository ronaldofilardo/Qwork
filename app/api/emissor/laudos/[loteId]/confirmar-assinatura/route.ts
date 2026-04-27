/**
 * POST /api/emissor/laudos/[loteId]/confirmar-assinatura
 *
 * Permite ao emissor confirmar manualmente que o laudo já foi assinado
 * no ZapSign quando o webhook automático não foi disparado.
 *
 * Fluxo:
 * 1. Autentica o emissor
 * 2. Busca laudo aguardando assinatura pelo lote_id + emissor_cpf
 * 3. Consulta ZapSign: se ainda não assinado → retorna signed=false
 * 4. Se assinado:
 *    a. Baixa o PDF assinado
 *    b. Calcula hash SHA-256
 *    c. Salva localmente
 *    d. FASE A: grava hash + assinado_em + status='assinado_processando'
 *    e. FASE B: upload Backblaze + status='enviado' + emitido_em/enviado_em
 *    f. Finaliza lote
 */

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import {
  buscarDocumentoZapSign,
  downloadPdfAssinado,
} from '@/lib/integrations/zapsign/client';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface LaudoRow {
  id: number;
  lote_id: number;
  status: string;
  zapsign_doc_token: string | null;
  zapsign_signer_token: string | null;
  zapsign_sign_url: string | null;
  assinado_em: string | null;
  emitido_em: string | null;
  enviado_em: string | null;
}

export async function POST(
  _req: Request,
  { params }: { params: { loteId: string } }
): Promise<NextResponse> {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  let user;
  try {
    user = await requireRole('emissor');
  } catch {
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

  // ── 2. Buscar laudo ───────────────────────────────────────────────────────
  const laudoResult = await query<LaudoRow>(
    `SELECT id, lote_id, status, zapsign_doc_token, zapsign_signer_token,
            zapsign_sign_url, assinado_em, emitido_em, enviado_em
     FROM laudos
     WHERE lote_id = $1 AND emissor_cpf = $2
     LIMIT 1`,
    [loteId, user.cpf],
    user
  );

  if (laudoResult.rows.length === 0) {
    return NextResponse.json(
      { error: 'Laudo não encontrado para este lote', success: false },
      { status: 404 }
    );
  }

  const laudo = laudoResult.rows[0];

  // Idempotência: já processado
  if (laudo.status === 'enviado' || laudo.status === 'emitido') {
    return NextResponse.json({
      success: true,
      signed: true,
      message: 'Laudo já foi confirmado e está disponível em "Laudo Emitido".',
    });
  }

  if (
    laudo.status !== 'aguardando_assinatura' &&
    laudo.status !== 'assinado_processando'
  ) {
    return NextResponse.json(
      {
        error: `Status '${laudo.status}' não permite confirmação de assinatura. Esperado: 'aguardando_assinatura'.`,
        success: false,
      },
      { status: 409 }
    );
  }

  if (!laudo.zapsign_doc_token) {
    return NextResponse.json(
      {
        error:
          'Token ZapSign não encontrado neste laudo. Não é possível verificar.',
        success: false,
      },
      { status: 400 }
    );
  }

  // ── 3. Consultar ZapSign ──────────────────────────────────────────────────
  let docAtualizado;
  try {
    docAtualizado = await buscarDocumentoZapSign(laudo.zapsign_doc_token);
  } catch (err) {
    console.error(
      `[CONFIRMAR-ASSINATURA] Falha ao consultar ZapSign (laudo ${laudo.id}):`,
      err
    );
    return NextResponse.json(
      {
        error:
          'Falha ao consultar ZapSign: ' +
          (err instanceof Error ? err.message : String(err)),
        success: false,
      },
      { status: 502 }
    );
  }

  if (docAtualizado.status !== 'signed') {
    return NextResponse.json({
      success: true,
      signed: false,
      zapsign_status: docAtualizado.status,
      message: `Documento ainda não assinado no ZapSign (status: ${docAtualizado.status}).`,
    });
  }

  const signedFileUrl = docAtualizado.signed_file;
  if (!signedFileUrl) {
    return NextResponse.json(
      {
        error:
          'Assinatura detectada no ZapSign, mas a URL do PDF assinado não está disponível ainda. Tente novamente em instantes.',
        success: false,
      },
      { status: 502 }
    );
  }

  // ── 4. Download do PDF assinado ───────────────────────────────────────────
  let pdfAssinadoBuffer: Buffer;
  try {
    pdfAssinadoBuffer = await downloadPdfAssinado(signedFileUrl);
  } catch (err) {
    console.error(
      `[CONFIRMAR-ASSINATURA] Falha ao baixar PDF assinado (laudo ${laudo.id}):`,
      err
    );
    return NextResponse.json(
      {
        error:
          'Falha ao baixar PDF assinado: ' +
          (err instanceof Error ? err.message : String(err)),
        success: false,
      },
      { status: 502 }
    );
  }

  // ── 5. Hash SHA-256 ───────────────────────────────────────────────────────
  const hashPdf = crypto
    .createHash('sha256')
    .update(pdfAssinadoBuffer)
    .digest('hex');

  // ── 6. Salvar localmente (best-effort — falha silenciosa em Vercel) ────────
  try {
    const storageDir = path.join(process.cwd(), 'storage', 'laudos');
    if (!fs.existsSync(storageDir))
      fs.mkdirSync(storageDir, { recursive: true });
    fs.writeFileSync(
      path.join(storageDir, `laudo-${laudo.id}.pdf`),
      pdfAssinadoBuffer
    );
  } catch {
    // ignorado — ambiente read-only (Vercel)
  }

  // ── FASE A: Gravar hash imediatamente ─────────────────────────────────────
  const assinadoEm = new Date();

  await query(
    `UPDATE laudos
     SET hash_pdf       = $1,
         assinado_em    = $2,
         zapsign_status = 'signed',
         status         = 'assinado_processando',
         atualizado_em  = NOW()
     WHERE id = $3
       AND status IN ('aguardando_assinatura', 'assinado_processando')`,
    [hashPdf, assinadoEm, laudo.id],
    user
  );

  // ── FASE C: Finalizar lote ANTES de setar emitido_em no laudo ─────────────
  // ⚠️ ORDEM CRÍTICA: O trigger prevent_modification_lote_when_laudo_emitted
  //    verifica laudos.emitido_em IS NOT NULL. O lote deve ser atualizado
  //    enquanto emitido_em ainda é NULL (laudo em 'assinado_processando').
  //
  // ⚠️ ESTADO: O trigger fn_validar_transicao_status_lote bloqueia saltos de
  //    status. É necessário caminhar pela máquina de estados:
  //    concluido → emissao_solicitada → emissao_em_andamento → laudo_emitido → finalizado
  //    Cada UPDATE só executa se o lote estiver no status "from" esperado.
  // Caminhar pela máquina de estados até 'laudo_emitido'.
  // NÃO vai até 'finalizado' — o emissor deve enviar manualmente (PATCH),
  // o que move o lote para 'finalizado' e exibe o card em 'Laudos Enviados'.
  const stateWalkSteps = [
    { from: 'concluido', to: 'emissao_solicitada' },
    { from: 'emissao_solicitada', to: 'emissao_em_andamento' },
    { from: 'emissao_em_andamento', to: 'laudo_emitido' },
  ] as const;
  for (const step of stateWalkSteps) {
    try {
      await query(
        `UPDATE lotes_avaliacao
         SET status        = $1,
             atualizado_em = NOW()
         WHERE id = $2 AND status = $3`,
        [step.to, laudo.lote_id, step.from],
        user
      );
    } catch (e) {
      console.warn(
        `[CONFIRMAR-ASSINATURA] Aviso ao transicionar lote ${laudo.lote_id} ${step.from}→${step.to}:`,
        e
      );
    }
  }

  // ── FASE D: Marcar laudo como 'emitido' ─────────────────────────────────
  // ⚠️ OBRIGATÓRIO setar emitido_em — constraint chk_laudos_emitido_em_when_emitido
  //    exige emitido_em IS NOT NULL quando status='emitido'.
  // ⚠️ NÃO seta arquivo_remoto_* — upload ao Backblaze é feito separadamente
  //    via UploadLaudoButton, que exibe somente quando status='emitido' && !arquivoRemotoKey.
  // ⚠️ Após setar emitido_em, o trigger prevent_modification_lote_when_laudo_emitted
  //    bloqueia updates no lote, EXCETO a transição laudo_emitido → finalizado
  //    (adicionada pela migration 1230 exatamente para este caso).
  await query(
    `UPDATE laudos
     SET status        = 'emitido',
         emitido_em    = NOW(),
         atualizado_em = NOW()
     WHERE id = $1`,
    [laudo.id],
    user
  );

  console.log(
    `[CONFIRMAR-ASSINATURA] ✅ Laudo ${laudo.id} emitido (lote ${laudo.lote_id} → laudo_emitido). Aguardando upload via UploadLaudoButton.`
  );

  return NextResponse.json({
    success: true,
    signed: true,
    hash_pdf: hashPdf,
    message: 'Assinatura confirmada. Laudo disponível em "Laudo Emitido".',
  });
}
