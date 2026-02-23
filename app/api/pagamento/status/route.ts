import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Esta rota usa `request.url` (searchParams) e deve ser sempre dinâmica no runtime.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Aceita tanto 'id' quanto 'pagamento_id' para retrocompatibilidade
    // CheckoutAsaas.tsx usava 'pagamento_id', outros lugares usavam 'id'
    const pagamentoId =
      searchParams.get('id') || searchParams.get('pagamento_id');

    if (!pagamentoId) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório (use id= ou pagamento_id=)' },
        { status: 400 }
      );
    }

    // JOIN com LEFT para suportar tanto entidades (entidade_id) quanto clínicas (clinica_id)
    // A query anterior fazia JOIN INNER em entidades, quebrando pagamentos de clínicas
    const pagamentoResult = await query(
      `SELECT
         p.*,
         COALESCE(e.nome, c.nome) AS entidade_nome,
         COALESCE(e.pagamento_confirmado, false) AS pagamento_confirmado
       FROM pagamentos p
       LEFT JOIN entidades e ON p.entidade_id = e.id
       LEFT JOIN clinicas  c ON p.clinica_id  = c.id
       WHERE p.id = $1`,
      [pagamentoId]
    );

    if (pagamentoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    const pagamento = pagamentoResult.rows[0];

    return NextResponse.json({
      success: true,
      status: pagamento.status, // campo direto para o polling verificar
      pagamento,
    });
  } catch (error) {
    console.error('Erro ao consultar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar pagamento' },
      { status: 500 }
    );
  }
}
