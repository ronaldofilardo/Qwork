import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession } from '@/lib/session';
import { validateDbEnvironmentAccess } from '@/lib/db/environment-guard';
import bcrypt from 'bcryptjs';
import {
  registrarAuditoria,
  extrairContextoRequisicao,
} from '@/lib/auditoria/auditoria';
import { NextRequest } from 'next/server';
import { rateLimitAsync, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { handleRepresentanteLogin, validarSenhaFuncionario } from './helpers';
import maintenanceConfig from '@/config/maintenance.json';

export const dynamic = 'force-dynamic';

/** Verifica bloqueio de manutenção com suporte a bypass por cookie */
function isMaintenanceBlocked(request: Request): boolean {
  const enabled = process.env.MAINTENANCE_MODE_ENABLED === 'true';
  if (!enabled) return false;
  if (process.env.APP_ENV !== 'production') return false;

  const startStr = process.env.MAINTENANCE_START;
  const endStr = process.env.MAINTENANCE_END;
  if (!startStr || !endStr) return false;

  const now = new Date();
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  if (!(now >= start && now <= end)) return false;

  // Verificar cookie de bypass
  const bypassToken = process.env.MAINTENANCE_BYPASS_TOKEN;
  if (bypassToken) {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const match = cookieHeader.match(/(?:^|;\s*)maintenance_bypass=([^;]+)/);
    const cookieValue = match?.[1];
    if (cookieValue === bypassToken) return false;
  }

  return true;
}

export async function POST(request: Request) {
  // 🔒 MANUTENÇÃO: bloquear login durante janela de manutenção (com bypass por cookie)
  if (isMaintenanceBlocked(request)) {
    const endTime = process.env.MAINTENANCE_END
      ? new Date(process.env.MAINTENANCE_END).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
        })
      : 'em breve';
    return NextResponse.json(
      {
        error: 'MAINTENANCE_MODE',
        message: 'Sistema em manutenção programada. Retornamos na segunda-feira, 27 de abril, às 8h.',
        maintenanceUntil: process.env.MAINTENANCE_END,
        endTimeFormatted: endTime,
        contactEmail: 'suporte@qwork.app.br',
      },
      { status: 503 }
    );
  }

  // 🔒 SEGURANÇA: Rate limiting distribuído (DB-backed) — 5 tentativas / 5 min por IP
  const rateLimitResult = await rateLimitAsync(
    request as unknown as NextRequest,
    RATE_LIMIT_CONFIGS.auth
  );
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
    const { cpf, senha, data_nascimento } = await request.json();

    // Validar entrada
    if (!cpf) {
      return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 });
    }

    // Validar que pelo menos senha ou data_nascimento foi fornecida
    if (!senha && !data_nascimento) {
      return NextResponse.json(
        { error: 'Senha ou data de nascimento é obrigatória' },
        { status: 400 }
      );
    }

    // PASSO 1: Buscar usuário — procurar em `usuarios` PRIMEIRO para tipos de sistema (suporte, comercial, vendedor)
    // Depois fallback para `funcionarios` (funcionários normais, gestores RH/Entidade)

    let usuario: any = null;
    let foundInFuncionarios = false;
    let foundInUsuarios = false;

    // TIPOS DE SISTEMA: procurar em `usuarios` primeiro
    const SYSTEM_ACCOUNT_TYPES = [
      'suporte',
      'comercial',
      'vendedor',
      'admin',
      'emissor',
    ];

    logger.log(`[LOGIN] Iniciando autenticação para CPF ***${cpf.slice(-4)}`);

    // Tentar buscar em usuarios (contas de sistema + funcionários que migraram)
    const usuarioFirstPass = await query(
      `SELECT cpf, nome, email, tipo_usuario, clinica_id, entidade_id, ativo, senha_hash FROM usuarios WHERE cpf = $1 LIMIT 1`,
      [cpf]
    );

    const usuarioRows =
      usuarioFirstPass && usuarioFirstPass.rows ? usuarioFirstPass.rows : [];

    // Se encontrou em usuarios E é um tipo de sistema, usar de lá
    if (
      usuarioRows.length > 0 &&
      SYSTEM_ACCOUNT_TYPES.includes(usuarioRows[0].tipo_usuario)
    ) {
      foundInUsuarios = true;
      usuario = usuarioRows[0];
      logger.log(
        `[LOGIN] Usuário encontrado em usuarios (tipo: ${usuario.tipo_usuario})`
      );
    } else {
      // Procurar em funcionarios como alternativa
      logger.log('[LOGIN] Buscando usuário em funcionarios (fallback)');
      const funcResult = await query(
        `SELECT * FROM funcionarios WHERE cpf = $1 LIMIT 1`,
        [cpf]
      );

      const funcRows = funcResult && funcResult.rows ? funcResult.rows : [];

      if (funcRows.length > 0) {
        foundInFuncionarios = true;
        usuario = funcRows[0];
        // Normalizar nomes de campos que podem variar após migração
        // IMPORTANTE: usuario_tipo é o campo do banco (funcionario_clinica, funcionario_entidade, rh, gestor, etc)
        // tipo_usuario é a variável JavaScript normalizada para sessão (funcionario, rh, gestor, admin, emissor)
        const rawPerfil =
          usuario.usuario_tipo || usuario.tipo_usuario || usuario.perfil;

        // Normalizar perfil: funcionario_clinica e funcionario_entidade viram 'funcionario'
        usuario.tipo_usuario =
          rawPerfil === 'funcionario_clinica' ||
          rawPerfil === 'funcionario_entidade'
            ? 'funcionario'
            : rawPerfil;

        usuario.tomador_id =
          usuario.entidade_id ||
          usuario.clinica_id ||
          usuario.empresa_id ||
          usuario.empresaId;
        usuario.entidade_id = usuario.entidade_id || usuario.entidadeId || null;
        usuario.clinica_id = usuario.clinica_id || usuario.clinicaId || null;
        usuario.senha_hash =
          usuario.senha_hash || usuario.senhaHash || usuario.senha;
        logger.log(`[LOGIN] Usuário encontrado em funcionarios:`, {
          cpf: usuario.cpf,
          usuario_tipo_raw: rawPerfil,
          tipo: usuario.tipo_usuario,
          tomador_id: usuario.tomador_id,
          entidade_id: usuario.entidade_id,
          ativo: usuario.ativo,
        });
      } else if (usuarioRows.length > 0) {
        // Encontrou em usuarios mas não é tipo sistema — usar mesmo assim
        foundInUsuarios = true;
        usuario = usuarioRows[0];
        logger.log(
          `[LOGIN] Usuário encontrado em usuarios (tipo: ${usuario.tipo_usuario})`
        );
      } else {
        // Não encontrou em nenhum lugar
        logger.log(
          '[LOGIN] Usuário não encontrado nas tabelas primárias; tentando representante'
        );
        return await handleRepresentanteLogin(cpf, senha, contextoRequisicao);
      }
    }
    logger.log(`[LOGIN] Usuário encontrado:`, {
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
    let tomadorId: number | null = null;
    let tomadorAtivo = true;

    let primeiraSenhaAlterada = true; // default: não forçar troca

    if (foundInFuncionarios) {
      // Usuário vindo da tabela `funcionarios`: senha já disponível na linha
      logger.log('[LOGIN] Usuário vindo de funcionarios');
      senhaHash = usuario.senha_hash;
      tomadorId = usuario.entidade_id || usuario.clinica_id || null;
      tomadorAtivo = usuario.ativo ?? true;
    } else if (
      foundInUsuarios &&
      SYSTEM_ACCOUNT_TYPES.includes(usuario.tipo_usuario)
    ) {
      // Usuário de sistema (suporte, comercial, vendedor, admin, emissor): senha em usuarios
      logger.log(
        `[LOGIN] Usuário de sistema (${usuario.tipo_usuario}) autenticando via usuarios`
      );
      senhaHash = usuario.senha_hash;
      tomadorId = usuario.entidade_id || usuario.clinica_id || null;
      tomadorAtivo = usuario.ativo ?? true;
    } else if (usuario.tipo_usuario === 'gestor') {
      // Buscar senha em entidades_senhas
      logger.log('[LOGIN] Buscando credenciais de gestor');
      const senhaResult = await query(
        `SELECT es.senha_hash, es.primeira_senha_alterada, e.id, e.ativa
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
      tomadorId = senhaResult.rows[0].id;
      tomadorAtivo = senhaResult.rows[0].ativa;
      primeiraSenhaAlterada =
        senhaResult.rows[0].primeira_senha_alterada ?? true;
    } else if (usuario.tipo_usuario === 'rh') {
      // Buscar senha em clinicas_senhas
      logger.log('[LOGIN] Buscando credenciais de RH');
      const senhaResult = await query(
        `SELECT cs.senha_hash, cs.primeira_senha_alterada, c.id as clinica_id, c.ativa
         FROM clinicas_senhas cs
         JOIN clinicas c ON c.id = cs.clinica_id
         WHERE cs.cpf = $1 AND cs.clinica_id = $2`,
        [cpf, usuario.clinica_id]
      );

      // Removido: dados legados de 'tomadors' não são mais usados
      // Todos os dados devem estar em entidades/clinicas

      // Fallback para tabela usuarios (caso historicamente a senha ainda esteja lá)
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
          tomadorId = uRes.rows[0].clinica_id || usuario.clinica_id;
          // tentar inferir ativo como true para evitar bloqueio indevido
          tomadorAtivo = true;
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
        tomadorId = senhaResult.rows[0].clinica_id;
        tomadorAtivo = senhaResult.rows[0].ativa;
        primeiraSenhaAlterada =
          senhaResult.rows[0].primeira_senha_alterada ?? true;
      }
    } else if (
      usuario.tipo_usuario === 'admin' ||
      usuario.tipo_usuario === 'emissor' ||
      usuario.tipo_usuario === 'suporte' ||
      usuario.tipo_usuario === 'comercial' ||
      usuario.tipo_usuario === 'vendedor'
    ) {
      logger.log(`[LOGIN] Validando senha para perfil ${usuario.tipo_usuario}`);
      senhaHash = usuario.senha_hash || null;
      tomadorId = null;
      tomadorAtivo = true;

      // Para vendedor: buscar flag primeira_senha_alterada em vendedores_perfil
      if (usuario.tipo_usuario === 'vendedor') {
        try {
          const vpResult = await query(
            `SELECT vp.primeira_senha_alterada
             FROM public.vendedores_perfil vp
             JOIN public.usuarios u ON u.id = vp.usuario_id
             WHERE u.cpf = $1 LIMIT 1`,
            [cpf]
          );
          if (vpResult.rows.length > 0) {
            primeiraSenhaAlterada =
              vpResult.rows[0].primeira_senha_alterada ?? true;
          }
        } catch (err) {
          console.warn(
            '[LOGIN] Erro ao buscar primeira_senha_alterada do vendedor:',
            err
          );
        }
      }
    }

    // Verificar se tomador está ativo
    if (!tomadorAtivo) {
      try {
        await registrarAuditoria({
          entidade_tipo: 'login',
          entidade_id: tomadorId,
          acao: 'login_falha',
          usuario_cpf: cpf,
          metadados: { motivo: 'tomador_inativo' },
          ...contextoRequisicao,
        });
      } catch (err) {
        console.warn(
          '[LOGIN] Falha ao registrar auditoria (tomador_inativo)',
          err
        );
      }

      return NextResponse.json(
        { error: 'Tomador inativo. Entre em contato com o administrador.' },
        { status: 403 }
      );
    }

    // PASSO 3: Validar senha ou permitir login de funcionário com data de nascimento
    // Para funcionários: validar que data_nascimento fornecida gera hash igual ao armazenado
    const isFuncionarioComDataNasc =
      usuario.tipo_usuario === 'funcionario' && data_nascimento;

    if (isFuncionarioComDataNasc) {
      const errResp = await validarSenhaFuncionario(
        senhaHash,
        data_nascimento,
        senha,
        cpf,
        tomadorId,
        usuario.tipo_usuario,
        contextoRequisicao
      );
      if (errResp) return errResp;
    } else if (senha && senhaHash) {
      // Validar senha para demais usuários (RH, Gestor)
      logger.log('[LOGIN] Validando credenciais');
      const senhaValida = await bcrypt.compare(senha, senhaHash);

      if (!senhaValida) {
        try {
          await registrarAuditoria({
            entidade_tipo: 'login',
            entidade_id: tomadorId,
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
    } else {
      // Nenhuma validação possível
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // PASSO 4: Criar sessão
    // IMPORTANTE: Segregação por tipo_usuario (criado automaticamente pelo sistema após pagamento):
    // - 'gestor' = Gestor de Entidade (empresa direta) → redireciona para /entidade
    // - 'rh' = RH de Clínica (gestor da clínica) → redireciona para /rh
    // NENHUM outro usuário pode criar login (EXCLUSIVO DO SISTEMA)
    const perfil = usuario.tipo_usuario;

    createSession({
      cpf: usuario.cpf,
      nome: usuario.nome,
      email: usuario.email,
      perfil: perfil as any,
      tomador_id: tomadorId,
      clinica_id: usuario.clinica_id,
      entidade_id: usuario.entidade_id,
    });

    // Registrar acesso em session_logs para auditoria de acesso
    try {
      const ipForDb =
        contextoRequisicao.ip_address === 'unknown'
          ? null
          : contextoRequisicao.ip_address;
      const sessionLogResult = await query(
        `INSERT INTO session_logs (cpf, perfil, clinica_id, empresa_id, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          usuario.cpf,
          perfil,
          usuario.clinica_id ?? null,
          usuario.entidade_id ?? null,
          ipForDb,
          contextoRequisicao.user_agent ?? null,
        ]
      );
      if (sessionLogResult.rows[0]?.id) {
        createSession({
          cpf: usuario.cpf,
          nome: usuario.nome,
          email: usuario.email,
          perfil: perfil as any,
          tomador_id: tomadorId,
          clinica_id: usuario.clinica_id,
          entidade_id: usuario.entidade_id,
          sessionLogId: sessionLogResult.rows[0].id,
        });
      }
    } catch (err) {
      console.warn('[LOGIN] Falha ao registrar session_log:', err);
    }

    // Registrar login bem-sucedido
    try {
      await registrarAuditoria({
        entidade_tipo: 'login',
        entidade_id: tomadorId,
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

    logger.log(`[LOGIN] Sessão criada para ${perfil}`);

    // Pré-verificar disponibilidade de ambientes para emissores
    const environmentAvailability =
      perfil === 'emissor'
        ? {
            development: validateDbEnvironmentAccess(
              usuario.cpf,
              'development'
            ),
            staging: validateDbEnvironmentAccess(usuario.cpf, 'staging'),
            production: validateDbEnvironmentAccess(usuario.cpf, 'production'),
          }
        : undefined;

    // VERIFICAR ACEITE DE TERMOS (apenas para rh e gestor)
    let termosPendentes = {
      termos_uso: false,
      politica_privacidade: false,
    };

    if (perfil === 'rh' || perfil === 'gestor') {
      try {
        const aceitesResult = await query(
          `SELECT termo_tipo FROM aceites_termos_usuario 
           WHERE usuario_cpf = $1 AND usuario_tipo = $2`,
          [cpf, perfil]
        );

        const aceites = aceitesResult.rows;
        const temTermosUso = aceites.some((a) => a.termo_tipo === 'termos_uso');
        const temPolitica = aceites.some(
          (a) => a.termo_tipo === 'politica_privacidade'
        );

        termosPendentes = {
          termos_uso: !temTermosUso,
          politica_privacidade: !temPolitica,
        };
      } catch (err: any) {
        // HOTFIX: Se tabela não existe (42P01), assumir termos PENDENTES (lado seguro)
        // Assim o modal será mostrado, e quando tentar registrar, receberá erro 503 amigável
        if (err?.code === '42P01') {
          logger.log(
            '[LOGIN] Tabela de termos ainda não existe - assumindo termos como pendentes'
          );
          termosPendentes = {
            termos_uso: true,
            politica_privacidade: true,
          };
        } else {
          console.error('[LOGIN] Erro ao verificar termos:', err);
          // Em caso de outro erro, assumir pendente (seguro)
          termosPendentes = {
            termos_uso: true,
            politica_privacidade: true,
          };
        }
      }
    }

    // Verificar se gestor/RH/vendedor precisa trocar senha no primeiro acesso
    const precisaTrocarSenha =
      (perfil === 'gestor' || perfil === 'rh' || perfil === 'vendedor') &&
      !primeiraSenhaAlterada;

    return NextResponse.json({
      success: true,
      cpf: usuario.cpf,
      nome: usuario.nome,
      perfil: perfil,
      data_nascimento: usuario.data_nascimento || null,
      termosPendentes,
      precisaTrocarSenha,
      ...(environmentAvailability && { environmentAvailability }),
      redirectTo:
        perfil === 'admin'
          ? '/admin'
          : perfil === 'suporte'
            ? '/suporte'
            : perfil === 'comercial'
              ? '/comercial'
              : perfil === 'vendedor'
                ? '/vendedor'
                : perfil === 'gestor'
                  ? '/entidade'
                  : perfil === 'rh'
                    ? '/rh'
                    : perfil === 'funcionario'
                      ? '/dashboard'
                      : '/emissor',
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
