import { NextResponse } from 'next/server';
import { query, getDatabaseInfo } from '@/lib/db';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { gerarSenhaDeNascimento } from '@/lib/auth/password-generator';
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
      console.log(`[LOGIN] Usuário encontrado em funcionarios:`, {
        cpf: usuario.cpf,
        usuario_tipo_raw: rawPerfil,
        tipo: usuario.tipo_usuario,
        tomador_id: usuario.tomador_id,
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
        // PASSO 1b: Não encontrado em usuarios — tentar tabela representantes (login unificado)
        console.log(
          `[LOGIN] Não encontrado em usuarios; buscando em representantes...`
        );
        const repResult = await query(
          `SELECT id, nome, email, cpf, cpf_responsavel_pj, codigo, senha_hash, senha_repres, status, tipo_pessoa
           FROM representantes
           WHERE cpf = $1 OR cpf_responsavel_pj = $1
           LIMIT 1`,
          [cpf]
        );

        const repRows = repResult && repResult.rows ? repResult.rows : [];

        if (repRows.length === 0) {
          console.log(
            `[LOGIN] Usuário não encontrado em nenhuma tabela: ${cpf}`
          );
          return NextResponse.json(
            { error: 'CPF ou senha inválidos' },
            { status: 401 }
          );
        }

        // --- Fluxo especial: representante ---
        const rep = repRows[0];
        console.log(`[LOGIN] Representante encontrado:`, {
          id: rep.id,
          nome: rep.nome,
          status: rep.status,
          tipo_pessoa: rep.tipo_pessoa,
        });

        // Verificar status bloqueante
        const statusBloqueados = ['desativado', 'rejeitado'];
        if (statusBloqueados.includes(rep.status)) {
          try {
            await registrarAuditoria({
              entidade_tipo: 'login',
              acao: 'login_falha',
              usuario_cpf: cpf,
              metadados: {
                motivo: 'representante_inativo',
                status: rep.status,
              },
              ...contextoRequisicao,
            });
          } catch (err) {
            console.warn(
              '[LOGIN] Falha ao registrar auditoria (rep_inativo):',
              err
            );
          }
          return NextResponse.json(
            {
              error:
                'Conta desativada ou rejeitada. Entre em contato com o administrador.',
            },
            { status: 403 }
          );
        }

        // Status pendentes: representante ainda não criou senha via convite
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
          return NextResponse.json(
            { error: 'Senha é obrigatória' },
            { status: 400 }
          );
        }

        // Validar senha:
        // - senha_repres: senha criada pelo próprio representante (fluxo novo)
        // - senha_hash  : fallback — hash do código gerado (retrocompatibilidade com reps antigos)
        let senhaRepValida = false;
        if (rep.senha_repres) {
          // Fluxo novo: representante criou sua própria senha
          senhaRepValida = await bcrypt.compare(senha, rep.senha_repres);
        } else if (rep.senha_hash) {
          // Retrocompatibilidade: login via código (reps migrados antes da migration 520)
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

        // Login bem-sucedido — criar sessão unificada para representante
        createSession({
          cpf: rep.cpf || rep.cpf_responsavel_pj,
          nome: rep.nome,
          perfil: 'representante' as any,
          representante_id: rep.id,
        });

        try {
          await registrarAuditoria({
            entidade_tipo: 'login',
            acao: 'login_sucesso',
            usuario_cpf: cpf,
            usuario_perfil: 'representante',
            metadados: {
              representante_id: rep.id,
              tipo_pessoa: rep.tipo_pessoa,
            },
            ...contextoRequisicao,
          });
        } catch (err) {
          console.warn(
            '[LOGIN] Falha ao registrar auditoria (rep_login_sucesso):',
            err
          );
        }

        console.log(`[LOGIN] Sessão criada para representante #${rep.id}`);

        return NextResponse.json({
          success: true,
          cpf: rep.cpf || rep.cpf_responsavel_pj,
          nome: rep.nome,
          perfil: 'representante',
          termosPendentes: { termos_uso: false, politica_privacidade: false },
          redirectTo: '/representante/dashboard',
        });
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
    let tomadorId: number | null = null;
    let tomadorAtivo = true;

    if (foundInFuncionarios) {
      // Usuário vindo da tabela `funcionarios`: senha já disponível na linha
      console.log(
        `[LOGIN] Usuário vindo de funcionarios; usando senha de funcionarios`
      );
      senhaHash = usuario.senha_hash;
      tomadorId = usuario.entidade_id || usuario.clinica_id || null;
      tomadorAtivo = usuario.ativo ?? true;
    } else if (usuario.tipo_usuario === 'gestor') {
      // Buscar senha em entidades_senhas
      console.log(`[LOGIN] Buscando senha de gestor em entidades_senhas...`);
      const senhaResult = await query(
        `SELECT es.senha_hash, e.id, e.ativa
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
    } else if (usuario.tipo_usuario === 'rh') {
      // Buscar senha em clinicas_senhas
      console.log(`[LOGIN] Buscando senha de RH em clinicas_senhas...`);
      const senhaResult = await query(
        `SELECT cs.senha_hash, c.id as clinica_id, c.ativa
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
      }
    } else if (
      usuario.tipo_usuario === 'admin' ||
      usuario.tipo_usuario === 'emissor'
    ) {
      // NOTA: Admin/Emissor faz login SEM validação de senha
      // (bypass de segurança para usuários administrativos)
      console.log(
        `[LOGIN] Login de ${usuario.tipo_usuario} — sem validação de senha`
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
      console.log(
        '[LOGIN] Funcionário com data de nascimento - validando contra hash armazenado'
      );

      // Verificar se senhaHash existe
      if (!senhaHash) {
        console.error(
          `[LOGIN] senhaHash não encontrado para funcionário CPF ${cpf}`
        );
        return NextResponse.json(
          { error: 'Configuração de senha inválida. Contate o administrador.' },
          { status: 500 }
        );
      }

      // Gerar a senha esperada a partir da data de nascimento
      try {
        const senhaEsperada = gerarSenhaDeNascimento(data_nascimento);
        console.log(
          '[LOGIN] Senha gerada a partir de data_nascimento, comparando hash...'
        );
        console.log(`[LOGIN] DEBUG - senhaEsperada: ${senhaEsperada}`);
        console.log(
          `[LOGIN] DEBUG - senhaHash existe: ${!!senhaHash}, primeiros 10 chars: ${senhaHash?.substring(0, 10)}`
        );

        // Validar o hash da senha gerada contra o hash armazenado
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
                tipo_usuario: usuario.tipo_usuario,
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
      } catch (error) {
        console.error(
          '[LOGIN] Erro ao gerar/validar senha de data_nascimento:',
          error
        );
        console.warn(
          '[LOGIN] ⚠️ Data de nascimento inválida ou em formato inválido no banco. Tentando login com senha normal se disponível...'
        );

        // FALLBACK: Se houver erro ao validar data (ex: data impossível como 31/02 no banco),
        // tentar login com senha normal se foi fornecida
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
              // Continuar com o login normal abaixo
              // Não fazer return aqui, deixar a lógica de criação de sessão executar
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
                  tipo_usuario: usuario.tipo_usuario,
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
          // Sem senha e data inválida
          try {
            await registrarAuditoria({
              entidade_tipo: 'login',
              entidade_id: tomadorId,
              acao: 'login_falha',
              usuario_cpf: cpf,
              metadados: {
                motivo: 'data_nascimento_formato_invalido',
                tipo_usuario: usuario.tipo_usuario,
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
    } else if (senha && senhaHash) {
      // Validar senha para demais usuários (RH, Gestor)
      console.log('[LOGIN] Comparando senha contra hash...');
      const senhaValida = await bcrypt.compare(senha, senhaHash);
      console.log(`[LOGIN] Senha válida: ${senhaValida}`);

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
      perfil: perfil as any,
      tomador_id: tomadorId,
      clinica_id: usuario.clinica_id,
      entidade_id: usuario.entidade_id,
    });

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

    console.log(`[LOGIN] Sessão criada para ${perfil}`);

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
          console.log(
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

    return NextResponse.json({
      success: true,
      cpf: usuario.cpf,
      nome: usuario.nome,
      perfil: perfil,
      data_nascimento: usuario.data_nascimento || null,
      termosPendentes,
      redirectTo:
        perfil === 'admin'
          ? '/admin'
          : perfil === 'gestor'
            ? '/entidade' // Gestor de Entidade
            : perfil === 'rh'
              ? '/rh' // RH de Clínica
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
