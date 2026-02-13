import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    if (!token) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    const result = await query(
      `SELECT 
        la.id AS lote_id, 
        la.clinica_id,
        la.valor_por_funcionario,
        la.link_pagamento_enviado_em,
        COUNT(a.id) AS num_avaliacoes,
        (la.valor_por_funcionario * COUNT(a.id)) AS valor_total,
        c.nome AS clinica_nome,
        c.cnpj AS clinica_cnpj
       FROM lotes_avaliacao la
       LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
       LEFT JOIN clinicas c ON c.id = la.clinica_id
       WHERE la.link_pagamento_token = $1
       GROUP BY la.id, la.clinica_id, c.id, c.nome, c.cnpj`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 });
    }

    const dados = result.rows[0];

    return NextResponse.json({
      lote_id: dados.lote_id,
      num_avaliacoes: parseInt(dados.num_avaliacoes),
      valor_por_funcionario: parseFloat(dados.valor_por_funcionario),
      valor_total: parseFloat(dados.valor_total),
      nome_tomador: dados.clinica_nome,
      cnpj_tomador: dados.clinica_cnpj,
      enviado_em: dados.link_pagamento_enviado_em,
    });
  } catch (error: any) {
    console.error('[ERRO] pagamento/emissao/info:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados' },
      { status: 500 }
    );
  }
}
