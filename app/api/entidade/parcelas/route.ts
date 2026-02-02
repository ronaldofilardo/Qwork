import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { calcularParcelas } from '@/lib/parcelas-helper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/parcelas
 * Lista todas as parcelas do contratante com status de recibo
 */
export async function GET() {
  try {
    const session = getSession();
    if (!session || session.perfil !== 'gestor_entidade') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const contratanteId = session.contratante_id;
    if (!contratanteId) {
      return NextResponse.json(
        { error: 'Contratante não encontrado' },
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
      WHERE co.contratante_id = $1
      ORDER BY co.criado_em DESC
      LIMIT 1
    `;

    const contratoResult = await queryAsGestorEntidade(contratoQuery, [
      contratanteId,
    ]);

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
        p.status,
        p.numero_parcelas,
        p.detalhes_parcelas,
        p.metodo,
        p.plataforma_nome,
        p.criado_em
      FROM pagamentos p
      WHERE p.contratante_id = $1
      ORDER BY p.criado_em DESC
      LIMIT 1
    `;

    const pagamentosResult = await queryAsGestorEntidade(pagamentosQuery, [
      contratanteId,
    ]);

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
        parseInt(String(pagamento.numero_parcelas)) > 0
      ) {
        // Gerar parcelas padrão baseado no status do pagamento e na vigência do contrato
        const numParcelas = parseInt(String(pagamento.numero_parcelas));
        const dataInicial = new Date(
          String(contrato.contratacao_at || pagamento.criado_em)
        );
        // regra: primeira parcela vence 1 dia antes da contratação
        dataInicial.setDate(dataInicial.getDate() - 1);

        const calc = calcularParcelas({
          valorTotal: parseFloat(String(pagamento.valor)),
          numeroParcelas: numParcelas,
          dataInicial,
        });

        // substituir data_pagamento da primeira parcela se pagamento já confirmado
        const isPago = pagamento.status === 'pago';
        if (isPago) {
          calc[0].pago = true;
          calc[0].data_pagamento = String(
            pagamento.data_pagamento || pagamento.criado_em
          );
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
        parseInt(String(pagamento.numero_parcelas)) === 1
      ) {
        // Pagamento à vista
        const dataVenc = contrato.contratacao_at
          ? new Date(String(contrato.contratacao_at))
          : new Date(String(pagamento.criado_em));
        if (contrato.contratacao_at) dataVenc.setDate(dataVenc.getDate() - 1);

        detalhes_parcelas.push({
          numero: 1,
          valor: parseFloat(String(pagamento.valor)),
          data_vencimento: dataVenc.toISOString().split('T')[0],
          pago: pagamento.status === 'pago',
          data_pagamento:
            pagamento.status === 'pago'
              ? String(pagamento.data_pagamento || pagamento.criado_em)
              : null,
        });
      }
    } catch (err) {
      console.error('Erro ao processar parcelas:', err);
    }

    // Verificar existência da tabela `recibos` antes de tentar consultá-la
    let recibosMap = new Map();
    try {
      const recibosColsRes = await queryAsGestorEntidade(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'recibos' AND column_name IN ('numero_recibo','conteudo_pdf_path','criado_em','hash_pdf')`
      );
      const recibosExists =
        Array.isArray(recibosColsRes.rows) && recibosColsRes.rows.length > 0;

      if (recibosExists) {
        const recibosQuery = `
          SELECT
            r.id,
            r.numero_recibo,
            r.conteudo_pdf_path,
            r.criado_em,
            r.hash_pdf
          FROM recibos r
          WHERE r.pagamento_id = $1
          ORDER BY r.criado_em
        `;

        const recibosResult = await queryAsGestorEntidade(recibosQuery, [
          pagamento.pagamento_id,
        ]);
        // Como não temos parcela_numero, usar o primeiro recibo encontrado para a parcela 1
        if (recibosResult.rows.length > 0) {
          recibosMap.set(1, recibosResult.rows[0]);
        }
      } else {
        // tabela `recibos` não existe no esquema atual — seguir sem recibos
        recibosMap = new Map();
      }
    } catch (err) {
      console.error('Erro ao verificar/consultar recibos:', err);
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
              hash: recibo.hash_pdf,
              arquivo_path: recibo.conteudo_pdf_path,
              criado_em: recibo.criado_em,
            }
          : null,
      };
    });

    console.debug('Parcelas geradas:', parcelas.length);

    return NextResponse.json({
      contrato_id: contrato.id,
      contratacao_at: contrato.contratacao_at,
      valor_total: parseFloat(String(contrato.valor_total)),
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
