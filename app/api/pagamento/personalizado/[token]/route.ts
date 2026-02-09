import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Validar link de pagamento personalizado
 * Retorna dados da entidade e valores para exibição na página de pagamento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    // Buscar dados da contratacao_personalizada com token
    const res = await query(
      `SELECT 
        cp.id as contratacao_id,
        cp.entidade_id,
        cp.valor_por_funcionario,
        cp.numero_funcionarios_estimado,
        cp.valor_total_estimado,
        cp.status,
        cp.payment_link_expiracao,
        t.id as tomador_id,
        t.nome as tomador_nome,
        t.tipo,
        t.email as tomador_email,
        t.cnpj as tomador_cnpj,
        p.nome as plano_nome,
        p.id as plano_id
       FROM contratacao_personalizada cp
       JOIN tomadores t ON t.id = COALESCE(cp.tomador_id, cp.entidade_id)
       JOIN planos p ON p.id = t.plano_id
       WHERE cp.payment_link_token = $1 
       AND cp.status IN ('valor_definido', 'aguardando_pagamento')`,
      [token]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Link inválido ou já utilizado' },
        { status: 404 }
      );
    }

    const data = res.rows[0];

    // Verificar expiração (48h)
    if (data.payment_link_expiracao) {
      const expiracao = new Date(data.payment_link_expiracao);
      if (expiracao < new Date()) {
        return NextResponse.json(
          { error: 'Link expirado. Solicite um novo link ao administrador.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      valido: true,
      contratacao_id: data.contratacao_id,
      entidade_id: data.entidade_id,
      tomador_id: data.tomador_id,
      entidade_id_compat: data.entidade_id, // backward compat
      tomador_nome: data.tomador_nome,
      tipo: data.tipo,
      entidade_nome: data.tomador_nome, // backward compat
      entidade_email: data.tomador_email,
      entidade_cnpj: data.tomador_cnpj,
      plano_nome: data.plano_nome,
      plano_id: data.plano_id,
      valor_por_funcionario: parseFloat(data.valor_por_funcionario || '0'),
      numero_funcionarios: parseInt(
        data.numero_funcionarios_estimado || '0',
        10
      ),
      valor_total: parseFloat(data.valor_total_estimado || '0'),
      status: data.status,
    });
  } catch (error) {
    console.error('Erro ao validar link de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

/**
 * POST - Aceitar proposta de valor e redirecionar para contrato
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await request.json();
    const { acao } = body;

    // Validar token
    const validacao = await query(
      `SELECT 
        cp.id,
        cp.entidade_id, 
        cp.status,
        cp.valor_por_funcionario,
        cp.numero_funcionarios_estimado,
        cp.valor_total_estimado,
        t.plano_id,
        t.tipo
       FROM contratacao_personalizada cp
       JOIN tomadores t ON t.id = COALESCE(cp.tomador_id, cp.entidade_id)
       WHERE cp.payment_link_token = $1
         AND cp.payment_link_expiracao > NOW()`,
      [token]
    );

    if (validacao.rows.length === 0) {
      return NextResponse.json(
        { error: 'Link inválido ou expirado' },
        { status: 404 }
      );
    }

    const proposta = validacao.rows[0];

    if (acao === 'aceitar') {
      // Atualizar status da contratação
      await query(
        `UPDATE contratacao_personalizada 
         SET status = 'valor_aceito_pelo_tomador',
             atualizado_em = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [proposta.id]
      );

      // Criar contrato (reutilizando lógica de plano fixo)
      const contratoRes = await query(
        `INSERT INTO contratos (
          entidade_id, plano_id, numero_funcionarios, valor_total,
          status, criado_em
        ) VALUES ($1, $2, $3, $4, 'pendente', CURRENT_TIMESTAMP)
        RETURNING id, entidade_id, plano_id, numero_funcionarios, valor_total, status`,
        [
          proposta.entidade_id,
          proposta.plano_id,
          proposta.numero_funcionarios_estimado,
          proposta.valor_total_estimado,
        ]
      );

      const contratoId = contratoRes.rows[0].id;

      console.info(
        JSON.stringify({
          event: 'proposta_personalizada_aceita',
          entidade_id: proposta.entidade_id,
          contrato_id: contratoId,
          valor_total: proposta.valor_total_estimado,
          timestamp: new Date().toISOString(),
        })
      );

      // Buscar dados do tomador para retornar com o contrato
      const entidadeRes = await query(
        `SELECT nome, cnpj, email, tipo FROM tomadores WHERE id = $1`,
        [proposta.entidade_id]
      );

      const entidade = entidadeRes.rows[0];

      return NextResponse.json({
        success: true,
        message: 'Proposta aceita! Revise e aceite o contrato.',
        contrato: {
          id: contratoId,
          entidade_id: proposta.entidade_id,
          tomador_id: proposta.entidade_id,
          tomador_nome: entidade.nome,
          tipo: entidade.tipo,
          entidade_cnpj: entidade.cnpj,
          entidade_email: entidade.email,
          plano_id: proposta.plano_id,
          numero_funcionarios: proposta.numero_funcionarios_estimado,
          valor_total: proposta.valor_total_estimado,
          status: 'pendente',
        },
      });
    }

    if (acao === 'recusar') {
      await query(
        `UPDATE contratacao_personalizada 
         SET status = 'aguardando_renegociacao',
             atualizado_em = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [proposta.id]
      );

      return NextResponse.json({
        success: true,
        message: 'Proposta recusada. O administrador será notificado.',
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar proposta:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
