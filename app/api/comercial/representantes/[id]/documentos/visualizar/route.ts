/**
 * GET /api/comercial/representantes/[id]/documentos/visualizar
 *
 * Serve documentos de representantes e seus vendedores.
 * Acesso: comercial, suporte, admin.
 *
 * Query params:
 *   - tipo: 'identificacao' (doc do representante)
 *           | 'vendedor_cad' | 'vendedor_nf_rpa' (docs de vendedores)
 *   - vendedor_id: (obrigatório quando tipo começa com 'vendedor_')
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'suporte', 'admin'], false);

    const repId = parseInt(params.id, 10);
    if (isNaN(repId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    // Ownership check: comercial só acessa representantes atribuídos a ele
    if (session.perfil === 'comercial') {
      const owned = await query<{ id: number }>(
        `SELECT 1 AS id FROM representantes WHERE id = $1 AND gestor_comercial_cpf = $2 LIMIT 1`,
        [repId, session.cpf]
      );
      if (owned.rows.length === 0) {
        return NextResponse.json(
          { error: 'Representante não encontrado' },
          { status: 404 }
        );
      }
    }

    const tipo = request.nextUrl.searchParams.get('tipo');
    if (
      !tipo ||
      !['identificacao', 'vendedor_cad', 'vendedor_nf_rpa'].includes(tipo)
    )
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });

    let docPath: string | null = null;

    if (tipo === 'identificacao') {
      const result = await query(
        `SELECT doc_identificacao_path FROM representantes_perfil WHERE representante_id = $1 LIMIT 1`,
        [repId]
      );
      if (result.rows.length === 0)
        return NextResponse.json(
          { error: 'Representante não encontrado' },
          { status: 404 }
        );
      docPath = result.rows[0].doc_identificacao_path;
    } else {
      const vendedorIdStr = request.nextUrl.searchParams.get('vendedor_id');
      const vendedorId = vendedorIdStr ? parseInt(vendedorIdStr, 10) : NaN;
      if (isNaN(vendedorId))
        return NextResponse.json(
          { error: 'vendedor_id obrigatório' },
          { status: 400 }
        );

      // Verifica que vendedor está vinculado ao representante
      const coluna =
        tipo === 'vendedor_cad' ? 'vp.doc_cad_path' : 'vp.doc_nf_rpa_path';
      const result = await query(
        `SELECT ${coluna} AS doc_path
         FROM hierarquia_comercial hc
         JOIN vendedores_perfil vp ON vp.usuario_id = hc.vendedor_id
         WHERE hc.vendedor_id = $1 AND hc.representante_id = $2
         LIMIT 1`,
        [vendedorId, repId]
      );
      if (result.rows.length === 0)
        return NextResponse.json(
          { error: 'Vendedor não encontrado para esse representante' },
          { status: 404 }
        );
      docPath = result.rows[0].doc_path;
    }

    if (!docPath)
      return NextResponse.json(
        { error: 'Documento não enviado' },
        { status: 404 }
      );

    // doc_path pode conter múltiplos arquivos separados por ';' (PJ: CNPJ + CPF resp)
    const firstPath = docPath.split(';')[0].trim();

    // Remove prefixo 'storage/' se presente: uploadLocal salva com esse prefixo,
    // mas baseDir já aponta para {cwd}/storage — evita caminho duplicado storage/storage/…
    const normalizedPath = firstPath.startsWith('storage/')
      ? firstPath.slice('storage/'.length)
      : firstPath;
    docPath = firstPath; // atualiza para Content-Disposition

    const baseDir = resolve(process.cwd(), 'storage');
    const fullPath = resolve(baseDir, normalizedPath);

    if (!fullPath.startsWith(baseDir))
      return NextResponse.json(
        { error: 'Acesso não permitido' },
        { status: 403 }
      );

    const fileBuffer = await readFile(fullPath);
    const ext = normalizedPath.toLowerCase().split('.').pop();
    let mimeType = 'application/octet-stream';
    if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'png') mimeType = 'image/png';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, max-age=0',
        'Content-Disposition': `inline; filename="${docPath.split('/').pop()}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message?.includes('ENOENT'))
      return NextResponse.json(
        { error: 'Arquivo não encontrado no storage' },
        { status: 404 }
      );
    console.error('[DOC-VIEWER] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
