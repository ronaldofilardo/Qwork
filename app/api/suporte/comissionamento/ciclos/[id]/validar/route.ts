/**
 * POST /api/suporte/comissionamento/ciclos/[id]/validar
 *
 * Suporte valida (ou rejeita) a NF/RPA enviada pelo representante.
 *
 * Body: { acao: 'validar' | 'rejeitar', motivo?: string }
 *
 * Ao validar: status → 'validado', data_validacao_suporte = NOW()
 * Ao rejeitar: status → 'aguardando_nf_rpa' (volta para envio), NF limpa
 *
 * Acesso: suporte, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  acao: z.enum(['validar', 'rejeitar']),
  motivo: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte', 'admin'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { acao, motivo } = parsed.data;

    // Verificar ciclo
    const existing = await query(
      `SELECT id, status, representante_id FROM ciclos_comissao_mensal WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ciclo não encontrado' },
        { status: 404 }
      );
    }

    const ciclo = existing.rows[0] as {
      id: number;
      status: string;
      representante_id: number;
    };

    if (ciclo.status !== 'nf_rpa_enviada') {
      return NextResponse.json(
        {
          error: `Ciclo está com status '${ciclo.status}'. Apenas 'nf_rpa_enviada' pode ser validado/rejeitado.`,
          code: 'STATUS_INVALIDO',
        },
        { status: 409 }
      );
    }

    if (acao === 'validar') {
      await query(
        `UPDATE ciclos_comissao_mensal
         SET status = 'validado',
             data_validacao_suporte = NOW(),
             validado_por_cpf = $1,
             atualizado_em = NOW()
         WHERE id = $2`,
        [session.cpf, id]
      );

      // Se representante estava bloqueado por NF, desbloquear
      await query(
        `UPDATE representantes
         SET status = 'apto',
             atualizado_em = NOW()
         WHERE id = $1
           AND status = 'apto_bloqueado'`,
        [ciclo.representante_id]
      );
    } else {
      // Rejeitar: voltar para aguardando, limpar NF
      await query(
        `UPDATE ciclos_comissao_mensal
         SET status = 'aguardando_nf_rpa',
             nf_rpa_path = NULL,
             nf_rpa_nome_arquivo = NULL,
             data_envio_nf_rpa = NULL,
             atualizado_em = NOW()
         WHERE id = $1`,
        [id]
      );
    }

    console.info(
      JSON.stringify({
        event: 'suporte_validou_ciclo_comissao',
        ciclo_id: id,
        acao,
        motivo: motivo ?? null,
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({
      ok: true,
      message:
        acao === 'validar'
          ? 'NF/RPA validada com sucesso.'
          : 'NF/RPA rejeitada. Representante notificado.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[POST /api/suporte/comissionamento/ciclos/[id]/validar]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
