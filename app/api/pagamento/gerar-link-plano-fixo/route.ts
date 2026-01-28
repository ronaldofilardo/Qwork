import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST /api/pagamento/gerar-link-plano-fixo
 *
 * Gera link de pagamento para planos fixos quando há falha no pagamento inicial
 * Body:
 * - contratante_id: ID do contratante
 * - contrato_id: ID do contrato (opcional, será criado se não existir)
 * - plano_id: ID do plano fixo
 * - numero_funcionarios: Número de funcionários
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contratante_id, contrato_id, plano_id, numero_funcionarios } = body;

    // Validações
    if (!contratante_id || !plano_id || !numero_funcionarios) {
      return NextResponse.json(
        {
          error:
            'Campos obrigatórios: contratante_id, plano_id, numero_funcionarios',
        },
        { status: 400 }
      );
    }

    await query('BEGIN');

    try {
      // Verificar status do contratante
      const contratanteRes = await query(
        'SELECT status, ativa, pagamento_confirmado FROM contratantes WHERE id = $1',
        [contratante_id]
      );

      if (contratanteRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'Contratante não encontrado' },
          { status: 404 }
        );
      }

      const contratante = contratanteRes.rows[0];

      // Não permitir regeneração para contratantes já aprovados
      if (contratante.status === 'aprovado') {
        return NextResponse.json(
          {
            error:
              'Não é possível gerar link de pagamento para contratante já aprovado',
          },
          { status: 400 }
        );
      }

      // Buscar dados do plano
      const planoRes = await query(
        `SELECT id, nome, tipo, preco, caracteristicas 
         FROM planos 
         WHERE id = $1 AND tipo = 'fixo'`,
        [plano_id]
      );

      if (planoRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'Plano fixo não encontrado' },
          { status: 404 }
        );
      }

      const plano = planoRes.rows[0];
      const limiteCaracteristicas = plano.caracteristicas?.limite_funcionarios;
      const limite = limiteCaracteristicas
        ? parseInt(limiteCaracteristicas)
        : null;

      // Validar limite de funcionários
      if (limite && numero_funcionarios > limite) {
        return NextResponse.json(
          {
            error: `Número de funcionários (${numero_funcionarios}) excede o limite do plano (${limite})`,
          },
          { status: 400 }
        );
      }

      // Calcular valor total (plano fixo tem preço por funcionário)
      const valorPorFuncionario = parseFloat(plano.preco);
      const valorTotal = valorPorFuncionario * numero_funcionarios;

      let contratoIdFinal = contrato_id;

      // Se não tiver contrato, criar um com status 'aguardando_pagamento'
      if (!contratoIdFinal) {
        const contratoRes = await query(
          `INSERT INTO contratos (
            contratante_id,
            plano_id,
            numero_funcionarios,
            valor_total,
            status,
            conteudo,
            conteudo_gerado
          ) VALUES ($1, $2, $3, $4, 'aguardando_pagamento', $5, $5)
          RETURNING id`,
          [
            contratante_id,
            plano_id,
            numero_funcionarios,
            valorTotal,
            `Contrato de Serviço - ${plano.nome}\n\nValor: R$ ${valorTotal.toFixed(2)}\nNúmero de Funcionários: ${numero_funcionarios}\nValor por Funcionário: R$ ${valorPorFuncionario.toFixed(2)}`,
          ]
        );

        contratoIdFinal = contratoRes.rows[0].id;
      }

      // Atualizar status do contratante para 'aguardando_pagamento'
      // NÃO ATIVAR até confirmação de pagamento
      await query(
        `UPDATE contratantes 
         SET status = 'aguardando_pagamento',
             pagamento_confirmado = false,
             ativa = false
         WHERE id = $1`,
        [contratante_id]
      );

      await query('COMMIT');

      // Gerar link de pagamento
      const paymentLink = `/pagamento/simulador?contratante_id=${contratante_id}&contrato_id=${contratoIdFinal}&plano_id=${plano_id}&numero_funcionarios=${numero_funcionarios}&retry=true`;

      console.info(
        JSON.stringify({
          event: 'payment_link_generated_plano_fixo',
          contratante_id,
          contrato_id: contratoIdFinal,
          plano_id,
          numero_funcionarios,
          valor_total: valorTotal,
          valor_por_funcionario: valorPorFuncionario,
          payment_link: paymentLink,
        })
      );

      return NextResponse.json({
        success: true,
        contrato_id: contratoIdFinal,
        payment_link: paymentLink,
        payment_info: {
          valor_total: valorTotal,
          valor_por_funcionario: valorPorFuncionario,
          numero_funcionarios,
          plano_nome: plano.nome,
          plano_tipo: 'fixo',
        },
        message:
          'Link de pagamento gerado com sucesso. Complete o pagamento para ativar o contrato.',
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Erro ao gerar link de pagamento:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao gerar link de pagamento',
      },
      { status: 500 }
    );
  }
}
