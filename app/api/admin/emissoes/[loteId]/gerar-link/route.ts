import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: { loteId: string } }
) {
  try {
    const user = await requireRole('admin');
    const loteId = parseInt(params.loteId);

    if (isNaN(loteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const loteResult = await query(
      `SELECT la.id, la.status, la.status_pagamento, la.valor_por_funcionario,
              la.liberado_por, la.clinica_id, la.entidade_id,
              COUNT(a.id) AS num_avaliacoes
       FROM lotes_avaliacao la
       LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
       WHERE la.id = $1
       GROUP BY la.id`,
      [loteId]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    if (lote.status !== 'concluido') {
      return NextResponse.json(
        { error: 'Lote deve estar concluído' },
        { status: 400 }
      );
    }

    if (!lote.valor_por_funcionario) {
      return NextResponse.json(
        { error: 'Defina o valor primeiro' },
        { status: 400 }
      );
    }

    // Permitir gerar novo link mesmo se já existe (uso único: após pago, pode gerar novamente)
    if (lote.status_pagamento === 'pago') {
      return NextResponse.json(
        { error: 'Pagamento já confirmado' },
        { status: 400 }
      );
    }

    // Gerar novo token (invalidando o anterior se existir)
    const token = randomUUID();

    await query(
      `UPDATE lotes_avaliacao
       SET link_pagamento_token = $1,
           link_pagamento_enviado_em = NOW(),
           status_pagamento = 'aguardando_pagamento',
           atualizado_em = NOW()
       WHERE id = $2`,
      [token, loteId]
    );

    const valorTotal = lote.valor_por_funcionario * lote.num_avaliacoes;

    // TODO: Criar tipo de notificação para link_pagamento_gerado no enum
    // Por enquanto, notificação desabilitada
    /*
    await query(
      `INSERT INTO notificacoes (
        tipo, titulo, mensagem, destinatario_cpf, destinatario_tipo, prioridade, dados_contexto
      ) VALUES (
        'link_pagamento_gerado',
        'Link de pagamento disponível',
        $1, $2, 'gestor', 'alta', $3
      )`,
      [
        `Link gerado para lote #${loteId}. Valor: R$ ${valorTotal.toFixed(2)}`,
        lote.liberado_por,
        JSON.stringify({
          lote_id: loteId,
          token,
          valor_total: valorTotal,
          num_avaliacoes: lote.num_avaliacoes,
        }),
      ]
    );
    */

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const linkPagamento = `${baseUrl}/pagamento/emissao/${token}`;

    console.log(
      `[INFO] Admin ${user.cpf} gerou link para lote ${loteId} - Token: ${token}`
    );

    return NextResponse.json({
      success: true,
      lote_id: loteId,
      token,
      link_pagamento: linkPagamento,
      valor_total: valorTotal,
    });
  } catch (error: any) {
    console.error('[ERRO] gerar-link:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
