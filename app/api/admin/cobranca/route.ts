import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calcularParcelas } from '@/lib/parcelas-helper';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * API para buscar contratos para o dashboard de cobrança do admin
 * GET /api/admin/cobranca
 */
export async function GET(request: Request) {
  try {
    const session = await requireRole('admin');

    // Suporte a filtro por CNPJ (opcional) via query string
    const url = new URL(request.url);
    const rawCnpj = url.searchParams.get('cnpj');
    const cnpj = rawCnpj ? rawCnpj.replace(/\D/g, '') : null;

    // Buscar contratantes aprovados com informações de pagamento
    let sql = `SELECT
        ct.id as contratante_id,
        ct.cnpj,
        ct.id as numero_contrato,
        ct.tipo as tipo_contratante,
        ct.nome as nome_contratante,
        -- número estimado informado na contratação
        COALESCE(co.numero_funcionarios, ct.numero_funcionarios_estimado) as numero_funcionarios_estimado,
        -- número atual de funcionários: preferir estatística agregada
        COALESCE(vc.funcionarios_ativos, 0) as numero_funcionarios_atual,
        pg.id as pagamento_id,
        pg.valor as pagamento_valor,
        pg.status as pagamento_status,
        pg.metodo as tipo_pagamento,
        CASE WHEN pg.numero_parcelas IS NOT NULL AND pg.numero_parcelas > 1 THEN 'parcelado' ELSE 'a_vista' END as modalidade_pagamento,
        pg.numero_parcelas,
        NULL as parcelas_json,
        COALESCE(pg.valor, 0)::numeric as valor_pago,
        CASE
          WHEN ct.ativa = true AND ct.pagamento_confirmado = true THEN 'ativo'
          WHEN ct.ativa = false THEN 'cancelado'
          ELSE 'pendente'
        END as status,
        ct.criado_em as data_contratacao,
        (ct.criado_em + INTERVAL '1 year') as data_fim_vigencia,
        pg.data_pagamento as data_pagamento,
        ct.criado_em
      FROM contratantes ct
      LEFT JOIN LATERAL (
        SELECT c.id, c.numero_funcionarios
        FROM contratos c
        WHERE c.contratante_id = ct.id
        ORDER BY c.criado_em DESC NULLS LAST, c.id DESC
        LIMIT 1
      ) co ON true
      LEFT JOIN v_contratantes_stats vc ON vc.id = ct.id
      LEFT JOIN LATERAL (
        SELECT p.id, p.valor, p.metodo, p.data_pagamento, p.numero_parcelas, p.plataforma_nome, p.detalhes_parcelas, p.status
        FROM pagamentos p
        WHERE p.contratante_id = ct.id
        ORDER BY p.data_pagamento DESC NULLS LAST, p.criado_em DESC
        LIMIT 1
      ) pg ON true
      `;

    // Construir cláusulas WHERE dinamicamente
    const whereClauses: string[] = [];
    const params: any[] = [];

    // Por padrão, trazer apenas contratantes aprovados
    whereClauses.push("ct.status = 'aprovado'");

    // Paginação e ordenação
    const pageRaw = url.searchParams.get('page');
    const limitRaw = url.searchParams.get('limit');
    const sortBy = url.searchParams.get('sort_by') || 'ct.criado_em';
    const sortDir =
      (url.searchParams.get('sort_dir') || 'desc').toLowerCase() === 'asc'
        ? 'ASC'
        : 'DESC';

    const page = pageRaw ? Math.max(parseInt(pageRaw, 10), 1) : 1;
    const limit = limitRaw
      ? Math.max(Math.min(parseInt(limitRaw, 10), 100), 1)
      : 20;

    if (cnpj) {
      whereClauses.push(
        "regexp_replace(ct.cnpj, '[^0-9]', '', 'g') = $" + (params.length + 1)
      );
      params.push(cnpj);
    }

    // Se houver cláusulas, adicionar ao SQL
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Total (para paginação)
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) sub`;

    // Verificar se tabela `contratos` existe para evitar erro em ambientes sem migração
    if (process.env.NODE_ENV !== 'test') {
      try {
        const contratosExistsRes = await query(
          `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratos') as exists`
        );
        const contratosExists = contratosExistsRes.rows[0]?.exists;
        if (contratosExists === false) {
          console.warn(
            '[API Cobrança] tabela `contratos` não existe - retornando resultado vazio para compatibilidade de ambiente'
          );
          return NextResponse.json({
            success: true,
            contratos: [],
            total: 0,
            page: page,
            limit: limit,
          });
        }
      } catch (e) {
        console.warn(
          '[API Cobrança] não foi possível verificar existência de `contratos`:',
          e
        );
      }
    }

    const countRes = await query(countSql, params, session);
    const total = parseInt(countRes.rows[0].total, 10) || 0;

    // Adicionar ordenação e limites
    sql += ` ORDER BY ${sortBy} ${sortDir} LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    const result = await query(sql, params, session);

    // Incluir meta de paginação
    const meta = { total, page, limit };

    // Enriquecer resultados com parcelas_json
    const rowsWithParcelas = result.rows.map((r: any) => {
      try {
        if (r.detalhes_parcelas) {
          return { ...r, parcelas_json: r.detalhes_parcelas };
        }

        if (
          r.numero_parcelas &&
          parseInt(r.numero_parcelas) > 1 &&
          r.pagamento_valor &&
          r.data_pagamento
        ) {
          const numero = parseInt(r.numero_parcelas);
          const valor = parseFloat(r.pagamento_valor);
          const dataInicio = new Date(r.data_pagamento);
          const parcelas = calcularParcelas({
            valorTotal: valor,
            numeroParcelas: numero,
            dataInicial: dataInicio,
          });
          return { ...r, parcelas_json: parcelas };
        }
      } catch (err) {
        console.error(
          'Erro ao calcular parcelas_json for contrato',
          r.contrato_id || r.id,
          err
        );
      }
      return r;
    });

    return NextResponse.json({
      success: true,
      contratos: rowsWithParcelas,
      meta,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao buscar contratos',
      },
      { status: error instanceof Error && error.message.includes('Acesso negado') ? 403 : 500 }
    );
  }
}
