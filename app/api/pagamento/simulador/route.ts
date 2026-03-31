import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pagamento/simulador
 *
 * Retorna informações para o simulador de pagamento
 * Query params:
 * - entidade_id: ID da entidade
 * - numero_funcionarios: Número de funcionários (opcional)
 * - contrato_id: ID do contrato (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entidadeId = searchParams.get('entidade_id');
    const numeroFuncionarios = parseInt(
      searchParams.get('numero_funcionarios') || '0'
    );

    if (!entidadeId) {
      return NextResponse.json(
        { error: 'Parâmetro obrigatório: entidade_id' },
        { status: 400 }
      );
    }

    // Buscar informações da entidade
    const entidadeRes = await query(
      'SELECT id, nome, tipo FROM entidades WHERE id = $1',
      [entidadeId]
    );

    if (entidadeRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Entidade não encontrada' },
        { status: 404 }
      );
    }

    const entidade = entidadeRes.rows[0];

    // Verificar contrato aceito
    const contratoIdParam = searchParams.get('contrato_id');
    let contratoEncontrado: any = null;

    if (contratoIdParam) {
      const ctrRes = await query(
        'SELECT id, numero_funcionarios, valor_total, aceito FROM contratos WHERE id = $1 AND entidade_id = $2',
        [parseInt(contratoIdParam), entidadeId]
      );
      if (ctrRes.rows.length === 0 || !ctrRes.rows[0].aceito) {
        return NextResponse.json(
          { error: 'Contrato deve ser aceito antes do simulador' },
          { status: 403 }
        );
      }
      contratoEncontrado = ctrRes.rows[0];
    } else {
      const ctrRes = await query(
        'SELECT id, numero_funcionarios, valor_total, aceito FROM contratos WHERE entidade_id = $1 AND aceito = true LIMIT 1',
        [entidadeId]
      );
      if (ctrRes.rows.length > 0) {
        contratoEncontrado = ctrRes.rows[0];
      }
    }

    // Calcular valores baseados no contrato
    let valorPorFuncionario: number | null = null;
    let valorTotal: number | null = null;

    if (
      contratoEncontrado &&
      contratoEncontrado.numero_funcionarios &&
      contratoEncontrado.valor_total
    ) {
      valorPorFuncionario =
        Number(contratoEncontrado.valor_total) /
        Number(contratoEncontrado.numero_funcionarios);
      valorTotal = Number(contratoEncontrado.valor_total);
      if (
        numeroFuncionarios &&
        Number(numeroFuncionarios) !==
          Number(contratoEncontrado.numero_funcionarios)
      ) {
        valorTotal = valorPorFuncionario * Number(numeroFuncionarios);
      }
    }

    // Fallback: valor padrão por funcionário
    if (valorPorFuncionario == null) {
      valorPorFuncionario = 20.0;
      valorTotal = valorPorFuncionario * (numeroFuncionarios || 1);
    }

    const numeroFuncionariosUsar =
      numeroFuncionarios || (contratoEncontrado?.numero_funcionarios ?? 1);

    return NextResponse.json({
      entidade_id: entidade.id,
      entidade_nome: entidade.nome,
      entidade_tipo: entidade.tipo,
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
