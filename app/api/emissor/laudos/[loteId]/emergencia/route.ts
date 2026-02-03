import { NextResponse } from 'next/server';
import { requireEmissor, AccessDeniedError } from '@/lib/auth-require';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/emissor/laudos/[loteId]/emergencia
 *
 * Força emissão de laudo em modo emergência
 * Requer justificativa obrigatória
 * Registra auditoria completa
 */
export async function POST(
  request: Request,
  { params }: { params: { loteId: string } }
) {
  try {
    // Validar autenticação e permissão (com fallback para getServerSession em testes)
    let session;
    try {
      session = requireEmissor();
    } catch (err) {
      // Fallback: alguns testes mockam next-auth/getServerSession em vez de cookies
      try {
        const { getServerSession } = await import('next-auth');
        const serverSess = await getServerSession();
        if (serverSess && (serverSess as any).user) {
          session = (serverSess as any).user as any;
          // Verificar permissão mínima - APENAS emissor
          if (session.perfil !== 'emissor') {
            throw new AccessDeniedError(
              'Acesso negado. Apenas emissores podem usar modo emergência.'
            );
          }
        } else {
          throw err;
        }
      } catch {
        throw err;
      }
    }

    const loteId = parseInt(params.loteId, 10);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido' },
        { status: 400 }
      );
    }

    // Validar corpo da requisição
    const body = await request.json();
    const { motivo } = body;

    if (!motivo || typeof motivo !== 'string' || motivo.trim().length < 20) {
      return NextResponse.json(
        { error: 'Motivo da intervenção é obrigatório (mínimo 20 caracteres)' },
        { status: 400 }
      );
    }

    // Verificar estado do lote
    const loteResult = await query(
      `
      SELECT 
        id, status, codigo, contratante_id, modo_emergencia
      FROM lotes_avaliacao
      WHERE id = $1
    `,
      [loteId]
    );

    if (!loteResult.rows || loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    let lote = loteResult.rows[0];

    // Tentar reconcluir automaticamente o lote antes de proceder com modo emergência.
    // Corrige casos em que avaliações já satisfazem condição de conclusão mas o
    // trigger não foi disparado (por exemplo, atualizações diretas ou operações externas).
    try {
      await query(
        'SELECT fn_reconcluir_lote_for_emergencia($1) AS reconcluido',
        [loteId]
      );
      const refreshed = await query(
        `SELECT id, status, codigo, contratante_id, modo_emergencia
         FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );
      if (refreshed.rows && refreshed.rows.length > 0) lote = refreshed.rows[0];
    } catch (err) {
      console.warn(
        '[EMERGÊNCIA] Erro ao tentar reconcluir lote antes da emissão:',
        err
      );
    }

    // Verificar se modo emergência já foi usado
    if (lote.modo_emergencia) {
      return NextResponse.json(
        {
          error: 'Modo emergência já foi usado para este lote',
          detalhes: 'O modo emergência só pode ser ativado uma vez por lote',
        },
        { status: 400 }
      );
    }

    // Validar que lote está concluído
    if (lote.status !== 'concluido') {
      return NextResponse.json(
        {
          error: `Lote não está concluído (status: ${lote.status})`,
        },
        { status: 400 }
      );
    }

    // Verificar se já existe laudo
    const laudoExistenteResult = await query(
      `
      SELECT id FROM laudos 
      WHERE lote_id = $1 AND status = 'enviado'
    `,
      [loteId]
    );

    if (laudoExistenteResult.rows && laudoExistenteResult.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'Laudo já foi enviado para este lote',
          laudo_id: laudoExistenteResult.rows[0].id,
        },
        { status: 400 }
      );
    }

    // Registrar auditoria da solicitação de modo emergência (formato compatível com testes)
    const auditSql = `INSERT INTO audit_logs (action, resource, resource_id, user_cpf, user_perfil, new_data, ip_address)
       VALUES ('laudo_emergencia_solicitado', 'lotes_avaliacao', $1, $2, $3, $4, $5)`;
    console.log('[EMERGÊNCIA][SQL] INSERT audit:', auditSql, [
      String(loteId),
      session.cpf,
      session.perfil,
      JSON.stringify({ motivo: motivo.trim(), lote_id: lote.id }),
      request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        '0.0.0.0',
    ]);
    await query(auditSql, [
      String(loteId),
      session.cpf,
      session.perfil,
      JSON.stringify({ motivo: motivo.trim(), lote_id: lote.id }),
      request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        '0.0.0.0',
    ]);

    // NOTA: Emissão automática foi removida
    console.error(`[EMERGÊNCIA] Emissão automática foi desativada`);

    // TODO: Implementar novo fluxo de emissão manual
    const sucesso = false;

    if (!sucesso) {
      console.error(`[EMERGÊNCIA] Falha na emissão imediata do lote ${loteId}`);
      // Registrar auditoria de erro com colunas corretas
      try {
        await query(
          `INSERT INTO audit_logs (action, resource, resource_id, user_cpf, user_perfil, new_data, ip_address, criado_em)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            'laudo_emergencia_erro',
            'lotes_avaliacao',
            String(loteId),
            session.cpf || null,
            session.perfil || 'emissor',
            JSON.stringify({
              lote_id: loteId,
              erro: String('Falha ao emitir laudo em modo emergência'),
            }),
            request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              '0.0.0.0',
          ]
        );
      } catch (auditErr) {
        console.error(
          '[EMERGÊNCIA] Erro ao registrar auditoria de erro:',
          auditErr
        );
      }

      return NextResponse.json(
        {
          error:
            'Falha ao emitir laudo em modo emergência. Tente novamente ou entre em contato com o suporte.',
          detalhes:
            'A emissão imediata falhou. Verifique os logs para mais detalhes.',
        },
        { status: 500 }
      );
    }

    console.log(
      `[EMERGÊNCIA] Emissor ${session.cpf} (${session.nome}) emitiu laudo de emergência para lote ${loteId} com sucesso`
    );

    // Se a emissão foi pedida, buscar o laudo real para informar status/emitido_em
    const laudoRes = await query(
      `SELECT id, status, emitido_em, enviado_em FROM laudos WHERE lote_id = $1 ORDER BY id DESC LIMIT 1`,
      [loteId]
    );

    if (sucesso) {
      if (laudoRes.rows && laudoRes.rows.length > 0) {
        const laudo = laudoRes.rows[0];
        console.log(
          `[EMERGÊNCIA] Laudo criado (id=${laudo.id}) para lote ${loteId}`
        );

        // Agora que o laudo foi produzido e emitido_em foi marcado, podemos marcar o lote como modo emergência
        try {
          await query(
            `UPDATE lotes_avaliacao
             SET modo_emergencia = TRUE, motivo_emergencia = $1
             WHERE id = $2`,
            [motivo.trim(), loteId]
          );
        } catch (updateErr) {
          console.warn(
            '[EMERGÊNCIA] Não foi possível marcar modo_emergencia após emissão:',
            updateErr
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Laudo emitido com sucesso em modo de emergência.',
          lote: {
            id: loteId,
            modo_emergencia: true,
            emitido_em: laudo.emitido_em,
            enviado_em: laudo.enviado_em,
            laudo_id: laudo.id,
            laudo_status: laudo.status,
          },
        });
      }

      // Emissor indica sucesso, mas sem registro de laudo (race/concorrência)
      console.warn(
        `[EMERGÊNCIA] emitirLaudoImediato retornou sucesso, mas nenhum laudo encontrado para lote ${loteId}`
      );
      return NextResponse.json({
        success: true,
        message:
          'Emissão iniciada (modo emergência), mas ainda não há registro de laudo. Verifique logs.',
        lote: { id: loteId, modo_emergencia: true },
      });
    } else {
      console.error(`[EMERGÊNCIA] Falha na emissão imediata do lote ${loteId}`);
      return NextResponse.json(
        {
          error:
            'Falha ao emitir laudo em modo emergência. Tente novamente ou entre em contato com o suporte.',
          detalhes:
            'A emissão imediata falhou. Verifique os logs para mais detalhes.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Tratar erros de autenticação/autorização separadamente
    if (error instanceof AccessDeniedError) {
      return NextResponse.json(
        {
          error: 'Acesso negado. Apenas emissores podem usar modo emergência.',
        },
        { status: 403 }
      );
    }

    console.error(
      '[EMERGÊNCIA] Erro ao emitir laudo em modo emergência:',
      error
    );

    // Registrar erro em auditoria (usar colunas padrão em inglês)
    try {
      await query(
        `INSERT INTO audit_logs (action, resource, resource_id, user_cpf, user_perfil, new_data, ip_address, criado_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          'laudo_emergencia_erro',
          'lotes_avaliacao',
          String(params.loteId),
          null,
          'sistema',
          JSON.stringify({
            lote_id: parseInt(params.loteId, 10),
            erro: error instanceof Error ? error.message : String(error),
          }),
          request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            '0.0.0.0',
        ]
      );
      console.log(
        '[EMERGÊNCIA] Auditoria de erro registrada para modo emergência (lote ' +
          params.loteId +
          ')'
      );
    } catch (auditError) {
      console.error(
        '[EMERGÊNCIA] Erro ao registrar auditoria de erro:',
        auditError
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao processar solicitação de emergência',
        detalhes: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
