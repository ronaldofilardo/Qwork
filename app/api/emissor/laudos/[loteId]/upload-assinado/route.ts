/**
 * POST /api/emissor/laudos/[loteId]/upload-assinado
 *
 * Permite ao emissor fazer upload do PDF já assinado no ZapSign.
 * O PDF assinado é diferente do original (possui página de evidências),
 * portanto não há validação de hash contra o original.
 *
 * Fluxo:
 * 1. Autentica o emissor
 * 2. Valida status do laudo (aguardando_assinatura | assinado_processando)
 * 3. Recebe o arquivo via multipart/form-data
 * 4. Calcula hash SHA-256 do PDF recebido
 * 5. Faz upload para Backblaze com key laudos/{loteId}.pdf
 * 6. Caminha pela máquina de estados do lote até laudo_emitido
 * 7. Marca laudo como emitido (status=emitido, emitido_em, assinado_em, hash_pdf)
 */

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { uploadToBackblaze } from '@/lib/storage/backblaze-client';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB — ZapSign adiciona página de evidências

interface LaudoRow {
  id: number;
  lote_id: number;
  status: string;
}

export async function POST(
  req: Request,
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
    `SELECT id, lote_id, status
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
  if (laudo.status === 'emitido' || laudo.status === 'enviado') {
    return NextResponse.json({
      success: true,
      message: 'Laudo já foi emitido.',
    });
  }

  if (
    laudo.status !== 'aguardando_assinatura' &&
    laudo.status !== 'assinado_processando'
  ) {
    return NextResponse.json(
      {
        error: `Status '${laudo.status}' não permite upload de PDF assinado. Esperado: 'aguardando_assinatura'.`,
        success: false,
      },
      { status: 409 }
    );
  }

  // ── 3. Receber arquivo ────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Falha ao ler formulário multipart', success: false },
      { status: 400 }
    );
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'Campo "file" não encontrado', success: false },
      { status: 400 }
    );
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json(
      { error: 'Apenas arquivos PDF são aceitos', success: false },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Arquivo muito grande. Máximo: 20MB', success: false },
      { status: 413 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);

  // ── 4. Hash SHA-256 ───────────────────────────────────────────────────────
  const hashPdf = crypto
    .createHash('sha256')
    .update(pdfBuffer)
    .digest('hex');

  // ── 5. Upload Backblaze ───────────────────────────────────────────────────
  const remoteKey = `laudos/${loteId}.pdf`;
  try {
    await uploadToBackblaze(pdfBuffer, remoteKey, 'application/pdf');
  } catch (err) {
    console.error(
      `[UPLOAD-ASSINADO] Falha no upload Backblaze (laudo ${laudo.id}):`,
      err
    );
    return NextResponse.json(
      {
        error:
          'Falha ao salvar PDF: ' +
          (err instanceof Error ? err.message : String(err)),
        success: false,
      },
      { status: 502 }
    );
  }

  // ── 6. FASE A: Gravar hash + assinado_processando ────────────────────────
  await query(
    `UPDATE laudos
     SET hash_pdf       = $1,
         assinado_em    = NOW(),
         zapsign_status = 'signed',
         status         = 'assinado_processando',
         atualizado_em  = NOW()
     WHERE id = $2
       AND status IN ('aguardando_assinatura', 'assinado_processando')`,
    [hashPdf, laudo.id],
    user
  );

  // ── 7. Caminhar pela máquina de estados do lote até laudo_emitido ─────────
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
        `[UPLOAD-ASSINADO] Aviso ao transicionar lote ${laudo.lote_id} ${step.from}→${step.to}:`,
        e
      );
    }
  }

  // ── 8. Marcar laudo como emitido ──────────────────────────────────────────
  await query(
    `UPDATE laudos
     SET status             = 'emitido',
         emitido_em         = NOW(),
         arquivo_remoto_key = $1,
         atualizado_em      = NOW()
     WHERE id = $2`,
    [remoteKey, laudo.id],
    user
  );

  console.log(
    `[UPLOAD-ASSINADO] ✅ Laudo ${laudo.id} emitido via upload manual (lote ${laudo.lote_id}).`
  );

  return NextResponse.json({
    success: true,
    message: 'PDF assinado enviado. Laudo disponível em "Laudo Emitido".',
  });
}
