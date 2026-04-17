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
  /** Percentual efetivamente aplicado (somente no modelo %) */
  percentualAplicado?: number;
  /** true se o valor é viável (valorQWork >= CUSTO_MINIMO) */
  viavel: boolean;
  modelo: ModeloComissionamento;
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
 *   - valorQWork         = CUSTO_MINIMO[tipoProduto]
 *   - valorRepresentante = valorLaudo - valorQWork (base do rep)
 *   - valorComercial     = (valorLaudo - valorRepresentante_bruto) × (percentualComercial / 100)
 *   - Inviável se valorRepresentante < 0
 */
export function calcularSplit(
  modelo: ModeloComissionamento,
  valorLaudo: number,
  tipoProduto: TipoProdutoSplit,
  percentual?: number,
  percentualComercial?: number
): ResultadoSplit {
  const custoMinimo = CUSTO_MINIMO[tipoProduto];
  const percComercial =
    percentualComercial != null && percentualComercial > 0
      ? percentualComercial
      : 0;

  if (modelo === 'percentual') {
    if (
      percentual === undefined ||
      percentual < 0 ||
      percentual > PERCENTUAL_MAXIMO_COMISSAO
    ) {
      return {
        valorQWork: valorLaudo,
        valorRepresentante: 0,
        valorComercial: 0,
        viavel: false,
        modelo,
      };
    }

    const valorRepresentante = parseFloat(
      (valorLaudo * (percentual / 100)).toFixed(2)
    );
    const valorComercial = parseFloat(
      (valorLaudo * (percComercial / 100)).toFixed(2)
    );
    const valorQWork = parseFloat(
      (valorLaudo - valorRepresentante - valorComercial).toFixed(2)
    );
    const viavel = valorQWork >= custoMinimo;

    return {
      valorQWork,
      valorRepresentante,
      valorComercial,
      percentualAplicado: percentual,
      viavel,
      modelo,
    };
  }

  // modelo === 'custo_fixo'
  const valorQWork = custoMinimo;
  const valorRepresentante = parseFloat((valorLaudo - valorQWork).toFixed(2));
  // Comercial recebe % do que sobra após o rep (base residual)
  const baseRestante = parseFloat((valorLaudo - valorRepresentante).toFixed(2));
  const valorComercial = parseFloat(
    (baseRestante * (percComercial / 100)).toFixed(2)
  );
  const viavel = valorRepresentante >= 0;

  return {
    valorQWork: parseFloat((valorQWork - valorComercial).toFixed(2)),
    valorRepresentante,
    valorComercial,
    viavel,
    modelo,
  };
}

/**
 * Monta o array de split para o payload da cobrança Asaas.
 * Retorna null se o representante não tiver walletId ou se o split for inviável.
 *
 * @param repWalletId    walletId da subconta do representante
 * @param splitResult    resultado de calcularSplit()
 * @param comercialWalletId  walletId da subconta do comercial (opcional; env ASAAS_COMERCIAL_WALLET_ID)
 */
export function montarSplitAsaas(
  repWalletId: string | null | undefined,
  splitResult: ResultadoSplit,
  comercialWalletId?: string | null
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

  return items;
}
