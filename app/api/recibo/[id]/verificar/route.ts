import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * API GET /api/recibo/[id]/verificar
 *
 * Verifica integridade do PDF do recibo comparando hash armazenado com recalculado
 *
 * Retorna:
 * - Status de integridade (íntegro/comprometido)
 * - Hash armazenado e hash calculado
 * - Metadados do recibo
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reciboId = parseInt(params.id);

    if (isNaN(reciboId)) {
      return NextResponse.json(
        { error: 'ID de recibo inválido' },
        { status: 400 }
      );
    }

    // Usar função PostgreSQL para verificar integridade
    const result = await query(
      `SELECT * FROM verificar_integridade_recibo($1)`,
      [reciboId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recibo não encontrado' },
        { status: 404 }
      );
    }

    const verificacao = result.rows[0];

    // Buscar metadados adicionais
    const metadados = await query(
      `SELECT 
        numero_recibo,
        contratante_id,
        criado_em,
        emitido_por,
        backup_path,
        octet_length(pdf) as tamanho_pdf
       FROM recibos
       WHERE id = $1`,
      [reciboId]
    );

    const recibo = metadados.rows[0];

    return NextResponse.json({
      integro: verificacao.integro,
      hash_armazenado: verificacao.hash_armazenado,
      hash_calculado: verificacao.hash_calculado,
      recibo: {
        id: reciboId,
        numero: recibo.numero_recibo,
        emitido_em: recibo.criado_em,
        emitido_por: recibo.emitido_por || 'SISTEMA',
        tamanho_pdf_kb: recibo.tamanho_pdf
          ? Math.round(recibo.tamanho_pdf / 1024)
          : 0,
        backup_path: recibo.backup_path,
      },
      verificado_em: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao verificar integridade do recibo:', error);
    return NextResponse.json(
      {
        error: 'Erro ao verificar integridade',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
