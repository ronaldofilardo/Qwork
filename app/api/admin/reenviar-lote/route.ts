import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
  const user = await requireRole(['rh', 'gestor_entidade']);
  if (!user) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    const { codigoLote } = await req.json();

    if (!codigoLote) {
      return NextResponse.json(
        {
          error: 'Código do lote é obrigatório',
          success: false,
        },
        { status: 400 }
      );
    }

    // Primeiro, verificar se o lote existe e seu status atual
    const loteCheck = await query(
      `
      SELECT
        la.id,
        la.codigo,
        la.status,
        la.titulo,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      WHERE la.codigo = $1
      GROUP BY la.id, la.codigo, la.status, la.titulo
    `,
      [codigoLote]
    );

    if (loteCheck.rows.length === 0) {
      return NextResponse.json(
        {
          error: `Lote ${codigoLote} não encontrado`,
          success: false,
        },
        { status: 404 }
      );
    }

    const lote = loteCheck.rows[0];

    // Verificar se o lote já está pronto para finalização
    const totalAvaliacoesAtivas =
      lote.total_avaliacoes - lote.avaliacoes_inativadas;
    const podeFinalizar =
      lote.total_avaliacoes > 0 &&
      lote.avaliacoes_concluidas === totalAvaliacoesAtivas;

    if (!podeFinalizar) {
      return NextResponse.json(
        {
          error: `Lote ${codigoLote} não pode ser finalizado. Avaliações concluídas: ${lote.avaliacoes_concluidas}/${totalAvaliacoesAtivas}`,
          success: false,
          dados: lote,
        },
        { status: 400 }
      );
    }

    // Marcar o lote como concluído
    await query(
      `
      UPDATE lotes_avaliacao
      SET status = 'concluido', finalizado_em = NOW(), atualizado_em = NOW()
      WHERE codigo = $1
    `,
      [codigoLote]
    );

    // Tentar emitir imediatamente após marcar como concluído
    let emitido = false;
    try {
      const { emitirLaudoImediato } = await import('@/lib/laudo-auto');
      emitido = await emitirLaudoImediato(lote.id);
    } catch (err) {
      console.error('Erro ao tentar emissão imediata após reenviar lote:', err);
    }

    return NextResponse.json({
      success: true,
      message: `Lote ${codigoLote} marcado como concluído e ${emitido ? 'emitido' : 'pronto para emissão (falha na emissão imediata)'}!`,
      lote: {
        id: lote.id,
        codigo: lote.codigo,
        titulo: lote.titulo,
        status_anterior: lote.status,
        status_novo: 'concluido',
        avaliacoes_concluidas: lote.avaliacoes_concluidas,
        total_avaliacoes_ativas: totalAvaliacoesAtivas,
        avaliacoes_inativadas: lote.avaliacoes_inativadas,
        emitido_imediato: emitido,
      },
    });
  } catch (error) {
    console.error('Erro ao reenviar lote:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        success: false,
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
};
