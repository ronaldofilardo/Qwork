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
        la.id AS lote_id, la.status, la.status_pagamento, la.valor_por_funcionario,
        la.link_pagamento_enviado_em,
        COUNT(a.id) AS num_avaliacoes,
        (la.valor_por_funcionario * COUNT(a.id)) AS valor_total,
        COALESCE(c.nome, e.nome) AS nome_tomador,
        COALESCE(c.cnpj, e.cnpj) AS cnpj_tomador
       FROM lotes_avaliacao la
       LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
       LEFT JOIN clinicas c ON c.id = la.clinica_id
       LEFT JOIN entidades e ON e.id = la.entidade_id
       WHERE la.link_pagamento_token = $1
       GROUP BY la.id, c.nome, c.cnpj, e.nome, e.cnpj`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 });
    }

    const dados = result.rows[0];

    // Token de uso único: verificar se já foi usado
    if (dados.status_pagamento === 'pago') {
      return NextResponse.json(
        { error: 'Link já foi utilizado', already_paid: true },
        { status: 400 }
      );
    }

    if (dados.status_pagamento !== 'aguardando_pagamento') {
      return NextResponse.json(
        { error: 'Link inválido ou não disponível' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      lote_id: dados.lote_id,
      num_avaliacoes: parseInt(dados.num_avaliacoes),
      valor_por_funcionario: parseFloat(dados.valor_por_funcionario),
      valor_total: parseFloat(dados.valor_total),
      nome_tomador: dados.nome_tomador,
      cnpj_tomador: dados.cnpj_tomador,
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
