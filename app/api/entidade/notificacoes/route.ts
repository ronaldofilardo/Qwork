export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { requireEntity } from '@/lib/session';

/**
 * GET /api/entidade/notificacoes
 * Retorna notificações da entidade (lotes concluídos, laudos enviados, etc)
 */
export async function GET() {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    // Buscar notificações de lotes concluídos (últimos 7 dias)
    const lotesConcluidos = await queryAsGestorEntidade(
      `
      SELECT
        'lote_concluido' as tipo,
        la.id as lote_id,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'concluida' OR a.status = 'concluido') as avaliacoes_concluidas,
        COUNT(DISTINCT a.id) as total_avaliacoes,
        MAX(a.envio) as data_conclusao
      FROM lotes_avaliacao la
      JOIN avaliacoes a ON a.lote_id = la.id
      WHERE COALESCE(la.entidade_id, la.contratante_id) = $1
        AND la.status = 'ativo'
        AND a.envio >= NOW() - INTERVAL '7 days'
      GROUP BY la.id
      HAVING COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'concluida' OR a.status = 'concluido') = COUNT(DISTINCT a.id)
      ORDER BY MAX(a.envio) DESC
      LIMIT 10
    `,
      [entidadeId]
    );

    // Buscar notificações de laudos enviados (últimos 7 dias)
    const laudosEnviados = await queryAsGestorEntidade(
      `
      SELECT
        'laudo_enviado' as tipo,
        l.id as laudo_id,
        l.lote_id,
        l.enviado_em as data_evento,
        e.nome as emissor_nome
      FROM laudos l
      JOIN lotes_avaliacao la ON la.id = l.lote_id
      LEFT JOIN usuarios e ON e.cpf = l.emissor_cpf
      WHERE COALESCE(la.entidade_id, la.contratante_id) = $1
        AND l.enviado_em >= NOW() - INTERVAL '7 days'
      GROUP BY l.id, l.enviado_em, e.nome
      ORDER BY l.enviado_em DESC
      LIMIT 10
    `,
      [entidadeId]
    );

    // Combinar notificações e ordenar por data
    const notificacoes = [
      ...lotesConcluidos.rows.map((n) => ({
        ...n,
        mensagem: `Lote ID: ${String(n.lote_id)} concluído com ${String(n.avaliacoes_concluidas)} avaliações`,
        data_evento: n.data_conclusao,
      })),
      ...laudosEnviados.rows.map((n) => ({
        ...n,
        mensagem: `Laudo ID: ${String(n.laudo_id)} enviado por ${String(n.emissor_nome) || 'emissor'}`,
        data_evento: n.data_evento,
      })),
    ].sort(
      (a, b) =>
        new Date(String(b.data_evento)).getTime() -
        new Date(String(a.data_evento)).getTime()
    );

    // Contar não lidas (últimas 24h)
    const totalNaoLidas = notificacoes.filter((n) => {
      const dataEvento = new Date(String(n.data_evento));
      const horasAtras = (Date.now() - dataEvento.getTime()) / (1000 * 60 * 60);
      return horasAtras < 24;
    }).length;

    return NextResponse.json({
      success: true,
      notificacoes: notificacoes.slice(0, 20), // Limitar a 20 mais recentes
      totalNaoLidas,
    });
  } catch (error) {
    console.error('Erro ao buscar notificações da entidade:', error);

    if (error instanceof Error && error.message.includes('Acesso restrito')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    );
  }
}
