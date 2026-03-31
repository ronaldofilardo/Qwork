/**
 * POST /api/representante/comissoes/[id]/nf
 * Representante envia NF/RPA para uma comissão.
 * Aceita imagens (png, jpg, jpeg, webp) e PDF, max 2MB.
 * Armazena em /storage/NF/{codigo_representante}/
 *
 * GET /api/representante/comissoes/[id]/nf
 * Representante faz download da NF/RPA que enviou.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import { registrarNfRep, registrarAuditoria } from '@/lib/db/comissionamento';
import { COMISSIONAMENTO_CONSTANTS } from '@/lib/types/comissionamento';

export const dynamic = 'force-dynamic';

/**
 * POST — representante envia NF/RPA
 * Multipart form-data com campo "nf" (o arquivo)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sess = requireRepresentante();
    const comissaoId = parseInt(params.id, 10);
    if (isNaN(comissaoId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    // Ler form-data
    const formData = await request.formData();
    const file = formData.get('nf') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado. Use o campo "nf".' },
        { status: 400 }
      );
    }

    // Validar tamanho (max 2MB)
    if (file.size > COMISSIONAMENTO_CONSTANTS.NF_MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Arquivo excede o limite de ${COMISSIONAMENTO_CONSTANTS.NF_MAX_SIZE_BYTES / (1024 * 1024)}MB.`,
        },
        { status: 400 }
      );
    }

    // Validar tipo MIME
    if (
      !COMISSIONAMENTO_CONSTANTS.NF_TIPOS_ACEITOS.includes(file.type as string)
    ) {
      return NextResponse.json(
        {
          error: `Tipo de arquivo não aceito: ${file.type}. Tipos permitidos: PDF, PNG, JPG, JPEG, WEBP.`,
        },
        { status: 400 }
      );
    }

    // Validar extensão
    const originalName = file.name || 'nf_rpa';
    const ext = originalName.split('.').pop()?.toLowerCase() || '';
    if (
      ext &&
      !COMISSIONAMENTO_CONSTANTS.NF_EXTENSOES_ACEITAS.includes(`.${ext}`)
    ) {
      return NextResponse.json(
        {
          error: `Extensão .${ext} não aceita. Extensões permitidas: ${COMISSIONAMENTO_CONSTANTS.NF_EXTENSOES_ACEITAS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Converter para buffer e salvar via storage (DEV: local, PROD: Backblaze)
    const buffer = Buffer.from(await file.arrayBuffer());

    // Buscar tipo_pessoa, cpf e cnpj do representante para definir path correto
    const { query: dbQuery } = await import('@/lib/db');
    const repResult = await dbQuery(
      'SELECT tipo_pessoa, cpf, cnpj FROM representantes WHERE id = $1 LIMIT 1',
      [sess.representante_id]
    );
    const repRow = repResult.rows[0];
    const tipoPessoa: 'pf' | 'pj' = repRow?.tipo_pessoa ?? 'pf';
    const identificador: string =
      tipoPessoa === 'pj'
        ? (repRow?.cnpj ?? String(sess.representante_id))
        : (repRow?.cpf ?? sess.cpf ?? String(sess.representante_id));

    const { uploadDocumentoRepresentante } =
      await import('@/lib/storage/representante-storage');
    const uploadResult = await uploadDocumentoRepresentante(
      buffer,
      'rpa',
      identificador,
      file.type,
      tipoPessoa,
      'RPA'
    );
    const nfPath = uploadResult.path;

    console.log(
      `[NF UPLOAD] Comissão ${comissaoId} — rep ${sess.representante_id} — salvo em ${nfPath}`
    );

    // Registrar NF no DB e recalcular previsão de pagamento
    const statusAnterior = await (async () => {
      const { query: q } = await import('@/lib/db');
      const r = await q(
        'SELECT status FROM comissoes_laudo WHERE id = $1 AND representante_id = $2 LIMIT 1',
        [comissaoId, sess.representante_id]
      );
      return r.rows[0]?.status ?? null;
    })();

    const result = await registrarNfRep(
      comissaoId,
      sess.representante_id,
      nfPath,
      originalName,
      sess.cpf
    );

    if (result.erro) {
      // Remover arquivo local se falhou na validação do DB (DEV apenas)
      const isLocalPath = !nfPath.startsWith('http');
      if (isLocalPath) {
        try {
          const fsCleanup = await import('fs/promises');
          const pathCleanup = await import('path');
          await fsCleanup.unlink(pathCleanup.join(process.cwd(), nfPath));
        } catch {
          // ignorar erro de limpeza
        }
      }
      return NextResponse.json({ error: result.erro }, { status: 422 });
    }

    // Auditoria
    await registrarAuditoria({
      tabela: 'comissoes_laudo',
      registro_id: comissaoId,
      status_anterior: statusAnterior,
      status_novo: 'nf_em_analise',
      triggador: 'rep_action',
      motivo: `NF/RPA enviada: ${originalName}`,
    });

    return NextResponse.json({
      success: true,
      nf_path: nfPath,
      nf_nome_arquivo: originalName,
      previsao: result.previsao,
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[POST /api/representante/comissoes/[id]/nf]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * GET — representante faz download da NF/RPA que enviou
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sess = requireRepresentante();
    const comissaoId = parseInt(params.id, 10);
    if (isNaN(comissaoId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    // Importar query inline para não poluir import de nível superior
    const { query } = await import('@/lib/db');

    // Buscar comissão verificando que pertence ao rep
    const result = await query(
      `SELECT nf_path, nf_nome_arquivo FROM comissoes_laudo
       WHERE id = $1 AND representante_id = $2 LIMIT 1`,
      [comissaoId, sess.representante_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comissão não encontrada.' },
        { status: 404 }
      );
    }

    const { nf_path, nf_nome_arquivo } = result.rows[0];
    if (!nf_path) {
      return NextResponse.json(
        { error: 'Nenhuma NF/RPA enviada.' },
        { status: 404 }
      );
    }

    const fs = await import('fs/promises');
    const path = await import('path');

    const fullPath = path.join(process.cwd(), nf_path);

    try {
      const fileBuffer = await fs.readFile(fullPath);
      const fileExt = path.extname(nf_nome_arquivo || nf_path).toLowerCase();

      const contentTypeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
      };
      const contentType = contentTypeMap[fileExt] || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${nf_nome_arquivo || 'nf_rpa' + fileExt}"`,
          'Content-Length': String(fileBuffer.length),
        },
      });
    } catch {
      return NextResponse.json(
        { error: 'Arquivo não encontrado no servidor.' },
        { status: 404 }
      );
    }
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[GET /api/representante/comissoes/[id]/nf]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
