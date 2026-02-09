/**
 * API: Solicitar Emissão Manual de Laudo
 *
 * Endpoint: POST /api/lotes/[loteId]/solicitar-emissao
 *
 * Descrição: Permite que RH (clínicas) e Entidades solicitem a emissão
 * manual do laudo após o lote entrar em estado 'concluido'.
 *
 * ⚠️ IMPORTANTE: Esta API NÃO emite o laudo automaticamente!
 * Ela apenas REGISTRA a solicitação. O laudo será emitido manualmente
 * pelo emissor quando ele clicar em "Gerar Laudo" no dashboard.
 *
 * Fluxo correto:
 * 1. RH/Entidade solicita emissão (este endpoint)
 * 2. Lote fica disponível no dashboard do emissor
 * 3. Emissor revisa e clica em "Gerar Laudo"
 * 4. Sistema chama POST /api/emissor/laudos/[loteId]
 * 5. Laudo é gerado com status 'emitido' (não 'enviado')
 * 6. Emissor revisa e clica em "Enviar"
 * 7. Sistema chama PATCH /api/emissor/laudos/[loteId]
 * 8. Laudo é marcado como 'enviado'
 *
 * Segurança:
 * - RH: Valida acesso à empresa do lote
 * - Entidade: Valida tomador_id
 * - Bloqueia se laudo já foi emitido
 * - Advisory lock previne race conditions
 */

