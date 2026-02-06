import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/parcelas/download-recibo
 * Baixa o arquivo do recibo
 */
export async function GET(request: Request) {
  try {
    const session = await requireEntity();

    const { searchParams } = new URL(request.url);
    const reciboId = searchParams.get('id');

    if (!reciboId) {
      return NextResponse.json(
        { error: 'ID do recibo é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar recibo e validar autorização
    const reciboQuery = `
      SELECT
        r.id,
        r.numero_recibo,
        r.conteudo_pdf_path,
        r.conteudo_texto,
        r.entidade_id
      FROM recibos r
      WHERE r.id = $1 AND r.ativo = true
      LIMIT 1
    `;

    const reciboResult = await queryAsGestorEntidade(reciboQuery, [reciboId]);

    if (reciboResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recibo não encontrado' },
        { status: 404 }
      );
    }

    const recibo = reciboResult.rows[0];

    // Validar autorização: recibo deve pertencer à entidade da sessão
    if (recibo.entidade_id !== session.contratante_id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Tentar ler arquivo do disco
    if (recibo.conteudo_pdf_path) {
      const filePath = join(process.cwd(), String(recibo.conteudo_pdf_path));

      if (existsSync(filePath)) {
        const fileBuffer = await readFile(filePath);

        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="${String(recibo.numero_recibo)}.txt"`,
          },
        });
      }
    }

    // Fallback: usar conteudo_texto do banco
    if (recibo.conteudo_texto) {
      return new NextResponse(String(recibo.conteudo_texto), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${String(recibo.numero_recibo)}.txt"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Conteúdo do recibo não encontrado' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Erro ao baixar recibo:', error);
    return NextResponse.json(
      { error: 'Erro ao baixar recibo' },
      { status: 500 }
    );
  }
}
