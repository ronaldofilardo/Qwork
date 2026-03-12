/**
 * GET /api/representante/comissoes/[id]/comprovante
 * Representante visualiza ou baixa o comprovante de pagamento da comissão.
 *
 * Query params:
 *   ?download=1 → Content-Disposition: attachment (força download)
 *   (default)   → Content-Disposition: inline (visualizar no browser)
 *
 * Comportamento de storage:
 *   PROD → path remoto (URL Backblaze) → redirect 302
 *   DEV  → path local (storage/...)    → streaming com Content-Type correto
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sess = requireRepresentante();
    const comissaoId = parseInt(params.id, 10);
    if (isNaN(comissaoId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    // Buscar comissão verificando que pertence ao representante logado
    const result = await query(
      `SELECT comprovante_pagamento_path
       FROM comissoes_laudo
       WHERE id = $1 AND representante_id = $2 LIMIT 1`,
      [comissaoId, sess.representante_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comissão não encontrada.' },
        { status: 404 }
      );
    }

    const { comprovante_pagamento_path } = result.rows[0] as {
      comprovante_pagamento_path: string | null;
    };

    if (!comprovante_pagamento_path) {
      return NextResponse.json(
        { error: 'Nenhum comprovante disponível para esta comissão.' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === '1';

    // PROD: URL remota (Backblaze) → redirecionar
    if (comprovante_pagamento_path.startsWith('http')) {
      const filename =
        comprovante_pagamento_path.split('/').pop() ?? 'comprovante';
      const redirectUrl = new URL(comprovante_pagamento_path);
      if (isDownload) {
        redirectUrl.searchParams.set(
          'response-content-disposition',
          `attachment; filename="${filename}"`
        );
      }
      return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
    }

    // DEV: path local → streaming
    const fs = await import('fs/promises');
    const path = await import('path');

    const fullPath = path.join(process.cwd(), comprovante_pagamento_path);

    try {
      const fileBuffer = await fs.readFile(fullPath);
      const ext = path.extname(comprovante_pagamento_path).toLowerCase();

      const contentTypeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
      };
      const contentType = contentTypeMap[ext] ?? 'application/octet-stream';

      const filename = path.basename(comprovante_pagamento_path);
      const disposition = isDownload
        ? `attachment; filename="${filename}"`
        : `inline; filename="${filename}"`;

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': disposition,
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
    console.error('[GET /api/representante/comissoes/[id]/comprovante]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
