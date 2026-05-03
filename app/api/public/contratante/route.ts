import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/contratante?id=123
 * Busca dados básicos de contratante (sem autenticação)
 * Usado na página de sucesso-cadastro para completar fluxo
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    const result = await query(
      `SELECT 
        c.id,
        c.tipo,
        c.nome,
        c.pagamento_confirmado,
        c.status,
        c.numero_funcionarios_estimado,
        (SELECT id FROM contratos WHERE contratante_id = c.id ORDER BY criado_em DESC LIMIT 1) AS contrato_id,
        (SELECT aceito FROM contratos WHERE contratante_id = c.id ORDER BY criado_em DESC LIMIT 1) AS contrato_aceito
      FROM contratantes c
      WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contratante não encontrado' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const contratante = {
      id: row.id,
      tipo: row.tipo,
      nome: row.nome,
      pagamento_confirmado: row.pagamento_confirmado,
      status: row.status,
      numero_funcionarios_estimado: row.numero_funcionarios_estimado,
      contrato_id: row.contrato_id || null,
      contrato_aceito: !!row.contrato_aceito,
    };

    return NextResponse.json({
      success: true,
      contratante,
    });
  } catch (error) {
    console.error('Erro ao buscar contratante:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados' },
      { status: 500 }
    );
  }
}
