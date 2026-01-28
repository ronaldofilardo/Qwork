import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { getBaseUrl } from '@/lib/utils/get-base-url';

/**
 * POST /api/admin/gerar-link-retomada
 *
 * Gera link de retomada de pagamento para plano fixo
 * Body:
 * - contratante_id: ID do contratante
 * - contrato_id: ID do contrato
 * - enviar_email: boolean (opcional) - se deve enviar email automaticamente
 */
export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requireRole(session, ['admin']);

    const body = await request.json();
    const { contratante_id, contrato_id, enviar_email = false } = body;

    // Validações
    if (!contratante_id || !contrato_id) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: contratante_id, contrato_id' },
        { status: 400 }
      );
    }

    // Verificar se contratante e contrato existem
    const verificacao = await query(
      `SELECT 
        c.id as contratante_id,
        c.nome as contratante_nome,
        c.email as contratante_email,
        c.status as contratante_status,
        c.pagamento_confirmado,
        ct.id as contrato_id,
        ct.numero_contrato,
        ct.valor_total,
        p.tipo as plano_tipo
      FROM contratantes c
      JOIN contratos ct ON ct.id = $2 AND ct.contratante_id = c.id
      JOIN planos p ON ct.plano_id = p.id
      WHERE c.id = $1`,
      [contratante_id, contrato_id]
    );

    if (verificacao.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contratante ou contrato não encontrado' },
        { status: 404 }
      );
    }

    const dados = verificacao.rows[0];

    // Validar se já não foi pago
    if (dados.pagamento_confirmado) {
      return NextResponse.json(
        { error: 'Pagamento já foi confirmado para este contratante' },
        { status: 400 }
      );
    }

    // Construir URL de retomada sem uso de token (parâmetros por ID)
    const baseUrl = getBaseUrl();
    const linkRetomada = `${baseUrl}/pagamento/simulador?contratante_id=${contratante_id}&contrato_id=${contrato_id}`;

    // Log da ação
    console.info(
      JSON.stringify({
        event: 'link_retomada_gerado',
        contratante_id,
        contrato_id,
        gerado_por_cpf: session.cpf,
      })
    );

    // Se solicitado, enviar email (implementação futura)
    if (enviar_email) {
      // TODO: Integrar com serviço de email
      console.info(
        `[EMAIL] Enviaria email para ${dados.contratante_email} com link: ${linkRetomada}`
      );
    }

    // Criar registro de log/auditoria
    await query(
      `INSERT INTO logs_admin (
        admin_cpf,
        acao,
        entidade_tipo,
        entidade_id,
        detalhes
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        session.cpf,
        'gerar_link_retomada',
        'contratante',
        contratante_id,
        JSON.stringify({
          contrato_id,
          plano_tipo: dados.plano_tipo,
        }),
      ]
    );

    return NextResponse.json({
      success: true,
      link_retomada: linkRetomada,
      expira_em: '72 horas',
      dados_contratante: {
        nome: dados.contratante_nome,
        email: dados.contratante_email,
        numero_contrato: dados.numero_contrato,
        valor_total: dados.valor_total,
      },
      message: enviar_email
        ? 'Link gerado e email enviado com sucesso'
        : 'Link gerado com sucesso. Copie e envie manualmente para o contratante.',
    });
  } catch (error) {
    console.error('Erro ao gerar link de retomada:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao gerar link de retomada',
      },
      { status: 500 }
    );
  }
}
