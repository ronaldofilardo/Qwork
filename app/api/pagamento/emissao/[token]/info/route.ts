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
        la.entidade_id,
        la.clinica_id,
        la.valor_por_funcionario,
        la.link_pagamento_enviado_em,
        COUNT(a.id) AS num_avaliacoes,
        (la.valor_por_funcionario * COUNT(a.id)) AS valor_total,
        COALESCE(c.nome, e.nome) AS tomador_nome,
        COALESCE(c.cnpj, e.cnpj) AS tomador_cnpj,
        e.nome AS empresa_nome
       FROM lotes_avaliacao la
       LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
       LEFT JOIN clinicas c ON c.id = la.clinica_id
       LEFT JOIN entidades e ON e.id = la.entidade_id
       WHERE la.link_pagamento_token = $1
       GROUP BY la.id, la.entidade_id, la.clinica_id, c.id, c.nome, c.cnpj, e.id, e.nome, e.cnpj`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 });
    }

    const dados = result.rows[0];

    return NextResponse.json({
      lote_id: dados.lote_id,
      tomador_id: dados.entidade_id || dados.clinica_id, // Prioriza entidade_id
      num_avaliacoes: parseInt(dados.num_avaliacoes),
      valor_por_funcionario: parseFloat(dados.valor_por_funcionario),
      valor_total: parseFloat(dados.valor_total),
      nome_tomador: dados.tomador_nome,
      nome_empresa: dados.empresa_nome || null,
      cnpj_tomador: dados.tomador_cnpj,
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
