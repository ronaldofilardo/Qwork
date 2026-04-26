/**
 * POST /api/suporte/representantes/reset-senha
 *
 * Suporte reseta a senha de um representante via CPF.
 * Efeito: seta `primeira_senha_alterada = false` em `representantes_senhas`,
 * forçando que, no próximo login, o representante seja direcionado a criar uma nova senha.
 * Preserva a senha_hash atual (acesso ainda funciona com a senha antiga,
 * porém é redirecionado para troca obrigatória).
 *
 * Body: { cpf: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { logAudit, extractRequestInfo } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  cpf: z
    .string()
    .min(11)
    .max(14)
    .transform((v) => v.replace(/\D/g, '')),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole('suporte', false);

    const raw = await request.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    const { cpf } = parsed.data;

    if (cpf.length !== 11) {
      return NextResponse.json(
        { error: 'CPF deve ter 11 dígitos' },
        { status: 400 }
      );
    }

    // Buscar representante pelo CPF (PF ou responsável PJ)
    const repRes = await query<{
      id: number;
      nome: string;
      cpf: string | null;
      cpf_responsavel_pj: string | null;
      status: string;
      ativo: boolean;
    }>(
      `SELECT id, nome, cpf, cpf_responsavel_pj, status, ativo
       FROM representantes
       WHERE cpf = $1 OR cpf_responsavel_pj = $1
       LIMIT 1`,
      [cpf],
      session
    );

    if (repRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado com o CPF informado' },
        { status: 404 }
      );
    }

    const rep = repRes.rows[0];

    // Bloquear reset para representantes definitivamente desativados/rejeitados
    if (['desativado', 'rejeitado'].includes(rep.status)) {
      return NextResponse.json(
        {
          error: `Não é possível resetar senha de representante com status "${rep.status}"`,
        },
        { status: 409 }
      );
    }

    // UPSERT em representantes_senhas: marcar primeira_senha_alterada = false
    // Preserva senha_hash existente — o representante ainda pode logar com a senha atual,
    // mas será redirecionado para criar uma nova senha
    await query(
      `INSERT INTO public.representantes_senhas (representante_id, cpf, senha_hash, primeira_senha_alterada)
       VALUES ($1, $2, NULL, FALSE)
       ON CONFLICT (representante_id, cpf)
       DO UPDATE SET primeira_senha_alterada = FALSE, atualizado_em = CURRENT_TIMESTAMP`,
      [rep.id, cpf],
      session
    );

    const { ipAddress, userAgent } = extractRequestInfo(request);
    await logAudit(
      {
        action: 'UPDATE',
        resource: 'representantes_senhas',
        resourceId: String(rep.id),
        details: `Suporte resetou senha do representante ${rep.nome} (id: ${rep.id}). Troca obrigatória no próximo login.`,
        ipAddress,
        userAgent,
      },
      session
    ).catch((e) => console.warn('[AUDIT] Erro ao registrar auditoria:', e));

    return NextResponse.json({
      success: true,
      nome: rep.nome,
      message:
        'Senha resetada. No próximo login, o representante deverá criar uma nova senha.',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    console.error('[POST /api/suporte/representantes/reset-senha]', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
