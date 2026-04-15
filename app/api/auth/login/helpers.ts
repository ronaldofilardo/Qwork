import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';
import { registrarAuditoria } from '@/lib/auditoria/auditoria';

type ContextoRequisicao = Record<string, unknown>;

/**
 * Trata o fluxo de login de representantes.
 * Chamado quando o usuário não é encontrado em `funcionarios` nem em `usuarios`.
 */
export async function handleRepresentanteLogin(
  cpf: string,
  senha: string | undefined,
  contextoRequisicao: ContextoRequisicao
): Promise<NextResponse> {
  const repResult = await query(
    `SELECT id, nome, email, cpf, cpf_responsavel_pj, codigo, senha_hash, senha_repres, status, tipo_pessoa, ativo
     FROM representantes
     WHERE cpf = $1 OR cpf_responsavel_pj = $1
     LIMIT 1`,
    [cpf]
  );

  const repRows = repResult && repResult.rows ? repResult.rows : [];

  if (repRows.length === 0) {
    console.log(`[LOGIN] Usuário não encontrado em nenhuma tabela: ${cpf}`);
    return NextResponse.json(
      { error: 'CPF ou senha inválidos' },
      { status: 401 }
    );
  }

  const rep = repRows[0];
  console.log(`[LOGIN] Representante encontrado:`, {
    id: rep.id,
    nome: rep.nome,
    status: rep.status,
    tipo_pessoa: rep.tipo_pessoa,
  });

  const statusBloqueados = ['desativado', 'rejeitado'];
  if (statusBloqueados.includes(rep.status)) {
    try {
      await registrarAuditoria({
        entidade_tipo: 'login',
        acao: 'login_falha',
        usuario_cpf: cpf,
        metadados: { motivo: 'representante_inativo', status: rep.status },
        ...contextoRequisicao,
      });
    } catch (err) {
      console.warn('[LOGIN] Falha ao registrar auditoria (rep_inativo):', err);
    }
    return NextResponse.json(
      {
        error:
          'Conta desativada ou rejeitada. Entre em contato com o administrador.',
      },
      { status: 403 }
    );
  }

  // Verificar se o acesso está bloqueado pelo comercial (ativo=false)
  if (rep.ativo === false) {
    try {
      await registrarAuditoria({
        entidade_tipo: 'login',
        acao: 'login_falha',
        usuario_cpf: cpf,
        metadados: { motivo: 'representante_acesso_bloqueado' },
        ...contextoRequisicao,
      });
    } catch (err) {
      console.warn(
        '[LOGIN] Falha ao registrar auditoria (rep_bloqueado):',
        err
      );
    }
    return NextResponse.json(
      {
        error: 'Usuário inativo. Entre em contato com o administrador.',
      },
      { status: 403 }
    );
  }

  if (rep.status === 'aguardando_senha') {
    return NextResponse.json(
      {
        error:
          'Você ainda não criou sua senha. Verifique seu e-mail e acesse o link de convite enviado pelo administrador.',
      },
      { status: 403 }
    );
  }

  if (rep.status === 'expirado') {
    return NextResponse.json(
      {
        error:
          'Seu link de convite expirou. Entre em contato com o administrador para receber um novo convite.',
      },
      { status: 403 }
    );
  }

  if (!senha) {
    return NextResponse.json({ error: 'Senha é obrigatória' }, { status: 400 });
  }

  let senhaRepValida = false;
  let primeiraSenhaAlterada = true; // default: não forçar troca

  // Tentar validar com representantes_senhas (nova tabela) primeiro
  const repSenhaResult = await query(
    `SELECT senha_hash, primeira_senha_alterada FROM public.representantes_senhas
     WHERE representante_id = $1 LIMIT 1`,
    [rep.id]
  );

  if (repSenhaResult.rows.length > 0) {
    primeiraSenhaAlterada =
      repSenhaResult.rows[0].primeira_senha_alterada ?? true;

    if (repSenhaResult.rows[0].senha_hash) {
      senhaRepValida = await bcrypt.compare(
        senha,
        repSenhaResult.rows[0].senha_hash
      );
    } else if (rep.senha_repres) {
      senhaRepValida = await bcrypt.compare(senha, rep.senha_repres);
    } else if (rep.senha_hash) {
      senhaRepValida = await bcrypt.compare(senha, rep.senha_hash);
    }
  } else if (rep.senha_repres) {
    senhaRepValida = await bcrypt.compare(senha, rep.senha_repres);
  } else if (rep.senha_hash) {
    senhaRepValida = await bcrypt.compare(senha, rep.senha_hash);
  } else {
    console.error(
      `[LOGIN] Representante ${rep.id} sem senha_hash nem senha_repres — execute a migration 510/520 e o seed`
    );
    return NextResponse.json(
      { error: 'Erro de configuração. Contate o administrador.' },
      { status: 500 }
    );
  }

  if (!senhaRepValida) {
    try {
      await registrarAuditoria({
        entidade_tipo: 'login',
        acao: 'login_falha',
        usuario_cpf: cpf,
        metadados: { motivo: 'senha_invalida_representante' },
        ...contextoRequisicao,
      });
    } catch (err) {
      console.warn(
        '[LOGIN] Falha ao registrar auditoria (rep_senha_invalida):',
        err
      );
    }
    return NextResponse.json(
      { error: 'CPF ou senha inválidos' },
      { status: 401 }
    );
  }

  createSession({
    cpf: rep.cpf || rep.cpf_responsavel_pj,
    nome: rep.nome,
    perfil: 'representante' as any,
    representante_id: rep.id,
  });

  // Registrar acesso em session_logs para auditoria de acesso
  try {
    const ipForDb =
      (contextoRequisicao.ip_address as string | undefined) === 'unknown'
        ? null
        : ((contextoRequisicao.ip_address as string | undefined) ?? null);
    const sessionLogResult = await query(
      `INSERT INTO session_logs (cpf, perfil, clinica_id, empresa_id, ip_address, user_agent)
       VALUES ($1, 'representante', NULL, NULL, $2, $3)
       RETURNING id`,
      [
        rep.cpf || rep.cpf_responsavel_pj,
        ipForDb,
        (contextoRequisicao.user_agent as string | undefined) ?? null,
      ]
    );
    if (sessionLogResult.rows[0]?.id) {
      createSession({
        cpf: rep.cpf || rep.cpf_responsavel_pj,
        nome: rep.nome,
        perfil: 'representante' as any,
        representante_id: rep.id,
        sessionLogId: sessionLogResult.rows[0].id,
      });
    }
  } catch (err) {
    console.warn(
      '[LOGIN] Falha ao registrar session_log para representante:',
      err
    );
  }

  try {
    await registrarAuditoria({
      entidade_tipo: 'login',
      acao: 'login_sucesso',
      usuario_cpf: cpf,
      usuario_perfil: 'representante',
      metadados: { representante_id: rep.id, tipo_pessoa: rep.tipo_pessoa },
      ...contextoRequisicao,
    });
  } catch (err) {
    console.warn(
      '[LOGIN] Falha ao registrar auditoria (rep_login_sucesso):',
      err
    );
  }

  console.log(`[LOGIN] Sessão criada para representante #${rep.id}`);

  // Verificar se representante precisa trocar senha no primeiro acesso
  const precisaTrocarSenha = !primeiraSenhaAlterada;

  return NextResponse.json({
    success: true,
    cpf: rep.cpf || rep.cpf_responsavel_pj,
    nome: rep.nome,
    perfil: 'representante',
    termosPendentes: { termos_uso: false, politica_privacidade: false },
    precisaTrocarSenha,
    redirectTo: '/representante/dashboard',
  });
}

