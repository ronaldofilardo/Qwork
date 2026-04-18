/**
 * GET /api/representante/equipe/vendedores/[id]/documentos/visualizar?tipo=cad|nf
 *
 * Serve o documento do vendedor vinculado ao representante autenticado.
 * Valida propriedade via hierarquia_comercial antes de servir o arquivo.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import type { Session } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();

    const vendedorId = parseInt(params.id, 10);
    if (isNaN(vendedorId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const tipo = request.nextUrl.searchParams.get('tipo');
    if (!tipo || !['cad', 'nf'].includes(tipo))
      return NextResponse.json(
        { error: 'Tipo inválido (cad ou nf)' },
        { status: 400 }
      );

    const rlsSess: Session = {
      cpf: sess.cpf ?? '',
      nome: sess.nome,
      perfil: 'representante',
      representante_id: sess.representante_id,
    };

    const coluna = tipo === 'cad' ? 'vp.doc_cad_path' : 'vp.doc_nf_path';
    const result = await query(
      `SELECT ${coluna} AS doc_path
       FROM hierarquia_comercial hc
       JOIN vendedores_perfil vp ON vp.usuario_id = hc.vendedor_id
       WHERE hc.vendedor_id = $1 AND hc.representante_id = $2 AND hc.ativo = true
       LIMIT 1`,
      [vendedorId, sess.representante_id],
      rlsSess
    );

    if (result.rows.length === 0)
      return NextResponse.json(
        { error: 'Vendedor não encontrado na sua equipe' },
        { status: 404 }
      );

    const rawDocPath = result.rows[0].doc_path as string | null;
    if (!rawDocPath)
      return NextResponse.json(
        { error: 'Documento não enviado' },
        { status: 404 }
      );

    // doc_cad_path pode conter múltiplos arquivos separados por ';' (PJ: CNPJ + CPF resp)
    // Usa o primeiro caminho disponível
    const firstPath = rawDocPath.split(';')[0].trim();

    // Remove prefixo 'storage/' se presente: uploadLocalVendedor salva com esse prefixo,
    // mas baseDir já aponta para {cwd}/storage — evita caminho duplicado storage/storage/…
    const normalizedPath = firstPath.startsWith('storage/')
      ? firstPath.slice('storage/'.length)
      : firstPath;
    const docPath = firstPath; // mantém original apenas para Content-Disposition

    // Servir arquivo local
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
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message?.includes('ENOENT'))
      return NextResponse.json(
        { error: 'Arquivo não encontrado no storage' },
        { status: 404 }
      );
    const r = repAuthErrorResponse(e);
    return NextResponse.json(r.body, { status: r.status });
  }
}
