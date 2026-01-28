/**
 * API para retornar HTML de laudos (para geração client-side de PDFs)
 * Solução temporária para Vercel Free Tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireEmissor } from '@/lib/auth-require';
import { query } from '@/lib/db';
import { gerarHTMLLaudoCompleto } from '@/lib/templates/laudo-html';

export async function GET(
  req: NextRequest,
  { params }: { params: { loteId: string } }
) {
  try {
    // Verificar autenticação
    const session = requireEmissor();
    const { loteId } = params;

    // Verificar se o lote existe e pertence ao emissor
    const loteResult = await query(
      `SELECT id, codigo, titulo, status, clinica_id
       FROM lotes_avaliacao
       WHERE id = $1`,
      [loteId]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    // Verificar se já existe laudo emitido
    const laudoResult = await query(
      `SELECT id, hash_pdf, status, emitido_em, emissor_cpf
       FROM laudos
       WHERE lote_id = $1`,
      [loteId]
    );

    if (laudoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Laudo ainda não foi emitido para este lote' },
        { status: 404 }
      );
    }

    const laudo = laudoResult.rows[0];

    // Buscar dados completos do laudo
    const dadosLaudoResult = await query(
      `SELECT dados_laudo
       FROM laudos
       WHERE id = $1`,
      [laudo.id]
    );

    if (!dadosLaudoResult.rows[0]?.dados_laudo) {
      return NextResponse.json(
        { error: 'Dados do laudo não encontrados' },
        { status: 404 }
      );
    }

    const dadosLaudo = dadosLaudoResult.rows[0].dados_laudo;

    // Gerar HTML do laudo
    const htmlContent = gerarHTMLLaudoCompleto({
      etapa1: dadosLaudo.etapa1,
      etapa2: dadosLaudo.etapa2,
      etapa3: dadosLaudo.etapa3,
      etapa4: dadosLaudo.etapa4,
      emitidoEm: laudo.emitido_em,
    });

    // Retornar HTML com headers apropriados
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Laudo-Id': String(laudo.id),
        'X-Lote-Id': String(loteId),
      },
    });
  } catch (error) {
    console.error('Erro ao gerar HTML do laudo:', error);
    return NextResponse.json(
      {
        error: 'Erro ao gerar HTML do laudo',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
