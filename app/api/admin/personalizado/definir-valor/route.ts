import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { createProposalLink } from '@/lib/utils/get-base-url';
import crypto from 'crypto';

/**
 * POST /api/admin/personalizado/definir-valor
 *
 * Admin define número de funcionários e valor para plano personalizado e gera link
 *
 * Fluxo:
 * 1. Admin recebe pré-cadastro em status 'aguardando_valor_admin'
 * 2. Admin define numero_funcionarios e valor_por_funcionario
 * 3. Sistema calcula valor_total
 * 4. Sistema gera token único de acesso
 * 5. Sistema atualiza status para 'valor_definido'
 * 6. Sistema retorna link para envio ao tomador
 *
 * Body:
 * - contratacao_id: ID do registro em contratacao_personalizada
 * - numero_funcionarios: Número final de funcionários
 * - valor_por_funcionario: Valor negociado por funcionário
 *
 * Retorna:
 * - link_proposta: URL com token para tomador acessar e aceitar
 */
export async function POST(request: NextRequest) {
  try {
    // Validar sessão de admin
    const session = getSession();
    if (!session || session.perfil !== 'admin') {
      return NextResponse.json(
        {
          error: 'Acesso negado. Apenas admins podem definir valores.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contratacao_id, numero_funcionarios, valor_por_funcionario } = body;

    // Validação de entrada
    if (!contratacao_id || !numero_funcionarios || !valor_por_funcionario) {
      return NextResponse.json(
        {
          error:
            'contratacao_id, numero_funcionarios e valor_por_funcionario são obrigatórios',
        },
        { status: 400 }
      );
    }

    const numFunc = parseInt(numero_funcionarios);
    const valorFunc = parseFloat(valor_por_funcionario);

    if (isNaN(numFunc) || numFunc <= 0) {
      return NextResponse.json(
        { error: 'numero_funcionarios deve ser um número positivo' },
        { status: 400 }
      );
    }

    if (isNaN(valorFunc) || valorFunc <= 0) {
      return NextResponse.json(
        { error: 'valor_por_funcionario deve ser um número positivo' },
        { status: 400 }
      );
    }

    const valorTotal = numFunc * valorFunc;

    try {
      await query('BEGIN');

      // Buscar contratacao_personalizada e verificar status
      const contratacaoResult = await query(
        `SELECT 
          cp.id,
          cp.entidade_id,
          cp.status,
          c.nome AS tomador_nome,
          c.email AS responsavel_email,
          c.cnpj
        FROM contratacao_personalizada cp
        JOIN entidades c ON cp.entidade_id = c.id
        WHERE cp.id = $1`,
        [contratacao_id]
      );

      if (contratacaoResult.rows.length === 0) {
        await query('ROLLBACK');
        return NextResponse.json(
          { error: 'Contratação personalizada não encontrada' },
          { status: 404 }
        );
      }

      const contratacao = contratacaoResult.rows[0];

      if (contratacao.status !== 'aguardando_valor_admin') {
        await query('ROLLBACK');
        return NextResponse.json(
          {
            error: `Contratação está em status "${contratacao.status}". Esperado "aguardando_valor_admin".`,
          },
          { status: 400 }
        );
      }

      // Gerar token único para link de acesso
      const token = crypto.randomBytes(32).toString('hex');
      const expiracao = new Date();
      expiracao.setDate(expiracao.getDate() + 7); // Link válido por 7 dias

      // Atualizar contratacao_personalizada
      await query(
        `UPDATE contratacao_personalizada 
        SET 
          numero_funcionarios_estimado = $1,
          valor_por_funcionario = $2,
          valor_total_estimado = $3,
          payment_link_token = $4,
          payment_link_expiracao = $5,
          status = 'valor_definido',
          link_enviado_em = NOW(),
          atualizado_em = NOW()
        WHERE id = $6`,
        [numFunc, valorFunc, valorTotal, token, expiracao, contratacao_id]
      );

      // Atualizar entidade para aguardando_aceite
      await query(
        `UPDATE entidades 
        SET status = 'aguardando_aceite',
            atualizado_em = NOW()
        WHERE id = $1`,
        [contratacao.entidade_id]
      );

      // Registrar auditoria
      await logAudit({
        resource: 'contratacao_personalizada',
        action: 'UPDATE',
        resourceId: contratacao_id,
        details: JSON.stringify({
          entidade_id: contratacao.entidade_id,
          tomador_nome: contratacao.tomador_nome,
          numero_funcionarios: numFunc,
          valor_por_funcionario: valorFunc,
          valor_total: valorTotal,
          definido_por: session.cpf,
          definido_por_nome: session.nome,
          severity: 'medium',
        }),
      });

      await query('COMMIT');

      // Construir link da proposta
      const linkProposta = createProposalLink(token);

      // Log estruturado
      console.info(
        JSON.stringify({
          event: 'personalizado_valor_definido',
          contratacao_id,
          entidade_id: contratacao.entidade_id,
          tomador_nome: contratacao.tomador_nome,
          numero_funcionarios: numFunc,
          valor_total: valorTotal,
          link_proposta: linkProposta,
          definido_por: session.cpf,
          definido_por_nome: session.nome,
        })
      );

      return NextResponse.json({
        success: true,
        message: 'Valor definido e link gerado com sucesso',
        data: {
          link_proposta: linkProposta,
          contratacao_id,
          token,
          expira_em: expiracao.toISOString(),
          proposta_info: {
            numero_funcionarios: numFunc,
            valor_por_funcionario: valorFunc,
            valor_total: valorTotal,
          },
          tomador_info: {
            id: contratacao.entidade_id,
            nome: contratacao.tomador_nome,
            email: contratacao.responsavel_email,
            cnpj: contratacao.cnpj,
          },
        },
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('[ADMIN] Erro ao definir valor para personalizado:', error);

    return NextResponse.json(
      {
        error: 'Erro ao definir valor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
