import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

/**
 * POST /api/admin/manutencao/pagamentos/[pagamentoId]/disponibilizar
 * Marca link_disponibilizado_em = NOW() e cria notificação para o tomador
 */
export async function POST(
  _request: Request,
  { params }: { params: { pagamentoId: string } }
) {
  try {
    const user = await requireRole('suporte', false);
    const pagamentoId = parseInt(params.pagamentoId);

    if (isNaN(pagamentoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const result = await query(
      `SELECT p.id, p.status, p.valor, p.tipo_cobranca,
              p.link_pagamento_token, p.link_disponibilizado_em,
              p.entidade_id, p.empresa_id,
              COALESCE(e.nome, em.nome) as nome,
              e.responsavel_cpf
       FROM pagamentos p
       LEFT JOIN entidades e ON p.entidade_id = e.id
       LEFT JOIN empresas_clientes em ON p.empresa_id = em.id
       WHERE p.id = $1 AND p.tipo_cobranca = 'manutencao'`,
      [pagamentoId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pagamento de manutenção não encontrado' },
        { status: 404 }
      );
    }

    const pagamento = result.rows[0];

    if (!pagamento.link_pagamento_token) {
      return NextResponse.json(
        {
          error:
            'Link de pagamento ainda não foi gerado. Gere o link primeiro.',
        },
        { status: 400 }
      );
    }

    if (pagamento.status === 'pago') {
      return NextResponse.json(
        { error: 'Pagamento já confirmado' },
        { status: 400 }
      );
    }

    if (pagamento.link_disponibilizado_em) {
      return NextResponse.json(
        { error: 'Link já foi disponibilizado na conta do tomador' },
        { status: 409 }
      );
    }

    await query(
      `UPDATE pagamentos
       SET link_disponibilizado_em = NOW(),
           atualizado_em = NOW()
       WHERE id = $1`,
      [pagamentoId]
    );

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const linkPagamento = `${baseUrl}/pagamento/manutencao/${pagamento.link_pagamento_token}`;

    // Criar notificação para o responsável pelo tomador
    if (pagamento.responsavel_cpf) {
      try {
        await query(
          `INSERT INTO notificacoes (
            tipo, titulo, mensagem, destinatario_cpf, destinatario_tipo,
            prioridade, link_acao, dados_contexto
          ) VALUES (
            'pagamento_pendente',
            'Taxa de manutenção disponível para pagamento',
            $1, $2, 'gestor',
            'alta', $3, $4
          )`,
          [
            `Taxa de manutenção anual de R$ ${parseFloat(pagamento.valor).toFixed(2)} disponível para pagamento.`,
            pagamento.responsavel_cpf,
            linkPagamento,
            JSON.stringify({
              pagamento_id: pagamentoId,
              valor: parseFloat(pagamento.valor),
              nome: pagamento.nome,
            }),
          ]
        );
      } catch (notifErr) {
        console.error('[ADMIN] Erro ao criar notificação:', notifErr);
      }
    }

    console.log(
      `[INFO] Admin ${user.cpf} disponibilizou link de manutenção para pagamento ${pagamentoId}`
    );

    return NextResponse.json({
      success: true,
      pagamento_id: pagamentoId,
      link_disponibilizado_em: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[ERRO] manutencao/pagamentos/disponibilizar:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
