import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getContratosBytomador } from '@/lib/db-contratacao';
import { query, criarContaResponsavel } from '@/lib/db';

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
      const contrato = await query('SELECT * FROM contratos WHERE id = $1', [
        parseInt(id),
      ]);

      if (contrato.rows.length === 0) {
        return NextResponse.json(
          { error: 'Contrato não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        contrato: contrato.rows[0],
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

      // Buscar contrato
      const contratoRes = await query(
        `SELECT id, tomador_id, plano_id, numero_funcionarios, valor_total, aceito FROM contratos WHERE id = $1`,
        [contrato_id]
      );

      if (contratoRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'Contrato não encontrado' },
          { status: 404 }
        );
      }

      const contratoRow = contratoRes.rows[0];

      // Se já aceito, retornar sucesso com url do simulador
      if (contratoRow.aceito) {
        const simuladorUrl = `/pagamento/simulador?tomador_id=${contratoRow.tomador_id}&plano_id=${contratoRow.plano_id}&numero_funcionarios=${contratoRow.numero_funcionarios}&contrato_id=${contratoRow.id}`;
        return NextResponse.json(
          {
            success: true,
            message: 'Contrato já aceito',
            simulador_url: simuladorUrl,
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

      // Verificar feature flag para pular fase de pagamento
      const skipPaymentPhase = process.env.NEXT_PUBLIC_SKIP_PAYMENT_PHASE === 'true';

      let loginLiberadoImediatamente = false;
      let simuladorUrl = `/pagamento/simulador?tomador_id=${updated.tomador_id}&plano_id=${updated.plano_id}&numero_funcionarios=${updated.numero_funcionarios}&contrato_id=${updated.id}`;

      if (skipPaymentPhase) {
        try {
          // Buscar dados completos do tomador para criar conta
          const tomadorRes = await query(
            `SELECT * FROM entidades WHERE id = $1`,
            [updated.tomador_id]
          );

          if (tomadorRes.rows.length === 0) {
            console.error(
              `[CONTRATOS] Entidade ${updated.tomador_id} não encontrada para liberação de login`
            );
          } else {
            const tomadorData = tomadorRes.rows[0];

            // Criar conta responsável (libera login)
            await criarContaResponsavel(tomadorData);

            // Atualizar tomador para marcar como ativo e pagamento confirmado
            await query(
              `UPDATE entidades SET ativa = true, pagamento_confirmado = true, data_liberacao_login = CURRENT_TIMESTAMP WHERE id = $1`,
              [updated.tomador_id]
            );

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
          }
        } catch (err) {
          console.error(
            '[CONTRATOS] Erro ao liberar login automaticamente após aceite:',
            err
          );
          // Se houver erro, continuar com simulador como fallback
          loginLiberadoImediatamente = false;
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
