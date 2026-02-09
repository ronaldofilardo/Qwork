import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calcularParcelas } from '@/lib/parcelas-helper';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * API para buscar contratos de planos para o dashboard de cobrança do admin
 * GET /api/admin/cobranca
 */
export async function GET(request: Request) {
  try {
    const session = await requireRole('admin');

    // Suporte a filtro por CNPJ (opcional) via query string
    const url = new URL(request.url);
    const rawCnpj = url.searchParams.get('cnpj');
    const cnpj = rawCnpj ? rawCnpj.replace(/\D/g, '') : null;

    // Buscar entidades aprovadas com seus planos e última informação de pagamento
    // NOTA: Esta query é para ENTIDADES apenas (empresas particulares com usuários gestores)
    // Para CLÍNICAS, seria necessária query separada com clinica_id
    let sql = `SELECT
        ct.id as tomador_id,
        ct.cnpj,
        ct.plano_id as plano_id,
        pl.nome as plano_nome,
        COALESCE(pl.valor_por_funcionario, 20.00) as plano_preco,
        ct.id as numero_contrato,
        ct.nome as nome_tomador,
        pl.tipo as plano_tipo,
        ct.numero_funcionarios_estimado as numero_funcionarios_estimado,
        (SELECT COUNT(*) FROM funcionarios f WHERE (f.entidade_id = ct.id OR f.clinica_id = ct.id) AND f.ativo = true) as numero_funcionarios_atual,
        pg.id as pagamento_id,
        pg.valor as pagamento_valor,
        pg.status as pagamento_status,
        pg.metodo as tipo_pagamento,
        CASE WHEN pg.numero_parcelas IS NOT NULL AND pg.numero_parcelas > 1 THEN 'parcelado' ELSE 'a_vista' END as modalidade_pagamento,
        pg.numero_parcelas,
        NULL as parcelas_json,
        COALESCE(pg.valor, (ct.numero_funcionarios_estimado * COALESCE(pl.valor_por_funcionario, 20.00)))::numeric as valor_pago,
        CASE
          WHEN ct.status = 'aprovado' AND ct.pagamento_confirmado = true THEN 'ativo'
          WHEN ct.status != 'aprovado' THEN 'cancelado'
          ELSE 'pendente'
        END as status,
        ct.criado_em as data_contratacao,
        (ct.criado_em + INTERVAL '1 year') as data_fim_vigencia,
        pg.data_pagamento as data_pagamento,
        ct.criado_em
      FROM entidades ct
      LEFT JOIN planos pl ON ct.plano_id = pl.id
      LEFT JOIN (
        SELECT entidade_id, id, valor, status, metodo, data_pagamento, numero_parcelas, plataforma_nome, detalhes_parcelas
        FROM pagamentos
        WHERE entidade_id IS NOT NULL
        ORDER BY data_pagamento DESC NULLS LAST, criado_em DESC
      ) pg ON pg.entidade_id = ct.id AND pg.id = (
        SELECT id FROM pagamentos WHERE entidade_id = ct.id ORDER BY data_pagamento DESC NULLS LAST LIMIT 1
      )
      `;

    // Construir cláusulas WHERE dinamicamente
    const whereClauses: string[] = [];
    const params: any[] = [];

    // Por padrão, trazer apenas tomadors aprovados
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
    // (pular verificação em testes unitários onde as queries são mockadas)
    if (process.env.NODE_ENV !== 'test') {
      try {
        const contratosExistsRes = await query(
          `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratos') as exists`
        );
        const contratosExists = contratosExistsRes.rows[0]?.exists;
        // Somente retornar vazio se a verificação explicitamente informar false.
        // Se for undefined (p.ex. em testes com mocks que retornam rows:[]), continuar com a query principal.
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
        // continuar e deixar que a query principal falhe com erro existente
      }
    }

    console.debug('[API Cobrança] Executing count SQL');
    console.debug(countSql);
    const countRes = await query(countSql, params, session);
    console.debug('[API Cobrança] countRes:', countRes.rows);
    const total =
      countRes.rows && countRes.rows[0]
        ? parseInt(countRes.rows[0].total, 10)
        : 0;

    // Adicionar ordenação e limites
    sql += ` ORDER BY ${sortBy} ${sortDir} LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    console.debug('[API Cobrança] Executing SQL:', sql);

    const result = await query(sql, params, session);

    // Verificar se a query foi bem-sucedida
    if (!result || !result.rows) {
      console.error('[API Cobrança] Query failed, result:', result);
      return NextResponse.json({
        success: false,
        contratos: [],
        total: 0,
        page: page,
        limit: limit,
      });
    }

    // Incluir meta de paginação
    const meta = { total, page, limit };

    // Enriquecer resultados com parcelas_json (preferir o que está persistido em pagamentos, se houver)
    const rowsWithParcelas = result.rows.map((r: any) => {
      try {
        if (r.detalhes_parcelas) {
          // detalhes_parcelas salvo no DB - já é um JSON
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
      return { ...r, parcelas_json: null };
    });

    // Substituir result.rows pelo enriquecido
    result.rows = rowsWithParcelas;

    return NextResponse.json({
      success: true,
      contratos: result.rows,
      total: total,
      page: meta.page,
      limit: meta.limit,
    });
  } catch (error) {
    console.error('[API Cobrança] Erro ao buscar contratos:', error);
    console.debug('[API Cobrança] Error details:', error);
    // In test environment, include the error message to help debugging tests
    if (process.env.NODE_ENV === 'test') {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar contratos',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar contratos',
      },
      { status: 500 }
    );
  }
}
