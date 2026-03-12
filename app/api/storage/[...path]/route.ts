import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/storage/[...path]
 *
 * Serve arquivos do diretório storage/ para fins de download/visualização
 * Ex: /api/storage/tomadores/entidades/51790945000195/cartao_cnpj_1772823362843.pdf
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    if (!params.path || params.path.length === 0) {
      return NextResponse.json(
        { error: 'Caminho não especificado' },
        { status: 400 }
      );
    }

    // Reconstruir o caminho do arquivo
    const filePath = params.path.join('/');

    // Validar que o caminho começa com padrões esperados
    if (
      !filePath.startsWith('tomadores/') &&
      !filePath.startsWith('uploads/') &&
      !filePath.startsWith('representantes/')
    ) {
      return NextResponse.json(
        { error: 'Acesso não permitido' },
        { status: 403 }
      );
    }

    // Resolver o caminho completo de forma segura (prevenir directory traversal)
    const baseDir = resolve(process.cwd(), 'storage');
    const fullPath = resolve(baseDir, filePath);

    // Garantir que o arquivo está dentro do diretório storage/
    if (!fullPath.startsWith(baseDir)) {
      return NextResponse.json(
        { error: 'Acesso não permitido' },
        { status: 403 }
      );
    }

    // Ler o arquivo
    const fileBuffer = await readFile(fullPath);

    // Determinar o tipo MIME baseado na extensão
    const ext = filePath.toLowerCase().split('.').pop();
    let mimeType = 'application/octet-stream';
    if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'gif') mimeType = 'image/gif';

    // Retornar o arquivo com headers apropriados
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
      },
    });
  } catch (error) {
    console.error('[STORAGE] Erro ao servir arquivo:', error);

    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return NextResponse.json(
          { error: 'Arquivo não encontrado' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erro ao servir arquivo' },
      { status: 500 }
    );
  }
}
