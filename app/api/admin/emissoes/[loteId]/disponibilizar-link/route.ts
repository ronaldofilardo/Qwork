import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

/**
 * POST /api/admin/emissoes/[loteId]/disponibilizar-link
 * Marca link_disponibilizado_em = NOW() e cria notificação para o gestor/rh
 */
export async function POST(
  _request: Request,
  { params }: { params: { loteId: string } }
) {
  try {
    await requireRole('suporte', false);
    const loteId = parseInt(params.loteId);

    if (isNaN(loteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar se lote existe e já tem link gerado
    const loteResult = await query(
      `SELECT la.id, la.status_pagamento, la.link_pagamento_token,
              la.link_disponibilizado_em, la.entidade_id, la.clinica_id,
              la.valor_por_funcionario, la.liberado_por,
              COALESCE(e.isento_pagamento, cl.isento_pagamento, false) AS isento_pagamento,
              COUNT(a.id) FILTER (WHERE a.status != 'rascunho') as num_avaliacoes,
              COALESCE(e.nome, ec_ent.nome) as nome_tomador
       FROM lotes_avaliacao la
       LEFT JOIN avaliacoes a ON a.lote_id = la.id
       LEFT JOIN entidades e ON e.id = la.entidade_id
       LEFT JOIN clinicas cl ON cl.id = la.clinica_id
       LEFT JOIN entidades ec_ent ON ec_ent.id = (
         SELECT cl2.entidade_id FROM clinicas cl2 WHERE cl2.id = la.clinica_id LIMIT 1
       )
       WHERE la.id = $1
       GROUP BY la.id, e.nome, ec_ent.nome, e.isento_pagamento, cl.isento_pagamento`,
      [loteId]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    if (lote.isento_pagamento === true) {
      return NextResponse.json(
        {
          error:
            'Tomador isento de pagamento — não é necessário disponibilizar link de cobrança.',
        },
        { status: 400 }
      );
    }

    if (!lote.link_pagamento_token) {
      return NextResponse.json(
        {
          error:
            'Link de pagamento ainda não foi gerado. Gere o link primeiro.',
        },
        { status: 400 }
      );
    }

    if (lote.status_pagamento === 'pago') {
      return NextResponse.json(
        { error: 'Pagamento já confirmado' },
        { status: 400 }
      );
    }

    if (lote.link_disponibilizado_em) {
      return NextResponse.json(
        { error: 'Link já foi disponibilizado na conta do tomador' },
        { status: 409 }
      );
    }

    // Marcar como disponibilizado
    await query(
      `UPDATE lotes_avaliacao
       SET link_disponibilizado_em = NOW(),
           atualizado_em = NOW()
       WHERE id = $1`,
      [loteId]
    );

    // Criar notificação para o gestor/tomador
    const valorTotal =
      (lote.valor_por_funcionario || 0) * (lote.num_avaliacoes || 0);

    // Determinar destinatário
    const destinatarioTipo = lote.entidade_id ? 'gestor_entidade' : 'clinica';

    // Buscar CPF do liberado_por (gestor que solicitou emissão)
    if (lote.liberado_por) {
      try {
        await query(
          `INSERT INTO notificacoes (
            tipo, titulo, mensagem, destinatario_cpf, destinatario_tipo,
            prioridade, link_acao, dados_contexto
          ) VALUES (
            'pagamento_pendente',
            'Link de pagamento disponível',
            $1, $2, $3,
            'alta', $4, $5
          )`,
          [
            `Pagamento disponível para o lote #${loteId}. Valor: R$ ${valorTotal.toFixed(2)}`,
            lote.liberado_por,
            destinatarioTipo,
            `/pagamento/emissao/${lote.link_pagamento_token}`,
            JSON.stringify({
              lote_id: loteId,
              valor_total: valorTotal,
              nome_tomador: lote.nome_tomador,
            }),
          ]
        );
      } catch (notifErr) {
        // Log mas não falha a operação
        console.error('[ADMIN] Erro ao criar notificação:', notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Link disponibilizado na conta do tomador',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    console.error('Erro ao disponibilizar link:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
