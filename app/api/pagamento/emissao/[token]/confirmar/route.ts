import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { dispararEmailLotePago } from '@/lib/email';

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
      `SELECT la.id, la.status_pagamento, la.valor_por_funcionario, la.liberado_por,
              la.clinica_id, la.entidade_id,
              COALESCE(c.isento_pagamento, e.isento_pagamento, false) AS isento_pagamento
       FROM lotes_avaliacao la
       LEFT JOIN clinicas c ON c.id = la.clinica_id
       LEFT JOIN entidades e ON e.id = la.entidade_id
       WHERE la.link_pagamento_token = $1
       FOR UPDATE`,
      [token]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 });
    }

    const lote = loteResult.rows[0];

    // Bloquear pagamento via link se o tomador for isento
    if (lote.isento_pagamento === true) {
      console.warn(
        `[AVISO] Tentativa de pagamento via link para lote isento ${lote.id} — bloqueado`
      );
      return NextResponse.json(
        {
          error:
            'Este lote pertence a um tomador isento de pagamento. Nenhuma cobrança é necessária.',
        },
        { status: 400 }
      );
    }

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

    // Email #2: lote disponível para o emissor gerar o laudo
    dispararEmailLotePago(lote.id).catch((e) =>
      console.error('[EMAIL] dispararEmailLotePago (confirmar) falhou:', e)
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
