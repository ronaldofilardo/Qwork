import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/entidade/lote/[id]/solicitar-emissao
 * Solicitar emissão de laudo para um lote
 *
 * Ações:
 * 1. Validar que lote pertence à entidade
 * 2. Validar que tem avaliações concluídas
 * 3. Contar funcionários com avaliações concluídas
 * 4. Criar registro em fila de emissão
 * 5. Registrar solicitação em audit_log
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar sessão e perfil
    const session = await requireEntity();

    const loteId = parseInt(params.id);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido' },
        { status: 400 }
      );
    }

    // Buscar informações do lote e verificar se pertence à entidade do usuário
    const loteResult = await query(
      `
      SELECT
        la.id,
        la.tipo,
        la.status,
        la.criado_em,
        COUNT(DISTINCT CASE WHEN a.status = 'concluida' OR a.status = 'concluido' THEN f.id END) as funcionarios_concluidos
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON a.lote_id = la.id
      LEFT JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE la.id = $1 AND la.entidade_id = $2
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

    // Validar se tem avaliações concluídas
    if (!lote.funcionarios_concluidos || lote.funcionarios_concluidos === 0) {
      return NextResponse.json(
        {
          error: 'Lote não possui avaliações concluídas para solicitar emissão',
        },
        { status: 400 }
      );
    }

    // Verificar se já foi solicitada emissão
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

    // Criar registro em fila de emissão (se tabela existe) ou apenas registrar a solicitação
    // Aqui estamos criando um registro que o admin verá no dashboard
    await query(
      `
      INSERT INTO audit_log (acao, entidade_id, lote_id, usuario_cpf, metadados, criado_em)
      VALUES 
        ('solicitar_emissao_laudo', $1, $2, $3, $4, NOW())
      `,
      [
        session.entidade_id,
        loteId,
        session.cpf,
        JSON.stringify({
          funcionarios_concluidos: lote.funcionarios_concluidos,
          timestamp: new Date().toISOString(),
        }),
      ]
    );

    // Log de sucesso
    console.info(
      JSON.stringify({
        event: 'emissao_laudo_solicitada',
        lote_id: loteId,
        entidade_id: session.entidade_id,
        funcionarios_concluidos: lote.funcionarios_concluidos,
        solicitado_por: session.cpf,
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json(
      {
        success: true,
        lote_id: loteId,
        funcionarios_para_cobranca: lote.funcionarios_concluidos,
        mensagem:
          'Solicitação de emissão recebida. O administrador definirá o valor em breve.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SOLICITAR-EMISSAO] Erro:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Erro ao solicitar emissão' },
      { status: 500 }
    );
  }
}
