export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';

/**
 * GET /api/entidade/notificacoes
 * Retorna notificações da entidade (lotes concluídos, laudos enviados, etc)
 */
export async function GET() {
  try {
    const session = await requireEntity();
    const contratanteId = session.contratante_id;

    // Buscar notificações de lotes concluídos (últimos 7 dias)
    const lotesConcluidos = await query(
      `
      SELECT
        'lote_concluido' as tipo,
        la.id as lote_id,
        la.codigo,
        la.titulo,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'concluida') as avaliacoes_concluidas,
        COUNT(DISTINCT a.id) as total_avaliacoes,
        MAX(a.envio) as data_conclusao
      FROM lotes_avaliacao la
      JOIN avaliacoes a ON a.lote_id = la.id
      JOIN funcionarios f ON f.cpf = a.funcionario_cpf
      WHERE f.contratante_id = $1
        AND la.status = 'ativo'
        AND a.envio >= NOW() - INTERVAL '7 days'
      GROUP BY la.id, la.codigo, la.titulo
      HAVING COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'concluida') = COUNT(DISTINCT a.id)
      ORDER BY MAX(a.envio) DESC
      LIMIT 10
    `,
      [contratanteId]
    );

    // Buscar notificações de laudos enviados (últimos 7 dias)
    const laudosEnviados = await query(
      `
      SELECT
        'laudo_enviado' as tipo,
        l.id as laudo_id,
        l.lote_id,
        la.codigo,
        la.titulo,
        l.enviado_em as data_evento,
        e.nome as emissor_nome
      FROM laudos l
      JOIN lotes_avaliacao la ON la.id = l.lote_id
      JOIN funcionarios f ON (f.empresa_id = la.empresa_id OR f.contratante_id = $1)
      LEFT JOIN funcionarios e ON e.cpf = l.emissor_cpf
      WHERE f.contratante_id = $1
        AND l.enviado_em >= NOW() - INTERVAL '7 days'
      GROUP BY l.id, la.codigo, la.titulo, l.enviado_em, e.nome
      ORDER BY l.enviado_em DESC
      LIMIT 10
    `,
      [contratanteId]
    );

    // Combinar notificações e ordenar por data
    const notificacoes = [
      ...lotesConcluidos.rows.map((n) => ({
        ...n,
        mensagem: `Lote ${n.codigo} concluído com ${n.avaliacoes_concluidas} avaliações`,
        data_evento: n.data_conclusao,
      })),
      ...laudosEnviados.rows.map((n) => ({
        ...n,
        mensagem: `Laudo ${n.codigo} enviado por ${n.emissor_nome || 'emissor'}`,
      })),
    ].sort(
      (a, b) =>
        new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime()
    );

    // Contar não lidas (últimas 24h)
    const totalNaoLidas = notificacoes.filter((n) => {
      const dataEvento = new Date(n.data_evento);
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
