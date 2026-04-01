import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/tomador?id=123
 * Busca dados básicos de tomador (entidade/clínica) sem autenticação
 * Usado na página de sucesso-cadastro para completar fluxo
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    const sql = `SELECT 
        COALESCE(e.id, cl.id) as id,
        COALESCE(e.tipo, 'entidade') as tipo,
        COALESCE(e.nome, cl.nome) as nome,
        COALESCE(e.pagamento_confirmado, cl.pagamento_confirmado) as pagamento_confirmado,
        COALESCE(e.status, cl.status) as status,
        COALESCE(e.numero_funcionarios_estimado, cl.numero_funcionarios_estimado) as numero_funcionarios_estimado,
        false AS payment_link_generated,
        (SELECT id FROM contratos WHERE tomador_id = $1 ORDER BY criado_em DESC LIMIT 1) AS contrato_id,
        (SELECT aceito FROM contratos WHERE tomador_id = $1 ORDER BY criado_em DESC LIMIT 1) AS contrato_aceito
      FROM (SELECT $1::bigint AS tomador_id) source
      LEFT JOIN entidades e ON e.id = source.tomador_id
      LEFT JOIN clinicas cl ON cl.id = source.tomador_id
      WHERE e.id = $1 OR cl.id = $1
      LIMIT 1`;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tomador não encontrado' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const tomador = {
      id: row.id,
      tipo: row.tipo,
      nome: row.nome,
      pagamento_confirmado: row.pagamento_confirmado,
      status: row.status,
      numero_funcionarios_estimado: row.numero_funcionarios_estimado,
      payment_link_generated: false,
      contrato_id: row.contrato_id || null,
      contrato_aceito: !!row.contrato_aceito,
    };

    return NextResponse.json({
      success: true,
      tomador,
    });
  } catch (error) {
    console.error('Erro ao buscar tomador:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados' },
      { status: 500 }
    );
  }
}
