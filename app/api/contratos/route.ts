import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getContratosBytomador } from '@/lib/db-contratacao';
import { query, criarContaResponsavel } from '@/lib/db';
import { obterContrato } from '@/lib/contratos/contratos';

export const dynamic = 'force-dynamic';

/**
 * GET: Buscar contratos
 * Query params:
 * - id: ID do contrato específico
 * - tomador_id: Listar contratos de um tomador
 *
 * IMPORTANTE: Buscar contrato por ID não requer autenticação (novos tomadores precisam visualizar)
 * Listar contratos de tomador SIM requer autenticação
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tomadorId =
      searchParams.get('tomador_id') || searchParams.get('tomador_id');

    // Buscar contrato específico por ID - NÃO requer autenticação
    if (id) {
      // Usar função obterContrato que já faz JOIN com tomadores
      const contrato = await obterContrato(parseInt(id));

      if (!contrato) {
        return NextResponse.json(
          { error: 'Contrato não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        contrato,
      });
    }

    // Listar contratos de tomador - REQUER autenticação
    if (tomadorId) {
      const session = getSession();
      if (!session) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }

      const contratos = await getContratosBytomador(
        parseInt(tomadorId),
        session
      );

      return NextResponse.json({
        success: true,
        contratos,
      });
    }

    return NextResponse.json(
      { error: 'Parâmetros inválidos. Forneça id ou tomador_id' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);

    // Retornar erro detalhado para debugging
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Erro ao buscar contratos' },
      { status: 500 }
    );
  }
}

/**
 * POST: Criar ou aceitar contrato
 * Body:
 * - acao: 'criar' | 'aceitar'
 * - Para criar: { tomador_id, plano_id, ip_aceite? }
 * - Para aceitar: { contrato_id, ip_aceite }
 *
 * IMPORTANTE: Aceite de contrato NÃO requer autenticação (novos tomadors)
 * Criação de contrato SIM requer autenticação (apenas admin)
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
        `SELECT id, tomador_id, plano_id, numero_funcionarios, valor_total, aceito, tipo_tomador FROM contratos WHERE id = $1`,
        [contrato_id]
      );

      if (contratoRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'Contrato não encontrado' },
          { status: 404 }
        );
      }

      const contratoRow = contratoRes.rows[0];

      // Se já aceito, retornar sucesso com url do simulador (se pagamento está ativado)
      if (contratoRow.aceito) {
        const skipPaymentPhase =
          process.env.NEXT_PUBLIC_SKIP_PAYMENT_PHASE === 'true';

        const response: any = {
          success: true,
          message: 'Contrato já aceito',
        };

        // Só incluir URL do simulador se pagamento está ativado (skipPaymentPhase = false)
        if (!skipPaymentPhase) {
          const simuladorUrl = `/pagamento/simulador?tomador_id=${contratoRow.tomador_id}&plano_id=${contratoRow.plano_id}&numero_funcionarios=${contratoRow.numero_funcionarios}&contrato_id=${contratoRow.id}`;
          response.simulador_url = simuladorUrl;
        }

        return NextResponse.json(response, { status: 200 });
      }

      // Marcar contrato como aceito (sem geração de hash — contrato padrão unificado)
      const updateRes = await query(
        `UPDATE contratos SET aceito = true, ip_aceite = $2, data_aceite = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [contratoRow.id, clientIp]
      );

      const updated = updateRes.rows[0];

      // Verificar feature flag para pular fase de pagamento
      const skipPaymentPhase =
        process.env.NEXT_PUBLIC_SKIP_PAYMENT_PHASE === 'true';

      let loginLiberadoImediatamente = false;
      let simuladorUrl = `/pagamento/simulador?tomador_id=${updated.tomador_id}&plano_id=${updated.plano_id}&numero_funcionarios=${updated.numero_funcionarios}&contrato_id=${updated.id}`;
      let boasVindasUrl: string | null = null;
      let credenciais: { login: string; senha: string } | null = null;

      if (skipPaymentPhase) {
        try {
          // Buscar dados completos do tomador usando tipo_tomador do contrato
          // Isso garante que buscamos na tabela CORRETA com base em onde foi originalmente inserido
          const tabelaTomador: 'entidades' | 'clinicas' =
            updated.tipo_tomador === 'clinica' ? 'clinicas' : 'entidades';

          const tomadorRes = await query(
            `SELECT * FROM ${tabelaTomador} WHERE id = $1`,
            [updated.tomador_id]
          );

          if (tomadorRes.rows.length === 0) {
            console.error(
              `[CONTRATOS] Tomador ${updated.tomador_id} não encontrado na tabela ${tabelaTomador} (tipo_tomador=${updated.tipo_tomador})`
            );
            throw new Error(
              `Tomador não encontrado na tabela ${tabelaTomador}`
            );
          }

          const tomadorData = tomadorRes.rows[0];

          // Garantir que tipo esteja definido com base na tabela
          if (!tomadorData.tipo) {
            tomadorData.tipo =
              tabelaTomador === 'clinicas' ? 'clinica' : 'entidade';
          }

          console.info(
            JSON.stringify({
              event: 'contrato_aceito_tomador_localizado',
              tomador_id: updated.tomador_id,
              tabela: tabelaTomador,
              tipo: tomadorData.tipo,
              tipo_tomador_contrato: updated.tipo_tomador,
            })
          );

          // Criar conta responsável (libera login)
          await criarContaResponsavel(tomadorData);

          // Atualizar tomador para marcar como ativo
          const updateTableQuery = `UPDATE ${tabelaTomador} SET ativa = true, data_liberacao_login = CURRENT_TIMESTAMP WHERE id = $1`;
          await query(updateTableQuery, [updated.tomador_id]);

          // Calcular credenciais (mesmo que em criarContaResponsavel)
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

          // Log de auditoria
          console.info(
            JSON.stringify({
              event: 'contrato_aceito_com_liberacao_login_automatica',
              contrato_id: updated.id,
              tomador_id: updated.tomador_id,
              ip_aceite: clientIp,
              skip_payment_phase: true,
              timestamp: new Date().toISOString(),
            })
          );

          loginLiberadoImediatamente = true;
          simuladorUrl = null; // Não usar simulador se pagamento foi pulado
        } catch (err) {
          console.error(
            '[CONTRATOS] Erro ao liberar login automaticamente após aceite:',
            err
          );
          // Se skipPaymentPhase está ativado mas houve erro, retornar erro
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
      } else {
        // Log normal quando pagamento está ativado
        console.info(
          JSON.stringify({
            event: 'contrato_aceito',
            contrato_id: updated.id,
            tomador_id: updated.tomador_id,
            ip_aceite: clientIp,
            timestamp: new Date().toISOString(),
          })
        );
      }

      return NextResponse.json(
        {
          success: true,
          contrato: updated,
          simulador_url: simuladorUrl,
          boasVindasUrl,
          credenciais,
          loginLiberadoImediatamente,
          skip_payment_phase: skipPaymentPhase,
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
      const { tomador_id, plano_id, ip_aceite } = body;

      if (!tomador_id || !plano_id) {
        return NextResponse.json(
          { error: 'Dados incompletos. Forneça tomador_id e plano_id' },
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
