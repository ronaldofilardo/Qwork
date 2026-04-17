/**
 * POST /api/admin/comissoes/gerar
 * Admin gera comissão a partir de um lote pago.
 *
 * Fórmula: valor_comissao = valor_laudo × representante.percentual_comissao / 100
 * Bloqueia se o percentual não estiver definido no cadastro do representante.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { criarComissaoAdmin } from '@/lib/db/comissionamento';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['comercial', 'suporte'], false);
    const body = await request.json();

    const {
      lote_pagamento_id,
      vinculo_id,
      representante_id,
      entidade_id,
      clinica_id,
      valor_laudo,
      laudo_id,
      parcela_numero,
      total_parcelas,
    } = body;

    // Validação básica
    if (
      !lote_pagamento_id ||
      !vinculo_id ||
      !representante_id ||
      !valor_laudo
    ) {
      return NextResponse.json(
        {
          error:
            'Campos obrigatórios: lote_pagamento_id, vinculo_id, representante_id, valor_laudo',
        },
        { status: 400 }
      );
    }

    if (typeof valor_laudo !== 'number' || valor_laudo <= 0) {
      return NextResponse.json(
        { error: 'valor_laudo deve ser um número positivo' },
        { status: 400 }
      );
    }

    const parcelaNum = typeof parcela_numero === 'number' ? parcela_numero : 1;
    const totalParc = typeof total_parcelas === 'number' ? total_parcelas : 1;

    if (parcelaNum > totalParc) {
      return NextResponse.json(
        { error: 'parcela_numero não pode ser maior que total_parcelas' },
        { status: 400 }
      );
    }

    // Guard: lote deve estar pago no banco (não confiar apenas na UI)
    const loteCheck = await query<{ status_pagamento: string }>(
      `SELECT status_pagamento FROM lotes_avaliacao WHERE id = $1 LIMIT 1`,
      [lote_pagamento_id]
    );
    if (loteCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }
    if (loteCheck.rows[0].status_pagamento !== 'pago') {
      return NextResponse.json(
        { error: 'Lote ainda não está com pagamento confirmado' },
        { status: 422 }
      );
    }

    // Guard: comissão para esta parcela já existe
    const dupCheck = await query<{ id: number }>(
      `SELECT id FROM comissoes_laudo WHERE lote_pagamento_id = $1 AND parcela_numero = $2 LIMIT 1`,
      [lote_pagamento_id, parcelaNum]
    );
    if (dupCheck.rows.length > 0) {
      return NextResponse.json(
        {
          error: `Comissão para parcela ${parcelaNum} já existe (id ${dupCheck.rows[0].id})`,
        },
        { status: 409 }
      );
    }

    const result = await criarComissaoAdmin({
      lote_pagamento_id,
      vinculo_id,
      representante_id,
      entidade_id: entidade_id ?? null,
      clinica_id: clinica_id ?? null,
      laudo_id: laudo_id ?? null,
      valor_laudo,
      parcela_numero: parcelaNum,
      total_parcelas: totalParc,
      admin_cpf: session.cpf,
      // Admin gerando manualmente: parcela já foi paga (lote está no status 'pago')
      parcela_confirmada_em: new Date(),
    });

    if (result.erro) {
      return NextResponse.json({ error: result.erro }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      comissao: result.comissao,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[POST /api/admin/comissoes/gerar]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
