import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    if (!token) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    const result = await query(
      `SELECT
        p.id AS pagamento_id,
        p.entidade_id,
        p.empresa_id,
        p.valor,
        p.status,
        p.link_pagamento_enviado_em,
        COALESCE(e.nome, em.nome) AS nome,
        COALESCE(e.cnpj, em.cnpj) AS cnpj,
        cl.nome AS clinica_nome,
        e.id AS entidade_id_check
       FROM pagamentos p
       LEFT JOIN entidades e ON p.entidade_id = e.id
       LEFT JOIN empresas_clientes em ON p.empresa_id = em.id
       LEFT JOIN clinicas cl ON em.clinica_id = cl.id
       WHERE p.link_pagamento_token = $1
         AND p.tipo_cobranca = 'manutencao'`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 });
    }

    const row = result.rows[0];

    if (row.status === 'pago') {
      return NextResponse.json(
        {
          error: 'Este link já foi utilizado. O pagamento foi confirmado.',
          already_paid: true,
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      pagamento_id: row.pagamento_id,
      tomador_id: row.entidade_id_check ? row.entidade_id : row.empresa_id,
      valor: parseFloat(row.valor),
      nome: row.nome,
      cnpj: row.cnpj,
      clinica_nome: row.clinica_nome ?? null,
      enviado_em: row.link_pagamento_enviado_em,
    });
  } catch (error: any) {
    console.error('[ERRO] pagamento/manutencao/info:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados' },
      { status: 500 }
    );
  }
}
