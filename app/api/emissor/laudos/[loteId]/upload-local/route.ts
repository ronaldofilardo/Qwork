import { requireRole } from '@/lib/session';
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/emissor/laudos/[loteId]/upload-local
 * Endpoint temporário para upload local (desenvolvimento)
 * Em produção, o upload será direto para Backblaze via presigned URL
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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const key = formData.get('key') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido', success: false },
        { status: 400 }
      );
    }

    if (!key) {
      return NextResponse.json(
        { error: 'Chave (key) não fornecida', success: false },
        { status: 400 }
      );
    }

    // Validar tamanho (1 MB máximo)
    if (file.size > 1048576) {
      return NextResponse.json(
        {
          error: 'Arquivo excede o tamanho máximo permitido (1 MB)',
          success: false,
          maxSizeBytes: 1048576,
          fileSize: file.size,
        },
        { status: 400 }
      );
    }

    // Validar tipo MIME
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        {
          error: 'Tipo de arquivo inválido. Apenas PDF é permitido',
          success: false,
          receivedType: file.type,
        },
        { status: 400 }
      );
    }

    // Criar diretório pending se não existir
    const pendingDir = path.join(process.cwd(), 'storage', 'laudos', 'pending');
    if (!existsSync(pendingDir)) {
      mkdirSync(pendingDir, { recursive: true });
    }

    // Ler arquivo e validar header PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verificar header %PDF-
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

    // Salvar temporariamente com a key fornecida
    const filename = key.replace(/\//g, '_'); // sanitizar key para usar como nome de arquivo
    const tempPath = path.join(pendingDir, filename);

    await writeFile(tempPath, buffer);

    console.log(
      `[UPLOAD-LOCAL] Arquivo recebido: ${filename} (${file.size} bytes) para lote ${loteId}`
    );

    return NextResponse.json({
      success: true,
      key,
      filename,
      size: file.size,
      contentType: file.type,
      tempPath: `/pending/${filename}`, // caminho relativo para confirmar
      message: 'Arquivo recebido com sucesso. Aguardando confirmação.',
    });
  } catch (error) {
    console.error(
      '[POST /api/emissor/laudos/[loteId]/upload-local] Erro:',
      error
    );
    return NextResponse.json(
      {
        error: 'Erro ao processar upload',
        success: false,
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
};
