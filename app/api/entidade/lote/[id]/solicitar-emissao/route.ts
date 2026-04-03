import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/entidade/lote/[id]/solicitar-emissao
 * Solicitar emissão de laudo para um lote de entidade.
 *
 * Ações:
 * 1. Validar que lote pertence à entidade (isolamento por entidade_id)
 * 2. Validar que lote atingiu 70% (status === 'concluido' — setado pelo trigger DB)
 * 3. Validar que não há emissão já solicitada
 * 4. BEGIN: auto-inativar avaliações pendentes + inserir audit_log
 * 5. COMMIT
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticação
    const session = await requireEntity();

    const loteId = parseInt(params.id);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido' },
        { status: 400 }
      );
    }

    // 2. Buscar lote e validar pertencimento à entidade
    // ISOLAMENTO: filtro direto em la.entidade_id impede acesso a lotes de clínicas/RH
    const loteResult = await query(
      `
      SELECT
        la.id,
        la.tipo,
        la.status,
        la.criado_em,
        COUNT(DISTINCT CASE WHEN a.status IN ('concluida', 'concluido') THEN a.id END) AS funcionarios_concluidos
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON a.lote_id = la.id
      WHERE la.id = $1
        AND la.entidade_id = $2
        AND la.clinica_id IS NULL
        AND la.empresa_id IS NULL
      GROUP BY la.id, la.tipo, la.status, la.criado_em
      LIMIT 1
    `,
      [loteId, session.entidade_id]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado ou não pertence à sua entidade' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    // 3. Validar que o lote atingiu 70% (trigger DB seta status='concluido')
    if (lote.status !== 'concluido') {
      return NextResponse.json(
        {
          error:
            'Lote ainda não atingiu o mínimo de 70% de avaliações concluídas para solicitar emissão.',
        },
        { status: 400 }
      );
    }

    // 4. Validar que tem ao menos uma avaliação concluída
    if (
      !lote.funcionarios_concluidos ||
      Number(lote.funcionarios_concluidos) === 0
    ) {
      return NextResponse.json(
        {
          error: 'Lote não possui avaliações concluídas para solicitar emissão',
        },
        { status: 400 }
      );
    }

    // 5. Verificar se emissão já foi solicitada
    const jaExisteResult = await query(
      `SELECT id FROM v_fila_emissao WHERE lote_id = $1 LIMIT 1`,
      [loteId]
    );

    if (jaExisteResult.rows.length > 0) {
      return NextResponse.json(
        {
          error:
            'Emissão já foi solicitada para este lote. Aguarde o processamento.',
        },
        { status: 409 }
      );
    }

    // 6. Transação: auto-inativar pendentes + registrar audit_log
    await query('BEGIN');
    try {
      // 6a. Inativar automaticamente avaliações ainda não concluídas
      const autoInativadasResult = await query(
        `UPDATE avaliacoes
         SET status = 'inativada',
             motivo_inativacao = 'Inativação automática: emissão do laudo solicitada',
             inativada_em = NOW()
         WHERE lote_id = $1
           AND status NOT IN ('concluida', 'inativada')
         RETURNING id`,
        [loteId]
      );
      const autoInativadasCount = autoInativadasResult.rowCount ?? 0;
      if (autoInativadasCount > 0) {
        console.log(
          `[INFO] ${autoInativadasCount} avaliação(ões) inativada(s) automaticamente no lote ${loteId} (entidade)`
        );
      }

      // 6b. Registrar solicitação no audit_log
      await query(
        `INSERT INTO audit_log (acao, entidade_id, lote_id, usuario_cpf, metadados, criado_em)
         VALUES ('solicitar_emissao_laudo', $1, $2, $3, $4, NOW())`,
        [
          session.entidade_id,
          loteId,
          session.cpf,
          JSON.stringify({
            funcionarios_concluidos: Number(lote.funcionarios_concluidos),
            auto_inativadas: autoInativadasCount,
            timestamp: new Date().toISOString(),
          }),
        ]
      );

      await query('COMMIT');

      console.info(
        JSON.stringify({
          event: 'emissao_laudo_solicitada',
          lote_id: loteId,
          entidade_id: session.entidade_id,
          funcionarios_concluidos: Number(lote.funcionarios_concluidos),
          auto_inativadas: autoInativadasCount,
          solicitado_por: session.cpf,
          timestamp: new Date().toISOString(),
        })
      );

      return NextResponse.json(
        {
          success: true,
          lote_id: loteId,
          funcionarios_para_cobranca: Number(lote.funcionarios_concluidos),
          auto_inativadas_count: autoInativadasCount,
          mensagem:
            'Solicitação de emissão recebida. O administrador definirá o valor em breve.',
        },
        { status: 200 }
      );
    } catch (txError) {
      await query('ROLLBACK');
      throw txError;
    }
  } catch (error) {
    console.error('[SOLICITAR-EMISSAO-ENTIDADE] Erro:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Erro ao solicitar emissão' },
      { status: 500 }
    );
  }
}
