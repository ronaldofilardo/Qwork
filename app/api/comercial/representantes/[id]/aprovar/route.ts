/**
 * POST /api/comercial/representantes/[id]/aprovar
 *
 * Permite ao comercial verificar ou rejeitar um lead de cadastro de representante
 * que chegou via landing page (representantes_cadastro_leads).
 *
 * Body: { acao: 'verificar' | 'rejeitar', observacao?: string }
 *
 * - verificar: status → 'verificado' (aguarda ativação manual)
 * - rejeitar: status → 'rejeitado'
 *
 * Acesso: comercial, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  acao: z.enum(['verificar', 'rejeitar']),
  observacao: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'admin'], false);

    const leadId = params.id;
    // UUID validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leadId)) {
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

    const { acao, observacao } = parsed.data;

    // Verificar que o lead existe e está em um status que permite ação
    const leadCheck = await query(
      `SELECT id, nome, email, status
       FROM representantes_cadastro_leads
       WHERE id = $1
       LIMIT 1`,
      [leadId]
    );
    if (leadCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cadastro não encontrado' },
        { status: 404 }
      );
    }

    const lead = leadCheck.rows[0];
    const statusAtual = lead.status as string;

    // Impedir reprocessamento de leads já finalizados
    if (['verificado', 'rejeitado', 'ativo'].includes(statusAtual)) {
      return NextResponse.json(
        {
          error: `Cadastro já está com status '${statusAtual}' e não pode ser alterado`,
          code: 'STATUS_FINAL',
        },
        { status: 409 }
      );
    }

    const novoStatus = acao === 'verificar' ? 'verificado' : 'rejeitado';
    const operadorCpf = (session as { cpf?: string }).cpf ?? 'desconhecido';

    // Atualizar status do lead
    await query(
      `UPDATE representantes_cadastro_leads
       SET status = $1,
           observacao_comercial = $2,
           verificado_por_cpf = $3,
           verificado_em = NOW(),
           updated_at = NOW()
       WHERE id = $4`,
      [novoStatus, observacao ?? null, operadorCpf, leadId]
    );

    console.info(
      `[APROVAR-REP] Lead ${leadId} (${lead.nome} / ${lead.email}) → ${novoStatus} por ${operadorCpf}`
    );

    return NextResponse.json({
      success: true,
      lead_id: leadId,
      status: novoStatus,
      message:
        acao === 'verificar'
          ? 'Cadastro verificado com sucesso'
          : 'Cadastro rejeitado',
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[POST /api/comercial/representantes/[id]/aprovar]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
