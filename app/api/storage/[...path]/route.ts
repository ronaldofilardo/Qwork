import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Perfis com acesso irrestrito ao storage (staff da plataforma) */
const PERFIS_FULL_ACCESS = new Set([
  'admin',
  'suporte',
  'emissor',
  'comercial',
  'vendedor',
]);

/**
 * Valida ownership do arquivo baseado no path e na sessão do usuário.
 * Retorna true se o acesso é permitido, false caso contrário.
 */
async function hasStorageAccess(
  filePath: string,
  session: NonNullable<ReturnType<typeof getSession>>
): Promise<boolean> {
  // Staff da plataforma tem acesso irrestrito
  if (PERFIS_FULL_ACCESS.has(session.perfil)) return true;

  // Representante: somente pasta representantes/{representante_id}/
  if (filePath.startsWith('representantes/')) {
    const segments = filePath.split('/');
    const idInPath = parseInt(segments[1] ?? '', 10);
    return (
      !isNaN(idInPath) &&
      session.representante_id != null &&
      idInPath === session.representante_id
    );
  }

  // Documentos de tomadores (clínicas/entidades)
  if (filePath.startsWith('tomadores/')) {
    // RH e gestor precisam de verificação de ownership via CNPJ no path
    if (session.perfil === 'rh' || session.perfil === 'gestor') {
      // Extrair CNPJ do path: tomadores/entidades/{cnpj}/...
      const segments = filePath.split('/');
      // Formato: tomadores/entidades/CNPJ/arquivo
      if (segments.length >= 3 && segments[1] === 'entidades') {
        const cnpjInPath = segments[2];
        if (!cnpjInPath) return false;
        const tomadorId =
          session.perfil === 'rh' ? session.clinica_id : session.entidade_id;
        if (!tomadorId) return false;
        const result = await query(
          `SELECT 1 FROM entidades WHERE id = $1 AND cnpj = $2 LIMIT 1`,
          [tomadorId, cnpjInPath]
        );
        return result.rows.length > 0;
      }
      // Path sem CNPJ explícito — negar por segurança
      return false;
    }
    // Outros perfis autenticados não têm acesso a arquivos de tomadores
    return false;
  }

  // uploads/: acesso negado por padrão para perfis não-staff
  return false;
}

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
    // Verificar autenticação
    const session = getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Autenticação requerida' },
        { status: 401 }
      );
    }

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

    // Verificar ownership: usuário só acessa seus próprios arquivos
    const allowed = await hasStorageAccess(filePath, session);
    if (!allowed) {
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

    // Retornar o arquivo com headers de cache privado (documentos médicos/financeiros)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
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
