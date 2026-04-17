/**
 * PATCH /api/admin/usuarios/[id]
 *
 * Atualiza um usuário do sistema (suporte/comercial/emissor/admin).
 * Apenas admin pode executar.
 *
 * Body:
 *   { ativo: boolean }              — ativa/inativa (não permitido para admin)
 *   { asaas_wallet_id: string }     — atualiza wallet Asaas (apenas admin/comercial)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { logAudit, extractRequestInfo } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const AtivoSchema = z.object({
  ativo: z.boolean(),
  asaas_wallet_id: z.undefined().optional(),
});

const WalletSchema = z.object({
  asaas_wallet_id: z.string().min(1).max(100),
  ativo: z.undefined().optional(),
});

const BodySchema = z.union([AtivoSchema, WalletSchema]);

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
        {
          error:
            'Dados inválidos: informe ativo (boolean) ou asaas_wallet_id (string)',
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const { ipAddress, userAgent } = extractRequestInfo(request);

    // ── Atualizar wallet Asaas ──────────────────────────────────────────────
    if ('asaas_wallet_id' in data && data.asaas_wallet_id !== undefined) {
      const walletId = data.asaas_wallet_id;

      const existingRes = await query<{
        id: number;
        cpf: string;
        nome: string;
        tipo_usuario: string;
        asaas_wallet_id: string | null;
      }>(
        `SELECT id, cpf, nome, tipo_usuario, asaas_wallet_id
         FROM usuarios
         WHERE id = $1 AND tipo_usuario IN ('admin', 'comercial')
         LIMIT 1`,
        [id],
        session
      );

      if (existingRes.rows.length === 0) {
        return NextResponse.json(
          {
            error: 'Usuário não encontrado ou perfil não permitido para wallet',
          },
          { status: 404 }
        );
      }

      const usuario = existingRes.rows[0];

      await query(
        `UPDATE usuarios SET asaas_wallet_id = $1, atualizado_em = now() WHERE id = $2`,
        [walletId, id],
        session
      );

      await logAudit(
        {
          action: 'UPDATE',
          resource: 'usuarios',
          resourceId: usuario.cpf,
          oldData: { asaas_wallet_id: usuario.asaas_wallet_id },
          newData: { asaas_wallet_id: walletId },
          details: `Admin atualizou wallet Asaas de ${usuario.nome} (${usuario.tipo_usuario})`,
          ipAddress,
          userAgent,
        },
        session
      ).catch((e) => console.warn('[AUDIT] Erro ao registrar auditoria:', e));

      return NextResponse.json({
        success: true,
        asaas_wallet_id: walletId,
        message: 'Wallet Asaas atualizada com sucesso',
      });
    }

    // ── Ativar / Inativar ──────────────────────────────────────────────────
    const { ativo } = data as z.infer<typeof AtivoSchema>;

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
