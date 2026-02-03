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
    const { loteId } = await req.json();

    if (!loteId) {
      return NextResponse.json(
        {
          error: 'ID do lote é obrigatório',
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
        la.status,
        la.titulo,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      WHERE la.id = $1
      GROUP BY la.id, la.status, la.titulo
    `,
      [loteId]
    );

    if (loteCheck.rows.length === 0) {
      return NextResponse.json(
        {
          error: `Lote ${loteId} não encontrado`,
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
          error: `Lote ${loteId} não pode ser finalizado. Avaliações concluídas: ${lote.avaliacoes_concluidas}/${totalAvaliacoesAtivas}`,
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
      WHERE id = $1
    `,
      [loteId]
    );

    return NextResponse.json({
      success: true,
      message: `Lote ${loteId} marcado como concluído e pronto para emissão!`,
      lote: {
        id: lote.id,
        titulo: lote.titulo,
        status_anterior: lote.status,
        status_novo: 'concluido',
        avaliacoes_concluidas: lote.avaliacoes_concluidas,
        total_avaliacoes_ativas: totalAvaliacoesAtivas,
        avaliacoes_inativadas: lote.avaliacoes_inativadas,
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
