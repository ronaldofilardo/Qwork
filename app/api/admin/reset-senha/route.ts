/**
 * POST /api/admin/reset-senha
 *
 * Admin inicia o reset de senha de um usuário com perfil especial.
 * Perfis suportados: suporte, comercial, rh, gestor (tabela usuarios)
 *
 * Body: { cpf: string }
 * Resposta: { success: true, link: string, nome: string, perfil: string }
 *
 * Efeito colateral:
 *   - Usuários da tabela `usuarios` → ativo = false
 *
 * IMPORTANTE:
 *   - Reset de senha de representantes é EXCLUSIVO do suporte
 *     via /api/suporte/representantes/reset-senha
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query, transaction } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { logAudit, extractRequestInfo } from '@/lib/audit';
import {
  PERFIS_RESET_USUARIOS,
  gerarTokenResetUsuario,
  logEmailResetSenha,
} from '@/lib/reset-senha/gerar-token';
import { checkCpfUnicoSistema } from '@/lib/validators/cpf-unico';

// reqId não está na assinatura de extractRequestInfo — usar apenas ipAddress/userAgent

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
    const session = await requireRole('admin', false);

    const raw = await request.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    const { cpf } = parsed.data;

    // Validação de CPF (11 dígitos numéricos)
    if (cpf.length !== 11) {
      return NextResponse.json(
        { error: 'CPF deve ter 11 dígitos' },
        { status: 400 }
      );
    }

    // 1. Verificar se é usuário na tabela `usuarios` com perfil permitido
    const usuarioRes = await query<{
      id: number;
      cpf: string;
      nome: string;
      tipo_usuario: string;
      email: string | null;
      ativo: boolean;
    }>(
      `SELECT id, cpf, nome, tipo_usuario, email, ativo
       FROM usuarios
       WHERE cpf = $1 AND tipo_usuario = ANY($2::usuario_tipo_enum[])
       LIMIT 1`,
      [cpf, PERFIS_RESET_USUARIOS],
      session
    );

    if (usuarioRes.rows.length > 0) {
      const usuario = usuarioRes.rows[0];

      // Verificar antecipadamente se há conflito cross-perfil que impediria a reativação.
      // O trigger tg_usuario_cpf_unico bloquearia o UPDATE ativo=true no confirmar/route.ts
      // caso o CPF exista em representantes, leads ativos ou outro usuario bloqueante.
      const conflito = await checkCpfUnicoSistema(cpf, {
        ignorarUsuarioId: usuario.id,
      });
      if (!conflito.disponivel) {
        return NextResponse.json(
          {
            error: `Não é possível gerar o link de reset: ${conflito.message}. Resolva o conflito de cadastro antes de prosseguir.`,
          },
          { status: 409 }
        );
      }

      const resultado = await transaction(async (tx) => {
        return gerarTokenResetUsuario(cpf, tx);
      }, session);

      logEmailResetSenha(
        resultado.nome,
        usuario.email,
        resultado.link,
        resultado.expira_em
      );

      const { ipAddress, userAgent } = extractRequestInfo(request);
      await logAudit(
        {
          action: 'DEACTIVATE',
          resource: 'usuarios',
          resourceId: usuario.cpf,
          details: `Reset de senha gerado para perfil ${usuario.tipo_usuario}. Expira em: ${resultado.expira_em.toISOString()}`,
          ipAddress,
          userAgent,
        },
        session
      ).catch((e) => console.warn('[AUDIT] Erro ao registrar auditoria:', e));

      return NextResponse.json({
        success: true,
        link: resultado.link,
        nome: resultado.nome,
        perfil: usuario.tipo_usuario,
        expira_em: resultado.expira_em.toISOString(),
      });
    }

    // 2. Verificar se o CPF pertence a um representante
    const repRes = await query<{
      id: number;
    }>(
      `SELECT id
       FROM representantes
       WHERE cpf = $1 OR cpf_responsavel_pj = $1
       LIMIT 1`,
      [cpf],
      session
    );

    if (repRes.rows.length > 0) {
      return NextResponse.json(
        {
          error:
            'Para representantes, o reset de senha deve ser realizado pelo suporte em Representantes > Lista Geral.',
        },
        { status: 403 }
      );
    }

    // CPF não encontrado em nenhuma tabela com perfil válido
    return NextResponse.json(
      {
        error:
          'Usuário não encontrado com CPF informado. Verifique se o CPF está correto e se o perfil é permitido (suporte, comercial, rh ou gestor).',
      },
      { status: 404 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    console.error('[POST /api/admin/reset-senha]', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
