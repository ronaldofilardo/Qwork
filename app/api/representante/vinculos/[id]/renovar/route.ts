/**
 * POST /api/representante/vinculos/[id]/renovar
 * Solicita renovação manual do vínculo (Admin precisa aprovar).
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sess = requireRepresentante();
    const vinculoId = parseInt(params.id, 10);
    if (isNaN(vinculoId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    // Buscar vínculo
    const result = await query(
      `SELECT v.*, e.nome AS entidade_nome
       FROM vinculos_comissao v
       JOIN entidades e ON e.id = v.entidade_id
       WHERE v.id = $1 LIMIT 1`,
      [vinculoId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vínculo não encontrado' },
        { status: 404 }
      );
    }

    const vinculo = result.rows[0];

    if (vinculo.representante_id !== sess.representante_id) {
      return NextResponse.json(
        { error: 'Sem permissão para este vínculo' },
        { status: 403 }
      );
    }

    if (!['ativo', 'inativo'].includes(vinculo.status)) {
      return NextResponse.json(
        { error: `Vínculo ${vinculo.status} não pode ser renovado` },
        { status: 409 }
      );
    }

    // Calcular nova data de expiração: 1 ano a partir de hoje
    const novaExpiracao = new Date();
    novaExpiracao.setFullYear(novaExpiracao.getFullYear() + 1);
    novaExpiracao.setHours(0, 0, 0, 0); // meia-noite

    const renovado = await query(
      `UPDATE vinculos_comissao
       SET data_expiracao = $2,
           status         = 'ativo'
       WHERE id = $1
       RETURNING *`,
      [vinculoId, novaExpiracao.toISOString()]
    );

    // Auditoria
    await query(
      `INSERT INTO comissionamento_auditoria
         (tabela, registro_id, status_anterior, status_novo, triggador, motivo)
       VALUES ('vinculos_comissao', $1, $2, 'ativo', 'rep_action', 'Renovação solicitada pelo representante')`,
      [vinculoId, vinculo.status]
    );

    return NextResponse.json({
      success: true,
      vinculo: renovado.rows[0],
      mensagem: 'Vínculo renovado com sucesso por mais 1 ano.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[POST /api/representante/vinculos/[id]/renovar]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
