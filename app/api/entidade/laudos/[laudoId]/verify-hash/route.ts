import { requireEntity } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { lerLaudo, calcularHash } from '@/lib/storage/laudo-storage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/laudos/[laudoId]/verify-hash
 * Recalcula o hash do arquivo PDF e compara com o hash armazenado
 * para verificar a integridade do laudo
 */
export const GET = async (
  req: Request,
  { params }: { params: { laudoId: string } }
) => {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    const laudoId = parseInt(params.laudoId);
    if (isNaN(laudoId)) {
      return NextResponse.json(
        { error: 'ID do laudo inválido', success: false },
        { status: 400 }
      );
    }

    // Buscar laudo e verificar se pertence à entidade
    const laudoQuery = await query(
      `
      SELECT
        l.id,
        l.lote_id,
        l.hash_pdf,
        l.status,
        l.emitido_em,
        la.entidade_id,
        la.clinica_id
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.id = $1 
        AND l.status IN ('enviado', 'emitido')
        AND la.entidade_id = $2
    `,
      [laudoId, entidadeId]
    );

    if (laudoQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Laudo não encontrado ou acesso negado', success: false },
        { status: 404 }
      );
    }

    const laudo = laudoQuery.rows[0];
    const hashArmazenado = laudo.hash_pdf;

    if (!hashArmazenado) {
      return NextResponse.json(
        {
          error:
            'Hash do laudo não disponível (laudo pode estar em processamento)',
          success: false,
        },
        { status: 404 }
      );
    }

    // Ler o arquivo PDF do storage
    console.log(`[VERIFY] Lendo arquivo PDF do laudo ${laudo.id}...`);
    let pdfBuffer: Buffer;

    try {
      pdfBuffer = await lerLaudo(laudo.id);
    } catch (error: any) {
      console.error(
        `[VERIFY] Erro ao ler arquivo PDF do laudo ${laudo.id}:`,
        error
      );
      return NextResponse.json(
        {
          error: 'Arquivo do laudo não encontrado no armazenamento',
          success: false,
        },
        { status: 404 }
      );
    }

    // Recalcular hash do arquivo
    const hashCalculado = calcularHash(pdfBuffer);
    console.log(`[VERIFY] Hash armazenado: ${hashArmazenado}`);
    console.log(`[VERIFY] Hash calculado:  ${hashCalculado}`);

    // Comparar hashes (case-insensitive)
    const hashValido =
      hashArmazenado.toLowerCase() === hashCalculado.toLowerCase();

    if (!hashValido) {
      console.error(`[VERIFY] ⚠️ HASH INVÁLIDO para laudo ${laudo.id}!`);
      console.error(`[VERIFY]   Esperado: ${hashArmazenado}`);
      console.error(`[VERIFY]   Calculado: ${hashCalculado}`);
    } else {
      console.log(`[VERIFY] ✅ Hash válido para laudo ${laudo.id}`);
    }

    return NextResponse.json({
      success: true,
      hash_valido: hashValido,
      hash_armazenado: hashArmazenado,
      hash_calculado: hashCalculado,
      laudo_id: laudo.id,
      lote_id: laudo.lote_id,
      emitido_em: laudo.emitido_em,
      status: laudo.status,
    });
  } catch (error: any) {
    console.error('[VERIFY] Erro ao verificar hash do laudo:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erro interno do servidor',
        success: false,
      },
      { status: 500 }
    );
  }
};