import { NextResponse } from 'next/server';
import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { loteId: string } }
) {
  try {
    // 1. Autenticação básica
    const user = await requireAuth();
    const loteId = parseInt(params.loteId);

    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID de lote inválido' },
        { status: 400 }
      );
    }

    console.log(
      `[INFO] Solicitação de emissão manual para lote ${loteId} por ${user.cpf} (${user.perfil})`
    );

    // 2. Buscar informações do lote
    const loteResult = await query(
      `SELECT 
        id,
        status, 
        clinica_id, 
        empresa_id, 
        entidade_id, 
        emitido_em
      FROM lotes_avaliacao 
      WHERE id = $1`,
      [loteId]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    // 3. Validar permissões baseado no tipo de lote
    if (lote.clinica_id && user.perfil === 'rh') {
      // Lote de clínica - validar acesso à empresa
      try {
        await requireRHWithEmpresaAccess(lote.empresa_id);
      } catch {
        console.warn(
          `[WARN] RH ${user.cpf} tentou solicitar emissão de lote sem permissão (empresa_id: ${lote.empresa_id})`
        );
        return NextResponse.json(
          { error: 'Sem permissão para este lote' },
          { status: 403 }
        );
      }
    } else if (lote.entidade_id && user.perfil === 'gestor') {
      // Lote de entidade - validar entidade_id
      // O user já vem autenticado com entidade_id do requireAuth()
      if (user.entidade_id !== lote.entidade_id) {
        console.warn(
          `[WARN] Entidade ${user.cpf} tentou solicitar emissão de lote de outra entidade (lote: ${lote.entidade_id}, user: ${user.entidade_id})`
        );
        return NextResponse.json(
          { error: 'Sem permissão para este lote' },
          { status: 403 }
        );
      }
    } else {
      // Perfil não autorizado
      return NextResponse.json(
        {
          error: `Perfil '${user.perfil}' não pode solicitar emissão de laudos`,
        },
        { status: 403 }
      );
    }

    // 4. Validar status do lote
    if (lote.status !== 'concluido') {
      return NextResponse.json(
        {
          error: `Lote não está concluído. Status atual: ${lote.status}`,
        },
        { status: 400 }
      );
    }

    // 5. Validar que laudo não foi emitido
    if (lote.emitido_em) {
      return NextResponse.json(
        {
          error: 'Laudo já foi emitido para este lote',
          emitido_em: lote.emitido_em,
        },
        { status: 400 }
      );
    }

    // 6. Verificar se já existe laudo enviado
    const laudoExistente = await query(
      `SELECT id, status, emitido_em 
       FROM laudos 
       WHERE lote_id = $1`,
      [loteId]
    );

    if (
      laudoExistente.rows.length > 0 &&
      laudoExistente.rows[0].status === 'enviado'
    ) {
      return NextResponse.json(
        {
          error: 'Laudo já foi enviado para este lote',
          laudo_id: laudoExistente.rows[0].id,
        },
        { status: 400 }
      );
    }

    // 7. Adicionar à fila e emitir (com lock para prevenir duplicação)
    await query('BEGIN');

    try {
      // Advisory lock para prevenir race condition
      await query('SELECT pg_advisory_xact_lock($1)', [loteId]);
      console.log(`[INFO] Advisory lock adquirido para lote ${loteId}`);

      // 8. Registrar solicitação de emissão em auditoria_laudos
      // (substituiu a antiga fila_emissao - migration 201)
      // Usar INSERT com verificação prévia otimizada (migration 202)
      // Normalizar `tipo_solicitante` para satisfazer CHECK constraints
      const tipoSolicitante = user.perfil === 'rh' ? 'rh' : 'gestor';

      const insertResult = await query(
        `WITH existing AS (
           SELECT id, tentativas
           FROM auditoria_laudos
           WHERE lote_id = $1
             AND acao = 'solicitar_emissao'
             AND solicitado_por = $2
             AND status IN ('pendente', 'reprocessando')
           FOR UPDATE SKIP LOCKED
           LIMIT 1
         ),
         updated AS (
           UPDATE auditoria_laudos
           SET tentativas = tentativas + 1,
               criado_em = NOW()
           WHERE id = (SELECT id FROM existing)
           RETURNING id, tentativas, TRUE as is_update
         ),
         inserted AS (
           INSERT INTO auditoria_laudos (
             lote_id,
             acao,
             status,
             solicitado_por,
             tipo_solicitante,
             criado_em
           )
           SELECT $1, 'solicitar_emissao', 'pendente', $2, $3, NOW()
           WHERE NOT EXISTS (SELECT 1 FROM existing)
           RETURNING id, tentativas, FALSE as is_update
         )
         SELECT * FROM updated
         UNION ALL
         SELECT * FROM inserted`,
        [loteId, user.cpf, tipoSolicitante]
      );

      const result = insertResult.rows[0];
      if (result?.is_update) {
        console.log(
          `[INFO] Solicitação duplicada atualizada para lote ${loteId} (tentativa #${result.tentativas})`
        );
      } else {
        console.log(`[INFO] Nova solicitação registrada para lote ${loteId}`);
      }

      // 9. Atualizar lote com status de pagamento (NOVO FLUXO)
      await query(
        `UPDATE lotes_avaliacao
         SET status_pagamento = 'aguardando_cobranca',
             solicitacao_emissao_em = NOW(),
             atualizado_em = NOW()
         WHERE id = $1`,
        [loteId]
      );

      console.log(
        `[INFO] Lote ${loteId} marcado como aguardando cobrança - novo fluxo de pagamento`
      );

      // 10. Criar notificação para ADMIN sobre solicitação de cobrança
      // TODO: Ajustar para usar destinatario_cpf/destinatario_tipo ao invés de destinatario_role
      /*
      await query(
        `INSERT INTO notificacoes (
           tipo, 
           prioridade, 
           destinatario_role,
           titulo, 
           mensagem,
           lote_id,
           dados_contexto
         )
         VALUES (
           'solicitacao_emissao'::tipo_notificacao,
           'alta'::prioridade_notificacao,
           'admin',
           $1,
           $2,
           $3,
           jsonb_build_object(
             'solicitante_cpf', $4::text,
             'solicitante_nome', $5::text,
             'solicitante_tipo', $6::text,
             'clinica_id', $7,
             'empresa_id', $8,
             'entidade_id', $9
           )
         )`,
        [
          'Nova solicitação de emissão',
          `${user.perfil === 'rh' ? 'Clínica' : 'Entidade'} solicitou emissão de laudo para lote #${loteId}`,
          loteId,
          user.cpf,
          user.nome,
          user.perfil,
          lote.clinica_id,
          lote.empresa_id,
          lote.entidade_id,
        ]
      );
      */
      console.log('[INFO] Notificação para admin temporariamente desabilitada');

      // 11. Criar notificação de sucesso para o solicitante
      let destinatarioTipo: string = user.perfil;
      if (user.perfil === 'rh') {
        destinatarioTipo = 'funcionario';
      } else if (user.perfil === 'gestor') {
        destinatarioTipo = 'gestor';
      }

      await query(
        `INSERT INTO notificacoes (
           tipo, 
           prioridade, 
           destinatario_cpf, 
           destinatario_tipo, 
           titulo, 
           mensagem,
           dados_contexto
         )
         VALUES (
           'emissao_solicitada_sucesso'::tipo_notificacao,
           'media'::prioridade_notificacao,
           $1,
           $2,
           $3,
           $4,
           jsonb_build_object('lote_id', $5::integer)
         )`,
        [
          user.cpf,
          destinatarioTipo,
          'Solicitação de emissão enviada',
          `Solicitação enviada para lote #${loteId}. Aguarde o link de pagamento.`,
          loteId,
        ]
      );

      // COMMIT apenas após notificações criadas com sucesso
      await query('COMMIT');

      console.log(
        `[INFO] ✓ Solicitação de emissão registrada com sucesso para lote ${loteId}`
      );

      return NextResponse.json({
        success: true,
        message:
          'Solicitação enviada com sucesso. Aguarde o link de pagamento.',
        lote: {
          id: lote.id,
          status_pagamento: 'aguardando_cobranca',
        },
      });
    } catch (emissaoError) {
      await query('ROLLBACK');

      console.error(
        `[ERROR] Exceção ao registrar solicitação de emissão para lote ${loteId}:`,
        emissaoError
      );

      // Registrar erro no sistema (incluir `titulo` que é NOT NULL)
      const tituloNotificacao = 'Erro ao registrar solicitação de emissão';
      const mensagemNotificacao = `Erro ao registrar solicitação de emissão do lote ${loteId}: ${
        emissaoError instanceof Error
          ? emissaoError.message
          : String(emissaoError)
      }`;

      await query(
        `INSERT INTO notificacoes_admin (tipo, titulo, mensagem, lote_id, criado_em)
         VALUES ('erro_critico_solicitacao_emissao', $1, $2, $3, NOW())`,
        [tituloNotificacao, mensagemNotificacao, loteId]
      );

      return NextResponse.json(
        {
          error: 'Erro ao solicitar emissão do laudo',
          details:
            emissaoError instanceof Error
              ? emissaoError.message
              : 'Erro desconhecido',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[ERROR] Erro no endpoint de solicitação de emissão:', error);

    return NextResponse.json(
      {
        error: 'Erro interno no servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
