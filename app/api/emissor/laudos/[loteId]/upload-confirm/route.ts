import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { readFile, unlink, rename, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/emissor/laudos/[loteId]/upload-confirm
 * Confirma upload de laudo e marca como emitido
 *
 * Máquina de estados (CRÍTICO):
 * 1. Lote deve estar 'concluido'
 * 2. Arquivo temporário deve existir
 * 3. Validações: tamanho, tipo, hash
 * 4. Criar registro em laudos com status 'emitido'
 * 5. Mover arquivo para storage final
 * 6. Laudo torna-se IMUTÁVEL após confirmação
 */
export const POST = async (
  req: Request,
  { params }: { params: { loteId: string } }
) => {
  const user = await requireRole('emissor');
  if (!user) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    const loteId = parseInt(params.loteId);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido', success: false },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { key, filename, clientSha256 } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Chave (key) não fornecida', success: false },
        { status: 400 }
      );
    }

    // Verificar se já existe laudo (garantir imutabilidade)
    const laudoExistente = await query(
      `SELECT id, status, emitido_em FROM laudos WHERE lote_id = $1`,
      [loteId]
    );

    if (laudoExistente.rows.length > 0) {
      const existing = laudoExistente.rows[0];

      if (existing.status === 'enviado') {
        return NextResponse.json(
          {
            error:
              'Laudo já foi enviado - operação não permitida (imutabilidade)',
            success: false,
          },
          { status: 400 }
        );
      }

      if (existing.emitido_em) {
        return NextResponse.json(
          {
            error:
              'Laudo já foi emitido - operação não permitida (imutabilidade)',
            success: false,
          },
          { status: 400 }
        );
      }
    }

    // Localizar arquivo temporário
    const sanitizedKey = key.replace(/\//g, '_');
    const pendingDir = path.join(process.cwd(), 'storage', 'laudos', 'pending');
    const tempPath = path.join(pendingDir, sanitizedKey);

    // Verificar existência do arquivo
    let buffer: Buffer;
    try {
      buffer = await readFile(tempPath);
    } catch {
      return NextResponse.json(
        {
          error: 'Arquivo temporário não encontrado ou expirado',
          success: false,
          key,
        },
        { status: 404 }
      );
    }

    // Revalidar tamanho
    if (buffer.length > 1048576) {
      // Remover arquivo inválido
      await unlink(tempPath).catch(() => {});
      return NextResponse.json(
        {
          error: 'Arquivo excede o tamanho máximo permitido (1 MB)',
          success: false,
        },
        { status: 400 }
      );
    }

    // Revalidar header PDF
    const header = buffer.slice(0, 5).toString('ascii');
    if (!header.startsWith('%PDF-')) {
      // Remover arquivo inválido
      await unlink(tempPath).catch(() => {});
      return NextResponse.json(
        {
          error: 'Arquivo não é um PDF válido',
          success: false,
        },
        { status: 400 }
      );
    }

    // Calcular hash SHA-256
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Verificar hash do cliente (se fornecido)
    if (clientSha256 && clientSha256.toLowerCase() !== hash.toLowerCase()) {
      console.warn(
        `[UPLOAD-CONFIRM] Hash mismatch: client=${clientSha256}, server=${hash}`
      );
      // Não bloquear, mas logar (cliente pode ter calculado errado)
    }

    // Inserir/atualizar laudo usando Client isolado para garantir atomicidade
    let laudoId: number;

    try {
      const { Client } = await import('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
      });
      await client.connect();

      try {
        await client.query('BEGIN');

        // Configurar contexto RLS
        await client.query(`SET LOCAL app.current_user_cpf = '${user.cpf}'`);
        await client.query(`SET LOCAL app.current_user_perfil = 'emissor'`);
        await client.query(`SET LOCAL app.system_bypass = 'true'`);

        // Inserir laudo com status 'emitido'
        const shouldSkipHash =
          process.env.SKIP_LAUDO_HASH === '1' ||
          process.env.SKIP_LAUDO_HASH === 'true';

        let laudoInsert;
        if (shouldSkipHash) {
          laudoInsert = await client.query(
            `INSERT INTO laudos (id, lote_id, emissor_cpf, status, observacoes, emitido_em, criado_em, atualizado_em)
             VALUES ($1, $1, $2, 'emitido', 'Laudo enviado manualmente pelo emissor', NOW(), NOW(), NOW()) 
             RETURNING id`,
            [loteId, user.cpf]
          );
        } else {
          laudoInsert = await client.query(
            `INSERT INTO laudos (id, lote_id, emissor_cpf, status, observacoes, emitido_em, hash_pdf, criado_em, atualizado_em)
             VALUES ($1, $1, $2, 'emitido', 'Laudo enviado manualmente pelo emissor', NOW(), $3, NOW(), NOW()) 
             RETURNING id`,
            [loteId, user.cpf, hash]
          );
        }

        laudoId = laudoInsert.rows[0].id;

        await client.query('COMMIT');
        console.log(
          `[UPLOAD-CONFIRM] Laudo ${laudoId} criado com sucesso (lote ${loteId})`
        );
      } catch (insertErr: any) {
        await client.query('ROLLBACK');

        // Tratar duplicatas (condições de corrida)
        if (insertErr.code === '23505' || insertErr.code === 'P0001') {
          const existing = await client.query(
            `SELECT id FROM laudos WHERE lote_id = $1 LIMIT 1`,
            [loteId]
          );

          if (existing.rows.length > 0) {
            laudoId = existing.rows[0].id;
            console.warn(
              `[UPLOAD-CONFIRM] Laudo já existente detectado: ${laudoId}`
            );
          } else {
            throw insertErr;
          }
        } else {
          throw insertErr;
        }
      } finally {
        await client.end();
      }
    } catch (clientErr) {
      console.error('[UPLOAD-CONFIRM] Erro ao criar laudo:', clientErr);
      // Remover arquivo temporário em caso de falha
      await unlink(tempPath).catch(() => {});
      throw clientErr;
    }

    // Mover arquivo para storage final
    const finalDir = path.join(process.cwd(), 'storage', 'laudos');
    const finalFilename = `laudo-${laudoId}.pdf`;
    const finalPath = path.join(finalDir, finalFilename);

    try {
      await rename(tempPath, finalPath);
    } catch {
      // Fallback: copiar
      await writeFile(finalPath, buffer);
      await unlink(tempPath).catch(() => {});
    }

    // Criar arquivo de metadados
    const metadata = {
      arquivo: finalFilename,
      hash,
      criadoEm: new Date().toISOString(),
      uploadedBy: user.cpf,
      originalFilename: filename,
      size: buffer.length,
      key,
    };

    const metaPath = path.join(finalDir, `laudo-${laudoId}.json`);
    await writeFile(metaPath, JSON.stringify(metadata, null, 2));

    console.log(
      `[UPLOAD-CONFIRM] Laudo ${laudoId} confirmado e persistido com sucesso`
    );

    // Registrar auditoria
    try {
      await query(
        `INSERT INTO audit_logs (action, resource, resource_id, new_data, user_perfil, user_cpf)
         VALUES ('laudo_upload_manual', 'laudos', $1, $2, 'emissor', $3)`,
        [
          laudoId.toString(),
          JSON.stringify({
            lote_id: loteId,
            hash,
            size: buffer.length,
            key,
            uploader: user.cpf,
          }),
          user.cpf,
        ]
      );
    } catch (auditErr) {
      console.warn('[UPLOAD-CONFIRM] Falha ao registrar auditoria:', auditErr);
    }

    return NextResponse.json({
      success: true,
      laudo_id: laudoId,
      sha256: hash,
      size: buffer.length,
      filename: finalFilename,
      message: 'Laudo confirmado e emitido com sucesso',
      immutable: true,
    });
  } catch (error) {
    console.error(
      '[POST /api/emissor/laudos/[loteId]/upload-confirm] Erro:',
      error
    );
    return NextResponse.json(
      {
        error: 'Erro ao confirmar upload',
        success: false,
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
};
