import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { autoConvertirLeadPorCnpj } from '@/lib/db/comissionamento';
import { notificarAceiteContrato } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * POST /api/contratos
 * Body: { acao: 'aceitar', contrato_id, ip_aceite? }
 *
 * Registra aceite do contrato de prestação de serviços pelo tomador.
 * Não requer autenticação — tomadores recém-cadastrados precisam aceitar antes de ter login.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { acao } = body;

    // AÇÃO: ACEITAR - Não requer autenticação (novos tomadors em cadastro)
    if (acao === 'aceitar') {
      const { contrato_id, ip_aceite } = body;

      if (!contrato_id) {
        return NextResponse.json(
          { error: 'contrato_id é obrigatório' },
          { status: 400 }
        );
      }

      // Pegar IP do cliente
      const clientIp =
        ip_aceite ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';

      // Buscar contrato com tipo_tomador para saber onde buscar
      const contratoRes = await query(
        `SELECT id, tomador_id, numero_funcionarios, valor_total, aceito, tipo_tomador FROM contratos WHERE id = $1`,
        [contrato_id]
      );

      if (contratoRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'Contrato não encontrado' },
          { status: 404 }
        );
      }

      const contratoRow = contratoRes.rows[0];

      // Se já aceito, retornar sucesso imediato (acesso já liberado)
      if (contratoRow.aceito) {
        return NextResponse.json(
          {
            success: true,
            message: 'Contrato já aceito',
          },
          { status: 200 }
        );
      }

      // Marcar contrato como aceito (sem geração de hash — contrato padrão unificado)
      const updateRes = await query(
        `UPDATE contratos SET aceito = true, ip_aceite = $2, data_aceite = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [contratoRow.id, clientIp]
      );

      const updated = updateRes.rows[0];
      let boasVindasUrl: string | null = null;
      let credenciais: { login: string; senha: string } | null = null;

      const tabelaTomador: 'entidades' | 'clinicas' =
        updated.tipo_tomador === 'clinica' ? 'clinicas' : 'entidades';

      try {
        // Buscar dados completos do tomador usando tipo_tomador do contrato

        const tomadorRes = await query(
          `SELECT * FROM ${tabelaTomador} WHERE id = $1`,
          [updated.tomador_id]
        );

        if (tomadorRes.rows.length === 0) {
          console.error(
            `[CONTRATOS] Tomador ${updated.tomador_id} não encontrado na tabela ${tabelaTomador} (tipo_tomador=${updated.tipo_tomador})`
          );
          throw new Error(`Tomador não encontrado na tabela ${tabelaTomador}`);
        }

        const tomadorData = tomadorRes.rows[0];

        // Garantir que tipo esteja definido com base na tabela
        if (!tomadorData.tipo) {
          tomadorData.tipo =
            tabelaTomador === 'clinicas' ? 'clinica' : 'entidade';
        }

        console.info(
          JSON.stringify({
            event: 'contrato_aceito_criando_conta',
            tomador_id: updated.tomador_id,
            tabela: tabelaTomador,
            tipo: tomadorData.tipo,
            tipo_tomador_contrato: updated.tipo_tomador,
          })
        );

        // Criar/atualizar usuário em `usuarios` (modelo atual — sem contratantes_senhas)
        const cleanCnpjConta = (tomadorData.cnpj || '').replace(/[./-]/g, '');
        const cpfLogin = tomadorData.responsavel_cpf || cleanCnpjConta;
        const defaultPwd = cleanCnpjConta.slice(-6);
        const senhaHashed = await bcrypt.hash(defaultPwd, 10);
        const tipoUsuario = tabelaTomador === 'clinicas' ? 'rh' : 'gestor';
        const clinicaIdParam =
          tabelaTomador === 'clinicas' ? updated.tomador_id : null;
        const entidadeIdParam =
          tabelaTomador === 'entidades' ? updated.tomador_id : null;

        const usuarioExistente = await query(
          `SELECT id FROM usuarios WHERE cpf = $1`,
          [cpfLogin]
        );
        if (usuarioExistente.rows.length > 0) {
          const updateUserRes = await query(
            `UPDATE usuarios SET senha_hash = $1, ativo = true, primeira_senha_alterada = false,
              clinica_id = COALESCE($2, clinica_id),
              entidade_id = COALESCE($3, entidade_id),
              atualizado_em = NOW()
              WHERE cpf = $4
              RETURNING id, ativo, primeira_senha_alterada`,
            [senhaHashed, clinicaIdParam, entidadeIdParam, cpfLogin]
          );
          console.log(
            `[CONTRATOS] Usuário atualizado em usuarios para CPF ${cpfLogin}`,
            {
              usuarioId: updateUserRes.rows[0]?.id,
              ativo: updateUserRes.rows[0]?.ativo,
              primeira_senha_alterada:
                updateUserRes.rows[0]?.primeira_senha_alterada,
            }
          );
        } else {
          const insertUserRes = await query(
            `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, clinica_id, entidade_id, ativo, primeira_senha_alterada)
              VALUES ($1, $2, $3, $4, $5::usuario_tipo_enum, $6, $7, true, false)
              RETURNING id, ativo, primeira_senha_alterada`,
            [
              cpfLogin,
              tomadorData.responsavel_nome || tomadorData.nome,
              tomadorData.responsavel_email || tomadorData.email,
              senhaHashed,
              tipoUsuario,
              clinicaIdParam,
              entidadeIdParam,
            ]
          );
          console.log(
            `[CONTRATOS] Usuário criado em usuarios para CPF ${cpfLogin}`,
            {
              usuarioId: insertUserRes.rows[0]?.id,
              tipo_usuario: tipoUsuario,
              ativo: insertUserRes.rows[0]?.ativo,
              primeira_senha_alterada:
                insertUserRes.rows[0]?.primeira_senha_alterada,
            }
          );
        }

        // Atualizar tomador para marcar como ativo
        const updateTableQuery = `UPDATE ${tabelaTomador} SET ativa = true WHERE id = $1`;
        const updateResult = await query(updateTableQuery, [
          updated.tomador_id,
        ]);
        console.log(
          `[CONTRATOS] Tomador ${updated.tomador_id} marcado como ativo (tabela: ${tabelaTomador})`,
          {
            rowsAffected: updateResult.rowCount,
          }
        );

        // Auto-converter leads pendentes por CNPJ
        try {
          const tomadorCnpj = (tomadorData.cnpj || '').replace(/\D/g, '');
          if (tomadorCnpj) {
            await autoConvertirLeadPorCnpj(
              tomadorCnpj,
              tabelaTomador === 'entidades' ? updated.tomador_id : null,
              tabelaTomador === 'clinicas' ? updated.tomador_id : null
            );
          }
        } catch (autoErr) {
          console.error(
            '[CONTRATOS] Erro no auto-link por CNPJ (não-bloqueante):',
            autoErr
          );
        }

        // Calcular credenciais
        let cnpj = tomadorData.cnpj;
        if (!cnpj) {
          const cnpjRes = await query(
            `SELECT cnpj FROM ${tabelaTomador} WHERE id = $1`,
            [tomadorData.id]
          );
          if (cnpjRes.rows.length > 0) {
            cnpj = cnpjRes.rows[0].cnpj;
          }
        }

        if (cnpj) {
          const cleanCnpj = cnpj.replace(/[./-]/g, '');
          const loginCredencial = tomadorData.responsavel_cpf || cleanCnpj;
          const senhaCredencial = cleanCnpj.slice(-6);

          credenciais = {
            login: loginCredencial,
            senha: senhaCredencial,
          };

          // Criar URL para boas-vindas
          boasVindasUrl = `/boas-vindas?tomador_id=${updated.tomador_id}&login=${encodeURIComponent(loginCredencial)}&senha=${encodeURIComponent(senhaCredencial)}`;
        }

        // Fixar data limite para cobrança de taxa de manutenção (apenas entidades)
        // Clínicas: a data limite é por empresa (definida ao criar empresa)
        if (tabelaTomador === 'entidades') {
          try {
            // Usa data_aceite do contrato se disponível, caso contrário NOW()
            // IMPORTANTE: $1 deve ser um timestamp, não o ID (integer) do tomador
            await query(
              `UPDATE entidades
               SET limite_primeira_cobranca_manutencao = COALESCE(
                 (SELECT data_aceite FROM contratos WHERE id = $2 AND data_aceite IS NOT NULL),
                 NOW()
               ) + INTERVAL '90 days'
               WHERE id = $1 AND limite_primeira_cobranca_manutencao IS NULL`,
              [updated.tomador_id, updated.id]
            );
          } catch (manutencaoErr) {
            console.error(
              '[CONTRATOS] Erro ao fixar limite de manutenção (não-bloqueante):',
              manutencaoErr
            );
          }
        }

        // Log de auditoria
        console.info(
          JSON.stringify({
            event: 'contrato_aceito_conta_criada',
            contrato_id: updated.id,
            tomador_id: updated.tomador_id,
            ip_aceite: clientIp,
            timestamp: new Date().toISOString(),
          })
        );

        // Email #3: aceite de contrato
        notificarAceiteContrato({
          tomadorId: updated.tomador_id,
          tomadorNome: tomadorData.nome,
          cnpj: tomadorData.cnpj,
          tipo: updated.tipo_tomador as 'clinica' | 'entidade',
        }).catch((e) =>
          console.error('[EMAIL] notificarAceiteContrato falhou:', e)
        );
      } catch (err) {
        console.error(
          '[CONTRATOS] Erro ao liberar login automaticamente após aceite:',
          err
        );
        // Mesmo com erro, garantir que o tomador foi ativado
        try {
          const fallbackUpdate = await query(
            `UPDATE ${tabelaTomador} SET ativa = true WHERE id = $1`,
            [updated.tomador_id]
          );
          console.log(
            `[CONTRATOS] Fallback: Tomador ${updated.tomador_id} marcado como ativo após erro`,
            { rowsAffected: fallbackUpdate.rowCount }
          );
        } catch (fallbackErr) {
          console.error(
            `[CONTRATOS] Fallback também falhou para tomador ${updated.tomador_id}:`,
            fallbackErr
          );
        }
        return NextResponse.json(
          {
            success: false,
            error:
              'Erro ao liberar acesso automático após aceite do contrato. Por favor, tente novamente ou entre em contato com suporte.',
            details: err instanceof Error ? err.message : String(err),
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          contrato: updated,
          boasVindasUrl,
          credenciais,
          loginLiberadoImediatamente: true,
          tomadorId: updated.tomador_id,
        },
        { status: 200 }
      );
    }

    // AÇÃO: CRIAR - Requer autenticação (apenas admin)
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (acao === 'criar') {
      const { tomador_id, ip_aceite } = body;

      if (!tomador_id) {
        return NextResponse.json(
          { error: 'Dados incompletos. Forneça tomador_id' },
          { status: 400 }
        );
      }

      // Pegar IP do cliente
      const _clientIp =
        ip_aceite ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';

      // A funcionalidade de criação de contrato pré-pagamento foi removida.
      // Retornar 410 para o frontend com instruções claras. O frontend deve
      // iniciar o fluxo de pagamento diretamente (iniciar → confirmar → ativação).
      return NextResponse.json(
        {
          error:
            'Funcionalidade de contrato pré-pagamento foi permanentemente removida. O sistema usa fluxo simplificado: Cadastro → Aprovação → Pagamento → Ativação Automática.',
        },
        { status: 410 }
      );
    } else {
      return NextResponse.json(
        { error: 'Ação inválida. Use "criar" ou "aceitar"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erro ao processar contrato:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Erro ao processar contrato' },
      { status: 500 }
    );
  }
}
