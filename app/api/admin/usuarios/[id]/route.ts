/**
 * PATCH /api/admin/usuarios/[id]
 *
 * Ativa ou inativa um usuário do sistema (suporte/comercial).
 * Apenas admin pode executar.
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
    const session = await requireRole('admin', false);

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

    // Buscar usuário antes de alterar (para auditoria e validação)
    const existingRes = await query<{
      id: number;
      cpf: string;
      nome: string;
      tipo_usuario: string;
      ativo: boolean;
    }>(
      `SELECT id, cpf, nome, tipo_usuario, ativo
       FROM usuarios
       WHERE id = $1 AND tipo_usuario IN ('suporte', 'comercial', 'emissor')
       LIMIT 1`,
      [id],
      session
    );

    if (existingRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado ou perfil não permitido' },
        { status: 404 }
      );
    }

    const usuario = existingRes.rows[0];

    if (usuario.ativo === ativo) {
      return NextResponse.json({
        success: true,
        message: `Usuário já está ${ativo ? 'ativo' : 'inativo'}`,
        ativo,
      });
    }

    await query(
      `UPDATE usuarios
       SET ativo = $1, atualizado_em = now()
       WHERE id = $2`,
      [ativo, id],
      session
    );

    const { ipAddress, userAgent } = extractRequestInfo(request);
    await logAudit(
      {
        action: ativo ? 'ACTIVATE' : 'DEACTIVATE',
        resource: 'usuarios',
        resourceId: usuario.cpf,
        oldData: { ativo: usuario.ativo },
        newData: { ativo },
        details: `Admin ${ativo ? 'ativou' : 'inativou'} usuário ${usuario.nome} (${usuario.tipo_usuario})`,
        ipAddress,
        userAgent,
      },
      session
    ).catch((e) => console.warn('[AUDIT] Erro ao registrar auditoria:', e));

    return NextResponse.json({
      success: true,
      ativo,
      message: `Usuário ${ativo ? 'ativado' : 'inativado'} com sucesso`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    console.error('[PATCH /api/admin/usuarios/[id]]', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
