/**
 * GET /api/rh/financeiro-resumo
 * Retorna KPIs, timeline de parcelas e resumo mensal para o mini-dashboard financeiro.
 * Acesso restrito ao perfil 'rh'.
 */
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import {
  normalizarDetalhesParcelas,
  type Parcela,
} from '@/lib/parcelas-helper';
import type {
  FinanceiroResumo,
  KPIsFinanceiros,
  ParcelaTimeline,
  ResumoPorMes,
  EstadoCalculadoParcela,
} from '@/lib/types/financeiro-resumo';

export const revalidate = 300; // 5 minutos — invalidado via revalidatePath no webhook

function calcularEstado(
  pago: boolean,
  statusPagamento: string,
  dataVencimento: string
): EstadoCalculadoParcela {
  if (pago) return 'pago';
  if (statusPagamento === 'processando') return 'processando';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dataVencimento + 'T00:00:00');
  const diffDias = Math.ceil(
    (venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDias < 0) return 'atrasado';
  if (diffDias <= 3) return 'a_vencer_urgente';
  return 'pendente';
}

function labelMesAno(ano: number, mes: number): string {
  const meses = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  return `${meses[mes - 1]}/${ano}`;
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireRole(['rh']);

    let clinicaId = session.clinica_id;

    if (!clinicaId) {
      const vinculoRes = await query(
        `SELECT fc.clinica_id
         FROM funcionarios f
         INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
         WHERE f.cpf = $1 AND f.ativo = true AND fc.ativo = true
         LIMIT 1`,
        [session.cpf]
      );
      if (vinculoRes.rows.length > 0) {
        clinicaId = vinculoRes.rows[0].clinica_id as number;
      }
    }

    if (!clinicaId) {
      return NextResponse.json(
        { error: 'Você não está vinculado a uma clínica' },
        { status: 403 }
      );
    }

    const pagamentosResult = await query<{
      id: number;
      valor: string;
      metodo: string | null;
      status: string;
      numero_parcelas: number;
      detalhes_parcelas: Parcela[] | string | null;
      data_pagamento: string | null;
      data_confirmacao: string | null;
      asaas_boleto_url: string | null;
      asaas_payment_id: string | null;
      lote_id: number | null;
    }>(
      `SELECT
        p.id,
        p.valor,
        p.metodo,
        p.status,
        COALESCE(p.numero_parcelas, 1) AS numero_parcelas,
        p.detalhes_parcelas,
        p.data_pagamento,
        p.data_confirmacao,
        p.asaas_boleto_url,
        p.asaas_payment_id,
        (
          SELECT la.id FROM lotes_avaliacao la
          WHERE la.clinica_id = p.clinica_id
          ORDER BY la.criado_em DESC LIMIT 1
        ) AS lote_id
      FROM pagamentos p
      WHERE p.clinica_id = $1
        AND p.status IN ('pago', 'processando', 'pendente')
      ORDER BY p.criado_em DESC
      LIMIT 100`,
      [clinicaId]
    );

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;

    const parcelas: ParcelaTimeline[] = [];

    for (const row of pagamentosResult.rows) {
      const totalParcelas = row.numero_parcelas ?? 1;
      const statusPagamento = row.status;

      let detalhes: Parcela[] | null = null;

      if (row.detalhes_parcelas) {
        try {
          const raw =
            typeof row.detalhes_parcelas === 'string'
              ? (JSON.parse(row.detalhes_parcelas) as Parcela[])
              : (row.detalhes_parcelas as Parcela[]);
          detalhes = normalizarDetalhesParcelas(
            raw,
            statusPagamento,
            row.data_pagamento ?? row.data_confirmacao ?? null
          );
        } catch {
          detalhes = null;
        }
      }

      if (detalhes && detalhes.length > 0) {
        for (const parcela of detalhes) {
          const estado = calcularEstado(
            parcela.pago,
            statusPagamento,
            parcela.data_vencimento
          );
          const venc = new Date(parcela.data_vencimento + 'T00:00:00');
          const diasParaVenc = Math.ceil(
            (venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
          );

          parcelas.push({
            pagamento_id: row.id,
            parcela_numero: parcela.numero,
            total_parcelas: totalParcelas,
            valor: parcela.valor,
            data_vencimento: parcela.data_vencimento,
            pago: parcela.pago,
            data_pagamento: parcela.data_pagamento ?? null,
            metodo: row.metodo,
            lote_id: row.lote_id,
            boleto_url:
              row.metodo === 'boleto' ? (row.asaas_boleto_url ?? null) : null,
            lancamento_manual: !row.asaas_payment_id,
            estado,
            dias_para_vencimento: diasParaVenc,
          });
        }
      } else {
        // Pagamento sem detalhes de parcelas (à vista ou parcela única)
        const toDateStr = (v: unknown): string | null => {
          if (!v) return null;
          if (typeof v === 'string') return v.split('T')[0];
          if (v instanceof Date) return v.toISOString().split('T')[0];
          return String(v).split('T')[0];
        };
        const dataRef =
          toDateStr(row.data_pagamento) ??
          toDateStr(row.data_confirmacao) ??
          new Date().toISOString().split('T')[0];
        const pago = statusPagamento === 'pago';
        const dataVenc = pago
          ? dataRef
          : new Date().toISOString().split('T')[0];
        const estado = calcularEstado(pago, statusPagamento, dataVenc);
        const venc = new Date(dataVenc + 'T00:00:00');
        const diasParaVenc = Math.ceil(
          (venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );

        parcelas.push({
          pagamento_id: row.id,
          parcela_numero: 1,
          total_parcelas: 1,
          valor: parseFloat(row.valor),
          data_vencimento: dataVenc,
          pago,
          data_pagamento: row.data_pagamento ?? null,
          metodo: row.metodo,
          lote_id: row.lote_id,
          boleto_url:
            row.metodo === 'boleto' ? (row.asaas_boleto_url ?? null) : null,
          lancamento_manual: !row.asaas_payment_id,
          estado,
          dias_para_vencimento: diasParaVenc,
        });
      }
    }

    // Ordenar: atrasadas primeiro, depois por data de vencimento
    parcelas.sort((a, b) => {
      const prioridadeEstado: Record<EstadoCalculadoParcela, number> = {
        atrasado: 0,
        a_vencer_urgente: 1,
        pendente: 2,
        processando: 3,
        aguardando_emissao: 4,
        pago: 5,
      };
      const difPrio = prioridadeEstado[a.estado] - prioridadeEstado[b.estado];
      if (difPrio !== 0) return difPrio;
      return a.data_vencimento.localeCompare(b.data_vencimento);
    });

    // --- KPIs ---
    const parcelasPendentes = parcelas.filter((p) => !p.pago);
    const proximaParcela = parcelasPendentes[0] ?? null;

    const totalPendenteMes = parcelas
      .filter((p) => {
        if (p.pago) return false;
        const d = new Date(p.data_vencimento + 'T00:00:00');
        return d.getFullYear() === anoAtual && d.getMonth() + 1 === mesAtual;
      })
      .reduce((acc, p) => acc + p.valor, 0);

    const totalPagoMes = parcelas
      .filter((p) => {
        if (!p.pago || !p.data_pagamento) return false;
        const d = new Date(p.data_pagamento);
        return d.getFullYear() === anoAtual && d.getMonth() + 1 === mesAtual;
      })
      .reduce((acc, p) => acc + p.valor, 0);

    const kpis: KPIsFinanceiros = {
      proximo_vencimento: proximaParcela
        ? {
            data: proximaParcela.data_vencimento,
            valor: proximaParcela.valor,
            dias_restantes: proximaParcela.dias_para_vencimento,
          }
        : { data: null, valor: 0, dias_restantes: null },
      total_pendente_mes: totalPendenteMes,
      total_pago_mes: totalPagoMes,
      parcelas_em_aberto: parcelasPendentes.length,
    };

    // --- Resumo Mensal ---
    const mapMensal = new Map<string, ResumoPorMes>();

    for (const p of parcelas) {
      const d = new Date(p.data_vencimento + 'T00:00:00');
      const ano = d.getFullYear();
      const mes = d.getMonth() + 1;
      const chave = `${ano}-${String(mes).padStart(2, '0')}`;

      if (!mapMensal.has(chave)) {
        mapMensal.set(chave, {
          ano,
          mes,
          mes_ano: labelMesAno(ano, mes),
          total_a_pagar: 0,
          total_pago: 0,
          quantidade_pendentes: 0,
          quantidade_pagas: 0,
        });
      }

      const resumo = mapMensal.get(chave)!;

      if (p.pago) {
        resumo.total_pago += p.valor;
        resumo.quantidade_pagas += 1;
      } else {
        resumo.total_a_pagar += p.valor;
        resumo.quantidade_pendentes += 1;
      }
    }

    const resumo_mensal: ResumoPorMes[] = Array.from(mapMensal.values()).sort(
      (a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes - b.mes;
      }
    );

    const payload: FinanceiroResumo = { kpis, parcelas, resumo_mensal };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('[/api/rh/financeiro-resumo] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
