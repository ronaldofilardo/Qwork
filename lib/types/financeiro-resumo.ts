// ==========================================
// TIPOS PARA MINI-DASHBOARD FINANCEIRO
// ==========================================

/**
 * Estado visual calculado de uma parcela, derivado do status real + data de vencimento.
 * Não persistido em banco — calculado na camada de apresentação.
 */
export type EstadoCalculadoParcela =
  | 'pago'
  | 'processando'
  | 'atrasado'
  | 'a_vencer_urgente' // ≤ 3 dias
  | 'pendente' // > 3 dias
  | 'aguardando_emissao'; // lote ainda em aguardando_cobranca

/**
 * Representa uma parcela expandida para exibição na timeline do dashboard.
 * Derivada de pagamentos.detalhes_parcelas (JSONB).
 */
export interface ParcelaTimeline {
  pagamento_id: number;
  parcela_numero: number;
  total_parcelas: number;
  valor: number;
  data_vencimento: string; // YYYY-MM-DD
  pago: boolean;
  data_pagamento: string | null;
  metodo: string | null;
  lote_id: number | null;
  /** Boleto/segunda via — somente quando metodo='boleto' e asaas_boleto_url IS NOT NULL */
  boleto_url: string | null;
  /** true quando asaas_payment_id IS NULL — permite marcar como pago manualmente */
  lancamento_manual: boolean;
  estado: EstadoCalculadoParcela;
  dias_para_vencimento: number; // negativo = vencida
}

/**
 * Linha do resumo mensal (tabela compacta).
 */
export interface ResumoPorMes {
  ano: number;
  mes: number; // 1–12
  mes_ano: string; // ex: "Abr/2026"
  total_a_pagar: number; // parcelas pendentes com vencimento no mês
  total_pago: number; // parcelas pagas no mês
  quantidade_pendentes: number;
  quantidade_pagas: number;
}

/**
 * KPIs do topo do dashboard.
 */
export interface KPIsFinanceiros {
  /** Data + valor da próxima parcela não paga mais próxima */
  proximo_vencimento: {
    data: string | null;
    valor: number;
    dias_restantes: number | null;
  };
  /** Soma de parcelas não pagas com vencimento no mês corrente */
  total_pendente_mes: number;
  /** Soma de parcelas pagas no mês corrente */
  total_pago_mes: number;
  /** Quantidade de parcelas em aberto (não pagas, sem considerar mês) */
  parcelas_em_aberto: number;
}

/**
 * Shape completo retornado por GET /api/{rh|entidade}/financeiro-resumo
 */
export interface FinanceiroResumo {
  kpis: KPIsFinanceiros;
  parcelas: ParcelaTimeline[];
  resumo_mensal: ResumoPorMes[];
}
