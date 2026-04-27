/**
 * POST /api/webhooks/zapsign
 *
 * Webhook handler para callbacks do ZapSign.
 * Disparado quando o(s) assinante(s) completam a assinatura digital.
 *
 * Fluxo:
 * 1. Valida secret via query param ?secret=ZAPSIGN_WEBHOOK_SECRET
 * 2. Extrai doc_token e verifica status === 'signed'
 * 3. Busca laudo pelo zapsign_doc_token
 * 4. Chama ZapSign API para obter URL do PDF assinado
 * 5. Faz download do PDF assinado
 * 6. Calcula SHA-256 hash do PDF ASSINADO (requisito de imutabilidade)
 * 7. Faz upload para Backblaze
 * 8. Atualiza laudos: hash_pdf, emitido_em, enviado_em, assinado_em, arquivo_remoto_*
 * 9. Retorna 200 para o ZapSign
 *
 * ⚠️ Esta rota é pública (sem session) — ZapSign chama de fora.
 *    Segurança por ZAPSIGN_WEBHOOK_SECRET no query param.
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  buscarDocumentoZapSign,
  downloadPdfAssinado,
} from '@/lib/integrations/zapsign/client';
import { uploadLaudoToBackblaze } from '@/lib/storage/laudo-storage';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

// ─── Tipos do payload ZapSign ─────────────────────────────────────────────────

interface ZapSignWebhookPayload {
  document?: {
    token?: string;
    status?: string;
    signed_file?: string;
    name?: string;
  };
  signer?: {
    token?: string;
    email?: string;
    status?: string;
    signed_at?: string;
  };
  event_type?: string;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  // ── 1. Validar secret ────────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const receivedSecret = searchParams.get('secret') ?? '';
  const expectedSecret = process.env.ZAPSIGN_WEBHOOK_SECRET ?? '';

  if (
    !expectedSecret ||
    receivedSecret.length === 0 ||
    !crypto.timingSafeEqual(
      Buffer.from(receivedSecret),
      Buffer.from(expectedSecret)
    )
  ) {
    console.warn('[ZapSign Webhook] Secret inválido recebido');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Parsear body ──────────────────────────────────────────────────────
  let payload: ZapSignWebhookPayload;
  try {
    payload = (await req.json()) as ZapSignWebhookPayload;
  } catch {
    console.warn('[ZapSign Webhook] Body inválido (não é JSON)');
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const docToken = payload.document?.token;
  const docStatus = payload.document?.status;

  console.log(
    `[ZapSign Webhook] Evento recebido: token=${docToken}, status=${docStatus}`
  );

  // ── 3. Ignorar eventos que não sejam assinatura completa ─────────────────
  if (!docToken) {
    return NextResponse.json({ ok: true, ignorado: 'sem doc_token' });
  }

  if (docStatus !== 'signed') {
    console.log(
      `[ZapSign Webhook] Ignorando evento status="${docStatus}" (aguardamos apenas "signed")`
    );
    return NextResponse.json({ ok: true, ignorado: `status=${docStatus}` });
  }

  // ── 4. Buscar laudo pelo token ───────────────────────────────────────────
  const laudoResult = await query(
    `SELECT id, lote_id, emissor_cpf, status
     FROM laudos
     WHERE zapsign_doc_token = $1
     LIMIT 1`,
    [docToken]
    // Sem session — esta rota roda fora de contexto de usuário
  );

  if (laudoResult.rows.length === 0) {
    console.warn(
      `[ZapSign Webhook] Laudo não encontrado para doc_token=${docToken}`
    );
    // Retornamos 200 para o ZapSign não retentar indefinidamente
    return NextResponse.json({
      ok: true,
      aviso: 'Laudo não encontrado para este token',
    });
  }

  const laudo = laudoResult.rows[0] as {
    id: number;
    lote_id: number;
    emissor_cpf: string;
    status: string;
  };

  // Idempotência: se já foi processado, responder OK sem repetir
  if (laudo.status === 'enviado') {
    console.log(
      `[ZapSign Webhook] Laudo ${laudo.id} já está enviado — idempotência acionada`
    );
    return NextResponse.json({ ok: true, idempotente: true });
  }

  if (
    laudo.status !== 'aguardando_assinatura' &&
    laudo.status !== 'assinado_processando'
  ) {
    console.warn(
      `[ZapSign Webhook] Laudo ${laudo.id} está em status inesperado: ${laudo.status}`
    );
    return NextResponse.json({
      ok: true,
      aviso: `status inesperado: ${laudo.status}`,
    });
  }

  // ── 5. Buscar documento atualizado no ZapSign para obter signed_file ─────
  let signedFileUrl: string | undefined = payload.document?.signed_file;

  if (!signedFileUrl) {
    try {
      const docAtualizado = await buscarDocumentoZapSign(docToken);
      signedFileUrl = docAtualizado.signed_file;
    } catch (err) {
      console.error(
        `[ZapSign Webhook] Falha ao buscar documento ${docToken} na API:`,
        err
      );
    }
  }

  if (!signedFileUrl) {
    console.error(
      `[ZapSign Webhook] URL do PDF assinado não encontrada para doc_token=${docToken}`
    );
    // Retornar 500 para o ZapSign retentar mais tarde
    return NextResponse.json(
      { error: 'signed_file URL indisponível' },
      { status: 500 }
    );
  }

  // ── 6. Download do PDF assinado ──────────────────────────────────────────
  let pdfAssinadoBuffer: Buffer;
  try {
    pdfAssinadoBuffer = await downloadPdfAssinado(signedFileUrl);
    console.log(
      `[ZapSign Webhook] PDF assinado baixado: ${pdfAssinadoBuffer.byteLength} bytes`
    );
  } catch (err) {
    console.error(
      `[ZapSign Webhook] Falha ao baixar PDF assinado do laudo ${laudo.id}:`,
      err
    );
    return NextResponse.json(
      { error: 'Falha ao baixar PDF assinado' },
      { status: 500 }
    );
  }

  // ── 7. Calcular hash SHA-256 DO PDF ASSINADO ─────────────────────────────
  // ⚠️ REQUISITO CRÍTICO: O hash é sempre do arquivo final (assinado).
  //    Nunca do arquivo pré-assinatura gerado pelo Puppeteer.
  const hashPdfAssinado = crypto
    .createHash('sha256')
    .update(pdfAssinadoBuffer)
    .digest('hex');

  console.log(
    `[ZapSign Webhook] Hash SHA-256 do PDF assinado calculado: ${hashPdfAssinado}`
  );

  // ── 8. Sobrescrever arquivo local com o PDF assinado ─────────────────────
  try {
    const storageDir = path.join(process.cwd(), 'storage', 'laudos');
    if (!fs.existsSync(storageDir))
      fs.mkdirSync(storageDir, { recursive: true });
    const filePath = path.join(storageDir, `laudo-${laudo.id}.pdf`);
    fs.writeFileSync(filePath, pdfAssinadoBuffer);
    console.log(
      `[ZapSign Webhook] PDF assinado salvo em ${filePath} (substituiu pré-assinatura)`
    );
  } catch (fsErr) {
    // Em Vercel (read-only FS) isso vai falhar — não é crítico; o arquivo vai pro Backblaze
    console.warn(
      '[ZapSign Webhook] Não foi possível salvar PDF assinado localmente:',
      fsErr
    );
  }

  // ── FASE A: Commit hash imediatamente (antes do upload) ──────────────────
  // Inclui transição de status para 'assinado_processando' — garante que
  // se FASE B falhar, o laudo não fica co status='aguardando_assinatura' com hash preenchido.
  // O webhook ZapSign pode retentar; a FASE B é idempotente para 'assinado_processando'.
  const assinadoEm = payload.signer?.signed_at
    ? new Date(payload.signer.signed_at)
    : new Date();

  try {
    const faseAResult = await query(
      `UPDATE laudos
       SET hash_pdf       = $1,
           assinado_em    = $2,
           zapsign_status = 'signed',
           status         = 'assinado_processando',
           atualizado_em  = NOW()
       WHERE id = $3 AND status IN ('aguardando_assinatura', 'assinado_processando')
       RETURNING id`,
      [hashPdfAssinado, assinadoEm, laudo.id]
    );
    if (!faseAResult || faseAResult.rowCount === 0) {
      console.warn(
        `[ZapSign Webhook] FASE A: Laudo ${laudo.id} não estava em estado esperado — pode já ter sido processado`
      );
    } else {
      console.log(
        `[ZapSign Webhook] FASE A ✅ hash e assinado_em gravados para laudo ${laudo.id}`
      );
    }
  } catch (faseAErr) {
    console.error(
      `[ZapSign Webhook] FASE A: Falha ao gravar hash no DB (laudo ${laudo.id}):`,
      faseAErr
    );
    return NextResponse.json(
      { error: 'Falha ao gravar hash no banco de dados' },
      { status: 500 }
    );
  }

  // ── 9. Upload para Backblaze ─────────────────────────────────────────────
  let arquivoRemotoKey: string | null = null;
  let arquivoRemotoUrl: string | null = null;
  let arquivoRemotoProvider: string | null = null;
  let arquivoRemotoBucket: string | null = null;
  let arquivoRemotoEtag: string | null = null;
  const arquivoRemotoSize: number = pdfAssinadoBuffer.byteLength;

  try {
    const uploadResult = await uploadLaudoToBackblaze(
      laudo.id,
      laudo.lote_id,
      pdfAssinadoBuffer
    );

    if (uploadResult) {
      arquivoRemotoKey = uploadResult.key ?? null;
      arquivoRemotoUrl = uploadResult.url ?? null;
      arquivoRemotoProvider = uploadResult.provider ?? 'backblaze';
      arquivoRemotoBucket = uploadResult.bucket ?? null;
      arquivoRemotoEtag = uploadResult.etag ?? null;
      console.log(
        `[ZapSign Webhook] Upload Backblaze concluído: ${arquivoRemotoKey}`
      );
    } else {
      console.warn(
        '[ZapSign Webhook] Upload remoto desabilitado (DISABLE_LAUDO_REMOTE=1 ou Backblaze não configurado)'
      );
    }
  } catch (uploadErr) {
    console.error(
      `[ZapSign Webhook] Falha no upload para Backblaze (laudo ${laudo.id}):`,
      uploadErr
    );
    // Não bloquear — FASE B ainda marca status='enviado' (sem arquivo_remoto)
  }

  const agora = new Date();

  // ── FASE C: Finalizar lote ANTES de setar emitido_em no laudo ───────────
  // ⚠️ ORDEM CRÍTICA: O trigger prevent_modification_lote_when_laudo_emitted
  //    verifica laudos.emitido_em IS NOT NULL. Atualizar o lote enquanto
  //    emitido_em ainda é NULL (laudo em 'assinado_processando').
  //
  // Caminhar até 'laudo_emitido' — não vai até 'finalizado'.
  // O emissor deve enviar manualmente (PATCH) para mover para 'Laudos Enviados'.
  const webhookStateWalkSteps = [
    { from: 'concluido', to: 'emissao_solicitada' },
    { from: 'emissao_solicitada', to: 'emissao_em_andamento' },
    { from: 'emissao_em_andamento', to: 'laudo_emitido' },
  ] as const;
  for (const step of webhookStateWalkSteps) {
    try {
      await query(
        `UPDATE lotes_avaliacao
         SET status        = $1,
             atualizado_em = NOW()
         WHERE id = $2 AND status = $3`,
        [step.to, laudo.lote_id, step.from]
      );
    } catch (faseCErr) {
      console.warn(
        `[ZapSign Webhook] FASE C: lote ${laudo.lote_id} ${step.from}→${step.to}:`,
        faseCErr
      );
    }
  }
  console.log(
    `[ZapSign Webhook] FASE C ✅ Lote ${laudo.lote_id} avançado para laudo_emitido`
  );

  // ── FASE B: Emitir laudo (status='emitido' + arquivo_remoto) ──────────
  // NÃO seta enviado_em — o emissor envia manualmente via PATCH.
  // Assim o card aparece em 'Laudo Emitido', não 'Laudos Enviados'.
  try {
    await query(
      `UPDATE laudos
       SET status                     = 'emitido',
           emitido_em                 = $1,
           arquivo_remoto_provider    = $2,
           arquivo_remoto_bucket      = $3,
           arquivo_remoto_key         = $4,
           arquivo_remoto_url         = $5,
           arquivo_remoto_uploaded_at = $6,
           arquivo_remoto_etag        = $7,
           arquivo_remoto_size        = $8,
           atualizado_em              = NOW()
       WHERE id = $9 AND status IN ('assinado_processando', 'aguardando_assinatura')`,
      [
        agora, // $1 emitido_em
        arquivoRemotoProvider, // $2
        arquivoRemotoBucket, // $3
        arquivoRemotoKey, // $4
        arquivoRemotoUrl, // $5
        agora, // $6 uploaded_at
        arquivoRemotoEtag, // $7
        arquivoRemotoSize, // $8
        laudo.id, // $9
      ]
    );
    console.log(
      `[ZapSign Webhook] FASE B ✅ Laudo ${laudo.id} status=enviado, hash=${hashPdfAssinado}`
    );
  } catch (faseBErr) {
    console.error(
      `[ZapSign Webhook] FASE B: Falha ao finalizar laudo ${laudo.id}:`,
      faseBErr
    );
    return NextResponse.json(
      { error: 'Falha ao finalizar laudo no banco de dados' },
      { status: 500 }
    );
  }

  // ── 11. Audit log ────────────────────────────────────────────────────────
  try {
    await query(
      `INSERT INTO audit_logs (action, resource, resource_id, user_cpf, user_perfil, created_at, new_data)
       VALUES ('zapsign_assinatura_concluida', 'laudos', $1, $2, 'sistema', NOW(), $3)`,
      [
        laudo.id.toString(),
        laudo.emissor_cpf,
        JSON.stringify({
          doc_token: docToken,
          hash_pdf_assinado: hashPdfAssinado,
          assinado_em: assinadoEm,
          arquivo_remoto_key: arquivoRemotoKey,
        }),
      ]
    );
  } catch (auditErr) {
    // Audit não-crítico
    console.warn('[ZapSign Webhook] Falha no audit log:', auditErr);
  }

  return NextResponse.json({
    ok: true,
    laudo_id: laudo.id,
    hash: hashPdfAssinado,
  });
}
