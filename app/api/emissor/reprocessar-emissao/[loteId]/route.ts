import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST - Reprocessar emissão de laudo que falhou
export const POST = async (
  req: Request,
  { params }: { params: { loteId: string } }
) => {
  const user = await requireRole('emissor');
  if (!user) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    const loteId = parseInt(params.loteId);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido', success: false },
        { status: 400 }
      );
    }

    // Verificar se o lote existe e está elegível para reprocessamento
    const loteCheck = await query(
      `
      SELECT 
        la.id,
        la.codigo,
        la.status,
        la.auto_emitir_em,
        la.auto_emitir_agendado,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      WHERE la.id = $1
      GROUP BY la.id, la.codigo, la.status, la.auto_emitir_em, la.auto_emitir_agendado
    `,
      [loteId]
    );

    if (loteCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado', success: false },
        { status: 404 }
      );
    }

    const lote = loteCheck.rows[0];

    // Validar que o lote está concluído
    if (lote.status !== 'concluido') {
      return NextResponse.json(
        {
          error:
            "Lote precisa estar no status 'concluido' para reprocessamento",
          success: false,
        },
        { status: 400 }
      );
    }

    // Validar que todas as avaliações estão concluídas
    if (lote.total_avaliacoes !== lote.avaliacoes_concluidas) {
      return NextResponse.json(
        {
          error:
            'Todas as avaliações devem estar concluídas para reprocessamento',
          success: false,
        },
        { status: 400 }
      );
    }

    // (REMOVED) antiga validação por flag de agendamento — agora permitimos reprocessar lotes concluídos diretamente

    // Verificar se já existe laudo enviado (não permitir reprocessar se já foi enviado)
    const laudoExistente = await query(
      `
      SELECT id, status, enviado_em
      FROM laudos
      WHERE lote_id = $1 AND status = 'enviado' AND arquivo_pdf IS NOT NULL
    `,
      [loteId]
    );

    if (laudoExistente.rows.length > 0 && laudoExistente.rows[0].enviado_em) {
      return NextResponse.json(
        {
          error: 'Laudo já foi enviado. Não é possível reprocessar.',
          success: false,
        },
        { status: 400 }
      );
    }

    // Verificar se já existe uma tentativa de reprocessamento recente (últimos 5 minutos)
    const tentativaRecente = await query(
      `
      SELECT criado_em
      FROM auditoria_laudos
      WHERE lote_id = $1 
        AND acao = 'reprocessamento_manual'
        AND criado_em >= NOW() - INTERVAL '5 minutes'
      ORDER BY criado_em DESC
      LIMIT 1
    `,
      [loteId]
    );

    if (tentativaRecente.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'Aguarde 5 minutos entre tentativas de reprocessamento',
          success: false,
        },
        { status: 429 }
      );
    }

    // Emitir imediatamente (reprocessamento manual)
    const { emitirLaudoImediato } = await import('@/lib/laudo-auto');
    const emitted = await emitirLaudoImediato(loteId);

    if (!emitted) {
      return NextResponse.json(
        { success: false, message: 'Falha ao reprocessar emissão do laudo' },
        { status: 500 }
      );
    }

    // Registrar auditoria do reprocessamento manual
    // Normalizar IP (usar primeiro valor de x-forwarded-for ou fallback 127.0.0.1)
    const ipRaw = (
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      ''
    )
      .split(',')[0]
      .trim();
    const ip = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(ipRaw) ? ipRaw : '127.0.0.1';

    await query(
      `
      INSERT INTO auditoria_laudos (
        lote_id, 
        emissor_cpf, 
        emissor_nome, 
        acao, 
        status, 
        ip_address, 
        observacoes,
        criado_em
      )
      VALUES ($1, $2, $3, 'reprocessamento_manual', 'pendente', $4, $5, NOW())
    `,
      [
        loteId,
        user.cpf,
        user.nome,
        ip,
        `Reprocessamento solicitado pelo emissor ${user.nome}`,
      ]
    );

    // Criar notificação para o emissor
    await query(
      `
      INSERT INTO notificacoes (
        tipo, 
        lote_id, 
        titulo, 
        mensagem, 
        data_evento,
        destinatario_cpf
      )
      VALUES ($1, $2, $3, $4, NOW(), $5)
    `,
      [
        'lote_reprocessamento',
        loteId,
        'Reprocessamento solicitado',
        `O lote ${lote.codigo} foi colocado na fila para reprocessamento. O sistema tentará emitir o laudo novamente em breve.`,
        user.cpf,
      ]
    );

    console.log(
      `[INFO] Reprocessamento solicitado para lote ${loteId} por ${user.cpf}`
    );

    return NextResponse.json({
      success: true,
      message: 'Lote colocado na fila para reprocessamento',
      lote: {
        id: lote.id,
        codigo: lote.codigo,
        status: lote.status,
      },
    });
  } catch (error) {
    console.error(
      '[POST /api/emissor/reprocessar-emissao/[loteId]] Erro:',
      error
    );

    // Registrar auditoria de erro no reprocessamento
    try {
      await query(
        `
        INSERT INTO audit_logs (
          acao, entidade, entidade_id, dados, user_id, user_role, criado_em
        )
        VALUES (
          'reprocessamento_erro', 'lotes_avaliacao', $1, $2, $3, $4, NOW()
        )
      `,
        [
          params.loteId,
          JSON.stringify({
            erro: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error && error.stack ? error.stack : null,
          }),
          user && user.cpf ? user.cpf : null,
          user && user.perfil ? user.perfil : 'sistema',
        ]
      );
      console.log(
        '[REPROCESSAR] Auditoria de erro registrada para reprocessamento (lote ' +
          params.loteId +
          ')'
      );
    } catch (auditErr) {
      console.error(
        '[REPROCESSAR] Erro ao registrar auditoria de reprocessamento:',
        auditErr
      );
    }

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
