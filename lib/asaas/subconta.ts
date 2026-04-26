/**
 * lib/asaas/subconta.ts
 * Helpers para o novo modelo de comissionamento via split de pagamento.
 *
 * Responsabilidades:
 * - Constantes de custo mínimo por tipo de produto
 * - Cálculo do split (modelo % ou custo fixo)
 * - Tipos relacionados ao split e subcontas
 */

// ---------------------------------------------------------------------------
// Constantes de negócio
// ---------------------------------------------------------------------------

/** Valor mínimo que o QWork retém por avaliação, por tipo de produto */
export const CUSTO_MINIMO: Record<'clinica' | 'entidade', number> = {
  clinica: 5.0,
  entidade: 12.0,
};

/** Percentual máximo de comissão distribuível (representante) */
export const PERCENTUAL_MAXIMO_COMISSAO = 40;

import {
  calcularDistribuicaoSociedade,
  type ConfiguracaoGateway,
} from '../financeiro/sociedade';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type TipoProdutoSplit = 'clinica' | 'entidade';
export type ModeloComissionamento = 'percentual' | 'custo_fixo';

export interface ResultadoSplit {
  valorQWork: number;
  valorRepresentante: number;
  /** Valor que cabe ao comercial (0 se não houver percentual ou wallet configurado) */
  valorComercial: number;
  valorImpostos?: number;
  valorGateway?: number;
  baseLiquida?: number;
  /** Percentual efetivamente aplicado (somente no modelo %) */
  percentualAplicado?: number;
  /** true se o valor é viável (valorQWork >= CUSTO_MINIMO) */
  viavel: boolean;
  modelo: ModeloComissionamento;
}

export interface OpcoesFinanceirasSplit {
  percentualImpostos?: number;
  percentualGateway?: number | null;
  valorTaxaGateway?: number | null;
  valorLiquidoGateway?: number | null;
  metodoPagamento?: string | null;
  /**
   * Configurações dinâmicas do gateway lidas da tabela configuracoes_gateway.
   * Quando fornecidas, garantem que taxa_transacao e taxas por método
   * sejam lidas do banco (admin > financeiro > sociedade > taxas)
   * em vez de env vars ou zero.
   */
  configuracoes?: ConfiguracaoGateway[] | null;
  /** Número de parcelas — usado para selecionar taxa de cartão correta */
  numeroParcelas?: number | null;
}

/** Dados necessários para criar subconta Asaas do representante */
export interface DadosSubcontaRepresentante {
  nome: string;
  email: string;
  cpfCnpj: string; // CPF (PF) ou CNPJ (PJ)
  telefone?: string;
  // Dados bancários para transferência automática
  bankAccount?: {
    bank: { code: string };
    accountName: string;
    ownerName: string;
    cpfCnpj: string;
    agency: string;
    account: string;
    accountDigit?: string;
    bankAccountType: 'CONTA_CORRENTE' | 'CONTA_POUPANCA';
  };
}

/** Resposta da API Asaas ao criar subconta */
export interface RespostaSubconta {
  id: string; // ID externo da subconta no Asaas
  walletId: string; // walletId usado para split de pagamentos
  status: string;
}

/** Um item de split no payload da cobrança Asaas */
export interface AsaasSplitItem {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
}

/**
 * Opções para configurar split societário completo no Asaas.
 * Permite incluir impostos (QWork institucional) e beneficiários societários (sócios).
 */
export interface OpcoesSplitCompleto {
  /** walletId da conta institucional do QWork para recolhimento de impostos */
  impostosWalletId?: string | null;
  /**
   * Beneficiários societários para distribuição do valorQWork (sócios).
   * O valorQWork será distribuído proporcionalmente conforme os percentuais informados.
   */
  beneficiarios?: Array<{ walletId: string | null; percentual: number }>;
}

// ---------------------------------------------------------------------------
// Funções de cálculo
// ---------------------------------------------------------------------------

/**
 * Calcula os valores do split entre QWork, representante e comercial.
 *
 * Modelo PERCENTUAL:
 *   - valorRepresentante = valorLaudo × (percentual / 100)
 *   - valorComercial     = valorLaudo × (percentualComercial / 100)  [se informado]
 *   - valorQWork         = valorLaudo - valorRepresentante - valorComercial
 *   - Inviável se valorQWork < CUSTO_MINIMO[tipoProduto]
 *
 * Modelo CUSTO_FIXO:
 *   - valorRepresentante = valorCustoFixoRep (valor fixo configurado no cadastro do rep)
 *   - valorComercial     = (valorLaudo - valorCustoFixoRep) × (percentualComercial / 100)
 *   - valorQWork         = valorLaudo - valorRepresentante - valorComercial
 *   - Inviável se valorQWork < CUSTO_MINIMO[tipoProduto]
 */
