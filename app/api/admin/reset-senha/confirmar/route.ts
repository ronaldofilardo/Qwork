/**
 * POST /api/admin/reset-senha/confirmar
 *
 * Rota PÚBLICA — o usuário confirma sua nova senha usando o token recebido.
 * Não requer autenticação (usuário está inativo aguardando criar nova senha).
 *
 * Body: { token: string, senha: string, confirmacao: string }
 * Resposta: { success: true } | { error: string }
 *
 * Efeito colateral:
 *   - Atualiza senha_hash
 *   - Ativa o usuário (ativo = true / status = 'ativo')
 *   - Marca token como usado (reset_usado_em = NOW())
 *   - Zera reset_token (anula o link)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

function verificarEstado(
  usadoEm: string | null | undefined,
  expiraEm: string | null,
  tentativas: number
): string | null {
  if (usadoEm) {
    return 'Este link já foi utilizado. Solicite um novo reset ao administrador.';
  }
  if (!expiraEm || new Date(expiraEm) < new Date()) {
    return 'Este link expirou. Solicite um novo reset ao administrador.';
  }
  if (tentativas >= 3) {
    return 'Link bloqueado por excesso de tentativas. Solicite um novo reset ao administrador.';
  }
  return null;
}

const BodySchema = z.object({
  token: z.string().length(64),
  senha: z.string().min(1),
  confirmacao: z.string().min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const raw = await request.json();
    const parsed = BodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { token, senha, confirmacao } = parsed.data;

    if (senha !== confirmacao) {
      return NextResponse.json(
        { error: 'Senha e confirmação não conferem' },
        { status: 400 }
      );
    }

    // Regras de complexidade — padrão do projeto
    if (senha.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }
    if (!/[A-Z]/.test(senha)) {
      return NextResponse.json(
        { error: 'Senha deve conter pelo menos uma letra maiúscula' },
        { status: 400 }
      );
    }
    if (!/[0-9]/.test(senha)) {
      return NextResponse.json(
        { error: 'Senha deve conter pelo menos um número' },
        { status: 400 }
      );
    }

    // ─── Tabela `usuarios` ────────────────────────────────────────────────────
    const usuarioRes = await query<{
      cpf: string;
      nome: string;
      tipo_usuario: string;
      entidade_id: number | null;
      clinica_id: number | null;
      reset_token_expira_em: string | null;
      reset_tentativas_falhas: number;
      reset_usado_em: string | null;
    }>(
      `SELECT cpf, nome, tipo_usuario, entidade_id, clinica_id,
              reset_token_expira_em, reset_tentativas_falhas, reset_usado_em
       FROM usuarios
       WHERE reset_token = $1
       FOR UPDATE`,
      [token]
    );

    if (usuarioRes.rows.length > 0) {
      const u = usuarioRes.rows[0];

      const erroEstado = verificarEstado(
        u.reset_usado_em,
        u.reset_token_expira_em,
        u.reset_tentativas_falhas
      );
      if (erroEstado) {
        return NextResponse.json({ error: erroEstado }, { status: 400 });
      }

      const senhaHash = await bcrypt.hash(senha, 12);

      await query(
        `UPDATE usuarios
         SET senha_hash              = $1,
             ativo                   = true,
             reset_token             = NULL,
             reset_token_expira_em   = NULL,
             reset_usado_em          = NOW(),
             reset_tentativas_falhas = 0
         WHERE cpf = $2`,
        [senhaHash, u.cpf]
      );

      // ── Sincronizar senha na tabela de autenticação dedicada ─────────────
      // Gestores e RH autenticam via tabelas separadas (entidades_senhas /
      // clinicas_senhas). A senha precisa ser gravada lá também, caso contrário
      // o login falha porque a rota de login ignora usuarios.senha_hash para
      // esses perfis.
      if (u.tipo_usuario === 'gestor' && u.entidade_id) {
        await query(
          `INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, primeira_senha_alterada)
           VALUES ($1, $2, $3, TRUE)
           ON CONFLICT (cpf, entidade_id)
           DO UPDATE SET senha_hash = $3, primeira_senha_alterada = TRUE`,
          [u.entidade_id, u.cpf, senhaHash]
        );
      } else if (u.tipo_usuario === 'rh' && u.clinica_id) {
        await query(
          `INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada)
           VALUES ($1, $2, $3, TRUE)
           ON CONFLICT (cpf, clinica_id)
           DO UPDATE SET senha_hash = $3, primeira_senha_alterada = TRUE`,
          [u.clinica_id, u.cpf, senhaHash]
        );
      }

      return NextResponse.json({ success: true });
    }

    // ─── Tabela `representantes` ──────────────────────────────────────────────
    const repRes = await query<{
      id: number;
      nome: string;
      cpf: string | null;
      cpf_responsavel_pj: string | null;
      reset_token_expira_em: string | null;
      reset_tentativas_falhas: number;
      reset_usado_em: string | null;
    }>(
      `SELECT id, nome, cpf, cpf_responsavel_pj,
              reset_token_expira_em, reset_tentativas_falhas, reset_usado_em
       FROM representantes
       WHERE reset_token = $1
       FOR UPDATE`,
      [token]
    );

    if (repRes.rows.length > 0) {
      const r = repRes.rows[0];

      const erroEstado = verificarEstado(
        r.reset_usado_em,
        r.reset_token_expira_em,
        r.reset_tentativas_falhas
      );
      if (erroEstado) {
        return NextResponse.json({ error: erroEstado }, { status: 400 });
      }

      const senhaHash = await bcrypt.hash(senha, 12);
      const repCpf = r.cpf || r.cpf_responsavel_pj || '';

      // Atualiza senha na tabela dedicada representantes_senhas
      await query(
        `INSERT INTO public.representantes_senhas (representante_id, cpf, senha_hash, primeira_senha_alterada)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (representante_id, cpf)
         DO UPDATE SET senha_hash = $3, primeira_senha_alterada = TRUE, atualizado_em = NOW()`,
        [r.id, repCpf, senhaHash]
      );

      // Reativar representante e limpar token
      await query(
        `UPDATE representantes
         SET status                  = 'ativo',
             reset_token             = NULL,
             reset_token_expira_em   = NULL,
             reset_usado_em          = NOW(),
             reset_tentativas_falhas = 0
         WHERE id = $1`,
        [r.id]
      );

      return NextResponse.json({ success: true });
    }

    // Token não encontrado
    // Incrementar tentativas falhas em ambas as tabelas (segurança)
    // Não fazer alterações — token inexistente não há o que incrementar
    return NextResponse.json(
      { error: 'Token inválido ou expirado' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[POST /api/admin/reset-senha/confirmar]', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
