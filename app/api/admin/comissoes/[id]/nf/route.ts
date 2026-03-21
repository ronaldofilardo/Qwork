/**
 * PATCH /api/admin/comissoes/[id]/nf
 * Admin aprova ou rejeita NF/RPA de uma comissão.
 *
 * GET /api/admin/comissoes/[id]/nf
 * Admin faz download da NF/RPA enviada pelo representante.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { processarNfAdmin } from '@/lib/db/comissionamento';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PATCH — admin aprova ou rejeita NF
 * Body: { acao: 'aprovar' | 'rejeitar', motivo?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole('suporte', false);
    const comissaoId = parseInt(params.id, 10);
    if (isNaN(comissaoId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const body = await request.json();
    const { acao, motivo } = body;

    if (!acao || !['aprovar', 'rejeitar'].includes(acao)) {
      return NextResponse.json(
        { error: "Ação inválida. Use 'aprovar' ou 'rejeitar'." },
        { status: 400 }
      );
    }

    const result = await processarNfAdmin(
      comissaoId,
      acao as 'aprovar' | 'rejeitar',
      motivo,
      session.cpf
    );

    if (result.erro) {
      return NextResponse.json({ error: result.erro }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      comissao: result.comissao,
      acao,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[PATCH /api/admin/comissoes/[id]/nf]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * GET — admin faz download da NF/RPA
 * Retorna o arquivo armazenado em /storage/NF/{codigo_rep}/
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('suporte', false);
    const comissaoId = parseInt(params.id, 10);
    if (isNaN(comissaoId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    // Buscar comissão com dados do arquivo NF
    const result = await query(
      `SELECT c.nf_path, c.nf_nome_arquivo, r.codigo AS representante_codigo
       FROM comissoes_laudo c
       JOIN representantes r ON r.id = c.representante_id
       WHERE c.id = $1 LIMIT 1`,
      [comissaoId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comissão não encontrada' },
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

    // Ler arquivo do filesystem
    const fs = await import('fs/promises');
    const path = await import('path');

    const fullPath = path.join(process.cwd(), nf_path);

    try {
      const fileBuffer = await fs.readFile(fullPath);
      const ext = path.extname(nf_nome_arquivo || nf_path).toLowerCase();

      // Determinar content-type
      const contentTypeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
      };
      const contentType = contentTypeMap[ext] || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${nf_nome_arquivo || 'nf_rpa' + ext}"`,
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
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[GET /api/admin/comissoes/[id]/nf]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
