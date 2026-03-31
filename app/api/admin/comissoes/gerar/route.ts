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

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('admin', false);
    const body = await request.json();

    const {
      lote_pagamento_id,
      vinculo_id,
      representante_id,
      entidade_id,
      clinica_id,
      valor_laudo,
      laudo_id,
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

    const result = await criarComissaoAdmin({
      lote_pagamento_id,
      vinculo_id,
      representante_id,
      entidade_id: entidade_id ?? null,
      clinica_id: clinica_id ?? null,
      laudo_id: laudo_id ?? null,
      valor_laudo,
      admin_cpf: session.cpf,
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
