/**
 * POST /api/representante/ciclos/[ciclo_id]/nf
 *
 * Representante envia NF/RPA consolidada para um ciclo de comissão (fechado).
 * Aceita PDF, PNG, JPG, JPEG, WEBP — máx 2MB.
 * Armazena o arquivo e muda o status do ciclo: fechado → nf_enviada.
 *
 * GET /api/representante/ciclos/[ciclo_id]/nf
 *
 * Representante faz download da NF enviada para o ciclo.
 *
 * Acesso: representante autenticado (apenas o dono do ciclo)
 */
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import { query } from '@/lib/db';
import { registrarNfCiclo } from '@/lib/db/comissionamento/ciclos';
import { uploadDocumentoRepresentante } from '@/lib/storage/representante-storage';
import { COMISSIONAMENTO_CONSTANTS } from '@/lib/types/comissionamento';

export const dynamic = 'force-dynamic';

/**
 * POST — representante envia NF consolidada do ciclo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { ciclo_id: string } }
): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();
    const cicloId = parseInt(params.ciclo_id, 10);
    if (isNaN(cicloId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get('nf') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado. Use o campo "nf".' },
        { status: 400 }
      );
    }

    if (file.size > COMISSIONAMENTO_CONSTANTS.NF_MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Arquivo excede o limite de ${COMISSIONAMENTO_CONSTANTS.NF_MAX_SIZE_BYTES / (1024 * 1024)}MB.`,
        },
        { status: 400 }
      );
    }

    if (!COMISSIONAMENTO_CONSTANTS.NF_TIPOS_ACEITOS.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Tipo de arquivo não aceito: ${file.type}. Tipos permitidos: PDF, PNG, JPG, JPEG, WEBP.`,
        },
        { status: 400 }
      );
    }

    // Buscar dados do representante para o path de storage
    const repResult = await query(
      `SELECT tipo_pessoa, cpf, cnpj FROM representantes WHERE id = $1 LIMIT 1`,
      [sess.representante_id]
    );
    if (repResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado.' },
        { status: 404 }
      );
    }
    const repRow = repResult.rows[0] as {
      tipo_pessoa: 'pf' | 'pj';
      cpf: string | null;
      cnpj: string | null;
    };

    const identificador =
      repRow.tipo_pessoa === 'pj'
        ? (repRow.cnpj ?? String(sess.representante_id))
        : (repRow.cpf ?? sess.cpf ?? String(sess.representante_id));

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name || `nf_ciclo_${cicloId}`;

    const uploadResult = await uploadDocumentoRepresentante(
      buffer,
      'rpa',
      identificador,
      file.type,
      repRow.tipo_pessoa,
      'RPA'
    );
    const nfPath = uploadResult.path;

    // Registrar NF no ciclo (fechado → nf_enviada)
    const { ciclo, erro } = await registrarNfCiclo(
      cicloId,
      sess.representante_id,
      nfPath,
      originalName
    );

    if (erro) {
      // Limpar arquivo local em caso de erro de negócio (DEV apenas)
      const isLocalPath = !nfPath.startsWith('http');
      if (isLocalPath) {
        try {
          const { unlink } = await import('fs/promises');
          await unlink(path.join(process.cwd(), nfPath));
        } catch {
          // ignorar erro de limpeza
        }
      }
      return NextResponse.json({ error: erro }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      ciclo,
      nf_path: nfPath,
      nf_nome_arquivo: originalName,
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[POST /api/representante/ciclos/[ciclo_id]/nf]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * GET — representante faz download da NF enviada para o ciclo
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { ciclo_id: string } }
): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();
    const cicloId = parseInt(params.ciclo_id, 10);
    if (isNaN(cicloId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const result = await query(
      `SELECT nf_path, nf_nome_arquivo FROM ciclos_comissao
       WHERE id = $1 AND representante_id = $2 LIMIT 1`,
      [cicloId, sess.representante_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ciclo não encontrado ou sem permissão.' },
        { status: 404 }
      );
    }

    const { nf_path, nf_nome_arquivo } = result.rows[0] as {
      nf_path: string | null;
      nf_nome_arquivo: string | null;
    };

    if (!nf_path) {
      return NextResponse.json(
        { error: 'Nenhuma NF enviada para este ciclo.' },
        { status: 404 }
      );
    }

    // Arquivo local (DEV)
    const isLocal = !nf_path.startsWith('http');
    if (isLocal) {
      const { readFile } = await import('fs/promises');
      const fullPath = path.join(process.cwd(), nf_path);
      const fileBuffer = await readFile(fullPath);
      const ext = path.extname(nf_nome_arquivo || nf_path).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
      };
      const contentType = mimeMap[ext] ?? 'application/octet-stream';
      const displayName = nf_nome_arquivo ?? path.basename(nf_path);

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${displayName}"`,
          'Content-Length': String(fileBuffer.length),
        },
      });
    }

    // Arquivo remoto (PROD — redirecionar)
    return NextResponse.redirect(nf_path);
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[GET /api/representante/ciclos/[ciclo_id]/nf]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
