import { NextResponse } from 'next/server';
import { query, getDatabaseInfo } from '@/lib/db';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  registrarAuditoria,
  extrairContextoRequisicao,
} from '@/lib/auditoria/auditoria';
import { rateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  // 🔒 SEGURANÇA: Aplicar rate limiting (5 tentativas em 5 minutos)
  const rateLimitResult = rateLimit(RATE_LIMIT_CONFIGS.auth)(request as any);
  if (rateLimitResult) {
    console.warn(
      '[LOGIN] Rate limit excedido:',
      request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown'
    );
    return rateLimitResult;
  }

  const contextoRequisicao = extrairContextoRequisicao(request);

  try {
    console.log('Database info:', getDatabaseInfo());
    const { cpf, senha } = await request.json();

    // Validar entrada
    if (!cpf || !senha) {
      return NextResponse.json(
        { error: 'CPF e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // PASSO 1: Buscar usuário — suportar tabela `funcionarios` (após migração) e fallback para `usuarios`
    console.log(`[LOGIN] Buscando usuário CPF ${cpf} em funcionarios...`);
    const funcResult = await query(
      `SELECT * FROM funcionarios WHERE cpf = $1 LIMIT 1`,
      [cpf]
    );

    let usuario: any = null;
    let foundInFuncionarios = false;

    const funcRows = funcResult && funcResult.rows ? funcResult.rows : [];

    if (funcRows.length > 0) {
      foundInFuncionarios = true;
      usuario = funcRows[0];
      // Normalizar nomes de campos que podem variar após migração
      usuario.tipo_usuario =
        usuario.tipo_usuario || usuario.perfil || usuario.usuario_tipo;
      usuario.contratante_id =
        usuario.contratante_id ||
        usuario.contratanteId ||
        usuario.empresa_id ||
        usuario.empresaId;
      usuario.entidade_id = usuario.entidade_id || usuario.entidadeId || null;
      usuario.clinica_id = usuario.clinica_id || usuario.clinicaId || null;
      usuario.senha_hash =
        usuario.senha_hash || usuario.senhaHash || usuario.senha;
      console.log(`[LOGIN] Usuário encontrado em funcionarios:`, {
        cpf: usuario.cpf,
        tipo: usuario.tipo_usuario,
        contratante_id: usuario.contratante_id,
        clinica_id: usuario.clinica_id,
        entidade_id: usuario.entidade_id,
        ativo: usuario.ativo,
      });
    } else {
      console.log(
        `[LOGIN] Não encontrado em funcionarios; buscando em usuarios...`
      );
      const usuarioResult = await query(
        `SELECT cpf, nome, tipo_usuario, clinica_id, entidade_id, ativo FROM usuarios WHERE cpf = $1`,
        [cpf]
      );

      const usuarioRows =
        usuarioResult && usuarioResult.rows ? usuarioResult.rows : [];

      if (usuarioRows.length === 0) {
        console.log(`[LOGIN] Usuário não encontrado: ${cpf}`);
        return NextResponse.json(
          { error: 'CPF ou senha inválidos' },
          { status: 401 }
        );
      }

      usuario = usuarioRows[0];
      console.log(`[LOGIN] Usuário encontrado em usuarios:`, {
        cpf: usuario.cpf,
        tipo: usuario.tipo_usuario,
        clinica_id: usuario.clinica_id,
        entidade_id: usuario.entidade_id,
        ativo: usuario.ativo,
      });
    }
    console.log(`[LOGIN] Usuário encontrado:`, {
      cpf: usuario.cpf,
      tipo: usuario.tipo_usuario,
      clinica_id: usuario.clinica_id,
      entidade_id: usuario.entidade_id,
      ativo: usuario.ativo,
    });

    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      try {
        await registrarAuditoria({
          entidade_tipo: 'login',
          entidade_id: usuario.entidade_id || usuario.clinica_id,
          acao: 'login_falha',
          usuario_cpf: cpf,
          metadados: { motivo: 'usuario_inativo' },
          ...contextoRequisicao,
        });
      } catch (err) {
        console.warn(
          '[LOGIN] Falha ao registrar auditoria (usuario_inativo):',
          err
        );
      }

      return NextResponse.json(
        { error: 'Usuário inativo. Entre em contato com o administrador.' },
        { status: 403 }
      );
    }

    // PASSO 2: Buscar senha na tabela apropriada
    let senhaHash: string | null = null;
    let contratanteId: number | null = null;
    let contratanteAtivo = true;
    let pagamentoConfirmado = true;

    if (foundInFuncionarios) {
      // Usuário vindo da tabela `funcionarios`: senha já disponível na linha
      console.log(
        `[LOGIN] Usuário vindo de funcionarios; usando senha de funcionarios`
      );
      senhaHash = usuario.senha_hash;
      contratanteId = usuario.contratante_id || usuario.entidade_id || null;
      contratanteAtivo = usuario.ativo ?? true;
      pagamentoConfirmado = true;
    } else if (usuario.tipo_usuario === 'gestor') {
      // Buscar senha em entidades_senhas
      console.log(`[LOGIN] Buscando senha de gestor em entidades_senhas...`);
      const senhaResult = await query(
        `SELECT es.senha_hash, e.id, e.ativa, e.pagamento_confirmado
         FROM entidades_senhas es
         JOIN entidades e ON e.id = es.entidade_id
         WHERE es.cpf = $1 AND es.entidade_id = $2`,
        [cpf, usuario.entidade_id]
      );

      if (senhaResult.rows.length === 0) {
        console.error(
          `[LOGIN] Senha não encontrada em entidades_senhas para CPF ${cpf}`
        );
        return NextResponse.json(
          { error: 'Erro de configuração. Contate o administrador.' },
          { status: 500 }
        );
      }

      senhaHash = senhaResult.rows[0].senha_hash;
      contratanteId = senhaResult.rows[0].id;
      contratanteAtivo = senhaResult.rows[0].ativa;
      pagamentoConfirmado = senhaResult.rows[0].pagamento_confirmado;
    } else if (usuario.tipo_usuario === 'rh') {
      // Buscar senha em clinicas_senhas
      console.log(`[LOGIN] Buscando senha de RH em clinicas_senhas...`);
      // Tentativa 1: estrutura esperada (clinicas -> entidades)
      let senhaResult = await query(
        `SELECT cs.senha_hash, c.entidade_id, e.ativa, e.pagamento_confirmado
         FROM clinicas_senhas cs
         JOIN clinicas c ON c.id = cs.clinica_id
         JOIN entidades e ON e.id = c.entidade_id
         WHERE cs.cpf = $1 AND cs.clinica_id = $2`,
        [cpf, usuario.clinica_id]
      );

      // Tentativa 2: caso a migração tenha movido dados para 'contratantes'
      if (senhaResult.rows.length === 0) {
        console.warn(
          `[LOGIN] Falha busca padrão clinicas_senhas; tentando join com contratantes para CPF ${cpf}`
        );

        senhaResult = await query(
          `SELECT cs.senha_hash, c.id as entidade_id, c.ativa, c.pagamento_confirmado
           FROM clinicas_senhas cs
           JOIN contratantes c ON c.id = cs.clinica_id
           WHERE cs.cpf = $1 AND cs.clinica_id = $2`,
          [cpf, usuario.clinica_id]
        );
      }

      // Tentativa 3: fallback para tabela usuarios (caso historicamente a senha ainda esteja lá)
      if (senhaResult.rows.length === 0) {
        console.warn(
          `[LOGIN] clinicas_senhas vazia; tentando buscar senha em usuarios para CPF ${cpf}`
        );
        const uRes = await query(
          `SELECT senha_hash, clinica_id FROM usuarios WHERE cpf = $1`,
          [cpf]
        );

        if (uRes.rows.length > 0 && uRes.rows[0].senha_hash) {
          senhaHash = uRes.rows[0].senha_hash;
          contratanteId = uRes.rows[0].clinica_id || usuario.clinica_id;
          // tentar inferir ativo/pagamento como true para evitar bloqueio indevido
          contratanteAtivo = true;
          pagamentoConfirmado = true;
        } else {
          console.error(
            `[LOGIN] Senha não encontrada para RH (CPF ${cpf}) em nenhuma fonte`
          );
          return NextResponse.json(
            { error: 'Erro de configuração. Contate o administrador.' },
            { status: 500 }
          );
        }
      } else {
        senhaHash = senhaResult.rows[0].senha_hash;
        contratanteId = senhaResult.rows[0].entidade_id;
        contratanteAtivo = senhaResult.rows[0].ativa;
        pagamentoConfirmado = senhaResult.rows[0].pagamento_confirmado;
      }
    } else if (
      usuario.tipo_usuario === 'admin' ||
      usuario.tipo_usuario === 'emissor'
    ) {
      // Admin e Emissor não têm senha em tabelas de senhas
      // Por ora, permitir login sem validação de senha (pode ser melhorado)
      console.log(
        `[LOGIN] ${usuario.tipo_usuario} não valida senha (configuração temporária)`
      );

      createSession({
        cpf: usuario.cpf,
        nome: usuario.nome,
        perfil: usuario.tipo_usuario as any,
      });

      try {
        await registrarAuditoria({
          entidade_tipo: 'login',
          acao: 'login_sucesso',
          usuario_cpf: cpf,
          usuario_perfil: usuario.tipo_usuario,
          ...contextoRequisicao,
        });
      } catch (err) {
        console.warn('[LOGIN] Falha ao registrar auditoria:', err);
      }

      return NextResponse.json({
        success: true,
        cpf: usuario.cpf,
        nome: usuario.nome,
        perfil: usuario.tipo_usuario,
        redirectTo: usuario.tipo_usuario === 'admin' ? '/admin' : '/emissor',
      });
    }

    // Verificar se contratante está ativo
    if (!contratanteAtivo) {
      try {
        await registrarAuditoria({
          entidade_tipo: 'login',
          entidade_id: contratanteId,
          acao: 'login_falha',
          usuario_cpf: cpf,
          metadados: { motivo: 'contratante_inativo' },
          ...contextoRequisicao,
        });
      } catch (err) {
        console.warn(
          '[LOGIN] Falha ao registrar auditoria (contratante_inativo):',
          err
        );
      }

      return NextResponse.json(
        { error: 'Contratante inativo. Entre em contato com o administrador.' },
        { status: 403 }
      );
    }

    // Verificar pagamento (exceto admin)
    if (cpf !== '00000000000' && !pagamentoConfirmado) {
      try {
        await registrarAuditoria({
          entidade_tipo: 'login',
          entidade_id: contratanteId,
          acao: 'login_falha',
          usuario_cpf: cpf,
          metadados: { motivo: 'pagamento_nao_confirmado' },
          ...contextoRequisicao,
        });
      } catch (err) {
        console.warn(
          '[LOGIN] Falha ao registrar auditoria (pagamento_nao_confirmado):',
          err
        );
      }

      return NextResponse.json(
        {
          error:
            'Aguardando confirmação de pagamento. Verifique seu email para instruções ou contate o administrador.',
          contratante_id: contratanteId,
        },
        { status: 403 }
      );
    }

    // PASSO 3: Validar senha
    console.log('[LOGIN] Comparando senha contra hash...');
    const senhaValida = await bcrypt.compare(senha, senhaHash);
    console.log(`[LOGIN] Senha válida: ${senhaValida}`);

    if (!senhaValida) {
      try {
        await registrarAuditoria({
          entidade_tipo: 'login',
          entidade_id: contratanteId,
          acao: 'login_falha',
          usuario_cpf: cpf,
          metadados: { motivo: 'senha_invalida' },
          ...contextoRequisicao,
        });
      } catch (err) {
        console.warn(
          '[LOGIN] Falha ao registrar auditoria (senha_invalida):',
          err
        );
      }

      return NextResponse.json(
        { error: 'CPF ou senha inválidos' },
        { status: 401 }
      );
    }

    // PASSO 4: Criar sessão
    const perfil =
      usuario.tipo_usuario === 'gestor' ? 'gestor' : usuario.tipo_usuario;

    createSession({
      cpf: usuario.cpf,
      nome: usuario.nome,
      perfil: perfil as any,
      contratante_id: contratanteId,
      clinica_id: usuario.clinica_id,
      entidade_id: usuario.entidade_id,
    });

    // Registrar login bem-sucedido
    try {
      await registrarAuditoria({
        entidade_tipo: 'login',
        entidade_id: contratanteId,
        acao: 'login_sucesso',
        usuario_cpf: cpf,
        usuario_perfil: perfil,
        metadados: {
          tipo_usuario: usuario.tipo_usuario,
          clinica_id: usuario.clinica_id,
          entidade_id: usuario.entidade_id,
        },
        ...contextoRequisicao,
      });
    } catch (err) {
      console.warn(
        '[LOGIN] Falha ao registrar auditoria (login_sucesso):',
        err
      );
    }

    console.log(`[LOGIN] Sessão criada para ${perfil}`);

    return NextResponse.json({
      success: true,
      cpf: usuario.cpf,
      nome: usuario.nome,
      perfil: perfil,
      redirectTo:
        perfil === 'admin'
          ? '/admin'
          : perfil === 'gestor'
            ? '/entidade'
            : perfil === 'funcionario'
              ? '/dashboard'
              : '/rh',
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
