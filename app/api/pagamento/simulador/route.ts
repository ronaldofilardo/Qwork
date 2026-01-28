import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pagamento/simulador
 *
 * Retorna informações para o simulador de pagamento
 * Query params:
 * - contratante_id: ID do contratante
 * - plano_id: ID do plano
 * - numero_funcionarios: Número de funcionários (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contratanteId = searchParams.get('contratante_id');
    const planoId = searchParams.get('plano_id');
    const numeroFuncionarios = parseInt(
      searchParams.get('numero_funcionarios') || '0'
    );

    if (!contratanteId || !planoId) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: contratante_id e plano_id' },
        { status: 400 }
      );
    }

    // Buscar informações do contratante
    const contratanteRes = await query(
      'SELECT id, nome, tipo FROM contratantes WHERE id = $1',
      [contratanteId]
    );

    if (contratanteRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contratante não encontrado' },
        { status: 404 }
      );
    }

    const contratante = contratanteRes.rows[0];

    // Buscar informações do plano
    const planoRes = await query(
      'SELECT id, nome, tipo, preco FROM planos WHERE id = $1 AND ativo = true',
      [planoId]
    );

    if (planoRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Plano não encontrado ou inativo' },
        { status: 404 }
      );
    }

    const plano = planoRes.rows[0];

    // Para planos fixos e personalizados, exigir que exista contrato aceito associado ao contratante
    // Para contratos aceitos sem contrato_id explícito, recuperar dados do contrato para uso no simulador
    let contratoEncontrado: any = null;
    if (plano.tipo === 'fixo' || plano.tipo === 'personalizado') {
      const contratoIdParam = searchParams.get('contrato_id');
      if (contratoIdParam) {
        const ctrRes = await query(
          'SELECT id, aceito FROM contratos WHERE id = $1 AND contratante_id = $2',
          [parseInt(contratoIdParam), contratanteId]
        );
        if (ctrRes.rows.length === 0 || !ctrRes.rows[0].aceito) {
          return NextResponse.json(
            { error: 'Contrato deve ser aceito antes do simulador' },
            { status: 403 }
          );
        }
      } else {
        const ctrRes = await query(
          'SELECT id, numero_funcionarios, valor_total, aceito FROM contratos WHERE contratante_id = $1 AND aceito = true LIMIT 1',
          [contratanteId]
        );
        if (ctrRes.rows.length === 0) {
          return NextResponse.json(
            { error: 'Contrato deve ser aceito antes do simulador' },
            { status: 403 }
          );
        }
        contratoEncontrado = ctrRes.rows[0];
      }
    }

    // Calcular valores
    let valorPorFuncionario: number | null = null;
    let valorTotal: number | null = null;

    if (plano.tipo === 'fixo') {
      // Plano fixo: sempre R$20 por funcionário
      valorPorFuncionario = 20.0;
      valorTotal = valorPorFuncionario * (numeroFuncionarios || 1);
    } else {
      // Plano personalizado: primeiro tentar usar dados do contrato (se fornecido)
      const contratoIdParam = searchParams.get('contrato_id');

      if (contratoIdParam) {
        const contratoRow = await query(
          'SELECT id, numero_funcionarios, valor_total FROM contratos WHERE id = $1 AND contratante_id = $2',
          [parseInt(contratoIdParam, 10), contratanteId]
        );
        if (contratoRow.rows.length > 0) {
          const contrato = contratoRow.rows[0];
          if (contrato.numero_funcionarios && contrato.valor_total) {
            valorPorFuncionario =
              Number(contrato.valor_total) /
              Number(contrato.numero_funcionarios);
            // Preferir número de funcionários do querystring se informado, senão usar do contrato
            valorTotal = Number(contrato.valor_total);
            // Ajustar valorTotal caso o usuário tenha informado um número diferente
            if (
              numeroFuncionarios &&
              Number(numeroFuncionarios) !==
                Number(contrato.numero_funcionarios)
            ) {
              valorTotal = valorPorFuncionario * Number(numeroFuncionarios);
            }
          }
        }
      }

      // Se não encontramos dados pelo contrato, tentar a tabela contratacao_personalizada
      if (valorPorFuncionario == null) {
        const cpRes = await query(
          `SELECT valor_por_funcionario, numero_funcionarios_estimado, valor_total_estimado
           FROM contratacao_personalizada WHERE contratante_id = $1 AND status IN ('valor_definido', 'aguardando_pagamento', 'valor_aceito_pelo_contratante') LIMIT 1`,
          [contratanteId]
        );
        if (cpRes.rows.length > 0) {
          const cp = cpRes.rows[0];
          if (cp.valor_por_funcionario) {
            valorPorFuncionario = Number(cp.valor_por_funcionario);
            const numFuncs =
              numeroFuncionarios || cp.numero_funcionarios_estimado || 1;
            valorTotal = cp.valor_total_estimado
              ? Number(cp.valor_total_estimado)
              : valorPorFuncionario * Number(numFuncs);
            // If user provided a number, recalc total
            if (numeroFuncionarios) {
              valorTotal = valorPorFuncionario * Number(numeroFuncionarios);
            }
          }
        }
      }

      // Fallback: usar preço do plano se nada encontrado
      if (valorPorFuncionario == null) {
        valorPorFuncionario = Number(plano.preco || 0);
        valorTotal = valorPorFuncionario * (numeroFuncionarios || 1);
      }
    }

    // Determinar número de funcionários efetivo usado na simulação (prefere querystring, senão contrato, senão 1)
    const numeroFuncionariosUsar =
      numeroFuncionarios || (contratoEncontrado?.numero_funcionarios ?? 1);

    // Se o contrato foi encontrado por ID (passado via querystring), e também foi lido no bloco de cálculo, preferir número informado pelo usuário
    // (valor_total já foi ajustado na lógica acima quando necessário)

    return NextResponse.json({
      contratante_id: contratante.id,
      contratante_nome: contratante.nome,
      contratante_tipo: contratante.tipo,
      plano_id: plano.id,
      plano_nome: plano.nome,
      plano_tipo: plano.tipo,
      numero_funcionarios: numeroFuncionariosUsar,
      valor_por_funcionario: valorPorFuncionario,
      valor_total: valorTotal,
    });
  } catch (error) {
    console.error('Erro no simulador de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar simulação de pagamento' },
      { status: 500 }
    );
  }
}
