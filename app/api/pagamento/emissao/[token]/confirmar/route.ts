import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const body = await request.json();
    const { metodo_pagamento, num_parcelas, valor_total } = body;

    if (!metodo_pagamento || !num_parcelas || !valor_total) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    if (
      !['pix', 'cartao', 'boleto', 'transferencia'].includes(metodo_pagamento)
    ) {
      return NextResponse.json({ error: 'Método inválido' }, { status: 400 });
    }

    if (num_parcelas < 1 || num_parcelas > 12) {
      return NextResponse.json(
        { error: 'Parcelas inválidas (1-12)' },
        { status: 400 }
      );
    }

    const loteResult = await query(
      `SELECT id, status_pagamento, valor_por_funcionario, liberado_por
       FROM lotes_avaliacao
       WHERE link_pagamento_token = $1
       FOR UPDATE`,
      [token]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 });
    }

    const lote = loteResult.rows[0];

    // Token de uso único: verificar se já foi usado
    if (lote.status_pagamento === 'pago') {
      return NextResponse.json(
        { error: 'Link já foi utilizado' },
        { status: 400 }
      );
    }

    if (lote.status_pagamento !== 'aguardando_pagamento') {
      return NextResponse.json(
        { error: 'Não está aguardando pagamento' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE lotes_avaliacao
       SET status_pagamento = 'pago',
           pagamento_metodo = $1,
           pagamento_parcelas = $2,
           pago_em = NOW(),
           atualizado_em = NOW()
       WHERE id = $3`,
      [metodo_pagamento, num_parcelas, lote.id]
    );

    // Notificação para emissor - precisa buscar CPF de um emissor ativo
    // TODO: Criar tipos de notificação no enum para laudo_pago_pronto_emissao e pagamento_confirmado
    /*
    const emissorResult = await query(
      `SELECT cpf FROM usuarios WHERE tipo = 'emissor' AND ativo = true LIMIT 1`
    );
    
    if (emissorResult.rows.length > 0) {
      await query(
        `INSERT INTO notificacoes (
          tipo, titulo, mensagem, destinatario_cpf, destinatario_tipo, prioridade, dados_contexto
        ) VALUES (
          'laudo_pago_pronto_emissao', 'Novo laudo pago', $1, $2, 'emissor', 'alta', $3
        )`,
        [
          `Lote #${lote.id} foi pago e está pronto para emissão`,
          emissorResult.rows[0].cpf,
          JSON.stringify({ lote_id: lote.id })
        ]
      );
    }

    // Notificação para o solicitante
    await query(
      `INSERT INTO notificacoes (
        tipo, titulo, mensagem, destinatario_cpf, destinatario_tipo, prioridade, dados_contexto
      ) VALUES (
        'pagamento_confirmado', 'Pagamento confirmado', $1, $2, 'gestor', 'normal', $3
      )`,
      [
        `Pagamento do lote #${lote.id} confirmado. O laudo será emitido em breve.`,
        lote.liberado_por,
        JSON.stringify({ lote_id: lote.id })
      ]
    );
    */

    console.log(
      `[INFO] Pagamento confirmado lote ${lote.id} - ${metodo_pagamento} ${num_parcelas}x`
    );

    return NextResponse.json({
      success: true,
      lote_id: lote.id,
      message: 'Pagamento confirmado',
    });
  } catch (error: any) {
    console.error('[ERRO] confirmar pagamento:', error);
    return NextResponse.json({ error: 'Erro ao confirmar' }, { status: 500 });
  }
}
