/**
 * POST /api/emissor/laudos/[loteId]/upload
 *
 * Endpoint para upload de laudo ao bucket Backblaze
 * - Somente role 'emissor'
 * - Valida PDF, tamanho <= 2MB
 * - Verifica hash do arquivo contra laudos.hash_pdf
 * - Upload único (imutabilidade) - rejeita se já existe arquivo_remoto_key
 * - Persiste metadados no banco de dados
 * - Auditoria completa
 */

import { requireRole } from '@/lib/session';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  uploadLaudoToBackblaze,
  calcularHash,
} from '@/lib/storage/laudo-storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Upload pode levar até 60s

interface LaudoRow {
  id: number;
  lote_id: number;
  status: string;
  hash_pdf: string | null;
  arquivo_remoto_key: string | null;
  arquivo_remoto_url: string | null;
}

export async function POST(
  req: Request,
  { params }: { params: { loteId: string } }
) {
  const startTime = Date.now();

  // 1. Autenticação: SOMENTE emissor
  let user: Awaited<ReturnType<typeof requireRole>>;
  try {
    user = await requireRole('emissor');
  } catch {
    return NextResponse.json(
      {
        error: 'Acesso negado. Apenas emissores podem fazer upload de laudos.',
        success: false,
      },
      { status: 403 }
    );
  }

  try {
    const loteId = parseInt(params.loteId, 10);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido', success: false },
        { status: 400 }
      );
    }

    // 2. Buscar laudo no banco de dados pelo lote_id
    const laudoResult = await query<LaudoRow>(
      `SELECT id, lote_id, status, hash_pdf, arquivo_remoto_key, arquivo_remoto_url
       FROM laudos
       WHERE lote_id = $1
       LIMIT 1`,
      [loteId],
      user
    );

    if (laudoResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Laudo do lote ${loteId} não encontrado`, success: false },
        { status: 404 }
      );
    }

    const laudo = laudoResult.rows[0];
    const laudoId = laudo.id;

    // 3. Verificar se laudo foi gerado (tem PDF local)
    // ⚠️ IMPORTANTE: Após mudança na emissão, o laudo permanece com status='rascunho'
    // e é marcado como 'emitido' APÓS o upload ao bucket.
    // Portanto, verificar se tem hash_pdf (indica PDF foi gerado localmente)
    if (!laudo.hash_pdf) {
      return NextResponse.json(
        {
          error: `Laudo ${laudoId} do lote ${loteId} não foi gerado ainda. Gere o laudo antes de fazer upload.`,
          success: false,
        },
        { status: 400 }
      );
    }

    // 4. IMUTABILIDADE: Verificar se já existe upload (não permitir novo upload)
    if (laudo.arquivo_remoto_key) {
      return NextResponse.json(
        {
          error:
            'Este laudo já foi enviado ao bucket (imutabilidade). Upload não permitido.',
          success: false,
          details: {
            arquivo_remoto_key: laudo.arquivo_remoto_key,
            arquivo_remoto_url: laudo.arquivo_remoto_url,
          },
        },
        { status: 409 } // Conflict
      );
    }

    // 5. Verificar hash disponível
    if (!laudo.hash_pdf) {
      return NextResponse.json(
        {
          error:
            'Laudo sem hash SHA-256. Regenere o laudo antes de fazer upload.',
          success: false,
        },
        { status: 400 }
      );
    }

    // 6. Ler arquivo do FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido no campo "file"', success: false },
        { status: 400 }
      );
    }

    // 7. Validação: tipo MIME
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        {
          error: 'Tipo de arquivo inválido. Apenas PDF é permitido.',
          success: false,
          receivedType: file.type,
        },
        { status: 400 }
      );
    }

    // 8. Validação: tamanho <= 2MB
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error: 'Arquivo excede o tamanho máximo permitido (2 MB)',
          success: false,
          maxSizeBytes: MAX_SIZE,
          fileSize: file.size,
        },
        { status: 400 }
      );
    }

    // 9. Ler arquivo e calcular hash
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verificar header PDF
    const header = buffer.slice(0, 5).toString('ascii');
    if (!header.startsWith('%PDF-')) {
      return NextResponse.json(
        {
          error: 'Arquivo não é um PDF válido (header inválido)',
          success: false,
        },
        { status: 400 }
      );
    }

    // 10. Calcular hash do arquivo recebido
    const uploadedFileHash = calcularHash(buffer);

    // 11. IMUTABILIDADE: Comparar hash com hash_pdf do banco
    if (uploadedFileHash !== laudo.hash_pdf) {
      await query(
        `INSERT INTO audit_logs (action, resource, resource_id, new_data, user_perfil, user_cpf)
         VALUES ('laudo_upload_hash_mismatch', 'laudos', $1, $2, $3, $4)`,
        [
          laudoId.toString(),
          JSON.stringify({
            expected_hash: laudo.hash_pdf,
            received_hash: uploadedFileHash,
            lote_id: laudo.lote_id,
            emissor_cpf: user.cpf,
          }),
          user.perfil,
          user.cpf,
        ],
        user
      );

      return NextResponse.json(
        {
          error:
            'Hash do arquivo enviado não corresponde ao hash registrado no banco de dados (imutabilidade violada).',
          success: false,
          details: {
            expected: laudo.hash_pdf,
            received: uploadedFileHash,
          },
        },
        { status: 400 }
      );
    }

    // 12. Fazer upload para Backblaze e obter metadados da key real
    console.log(
      `[UPLOAD] Iniciando upload do laudo ${laudoId} (lote ${laudo.lote_id}) para Backblaze...`
    );

    const uploadResult = await uploadLaudoToBackblaze(
      laudoId,
      laudo.lote_id,
      buffer
    );

    if (!uploadResult) {
      return NextResponse.json(
        {
          error:
            'Upload Backblaze não disponível (configuração ausente ou serviço desabilitado)',
          success: false,
        },
        { status: 503 }
      );
    }

    // 14. Atualizar status do lote para 'finalizado'.
    // ⚠️ CRÍTICO: deve vir ANTES do passo 15 para garantir consistência.
    // ⚠️ NOTA: migration 1230 adicionou exceção no trigger
    //    prevent_modification_lote_when_laudo_emitted para permitir
    //    especificamente a transição laudo_emitido → finalizado mesmo
    //    quando laudos.emitido_em IS NOT NULL.
    // Guard AND status = 'laudo_emitido' evita transições indevidas
    // caso o lote já esteja em outro estado.
    try {
      await query(
        `UPDATE lotes_avaliacao SET status = 'finalizado', laudo_enviado_em = NOW(), atualizado_em = NOW() WHERE id = $1 AND status = 'laudo_emitido'`,
        [laudo.lote_id],
        user
      );
    } catch (loteUpdateError: unknown) {
      console.warn(
        `[UPLOAD] Aviso: não foi possível marcar lote ${laudo.lote_id} como finalizado. Upload do laudo já concluído.`,
        loteUpdateError instanceof Error
          ? loteUpdateError.message
          : loteUpdateError
      );
    }

    // 15. Persistir metadados no banco de dados E MARCAR COMO ENVIADO
    // ⚠️ IMPORTANTE: Deve vir APÓS o passo 14 — o trigger check_laudo_immutability
    // permitirá este UPDATE pois emitido_em ainda é NULL neste momento.
    // A validação de imutabilidade já foi feita no passo 4 (verificando arquivo_remoto_key)
    await query(
      `UPDATE laudos 
       SET arquivo_remoto_provider = $1,
           arquivo_remoto_bucket = $2,
           arquivo_remoto_key = $3,
           arquivo_remoto_url = $4,
           arquivo_remoto_uploaded_at = NOW(),
           arquivo_remoto_etag = $5,
           arquivo_remoto_size = $6,
           status = 'enviado',
           emitido_em = COALESCE(emitido_em, NOW()),
           enviado_em = NOW(),
           atualizado_em = NOW()
       WHERE id = $7`,
      [
        uploadResult.provider || 'backblaze',
        uploadResult.bucket || process.env.BACKBLAZE_BUCKET || 'laudos-qwork',
        uploadResult.key,
        uploadResult.url,
        uploadResult.etag || null,
        buffer.length,
        laudoId,
      ],
      user
    );

    // 16. Auditoria de sucesso
    await query(
      `INSERT INTO audit_logs (action, resource, resource_id, new_data, user_perfil, user_cpf)
       VALUES ('laudo_upload_backblaze_sucesso', 'laudos', $1, $2, $3, $4)`,
      [
        laudoId.toString(),
        JSON.stringify({
          lote_id: laudo.lote_id,
          emissor_cpf: user.cpf,
          arquivo_remoto_key: uploadResult.key,
          arquivo_remoto_url: uploadResult.url,
          file_size: buffer.length,
          duration_ms: Date.now() - startTime,
        }),
        user.perfil,
        user.cpf,
      ],
      user
    );

    console.log(
      `[UPLOAD] Upload concluído com sucesso para laudo ${laudoId} → ${uploadResult.url}`
    );

    return NextResponse.json({
      success: true,
      message: 'Upload realizado com sucesso',
      data: {
        laudoId,
        loteId: laudo.lote_id,
        arquivo_remoto_key: uploadResult.key,
        arquivo_remoto_url: uploadResult.url,
        arquivo_remoto_size: buffer.length,
        uploaded_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[UPLOAD] Erro no upload do laudo:', error);

    // Auditoria de erro
    try {
      const loteId = parseInt(params.loteId, 10);
      if (!isNaN(loteId)) {
        // Buscar laudoId a partir do loteId para auditoria
        const laudoResult = await query<{ id: number }>(
          'SELECT id FROM laudos WHERE lote_id = $1 LIMIT 1',
          [loteId],
          user
        );

        if (laudoResult.rows.length > 0) {
          const laudoId = laudoResult.rows[0].id;
          await query(
            `INSERT INTO audit_logs (action, resource, resource_id, new_data, user_perfil, user_cpf)
             VALUES ('laudo_upload_backblaze_erro', 'laudos', $1, $2, $3, $4)`,
            [
              laudoId.toString(),
              JSON.stringify({
                erro: error instanceof Error ? error.message : String(error),
                emissor_cpf: user?.cpf,
                duration_ms: Date.now() - startTime,
              }),
              user?.perfil || 'emissor',
              user?.cpf || null,
            ],
            user
          );
        }
      }
    } catch (auditError) {
      console.error(
        '[UPLOAD] Falha ao registrar auditoria de erro:',
        auditError
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao fazer upload do laudo',
        success: false,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