/**
 * Valida senha de funcionário via data de nascimento.
 * Retorna null se válida (continue o login), ou NextResponse de erro.
 */
export async function validarSenhaFuncionario(
  senhaHash: string | null,
  data_nascimento: string,
  senha: string | undefined,
  cpf: string,
  tomadorId: number | null,
  tipoUsuario: string,
  contextoRequisicao: ContextoRequisicao
): Promise<NextResponse | null> {
  if (!senhaHash) {
    console.error(
      `[LOGIN] senhaHash não encontrado para funcionário CPF ${cpf}`
    );
    return NextResponse.json(
      { error: 'Configuração de senha inválida. Contate o administrador.' },
      { status: 500 }
    );
  }

  console.log(
    '[LOGIN] Funcionário com data de nascimento - validando contra hash armazenado'
  );

  try {
    const senhaEsperada = gerarSenhaDeNascimento(data_nascimento);
    console.log(
      '[LOGIN] Senha gerada a partir de data_nascimento, comparando hash...'
    );
    console.log(`[LOGIN] DEBUG - senhaEsperada: ${senhaEsperada}`);
    console.log(
      `[LOGIN] DEBUG - senhaHash existe: ${!!senhaHash}, primeiros 10 chars: ${senhaHash?.substring(0, 10)}`
    );

    const senhaValida = await bcrypt.compare(senhaEsperada, senhaHash);
    console.log(`[LOGIN] Senha válida: ${senhaValida}`);

    if (!senhaValida) {
      try {
        await registrarAuditoria({
          entidade_tipo: 'login',
          entidade_id: tomadorId,
          acao: 'login_falha',
          usuario_cpf: cpf,
          metadados: {
            motivo: 'data_nascimento_invalida',
            tipo_usuario: tipoUsuario,
          },
          ...contextoRequisicao,
        });
      } catch (err) {
        console.warn(
          '[LOGIN] Falha ao registrar auditoria (data_nascimento_invalida):',
          err
        );
      }
      return NextResponse.json(
        { error: 'Data de nascimento inválida' },
        { status: 401 }
      );
    }

    return null; // Válida — prosseguir com criação de sessão
  } catch (error) {
    console.error(
      '[LOGIN] Erro ao gerar/validar senha de data_nascimento:',
      error
    );
    console.warn(
      '[LOGIN] ⚠️ Data de nascimento inválida ou em formato inválido no banco. Tentando login com senha normal se disponível...'
    );

    if (senha && senhaHash) {
      console.log(
        '[LOGIN] Tentando validação com senha normal após falha em data_nascimento...'
      );
      try {
        const senhaValida = await bcrypt.compare(senha, senhaHash);
        if (senhaValida) {
          console.log(
            '[LOGIN] Login bem-sucedido com senha normal (fallback após erro em data_nascimento)'
          );
          return null; // válida via fallback
        } else {
          return NextResponse.json(
            { error: 'Senha inválida' },
            { status: 401 }
          );
        }
      } catch (fallbackError) {
        console.error(
          '[LOGIN] Erro no fallback com senha normal:',
          fallbackError
        );
        try {
          await registrarAuditoria({
            entidade_tipo: 'login',
            entidade_id: tomadorId,
            acao: 'login_falha',
            usuario_cpf: cpf,
            metadados: {
              motivo: 'data_nascimento_formato_invalido_e_sem_senha',
              tipo_usuario: tipoUsuario,
            },
            ...contextoRequisicao,
          });
        } catch (err) {
          console.warn('[LOGIN] Falha ao registrar auditoria:', err);
        }
        return NextResponse.json(
          {
            error:
              'Data de nascimento em formato inválido ou senha não fornecida',
          },
          { status: 401 }
        );
      }
    } else {
      try {
        await registrarAuditoria({
          entidade_tipo: 'login',
          entidade_id: tomadorId,
          acao: 'login_falha',
          usuario_cpf: cpf,
          metadados: {
            motivo: 'data_nascimento_formato_invalido',
            tipo_usuario: tipoUsuario,
          },
          ...contextoRequisicao,
        });
      } catch (err) {
        console.warn('[LOGIN] Falha ao registrar auditoria:', err);
      }
      return NextResponse.json(
        { error: 'Data de nascimento em formato inválido' },
        { status: 401 }
      );
    }
  }
}
