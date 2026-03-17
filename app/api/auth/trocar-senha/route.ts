import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import {
  registrarAuditoria,
  extrairContextoRequisicao,
} from '@/lib/auditoria/auditoria';
import { rateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { assertRoles, ROLES, isApiError } from '@/lib/authorization/policies';

export const dynamic = 'force-dynamic';

const SENHA_MIN_LENGTH = 8;

/**
 * POST /api/auth/trocar-senha
 * Troca de senha obrigatória no primeiro acesso (gestores e RH).
 * Body: { senha_atual: string, nova_senha: string }
 */
export async function POST(request: Request) {
  // Rate limiting
  const rateLimitResult = rateLimit(RATE_LIMIT_CONFIGS.auth)(request as any);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  const contextoRequisicao = extrairContextoRequisicao(request);

  try {
    const session = getSession();
    assertRoles(session, [ROLES.RH, ROLES.GESTOR]);

    const { perfil, cpf } = session;

    const body = await request.json();
    const { senha_atual, nova_senha } = body;

    if (!senha_atual || typeof senha_atual !== 'string') {
      return NextResponse.json(
        { error: 'Senha atual é obrigatória' },
        { status: 400 }
      );
    }

    if (!nova_senha || typeof nova_senha !== 'string') {
      return NextResponse.json(
        { error: 'Nova senha é obrigatória' },
        { status: 400 }
      );
    }

    if (nova_senha.length < SENHA_MIN_LENGTH) {
      return NextResponse.json(
        {
          error: `Nova senha deve ter no mínimo ${SENHA_MIN_LENGTH} caracteres`,
        },
        { status: 400 }
      );
    }

    if (senha_atual === nova_senha) {
      return NextResponse.json(
        { error: 'A nova senha deve ser diferente da senha atual' },
        { status: 400 }
      );
    }

    // Buscar hash atual na tabela correta
    let tabelaSenha: string;
    let campoId: string;
    let idValue: number | undefined;

    if (perfil === 'gestor') {
      tabelaSenha = 'entidades_senhas';
      campoId = 'entidade_id';
      idValue = session.entidade_id;
    } else {
      tabelaSenha = 'clinicas_senhas';
      campoId = 'clinica_id';
      idValue = session.clinica_id;
    }

    if (!idValue) {
      return NextResponse.json(
        { error: 'Erro de configuração da sessão. Faça login novamente.' },
        { status: 400 }
      );
    }

    const senhaResult = await query(
      `SELECT senha_hash FROM ${tabelaSenha} WHERE cpf = $1 AND ${campoId} = $2`,
      [cpf, idValue]
    );

    if (senhaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registro de senha não encontrado. Contate o administrador.' },
        { status: 404 }
      );
    }

    const hashAtual = senhaResult.rows[0].senha_hash;

    // Validar senha atual
    const senhaAtualValida = await bcrypt.compare(senha_atual, hashAtual);
    if (!senhaAtualValida) {
      try {
        await registrarAuditoria({
          entidade_tipo: 'usuario',
          entidade_id: idValue,
          acao: 'login_falha',
          usuario_cpf: cpf,
          metadados: { motivo: 'senha_atual_incorreta_troca', perfil },
          ...contextoRequisicao,
        });
      } catch (err) {
        console.warn('[TROCAR_SENHA] Falha ao registrar auditoria:', err);
      }

      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 401 }
      );
    }

    // Hash da nova senha e atualizar
    const novoHash = await bcrypt.hash(nova_senha, 12);

    await query(
      `UPDATE ${tabelaSenha}
       SET senha_hash = $1, primeira_senha_alterada = true, atualizado_em = CURRENT_TIMESTAMP
       WHERE cpf = $2 AND ${campoId} = $3`,
      [novoHash, cpf, idValue]
    );

    // Auditoria de sucesso
    try {
      await registrarAuditoria({
        entidade_tipo: 'usuario',
        entidade_id: idValue,
        acao: 'atualizar',
        usuario_cpf: cpf,
        metadados: { operacao: 'trocar_senha_primeiro_acesso', perfil },
        ...contextoRequisicao,
      });
    } catch (err) {
      console.warn('[TROCAR_SENHA] Falha ao registrar auditoria:', err);
    }

    console.log(
      `[TROCAR_SENHA] ✅ Senha alterada com sucesso para ${perfil} CPF ${cpf}`
    );

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('[TROCAR_SENHA] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
