import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/manutencao/aguardando-quitacao
 * Retorna pagamentos de taxa de manutenção que foram criados mas ainda não foram pagos.
 * Apenas administradores e suporte têm acesso.
 */
export async function GET() {
  const session = getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (session.perfil !== 'admin' && session.perfil !== 'suporte') {
    return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });
  }

  try {
    const result = await query(
      `
      SELECT 
        p.id as pagamento_id,
        p.entidade_id,
        p.empresa_id,
        p.valor,
        p.status,
        p.criado_em,
        p.link_pagamento_token,
        p.link_disponibilizado_em,
        COALESCE(e.nome, em.nome) as nome,
        COALESCE(e.cnpj, em.cnpj) as cnpj,
        e.id as entidade_id_check,
        cl.nome as clinica_nome,
        CASE 
          WHEN e.id IS NOT NULL THEN 'entidade'
          WHEN em.id IS NOT NULL THEN 'empresa_clinica'
        END as tipo
      FROM pagamentos p
      LEFT JOIN entidades e ON p.entidade_id = e.id
      LEFT JOIN empresas_clientes em ON p.empresa_id = em.id
      LEFT JOIN clinicas cl ON em.clinica_id = cl.id
      WHERE p.tipo_cobranca = 'manutencao'
        AND p.status IN ('pendente', 'aguardando_pagamento')
      ORDER BY p.criado_em DESC
      `
    );

    const items = result.rows.map((row: any) => ({
      tipo: row.tipo,
      id: row.entidade_id_check ? row.entidade_id : row.empresa_id,
      pagamento_id: row.pagamento_id,
      nome: row.nome,
      cnpj: row.cnpj,
      clinica_nome: row.clinica_nome,
      valor: parseFloat(row.valor),
      status: row.status,
      criado_em: row.criado_em,
      link_pagamento_token: row.link_pagamento_token ?? null,
      link_disponibilizado_em: row.link_disponibilizado_em ?? null,
    }));

    return NextResponse.json({
      pagamentos: items,
      total: items.length,
    });
  } catch (error) {
    console.error(
      '[GET /api/admin/manutencao/aguardando-quitacao] Erro:',
      error
    );
    return NextResponse.json(
      { error: 'Erro ao buscar cobranças aguardando quitação' },
      { status: 500 }
    );
  }
}
