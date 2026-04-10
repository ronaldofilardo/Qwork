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

  if (laudo.status !== 'aguardando_assinatura') {
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
    const { join } = await import('path');
    const { writeFileSync, mkdirSync, existsSync } = await import('fs');
    const storageDir = join(process.cwd(), 'storage', 'laudos');
    if (!existsSync(storageDir)) mkdirSync(storageDir, { recursive: true });
    const filePath = join(storageDir, `laudo-${laudo.id}.pdf`);
    writeFileSync(filePath, pdfAssinadoBuffer);
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

  // ── 9. Upload para Backblaze ─────────────────────────────────────────────
  let arquivoRemotoKey: string | null = null;
  let arquivoRemotoUrl: string | null = null;
  let arquivoRemotoProvider: string | null = null;
  let arquivoRemotoBucket: string | null = null;
  let arquivoRemotoEtag: string | null = null;
  let arquivoRemotoSize: number | null = null;

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
      arquivoRemotoSize = uploadResult.size ?? pdfAssinadoBuffer.byteLength;
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
    // Não bloquear — continua para atualizar o DB com o hash calculado
  }

  // ── 10. Atualizar laudos no banco de dados ────────────────────────────────
  const assinadoEm = payload.signer?.signed_at
    ? new Date(payload.signer.signed_at)
    : new Date();

  try {
    const agora = new Date();
    await query(
      `UPDATE laudos
       SET status                     = 'enviado',
           hash_pdf                   = $1,
           emitido_em                 = $2,
           enviado_em                 = $2,
           assinado_em                = $3,
           zapsign_status             = 'signed',
           arquivo_remoto_provider    = $4,
           arquivo_remoto_bucket      = $5,
           arquivo_remoto_key         = $6,
           arquivo_remoto_url         = $7,
           arquivo_remoto_uploaded_at = $8,
           arquivo_remoto_etag        = $9,
           arquivo_remoto_size        = $10,
           atualizado_em              = NOW()
       WHERE id = $11 AND status = 'aguardando_assinatura'`,
      [
        hashPdfAssinado, // $1 hash do PDF ASSINADO
        agora, // $2 emitido_em = enviado_em (mesmo instante)
        assinadoEm, // $3 assinado_em
        arquivoRemotoProvider, // $4
        arquivoRemotoBucket, // $5
        arquivoRemotoKey, // $6
        arquivoRemotoUrl, // $7
        agora, // $8 uploaded_at
        arquivoRemotoEtag, // $9
        arquivoRemotoSize, // $10
        laudo.id, // $11
      ]
    );

    console.log(
      `[ZapSign Webhook] ✅ Laudo ${laudo.id} finalizado: status=enviado, hash=${hashPdfAssinado}`
    );
  } catch (dbErr) {
    console.error(
      `[ZapSign Webhook] Falha ao atualizar DB para laudo ${laudo.id}:`,
      dbErr
    );
    return NextResponse.json(
      { error: 'Falha ao atualizar banco de dados' },
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
