import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async (_req: Request) => {
  const session = await Promise.resolve(getSession());
  if (!session || session.perfil !== 'rh') {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }
  const user = session;

  try {
    // Verificar existência da tabela `notificacoes` antes de incluir o bloco correspondente
    let notificacoesExists = false;
    try {
      const notColsRes = await query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'notificacoes' AND column_name IN ('destinatario_cpf','tipo','criado_em')`
      );
      notificacoesExists =
        Array.isArray(notColsRes.rows) && notColsRes.rows.length > 0;
    } catch (err) {
      console.error(
        'Erro ao verificar existencia da tabela notificacoes:',
        err
      );
      notificacoesExists = false;
    }

    // Buscar notificações para clínicas: avaliações concluídas e laudos enviados
    const notificacoesQuery = await query(
      `
      SELECT
        'avaliacao_concluida' as tipo,
        a.id as id_referencia,
        a.id as avaliacao_id,
        la.id as lote_id,
        ec.nome as empresa_nome,
        a.envio as data_evento,
        COUNT(*) OVER () as total_count
      FROM avaliacoes a
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      WHERE la.clinica_id = (SELECT clinica_id FROM funcionarios WHERE cpf = $1)
        AND a.status = 'concluido'
        AND a.envio >= NOW() - INTERVAL '7 days'

      UNION ALL

      SELECT
        'laudo_enviado' as tipo,
        l.id as id_referencia,
        NULL as avaliacao_id,
        l.lote_id,
        ec.nome as empresa_nome,
        l.enviado_em as data_evento,
        COUNT(*) OVER () as total_count
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      WHERE la.clinica_id = (SELECT clinica_id FROM funcionarios WHERE cpf = $1)
        AND l.status = 'enviado'
        AND l.enviado_em >= NOW() - INTERVAL '7 days'

        ${
          notificacoesExists
            ? `
      UNION ALL

      SELECT
        'laudo_emitido_automaticamente' as tipo,
        n.id as id_referencia,
        NULL as avaliacao_id,
        NULL as lote_id,
        'Sistema' as empresa_nome,
        n.criado_em as data_evento,
        COUNT(*) OVER () as total_count
      FROM notificacoes n
      WHERE n.destinatario_cpf = $1
        AND n.tipo::text = 'laudo_emitido_automaticamente'
        AND n.criado_em >= NOW() - INTERVAL '7 days'
      `
            : ''
        }

      ORDER BY data_evento DESC
      LIMIT 50
    `,
      [user.cpf]
    );

    // Se a tabela `notificacoes` não existe, executar consulta sem o bloco de notificações
    // (a verificação anterior injeta string condicionalmente com ${notificacoesExists})

    const notificacoes = notificacoesQuery.rows.map((notif) => ({
      id: `${notif.tipo}_${notif.id_referencia}`,
      tipo: notif.tipo,
      lote_id: notif.lote_id,
      empresa_nome: notif.empresa_nome,
      data_evento: notif.data_evento,
      mensagem:
        notif.tipo === 'avaliacao_concluida'
          ? `Nova avaliação concluída no lote ID: ${notif.lote_id}`
          : notif.tipo === 'laudo_enviado'
            ? `Laudo enviado para o lote ID: ${notif.lote_id}`
            : `Laudo foi emitido e enviado automaticamente.`,
    }));

    // Contar total de notificações não lidas (todas são consideradas não lidas por enquanto)
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
