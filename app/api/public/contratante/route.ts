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

    // Buscar apenas dados necessários para o fluxo (não expor dados sensíveis)
    // Primeiro verificar se a tabela `contratacao_personalizada` existe para evitar 500
    const hasCp = await query(
      `SELECT to_regclass('public.contratacao_personalizada') as exists`
    );
    let sql: string;
    if (hasCp.rows[0]?.exists) {
      sql = `SELECT 
        c.id,
        c.tipo,
        c.nome,
        c.plano_id,
        c.pagamento_confirmado,
        c.status,
        c.numero_funcionarios_estimado,
        cp.id AS contratacao_personalizada_id,
        (cp.payment_link_token IS NOT NULL AND cp.payment_link_expiracao > NOW()) AS payment_link_generated,
        (SELECT id FROM contratos WHERE contratante_id = c.id ORDER BY criado_em DESC LIMIT 1) AS contrato_id,
        (SELECT aceito FROM contratos WHERE contratante_id = c.id ORDER BY criado_em DESC LIMIT 1) AS contrato_aceito
      FROM contratantes c
      LEFT JOIN contratacao_personalizada cp ON cp.contratante_id = c.id
      WHERE c.id = $1`;
    } else {
      // Fallback seguro quando a tabela não existe
      sql = `SELECT 
        c.id,
        c.tipo,
        c.nome,
        c.plano_id,
        c.pagamento_confirmado,
        c.status,
        c.numero_funcionarios_estimado,
        NULL::integer AS contratacao_personalizada_id,
        false AS payment_link_generated,
        (SELECT id FROM contratos WHERE contratante_id = c.id ORDER BY criado_em DESC LIMIT 1) AS contrato_id,
        (SELECT aceito FROM contratos WHERE contratante_id = c.id ORDER BY criado_em DESC LIMIT 1) AS contrato_aceito
      FROM contratantes c
      WHERE c.id = $1`;
    }

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contratante não encontrado' },
        { status: 404 }
      );
    }

    // Normalizar resposta para não expor tokens diretamente
    const row = result.rows[0];
    const contratante = {
      id: row.id,
      tipo: row.tipo,
      nome: row.nome,
      plano_id: row.plano_id,
      pagamento_confirmado: row.pagamento_confirmado,
      status: row.status,
      numero_funcionarios_estimado: row.numero_funcionarios_estimado,
      contratacao_personalizada_id: row.contratacao_personalizada_id || null,
      payment_link_generated: !!row.payment_link_generated,
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
