import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async (_req: Request) => {
  const user = await requireRole('emissor');
  if (!user) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    // Buscar lotes prontos que ainda não têm laudo ou estão em rascunho
    const notificacoesQuery = await query(
      `
      SELECT
        la.id,
        la.codigo,
        la.titulo,
        la.liberado_em,
        ec.nome as empresa_nome,
        c.nome as clinica_nome,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        l.status as status_laudo,
        l.id as laudo_id,
        CASE
          WHEN l.id IS NULL THEN 'novo_lote'
          ELSE 'processado'
        END as tipo_notificacao
      FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      JOIN clinicas c ON ec.clinica_id = c.id
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      LEFT JOIN laudos l ON la.id = l.id AND l.emissor_cpf = $1
      WHERE la.status IN ('ativo', 'finalizado')
      GROUP BY la.id, la.codigo, la.titulo, la.liberado_em, ec.nome, c.nome, l.status, l.id
      HAVING
        COUNT(a.id) > 0
        AND COUNT(a.id) = COUNT(CASE WHEN a.status = 'concluida' THEN 1 END)
        AND (l.id IS NULL)
      ORDER BY la.liberado_em DESC
    `,
      [user.cpf]
    );

    const notificacoes = notificacoesQuery.rows.map((notif) => ({
      id: notif.id,
      codigo: notif.codigo,
      titulo: notif.titulo,
      empresa_nome: notif.empresa_nome,
      clinica_nome: notif.clinica_nome,
      liberado_em: notif.liberado_em,
      total_avaliacoes: parseInt(notif.total_avaliacoes),
      tipo: notif.tipo_notificacao,
      mensagem:
        notif.tipo_notificacao === 'novo_lote'
          ? `Novo lote "${notif.titulo}" pronto para emissão de laudo`
          : `Laudo em rascunho aguardando finalização: "${notif.titulo}"`,
    }));

    // Contar total de notificações não lidas
    const totalNaoLidas = notificacoes.length;

    return NextResponse.json({
      success: true,
      notificacoes,
      totalNaoLidas,
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
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