export function calcularSplit(
  modelo: ModeloComissionamento,
  valorLaudo: number,
  tipoProduto: TipoProdutoSplit,
  percentual?: number,
  percentualComercial?: number,
  /** Valor custo fixo do representante (R$). Obrigatório para modelo custo_fixo. */
  valorCustoFixoRep?: number,
  opcoes?: OpcoesFinanceirasSplit
): ResultadoSplit {
  const custoMinimo = CUSTO_MINIMO[tipoProduto];
  const percComercial =
    percentualComercial != null && percentualComercial > 0
      ? percentualComercial
      : 0;

  if (
    modelo === 'percentual' &&
    (percentual === undefined ||
      percentual < 0 ||
      percentual > PERCENTUAL_MAXIMO_COMISSAO)
  ) {
    return {
      valorQWork: valorLaudo,
      valorRepresentante: 0,
      valorComercial: 0,
      valorImpostos: 0,
      valorGateway: 0,
      baseLiquida: valorLaudo,
      viavel: false,
      modelo,
    };
  }

  const custoFixo =
    valorCustoFixoRep != null && valorCustoFixoRep > 0
      ? valorCustoFixoRep
      : custoMinimo;

  const distribuicao = calcularDistribuicaoSociedade({
    valorBruto: valorLaudo,
    modeloRepresentante: modelo,
    percentualRepresentante: modelo === 'percentual' ? (percentual ?? 0) : 0,
    valorRepresentanteFixo: modelo === 'custo_fixo' ? custoFixo : 0,
    percentualComercial: percComercial,
    percentualImpostos: opcoes?.percentualImpostos,
    percentualGateway: opcoes?.percentualGateway,
    valorTaxaGateway: opcoes?.valorTaxaGateway,
    valorLiquidoGateway: opcoes?.valorLiquidoGateway,
    metodoPagamento: opcoes?.metodoPagamento,
    // Repassa configurações dinâmicas do banco (taxa_transacao, taxas por método)
    configuracoes: opcoes?.configuracoes ?? null,
    numeroParcelas: opcoes?.numeroParcelas ?? null,
  });

  const valorQWork = Number(distribuicao.valorParaSocios.toFixed(2));
  const viavel = distribuicao.viavel && valorQWork >= custoMinimo;

  return {
    valorQWork,
    valorRepresentante: distribuicao.valorRepresentante,
    valorComercial: distribuicao.valorComercial,
    valorImpostos: distribuicao.valorImpostos,
    valorGateway: distribuicao.valorGateway,
    baseLiquida: distribuicao.baseLiquida,
    percentualAplicado: modelo === 'percentual' ? percentual : undefined,
    viavel,
    modelo,
  };
}

/**
 * Monta o array de split para o payload da cobrança Asaas.
 * Retorna null se o representante não tiver walletId ou se o split for inviável.
 *
 * Ordem dos itens de split enviados ao Asaas:
 *  1. Representante (obrigatório — sem ele retorna null)
 *  2. Comercial (se walletId + valor > 0)
 *  3. Impostos — wallet institucional do QWork (se walletId + valorImpostos > 0)
 *  4. Beneficiários societários (sócios) — valorQWork distribuído proporcional aos percentuais
 *
 * @param repWalletId       walletId da subconta do representante
 * @param splitResult       resultado de calcularSplit()
 * @param comercialWalletId walletId da subconta do comercial (opcional)
 * @param opcoes            wallets adicionais para impostos e beneficiários societários
 */
export function montarSplitAsaas(
  repWalletId: string | null | undefined,
  splitResult: ResultadoSplit,
  comercialWalletId?: string | null,
  opcoes?: OpcoesSplitCompleto
): AsaasSplitItem[] | null {
  if (
    !repWalletId ||
    !splitResult.viavel ||
    splitResult.valorRepresentante <= 0
  ) {
    return null;
  }

  // Asaas aceita fixedValue ou percentualValue por item de split.
  // Usamos fixedValue para garantir exatidão no custo mínimo.
  const items: AsaasSplitItem[] = [
    {
      walletId: repWalletId,
      fixedValue: splitResult.valorRepresentante,
    },
  ];

  if (comercialWalletId && splitResult.valorComercial > 0) {
    items.push({
      walletId: comercialWalletId,
      fixedValue: splitResult.valorComercial,
    });
  }

  // Impostos: wallet institucional do QWork para recolhimento dos 7%
  const valorImpostos = splitResult.valorImpostos ?? 0;
  if (opcoes?.impostosWalletId && valorImpostos > 0) {
    items.push({
      walletId: opcoes.impostosWalletId,
      fixedValue: valorImpostos,
    });
  }

  // Beneficiários societários (sócios): distribuição do valorQWork proporcionalmente
  const valorQWork = splitResult.valorQWork;
  if (opcoes?.beneficiarios?.length && valorQWork > 0) {
    const benefAtivos = opcoes.beneficiarios.filter(
      (b) => b.walletId && b.percentual > 0
    );
    const totalPercentual = benefAtivos.reduce((s, b) => s + b.percentual, 0);
    if (totalPercentual > 0 && benefAtivos.length > 0) {
      let restante = valorQWork;
      benefAtivos.forEach((benef, idx) => {
        if (!benef.walletId) return;
        const isUltimo = idx === benefAtivos.length - 1;
        // Último sócio recebe o restante para evitar erro de arredondamento
        const valor = isUltimo
          ? Math.round(restante * 100) / 100
          : Math.round(
              ((valorQWork * benef.percentual) / totalPercentual) * 100
            ) / 100;
        if (valor > 0) {
          items.push({ walletId: benef.walletId as string, fixedValue: valor });
          restante = Math.round((restante - valor) * 100) / 100;
        }
      });
    }
  }

  return items;
}
