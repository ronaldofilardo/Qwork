import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { calcularParcelas } from '@/lib/parcelas-helper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rh/parcelas
 * Lista todas as parcelas da clínica com status de recibo
 */
export async function GET() {
  try {
    const session = getSession();
    if (!session || session.perfil !== 'rh') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Determinar um entidade_id válido (pode vir via session.clinica_id, session.entidade_id ou tabela clinicas)
    const clinicaId = session.clinica_id;
    let entidadeId: number | null = null;

    if (clinicaId) {
      // Verificar se já é uma entidade (entidades.id)
      const entidadeCheck = await query(
        `SELECT id FROM entidades WHERE id = $1 AND tipo = 'clinica' LIMIT 1`,
        [clinicaId]
      );
      if (entidadeCheck.rows.length > 0) {
        entidadeId = entidadeCheck.rows[0].id;
      } else {
        // Tentar mapear tabela 'clinicas' => entidade_id
        const mapRes = await query(
          `SELECT entidade_id FROM clinicas WHERE id = $1 LIMIT 1`,
          [clinicaId]
        );
        if (mapRes.rows.length > 0 && mapRes.rows[0].entidade_id) {
          entidadeId = mapRes.rows[0].entidade_id;
        }
      }
    }

    // Fallback: se a sessão conter entidade_id e essa entidade for do tipo 'clinica'
    if (!entidadeId && (session as any).entidade_id) {
      const entidadeCheck2 = await query(
        `SELECT id FROM entidades WHERE id = $1 AND tipo = 'clinica' LIMIT 1`,
        [(session as any).entidade_id]
      );
      if (entidadeCheck2.rows.length > 0) {
        entidadeId = entidadeCheck2.rows[0].id;
      }
    }

    // Último recurso: tentar obter via tabela funcionarios (pelo cpf da sessão)
    if (!entidadeId) {
      const funcRes = await query(
        `SELECT clinica_id, entidade_id FROM funcionarios WHERE cpf = $1 AND ativo = true LIMIT 1`,
        [session.cpf]
      );
      if (funcRes.rows.length > 0) {
        if (funcRes.rows[0].entidade_id)
          entidadeId = funcRes.rows[0].entidade_id;
        else if (funcRes.rows[0].clinica_id) {
          const map2 = await query(
            `SELECT entidade_id FROM clinicas WHERE id = $1 LIMIT 1`,
            [funcRes.rows[0].clinica_id]
          );
          if (map2.rows.length > 0 && map2.rows[0].entidade_id)
            entidadeId = map2.rows[0].entidade_id;
        }
      }
    }

    if (!entidadeId) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 400 }
      );
    }

    // Buscar contrato e timestamp de contratação
    const contratoQuery = `
      SELECT 
        co.id,
        co.criado_em as contratacao_at,
        co.valor_total,
        co.numero_funcionarios
      FROM contratos co
      WHERE co.entidade_id = $1
      ORDER BY co.criado_em DESC
      LIMIT 1
    `;

    const contratoResult = await query(contratoQuery, [entidadeId]);

    if (contratoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum contrato encontrado' },
        { status: 404 }
      );
    }

    const contrato = contratoResult.rows[0];

    // Buscar pagamentos e suas parcelas
    const pagamentosQuery = `
      SELECT
        p.id as pagamento_id,
        p.valor,
        p.numero_parcelas,
        p.detalhes_parcelas,
        p.metodo,
        p.status,
        p.criado_em
      FROM pagamentos p
      WHERE p.entidade_id = $1
      ORDER BY p.criado_em DESC
      LIMIT 1
    `;

    const pagamentosResult = await query(pagamentosQuery, [entidadeId]);

    if (pagamentosResult.rows.length === 0) {
      return NextResponse.json({
        contrato_id: contrato.id,
        contratacao_at: contrato.contratacao_at,
        parcelas: [],
      });
    }

    const pagamento = pagamentosResult.rows[0];
    let detalhes_parcelas: any[] = [];

    try {
      if (pagamento.detalhes_parcelas) {
        detalhes_parcelas =
          typeof pagamento.detalhes_parcelas === 'string'
            ? JSON.parse(pagamento.detalhes_parcelas)
            : pagamento.detalhes_parcelas;
      } else if (
        pagamento.numero_parcelas &&
        parseInt(pagamento.numero_parcelas) > 0
      ) {
        // Gerar parcelas padrão baseado no status do pagamento e na vigência do contrato
        const numParcelas = parseInt(pagamento.numero_parcelas);
        const dataInicial = new Date(
          contrato.contratacao_at || pagamento.criado_em
        );
        // regra: primeira parcela vence 1 dia antes da contratação
        dataInicial.setDate(dataInicial.getDate() - 1);

        const calc = calcularParcelas({
          valorTotal: parseFloat(pagamento.valor),
          numeroParcelas: numParcelas,
          dataInicial,
        });

        // substituir data_pagamento da primeira parcela se pagamento já confirmado
        const isPago = pagamento.status === 'pago';
        if (isPago) {
          calc[0].pago = true;
          calc[0].data_pagamento =
            pagamento.data_pagamento || pagamento.criado_em;
          calc[0].status = 'pago';
        }

        detalhes_parcelas = calc.map((c) => ({
          numero: c.numero,
          valor: c.valor,
          data_vencimento: c.data_vencimento,
          pago: c.pago,
          data_pagamento: c.data_pagamento || null,
        }));
      } else if (
        !pagamento.numero_parcelas ||
        parseInt(pagamento.numero_parcelas) === 1
      ) {
        // Pagamento à vista
        const dataVenc = contrato.contratacao_at
          ? new Date(contrato.contratacao_at)
          : new Date(pagamento.criado_em);
        if (contrato.contratacao_at) dataVenc.setDate(dataVenc.getDate() - 1);

        detalhes_parcelas.push({
          numero: 1,
          valor: parseFloat(pagamento.valor),
          data_vencimento: dataVenc.toISOString().split('T')[0],
          pago: pagamento.status === 'pago',
          data_pagamento:
            pagamento.status === 'pago'
              ? pagamento.data_pagamento || pagamento.criado_em
              : null,
        });
      }
    } catch (err) {
      console.error('Erro ao processar parcelas:', err);
    }

    // Verificar existência da tabela `recibos` antes de tentar consultá-la
    let recibosMap = new Map();
    try {
      const recibosColsRes = await query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'recibos' AND column_name IN ('numero_recibo','conteudo_pdf_path','criado_em')`
      );
      const recibosExists =
        Array.isArray(recibosColsRes.rows) && recibosColsRes.rows.length > 0;

      if (recibosExists) {
        const recibosQuery = `
          SELECT
            r.id,
            r.numero_recibo,
            r.conteudo_pdf_path,
            r.criado_em
          FROM recibos r
          WHERE r.pagamento_id = $1
          ORDER BY r.criado_em
        `;

        const recibosResult = await query(recibosQuery, [
          pagamento.pagamento_id,
        ]);
        // Como não temos parcela_numero, usar o primeiro recibo encontrado
        if (recibosResult.rows.length > 0) {
          recibosMap.set(1, recibosResult.rows[0]);
        }
      } else {
        recibosMap = new Map();
      }
    } catch (err) {
      console.error('Erro ao verificar/consultar recibos (RH):', err);
      recibosMap = new Map();
    }

    // Montar resposta com parcelas + recibos
    const parcelas = detalhes_parcelas.map((parcela: any) => {
      const recibo = recibosMap.get(parcela.numero);

      return {
        numero: parcela.numero,
        total_parcelas: detalhes_parcelas.length,
        valor: parcela.valor,
        status: parcela.pago ? 'pago' : 'a_vencer',
        data_vencimento: parcela.data_vencimento,
        data_pagamento: parcela.data_pagamento || null,
        recibo: recibo
          ? {
              id: recibo.id,
              numero_recibo: recibo.numero_recibo,
              hash: recibo.hash,
              arquivo_path: recibo.conteudo_pdf_path,
              criado_em: recibo.criado_em,
            }
          : null,
      };
    });

    console.debug('Parcelas (RH) geradas:', parcelas.length);

    return NextResponse.json({
      contrato_id: contrato.id,
      contratacao_at: contrato.contratacao_at,
      valor_total: parseFloat(contrato.valor_total),
      numero_funcionarios: contrato.numero_funcionarios,
      pagamento_id: pagamento.pagamento_id,
      metodo: pagamento.metodo,
      parcelas,
    });
  } catch (error) {
    console.error('Erro ao listar parcelas:', error);
    return NextResponse.json(
      { error: 'Erro ao listar parcelas' },
      { status: 500 }
    );
  }
}
