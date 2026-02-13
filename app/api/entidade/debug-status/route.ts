import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/debug-status?lote_id={loteId}&cpf={cpf}
 * Debug endpoint para verificar por que PDF não está sendo gerado
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireEntity();
    const { searchParams } = new URL(req.url);
    const loteId = searchParams.get('lote_id');
    const cpf = searchParams.get('cpf');

    const debug = {
      session: {
        entidade_id: session.entidade_id,
        perfil: session.perfil,
      },
      diagnosticos: {},
    };

    // 1. Verificar entidade
    const entidadeCheck = await query(
      `SELECT id, nome, ativo, tipo FROM tomadores WHERE id = $1`,
      [session.entidade_id],
      session
    );
    debug.diagnosticos['entidade'] = entidadeCheck.rows[0] || null;

    if (loteId) {
      // 2. Verificar lote
      const loteCheck = await query(
        `SELECT id, entidade_id, contratante_id, status FROM lotes_avaliacao WHERE id = $1`,
        [loteId],
        session
      );
      debug.diagnosticos['lote'] = loteCheck.rows[0] || null;

      // 3. Verificar via funcionarios_entidades (novo)
      const viaFE = await query(
        `SELECT COUNT(*) as total
         FROM avaliacoes a
         JOIN funcionarios f ON a.funcionario_cpf = f.cpf
         JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
         WHERE a.lote_id = $1
           AND fe.entidade_id = $2
           AND fe.ativo = true`,
        [loteId, session.entidade_id],
        session
      );
      debug.diagnosticos['avaliacoes_via_funcionarios_entidades'] =
        viaFE.rows[0];

      // 4. Verificar via contratante_id (legado)
      const viaContratante = await query(
        `SELECT COUNT(*) as total
         FROM avaliacoes a
         JOIN funcionarios f ON a.funcionario_cpf = f.cpf
         WHERE a.lote_id = $1 AND f.contratante_id = $2`,
        [loteId, session.entidade_id],
        session
      );
      debug.diagnosticos['avaliacoes_via_contratante_id'] =
        viaContratante.rows[0];

      // 5. Total de avaliacoes no lote
      const totalAval = await query(
        `SELECT 
           COUNT(*) as total,
           COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas
         FROM avaliacoes 
         WHERE lote_id = $1`,
        [loteId],
        session
      );
      debug.diagnosticos['total_avaliacoes_no_lote'] = totalAval.rows[0];

      if (cpf) {
        // 6. Verificar avaliação específica
        const avaliacaoEspecifica = await query(
          `SELECT id, status, concluida_em FROM avaliacoes 
           WHERE lote_id = $1 AND funcionario_cpf = $2`,
          [loteId, cpf],
          session
        );
        debug.diagnosticos['avaliacao_cpf'] =
          avaliacaoEspecifica.rows[0] || null;

        // 7. Verificar funcionário
        const funcionarioCheck = await query(
          `SELECT id, nome, cpf, contratante_id, ativo FROM funcionarios WHERE cpf = $1`,
          [cpf],
          session
        );
        debug.diagnosticos['funcionario'] = funcionarioCheck.rows[0] || null;

        // 8. Verificar vínculo via funcionarios_entidades
        if (funcionarioCheck.rows[0]) {
          const vinculoFE = await query(
            `SELECT * FROM funcionarios_entidades 
             WHERE funcionario_id = $1 AND entidade_id = $2`,
            [funcionarioCheck.rows[0].id, session.entidade_id],
            session
          );
          debug.diagnosticos['vinculo_funcionarios_entidades'] =
            vinculoFE.rows[0] || null;
        }
      }
    }

    return NextResponse.json(debug);
  } catch (error: any) {
    console.error('[entidade/debug-status] Erro:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erro ao gerar debug',
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
