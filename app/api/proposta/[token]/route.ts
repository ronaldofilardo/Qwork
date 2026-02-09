import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/proposta/[token]
 *
 * Busca dados da proposta personalizada através do token
 * Usado pela página /proposta/[token] para exibir detalhes da entidade
 *
 * Retorna:
 * - dados da proposta (entidade, plano, valores)
 * - validade do token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 }
      );
    }

    // Buscar proposta pelo token
    const result = await query(
      `SELECT 
        cp.id AS contratacao_id,
        cp.entidade_id,
        cp.numero_funcionarios_estimado,
        cp.valor_por_funcionario,
        cp.valor_total_estimado,
        cp.payment_link_expiracao,
        cp.status,
        e.nome AS entidade_nome,
        e.cnpj,
        e.responsavel_nome,
        e.responsavel_email,
        e.plano_id,
        p.nome AS plano_nome,
        p.tipo AS plano_tipo
      FROM contratacao_personalizada cp
      JOIN entidades e ON cp.entidade_id = e.id
      LEFT JOIN planos p ON e.plano_id = p.id
      WHERE cp.payment_link_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          valido: false,
          error: 'Link inválido ou expirado',
        },
        { status: 404 }
      );
    }

    const proposta = result.rows[0];

    // Verificar expiração
    const agora = new Date();
    const expiracao = new Date(proposta.payment_link_expiracao);

    if (agora > expiracao) {
      return NextResponse.json(
        {
          valido: false,
          error: 'Este link expirou. Entre em contato com o suporte.',
        },
        { status: 410 }
      );
    }

    // Verificar status
    if (proposta.status !== 'valor_definido') {
      return NextResponse.json(
        {
          valido: false,
          error: `Esta proposta já foi ${proposta.status === 'pago' ? 'paga' : 'processada'}.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valido: true,
      contratacao_id: proposta.contratacao_id,
      entidade_id: proposta.entidade_id,
      entidade_nome: proposta.entidade_nome,
      cnpj: proposta.cnpj,
      responsavel_nome: proposta.responsavel_nome,
      responsavel_email: proposta.responsavel_email,
      plano_nome: proposta.plano_nome || 'Plano Personalizado',
      plano_tipo: proposta.plano_tipo || 'personalizado',
      numero_funcionarios: proposta.numero_funcionarios_estimado,
      valor_por_funcionario: parseFloat(proposta.valor_por_funcionario),
      valor_total: parseFloat(proposta.valor_total_estimado),
      expira_em: proposta.payment_link_expiracao,
    });
  } catch (error) {
    console.error('[PROPOSTA] Erro ao buscar proposta:', error);

    return NextResponse.json(
      {
        valido: false,
        error: 'Erro ao buscar proposta',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
