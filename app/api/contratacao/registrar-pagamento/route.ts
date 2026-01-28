import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { query } from '@/lib/db';
import { calcularParcelas } from '@/lib/parcelas-helper';

export const dynamic = 'force-dynamic';

/**
 * API para registrar dados completos de pagamento após confirmação
 * POST /api/contratacao/registrar-pagamento
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const {
      contrato_plano_id,
      valor_pago,
      tipo_pagamento, // 'boleto', 'cartao', 'pix'
      modalidade_pagamento, // 'a_vista', 'parcelado'
      numero_parcelas,
    } = body;

    // Validações
    if (!contrato_plano_id) {
      return NextResponse.json(
        { error: 'ID do contrato de plano é obrigatório' },
        { status: 400 }
      );
    }

    if (!valor_pago || valor_pago <= 0) {
      return NextResponse.json(
        { error: 'Valor pago é obrigatório e deve ser maior que zero' },
        { status: 400 }
      );
    }

    if (
      !tipo_pagamento ||
      !['boleto', 'cartao', 'pix'].includes(tipo_pagamento)
    ) {
      return NextResponse.json(
        { error: 'Tipo de pagamento inválido' },
        { status: 400 }
      );
    }

    if (
      !modalidade_pagamento ||
      !['a_vista', 'parcelado'].includes(modalidade_pagamento)
    ) {
      return NextResponse.json(
        { error: 'Modalidade de pagamento inválida' },
        { status: 400 }
      );
    }

    // Se parcelado, validar número de parcelas
    if (modalidade_pagamento === 'parcelado') {
      if (!numero_parcelas || numero_parcelas < 2 || numero_parcelas > 12) {
        return NextResponse.json(
          { error: 'Número de parcelas deve estar entre 2 e 12' },
          { status: 400 }
        );
      }
    }

    // Calcular parcelas se for parcelado
    let parcelasJson = null;
    if (modalidade_pagamento === 'parcelado' && numero_parcelas) {
      const parcelas = calcularParcelas({
        valorTotal: valor_pago,
        numeroParcelas: numero_parcelas,
        dataInicial: new Date(),
      });
      parcelasJson = JSON.stringify(parcelas);
    }

    // Atualizar contrato de plano com dados de pagamento
    const result = await query(
      `UPDATE contratos_planos 
       SET 
         valor_pago = $1,
         tipo_pagamento = $2,
         modalidade_pagamento = $3,
         numero_parcelas = $4,
         parcelas_json = $5::jsonb,
         data_pagamento = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        valor_pago,
        tipo_pagamento,
        modalidade_pagamento,
        numero_parcelas || null,
        parcelasJson,
        contrato_plano_id,
      ],
      session
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contrato de plano não encontrado' },
        { status: 404 }
      );
    }

    // Registrar auditoria
    await query(
      `INSERT INTO auditoria_planos (
        contrato_id, 
        usuario_cpf, 
        acao, 
        detalhes
      ) VALUES ($1, $2, $3, $4)`,
      [
        contrato_plano_id,
        session.cpf,
        'pagamento_registrado',
        JSON.stringify({
          valor_pago,
          tipo_pagamento,
          modalidade_pagamento,
          numero_parcelas,
          timestamp: new Date().toISOString(),
        }),
      ],
      session
    );

    return NextResponse.json({
      success: true,
      contrato: result.rows[0],
      message: 'Dados de pagamento registrados com sucesso',
    });
  } catch (error) {
    console.error('[API Registrar Pagamento] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar dados de pagamento' },
      { status: 500 }
    );
  }
}
