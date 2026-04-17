/**
 * PATCH /api/comercial/representantes/[id]/toggle-ativo
 *
 * Ativa ou inativa o acesso de um representante ao sistema.
 * Comercial ou admin podem executar.
 * Não altera o status de negócio (representantes.status).
 *
 * Body: { ativo: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { logAudit, extractRequestInfo } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  ativo: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'admin'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const raw = await request.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos: ativo deve ser boolean' },
        { status: 400 }
      );
    }

    const { ativo } = parsed.data;

    // Buscar representante antes de alterar (auditoria + validação + ownership)
    const existingRes = await query<{
      id: number;
      cpf: string | null;
      nome: string;
      status: string;
      ativo: boolean;
    }>(
      `SELECT id, cpf, nome, status, ativo
       FROM representantes
       WHERE id = $1
         AND ($2::varchar IS NULL OR gestor_comercial_cpf = $2)
       LIMIT 1`,
      [id, session.perfil === 'comercial' ? session.cpf : null],
      session
    );

    if (existingRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );
    }

    const rep = existingRes.rows[0];

    if (rep.ativo === ativo) {
      return NextResponse.json({
        success: true,
        message: `Representante já está ${ativo ? 'ativo' : 'inativo'}`,
        ativo,
      });
    }

    await query(
      `UPDATE representantes
       SET ativo = $1, atualizado_em = now()
       WHERE id = $2`,
      [ativo, id],
      session
    );

    const { ipAddress, userAgent } = extractRequestInfo(request);
    await logAudit(
      {
        action: ativo ? 'ACTIVATE' : 'DEACTIVATE',
        resource: 'representantes',
        resourceId: String(id),
        oldData: { ativo: rep.ativo },
        newData: { ativo },
        details: `Comercial ${ativo ? 'ativou' : 'inativou'} acesso de representante ${rep.nome}`,
        ipAddress,
        userAgent,
      },
      session
    ).catch((e) => console.warn('[AUDIT] Erro ao registrar auditoria:', e));

    return NextResponse.json({
      success: true,
      ativo,
      message: `Representante ${ativo ? 'ativado' : 'inativado'} com sucesso`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    console.error(
      '[PATCH /api/comercial/representantes/[id]/toggle-ativo]',
      error
    );
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
