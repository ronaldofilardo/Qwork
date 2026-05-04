import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import {
  registrarAuditoria,
  extrairContextoRequisicao,
} from '@/lib/auditoria/auditoria';
import { NextRequest } from 'next/server';
import { rateLimitAsync, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { assertRoles, ROLES, isApiError } from '@/lib/authorization/policies';

export const dynamic = 'force-dynamic';

const SENHA_MIN_LENGTH = 8;

/**
 * POST /api/auth/trocar-senha
 * Troca de senha obrigatória no primeiro acesso (gestores e RH).
 * Body: { senha_atual: string, nova_senha: string }
 */
export async function POST(request: Request) {
  // Rate limiting distribuído (DB-backed)
  const rateLimitResult = await rateLimitAsync(
    request as unknown as NextRequest,
    RATE_LIMIT_CONFIGS.auth
  );
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
    let campoId: string | null;
    let idValue: number | undefined;

    // Primeiro, tentar buscar em usuarios (para recém-criados via contrato)
    const usuariosRes = await query(
      `SELECT senha_hash FROM usuarios WHERE cpf = $1`,
      [cpf]
    );

    if (usuariosRes.rows.length > 0 && usuariosRes.rows[0].senha_hash) {
      tabelaSenha = 'usuarios';
      campoId = null; // usuarios não usa campoId adicional
      idValue = undefined;
      console.log('[TROCAR_SENHA] Encontrado em usuarios');
    } else if (perfil === 'gestor') {
      tabelaSenha = 'entidades_senhas';
      campoId = 'entidade_id';
      idValue = session.entidade_id;
    } else {
      tabelaSenha = 'clinicas_senhas';
      campoId = 'clinica_id';
      idValue = session.clinica_id;
    }

    if (!tabelaSenha) {
      return NextResponse.json(
        { error: 'Erro de configuração da sessão. Faça login novamente.' },
        { status: 400 }
      );
    }

    let senhaResult;
    if (tabelaSenha === 'usuarios') {
      senhaResult = await query(
        `SELECT senha_hash FROM usuarios WHERE cpf = $1`,
        [cpf]
      );
    } else {
      if (!idValue) {
        return NextResponse.json(
          { error: 'Erro de configuração da sessão. Faça login novamente.' },
          { status: 400 }
        );
      }
      senhaResult = await query(
        `SELECT senha_hash FROM ${tabelaSenha} WHERE cpf = $1 AND ${campoId} = $2`,
        [cpf, idValue]
      );
    }

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

    if (tabelaSenha === 'usuarios') {
      await query(
        `UPDATE usuarios
         SET senha_hash = $1, primeira_senha_alterada = true, atualizado_em = CURRENT_TIMESTAMP
         WHERE cpf = $2`,
        [novoHash, cpf]
      );

      // Sincronizar senha nas tabelas dedicadas de autenticação.
      // RH autentica via clinicas_senhas e gestor via entidades_senhas — se apenas
      // usuarios for atualizado, o próximo login falhará (hash provisório ainda lá)
      // e primeira_senha_alterada continuará false → loop infinito de /trocar-senha.
      // Padrão idêntico ao já adotado em /api/admin/reset-senha/confirmar.
      if (perfil === 'rh' && session.clinica_id) {
        await query(
          `INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada)
           VALUES ($1, $2, $3, TRUE)
           ON CONFLICT (cpf, clinica_id)
           DO UPDATE SET senha_hash = $3, primeira_senha_alterada = TRUE`,
          [session.clinica_id, cpf, novoHash]
        );
      } else if (perfil === 'gestor' && session.entidade_id) {
        await query(
          `INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, primeira_senha_alterada)
           VALUES ($1, $2, $3, TRUE)
           ON CONFLICT (cpf, entidade_id)
           DO UPDATE SET senha_hash = $3, primeira_senha_alterada = TRUE`,
          [session.entidade_id, cpf, novoHash]
        );
      }
    } else {
      await query(
        `UPDATE ${tabelaSenha}
         SET senha_hash = $1, primeira_senha_alterada = true, atualizado_em = CURRENT_TIMESTAMP
         WHERE cpf = $2 AND ${campoId} = $3`,
        [novoHash, cpf, idValue]
      );
    }

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
