/**
 * PATCH /api/suporte/comissoes/ciclos/[id]/nf
 *
 * Aprovar ou rejeitar NF de um ciclo de comissão.
 *
 * Body:
 *   - acao: 'aprovar' | 'rejeitar'
 *   - motivo?: string (obrigatório para rejeição)
 *
 * Acesso: suporte, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  acao: z.enum(['aprovar', 'rejeitar']),
  motivo: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte', 'admin'], false);

    const cicloId = parseInt(params.id, 10);
    if (isNaN(cicloId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { acao, motivo } = parsed.data;

    if (acao === 'rejeitar' && !motivo?.trim()) {
      return NextResponse.json(
        { error: 'Motivo é obrigatório para rejeição' },
        { status: 400 }
      );
    }

    // Verificar ciclo existe e está em status correto
    const cicloRes = await query(
      `SELECT id, status, representante_id FROM ciclos_comissao WHERE id = $1 LIMIT 1`,
      [cicloId]
    );
    if (cicloRes.rows.length === 0) {
      return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 });
    }

    const ciclo = cicloRes.rows[0];
    if (ciclo.status !== 'nf_enviada') {
      return NextResponse.json(
        { error: `Ciclo com status '${ciclo.status}' não pode ser revisado. Esperado: nf_enviada.` },
        { status: 409 }
      );
    }

    if (acao === 'aprovar') {
      await query(
        `UPDATE ciclos_comissao
         SET status = 'nf_aprovada',
             nf_aprovada_em = NOW(),
             atualizado_em = NOW()
         WHERE id = $1`,
        [cicloId]
      );
    } else {
      await query(
        `UPDATE ciclos_comissao
         SET status = 'fechado',
             nf_rejeitada_em = NOW(),
             nf_motivo_rejeicao = $2,
             nf_path = NULL,
             nf_nome_arquivo = NULL,
             nf_enviada_em = NULL,
             atualizado_em = NOW()
         WHERE id = $1`,
        [cicloId, motivo!.trim()]
      );
    }

    // Auditoria
    try {
      const { registrarAuditoria } = await import('@/lib/db/comissionamento/auditoria');
      await registrarAuditoria({
        tabela: 'ciclos_comissao',
        registro_id: cicloId,
        status_anterior: 'nf_enviada',
        status_novo: acao === 'aprovar' ? 'nf_aprovada' : 'fechado',
        triggador: 'suporte_action',
        motivo: acao === 'aprovar'
          ? `NF aprovada pelo suporte (${session.cpf})`
          : `NF rejeitada pelo suporte (${session.cpf}): ${motivo}`,
        criado_por_cpf: session.cpf ?? null,
      });
    } catch (auditErr) {
      console.warn('[suporte/ciclos/nf] Auditoria best-effort:', auditErr);
    }

    return NextResponse.json({
      success: true,
      acao,
      ciclo_id: cicloId,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message?.includes('não autorizado') || e.message?.includes('Acesso negado')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.error('[API suporte/comissoes/ciclos/nf] Erro:', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
