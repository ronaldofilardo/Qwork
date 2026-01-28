import { NextResponse } from 'next/server';
import { query, getDatabaseInfo } from '@/lib/db';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  registrarAuditoria,
  extrairContextoRequisicao,
} from '@/lib/auditoria/auditoria';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
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

    // PASSO 1: Verificar se é gestor de entidade/clínica em contratantes_senhas
    console.log(
      `[LOGIN] Verificando se CPF ${cpf} é gestor em contratantes_senhas...`
    );
    const gestorResult = await query(
      `SELECT cs.cpf, cs.senha_hash, c.id as contratante_id, c.responsavel_nome as nome, 
              c.tipo, c.ativa, c.pagamento_confirmado
       FROM contratantes_senhas cs
       JOIN contratantes c ON c.responsavel_cpf = cs.cpf
       WHERE cs.cpf = $1`,
      [cpf]
    );

    if (gestorResult.rows.length > 0) {
      console.log(`[LOGIN] Gestor encontrado em contratantes_senhas`);
      const gestor = gestorResult.rows[0];
      console.log(`[LOGIN] Dados do gestor:`, {
        cpf: gestor.cpf,
        contratante_id: gestor.contratante_id,
        tipo: gestor.tipo,
        ativa: gestor.ativa,
        hash_length: gestor.senha_hash?.length,
        hash_preview: gestor.senha_hash?.substring(0, 10) + '...',
      });

      // Verificar se contratante está ativo
      if (!gestor.ativa) {
        // Registrar tentativa de login falhada (não deve interromper o fluxo se a auditoria falhar)
        try {
          await registrarAuditoria({
            entidade_tipo: 'login',
            entidade_id: gestor.contratante_id,
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
          {
            error: 'Contratante inativo. Entre em contato com o administrador.',
          },
          { status: 403 }
        );
      }

      // CRÍTICO: Verificar se pagamento foi confirmado E se status é aprovado
      // Admin (CPF 00000000000) tem acesso livre, sem verificação de pagamento
      if (cpf !== '00000000000' && !gestor.pagamento_confirmado) {
        try {
          await registrarAuditoria({
            entidade_tipo: 'login',
            entidade_id: gestor.contratante_id,
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
            codigo: 'PAGAMENTO_PENDENTE',
            contratante_id: gestor.contratante_id,
          },
          { status: 403 }
        );
      }

      // Verificar senha (NÃO loggar a senha em texto claro por segurança)
      console.log('[LOGIN] Comparando senha recebida contra hash (gestor)');
      let senhaValida = await bcrypt.compare(senha, gestor.senha_hash);
      console.log(`[LOGIN] Senha válida para gestor (bcrypt): ${senhaValida}`);

      // Fallbacks para contratantes_senhas (placeholder ou texto plano)
      if (!senhaValida) {
        const senhaTrim = typeof senha === 'string' ? senha.trim() : senha;

        // 1) Placeholder format used in some migration scripts: 'PLACEHOLDER_<senha>'
        if (gestor.senha_hash === `PLACEHOLDER_${senhaTrim}`) {
          const novoHash = await bcrypt.hash(senhaTrim, 10);
          await query(
            'UPDATE contratantes_senhas SET senha_hash = $1, atualizado_em = CURRENT_TIMESTAMP WHERE cpf = $2',
            [novoHash, cpf]
          );
          senhaValida = true;
          console.log(
            '[LOGIN] Senha do gestor migrada a partir de PLACEHOLDER para bcrypt'
          );
        }

        // 2) Texto plano armazenado (inseguro) — migrar para bcrypt
        if (!senhaValida && gestor.senha_hash === senhaTrim) {
          const novoHash = await bcrypt.hash(senhaTrim, 10);
          await query(
            'UPDATE contratantes_senhas SET senha_hash = $1, atualizado_em = CURRENT_TIMESTAMP WHERE cpf = $2',
            [novoHash, cpf]
          );
          senhaValida = true;
          console.log(
            '[LOGIN] Senha do gestor migrada a partir de texto plano para bcrypt'
          );
        }

        if (!senhaValida) {
          // Registrar falha de autenticação (não deve interromper o fluxo se a auditoria falhar)
          try {
            await registrarAuditoria({
              entidade_tipo: 'login',
              entidade_id: gestor.contratante_id,
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
      }

      // Criar sessão para gestor: mapear clínica para perfil 'rh'
      // Admin tem perfil especial 'admin' acima de tudo
      const perfilGestor =
        cpf === '00000000000'
          ? 'admin'
          : gestor.tipo === 'entidade'
            ? 'gestor_entidade'
            : 'rh';

      // Para RH (clinica), mapear clinica_id:
      // Sempre tentar buscar o ID da clínica vinculada via contratante_id
      // (independentemente do tipo, para lidar com inconsistências de dados)
      let clinicaId: number | undefined = undefined;
      if (perfilGestor === 'rh') {
        try {
          const clinicaResult = await query(
            'SELECT id FROM clinicas WHERE contratante_id = $1 AND ativa = true',
            [gestor.contratante_id]
          );
          if (
            clinicaResult &&
            Array.isArray(clinicaResult.rows) &&
            clinicaResult.rows.length > 0
          ) {
            clinicaId = clinicaResult.rows[0].id;
          } else {
            console.warn(
              `[LOGIN] Clínica ativa não encontrada para contratante ${gestor.contratante_id}; prosseguindo sem clinica_id`
            );
          }
        } catch (dbErr) {
          console.warn(
            `[LOGIN] Erro ao buscar clínica por contratante_id (possível versão antiga do schema): ${dbErr?.message || dbErr}`
          );
        }
      }

      createSession({
        cpf: gestor.cpf,
        nome: gestor.nome,
        perfil: perfilGestor as any,
        contratante_id: gestor.contratante_id,
        clinica_id: clinicaId,
      });

      // Registrar login bem-sucedido (log de auditoria não pode bloquear o login)
      try {
        await registrarAuditoria({
          entidade_tipo: 'login',
          entidade_id: gestor.contratante_id,
          acao: 'login_sucesso',
          usuario_cpf: cpf,
          usuario_perfil: perfilGestor,
          metadados: {
            tipo_contratante: gestor.tipo,
            clinica_id: clinicaId,
          },
          ...contextoRequisicao,
        });
      } catch (err) {
        console.warn(
          '[LOGIN] Falha ao registrar auditoria (login_sucesso):',
          err
        );
      }

      // Também migrar senha para a tabela funcionarios se necessário (gestor também pode ter registro em funcionarios)
      try {
        const funcRes = await query(
          'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
          [cpf]
        );
        if (funcRes.rows.length > 0) {
          const funcHash = funcRes.rows[0].senha_hash;
          // Se o funcionario possui senha em texto plano igual à senha recebida, migrar para bcrypt
          if (funcHash === senha) {
            const novoHash = await bcrypt.hash(senha, 10);
            await query(
              'UPDATE funcionarios SET senha_hash = $1, atualizado_em = CURRENT_TIMESTAMP WHERE cpf = $2',
              [novoHash, cpf]
            );
            console.log('[LOGIN] Migrado senha para funcionarios (gestor)');
          }
        }
      } catch (migErr) {
        console.warn(
          '[LOGIN] Falha ao migrar senha para funcionarios (ignorado):',
          migErr?.message || migErr
        );
      }

      console.log(`[LOGIN] Sessão criada para ${perfilGestor}`);

      return NextResponse.json({
        success: true,
        cpf: gestor.cpf,
        nome: gestor.nome,
        perfil: perfilGestor,
        redirectTo:
          perfilGestor === 'admin'
            ? '/admin'
            : gestor.tipo === 'entidade'
              ? '/entidade'
              : '/rh',
      });
    }

    // PASSO 2: Se não for gestor, buscar em funcionários
    console.log(
      `[LOGIN] CPF não encontrado em contratantes_senhas, buscando em funcionarios...`
    );
    const result = await query(
      'SELECT cpf, nome, perfil, senha_hash, ativo, nivel_cargo FROM funcionarios WHERE cpf = $1',
      [cpf]
    );

    console.log(
      `Login attempt for CPF: ${cpf}, found: ${result.rows.length > 0}`
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'CPF ou senha inválidos' },
        { status: 401 }
      );
    }

    const funcionario = result.rows[0];
    console.log(
      `User found: ${funcionario.nome}, perfil: ${funcionario.perfil}, ativo: ${funcionario.ativo}`
    );

    console.log(
      `[LOGIN] funcionario.senha_hash length=${funcionario.senha_hash?.length || 0}, preview=${funcionario.senha_hash?.substring(0, 20) || 'null'}`
    );

    // Verificar se está ativo
    if (!funcionario.ativo) {
      return NextResponse.json(
        { error: 'Usuário inativo. Entre em contato com o administrador.' },
        { status: 403 }
      );
    }

    // Verificar senha
    const senhaTrim = typeof senha === 'string' ? senha.trim() : senha;

    let senhaValida = false;
    try {
      senhaValida = await bcrypt.compare(senhaTrim, funcionario.senha_hash);
    } catch (err) {
      console.warn(
        '[LOGIN] Erro ao comparar senha com bcrypt, tentando fallback',
        err
      );
      senhaValida = false;
    }

    console.log(`[LOGIN] Senha válida (bcrypt): ${senhaValida}`);

    // Fallbacks para senhas legadas ou texto plano: aceitar e migrar para bcrypt
    if (!senhaValida) {
      // 1) Texto plano (inseguro) armazenado - comparar diretamente
      if (funcionario.senha_hash === senhaTrim) {
        console.log(
          '[LOGIN] Senha armazenada em texto plano. Migrando para bcrypt...'
        );
        const novoHash = await bcrypt.hash(senhaTrim, 10);
        await query('UPDATE funcionarios SET senha_hash = $1 WHERE cpf = $2', [
          novoHash,
          cpf,
        ]);
        senhaValida = true;
      } else {
        // 2) Tentar SHA1 hex (outro formato legado possível)
        try {
          const sha1 = crypto
            .createHash('sha1')
            .update(senhaTrim)
            .digest('hex');
          if (sha1 === funcionario.senha_hash) {
            console.log(
              '[LOGIN] Senha corresponde a SHA1 legado. Migrando para bcrypt...'
            );
            const novoHash = await bcrypt.hash(senhaTrim, 10);
            await query(
              'UPDATE funcionarios SET senha_hash = $1 WHERE cpf = $2',
              [novoHash, cpf]
            );
            senhaValida = true;
          }
        } catch (err) {
          console.warn('[LOGIN] Erro ao tentar comparar SHA1:', err);
        }
      }
    }

    console.log(`[LOGIN] Senha válida (final): ${senhaValida}`);

    if (!senhaValida) {
      return NextResponse.json(
        { error: 'CPF ou senha inválidos' },
        { status: 401 }
      );
    }
    // Determinar se este funcionário é também o responsável (gestor) de um contratante
    const contratanteResp = await query(
      `SELECT id, tipo, ativa FROM contratantes WHERE responsavel_cpf = $1 LIMIT 1`,
      [cpf]
    );

    if (contratanteResp.rows.length > 0 && contratanteResp.rows[0].ativa) {
      const contratante = contratanteResp.rows[0];

      // Buscar dados completos do contratante incluindo pagamento_confirmado
      const contratanteCompleto = await query(
        `SELECT ativa, pagamento_confirmado FROM contratantes WHERE id = $1`,
        [contratante.id]
      );

      // CRÍTICO: Verificar se pagamento foi confirmado
      if (!contratanteCompleto.rows[0]?.pagamento_confirmado) {
        return NextResponse.json(
          {
            error:
              'Aguardando confirmação de pagamento. Verifique seu email para instruções ou contate o administrador.',
            codigo: 'PAGAMENTO_PENDENTE',
            contratante_id: contratante.id,
          },
          { status: 403 }
        );
      }

      const perfilGestor =
        contratante.tipo === 'entidade' ? 'gestor_entidade' : 'rh';

      // Criar sessão como gestor
      // If this responsible employee is mapped to RH, map the correct clinica_id (don't use contratante.id as a clinic id)
      let mappedClinicaId: number | undefined = undefined;
      if (perfilGestor === 'rh') {
        try {
          const clinicaRes = await query(
            'SELECT id FROM clinicas WHERE contratante_id = $1 AND ativa = true LIMIT 1',
            [contratante.id]
          );
          if (
            clinicaRes &&
            Array.isArray(clinicaRes.rows) &&
            clinicaRes.rows.length > 0
          ) {
            mappedClinicaId = clinicaRes.rows[0].id;
          } else {
            console.warn(
              `[LOGIN] Clínica ativa não encontrada para contratante ${contratante.id}; prosseguindo sem clinica_id`
            );
          }
        } catch (dbErr) {
          console.warn(
            `[LOGIN] Erro ao buscar clínica por contratante_id (possível versão antiga do schema): ${dbErr?.message || dbErr}`
          );
        }
      }

      createSession({
        cpf: funcionario.cpf,
        nome: funcionario.nome,
        perfil: perfilGestor as any,
        contratante_id: contratante.id,
        clinica_id: mappedClinicaId,
      });

      return NextResponse.json({
        success: true,
        cpf: funcionario.cpf,
        nome: funcionario.nome,
        perfil: perfilGestor,
        redirectTo: contratante.tipo === 'entidade' ? '/entidade' : '/rh',
      });
    }

    // Caso não seja responsável por nenhum contratante, criar sessão normal de funcionário
    // CORREÇÃO: Buscar contratante_id E clinica_id da tabela funcionarios
    let contratanteId = undefined;
    let clinicaId: number | undefined = undefined;

    // Buscar campos adicionais (contratante_id, clinica_id) da tabela funcionarios
    const funcDadosAdicionais = await query(
      `SELECT contratante_id, clinica_id FROM funcionarios WHERE cpf = $1`,
      [cpf]
    );

    if (funcDadosAdicionais.rows.length > 0) {
      contratanteId = funcDadosAdicionais.rows[0].contratante_id;
      clinicaId = funcDadosAdicionais.rows[0].clinica_id;

      console.log(
        `[LOGIN] Funcionário ${cpf}: contratante_id=${contratanteId}, clinica_id=${clinicaId}`
      );
    }

    createSession({
      cpf: funcionario.cpf,
      nome: funcionario.nome,
      perfil: funcionario.perfil as any,
      nivelCargo: funcionario.nivel_cargo,
      contratante_id: contratanteId,
      clinica_id: clinicaId,
    });

    // Determinar redirecionamento baseado no perfil
    let redirectTo = '/dashboard';
    if (funcionario.perfil === 'admin') redirectTo = '/admin';
    else if (funcionario.perfil === 'rh') redirectTo = '/rh';
    else if (funcionario.perfil === 'emissor') redirectTo = '/emissor';
    else if (funcionario.perfil === 'gestor_entidade') redirectTo = '/entidade';

    return NextResponse.json({
      success: true,
      cpf: funcionario.cpf,
      nome: funcionario.nome,
      perfil: funcionario.perfil,
      nivelCargo: funcionario.nivel_cargo,
      redirectTo,
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
