export type ModeloRepresentanteSociedade = 'percentual' | 'custo_fixo';

export interface CalcularDistribuicaoSociedadeInput {
  valorBruto: number;
  modeloRepresentante: ModeloRepresentanteSociedade;
  percentualRepresentante?: number | null;
  valorRepresentanteFixo?: number | null;
  percentualImpostos?: number;
  percentualGateway?: number | null;
  valorTaxaGateway?: number | null;
  valorLiquidoGateway?: number | null;
  metodoPagamento?: string | null;
  numeroParcelas?: number | null;
  configuracoes?: ConfiguracaoGateway[] | null;
  percentualSocioRonaldo?: number;
  percentualSocioAntonio?: number;
}

export interface DistribuicaoSociedade {
  viavel: boolean;
  valorBruto: number;
  valorImpostos: number;
  valorGateway: number;
  baseLiquida: number;
  valorRepresentante: number;
  margemLivre: number;
  valorParaSocios: number;
  valorSocioRonaldo: number;
  valorSocioAntonio: number;
  totalDistribuido: number;
}

export interface BeneficiarioSociedade {
  id: string;
  nome: string;
  nomeEmpresarial: string;
  documentoFiscal: string;
  walletId: string | null;
  percentualParticipacao: number;
  ativo: boolean;
  observacoes?: string | null;
}

export interface ConfiguracaoQWorkSociedade {
  id: 'qwork';
  nome: 'QWork';
  nomeEmpresarial: string;
  documentoFiscal: string;
  walletId: string | null;
  percentualParticipacao: 0;
  ativo: boolean;
  observacoes?: string | null;
}

export interface ConfiguracaoGateway {
  codigo: string;
  descricao: string | null;
  tipo: 'taxa_fixa' | 'percentual';
  valor: number;
  ativo: boolean;
}

export const PERCENTUAL_IMPOSTOS_PADRAO = 7;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizarMetodoPagamento(
  metodo: string | null | undefined
): 'pix' | 'boleto' | 'credit_card' | 'outro' {
  const normalizado = String(metodo ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalizado.includes('pix')) return 'pix';
  if (normalizado.includes('boleto')) return 'boleto';
  if (normalizado.includes('credit') || normalizado.includes('cartao')) {
    return 'credit_card';
  }

  return 'outro';
}

function getPercentualGatewayFallback(
  metodo: string | null | undefined
): number {
  const metodoNormalizado = normalizarMetodoPagamento(metodo);

  const candidatesByMethod: Record<string, Array<string | undefined>> = {
    pix: [
      process.env.ASAAS_GATEWAY_FEE_PIX_PERCENT,
      process.env.NEXUS_GATEWAY_FEE_PIX_PERCENT,
      process.env.GATEWAY_FEE_PIX_PERCENT,
      process.env.ASAAS_TAXA_PIX_PERCENT,
    ],
    boleto: [
      process.env.ASAAS_GATEWAY_FEE_BOLETO_PERCENT,
      process.env.NEXUS_GATEWAY_FEE_BOLETO_PERCENT,
      process.env.GATEWAY_FEE_BOLETO_PERCENT,
      process.env.ASAAS_TAXA_BOLETO_PERCENT,
    ],
    credit_card: [
      process.env.ASAAS_GATEWAY_FEE_CREDIT_CARD_PERCENT,
      process.env.NEXUS_GATEWAY_FEE_CREDIT_CARD_PERCENT,
      process.env.GATEWAY_FEE_CREDIT_CARD_PERCENT,
      process.env.ASAAS_TAXA_CARTAO_PERCENT,
    ],
    outro: [],
  };

  const fallback = [
    ...(candidatesByMethod[metodoNormalizado] ?? []),
    process.env.ASAAS_GATEWAY_FEE_DEFAULT_PERCENT,
    process.env.NEXUS_GATEWAY_FEE_DEFAULT_PERCENT,
    process.env.GATEWAY_FEE_DEFAULT_PERCENT,
    '0',
  ];

  for (const raw of fallback) {
    const parsed = Number(raw ?? NaN);
    if (Number.isFinite(parsed)) {
      return clamp(parsed, 0, 100);
    }
  }

  return 0;
}

export function calcularTaxaGateway(input: {
  valorBruto: number;
  percentualGateway?: number | null;
  valorTaxaGateway?: number | null;
  valorLiquidoGateway?: number | null;
  metodoPagamento?: string | null;
  numeroParcelas?: number | null;
  configuracoes?: ConfiguracaoGateway[] | null;
}): {
  valorGateway: number;
  valorLiquidoAposGateway: number;
  percentualGatewayAplicado: number;
} {
  const valorBruto = round2(Math.max(0, Number(input.valorBruto || 0)));

  // 1. Deducao explicita vinda do webhook (maior prioridade)
  const taxaExplicita = Number(input.valorTaxaGateway ?? NaN);
  if (Number.isFinite(taxaExplicita) && taxaExplicita > 0) {
    const valorGateway = round2(clamp(taxaExplicita, 0, valorBruto));
    return {
      valorGateway,
      valorLiquidoAposGateway: round2(valorBruto - valorGateway),
      percentualGatewayAplicado:
        valorBruto > 0 ? round2((valorGateway / valorBruto) * 100) : 0,
    };
  }

  // 2. Valor liquido vindo do Asaas (net_value)
  const valorLiquidoGateway = Number(input.valorLiquidoGateway ?? NaN);
  if (
    Number.isFinite(valorLiquidoGateway) &&
    valorLiquidoGateway >= 0 &&
    valorLiquidoGateway <= valorBruto
  ) {
    const valorGateway = round2(valorBruto - valorLiquidoGateway);
    return {
      valorGateway,
      valorLiquidoAposGateway: round2(valorBruto - valorGateway),
      percentualGatewayAplicado:
        valorBruto > 0 ? round2((valorGateway / valorBruto) * 100) : 0,
    };
  }

  // 3. Configuracao dinamica do banco (configuracoes_gateway)
  if (input.configuracoes?.length) {
    const metodoNorm = normalizarMetodoPagamento(input.metodoPagamento);
    const parcelas = Math.max(1, Number(input.numeroParcelas ?? 1));

    let codigoPrincipal: string | null = null;
    if (metodoNorm === 'boleto') codigoPrincipal = 'boleto';
    else if (metodoNorm === 'pix') codigoPrincipal = 'pix';
    else if (metodoNorm === 'credit_card') {
      if (parcelas <= 1) codigoPrincipal = 'credit_card_1x';
      else if (parcelas <= 6) codigoPrincipal = 'credit_card_2_6x';
      else codigoPrincipal = 'credit_card_7_12x';
    }

    if (codigoPrincipal) {
      const configPrincipal = input.configuracoes.find(
        (c) => c.codigo === codigoPrincipal && c.ativo
      );
      const configTransacao = input.configuracoes.find(
        (c) => c.codigo === 'taxa_transacao' && c.ativo
      );

      if (configPrincipal) {
        const taxaPrincipal =
          configPrincipal.tipo === 'taxa_fixa'
            ? configPrincipal.valor
            : round2(valorBruto * (configPrincipal.valor / 100));
        const taxaTransacao =
          configTransacao?.tipo === 'taxa_fixa' ? configTransacao.valor : 0;
        const valorGateway = round2(
          clamp(taxaPrincipal + taxaTransacao, 0, valorBruto)
        );
        return {
          valorGateway,
          valorLiquidoAposGateway: round2(valorBruto - valorGateway),
          percentualGatewayAplicado:
            valorBruto > 0 ? round2((valorGateway / valorBruto) * 100) : 0,
        };
      }
    }
  }

  // 4. Percentual explicito / 5. Fallback de env vars
  const percentualGateway = clamp(
    Number(
      input.percentualGateway ??
        getPercentualGatewayFallback(input.metodoPagamento)
    ),
    0,
    100
  );
  const valorGateway = round2(valorBruto * (percentualGateway / 100));

  return {
    valorGateway,
    valorLiquidoAposGateway: round2(valorBruto - valorGateway),
    percentualGatewayAplicado: percentualGateway,
  };
}

export function calcularDistribuicaoSociedade(
  input: CalcularDistribuicaoSociedadeInput
): DistribuicaoSociedade {
  const valorBruto = round2(Math.max(0, Number(input.valorBruto || 0)));
  const percentualImpostos = clamp(
    Number(input.percentualImpostos ?? PERCENTUAL_IMPOSTOS_PADRAO),
    0,
    100
  );

  const percentualSocioRonaldo = Math.max(
    0,
    Number(input.percentualSocioRonaldo ?? 50)
  );
  const percentualSocioAntonio = Math.max(
    0,
    Number(input.percentualSocioAntonio ?? 50)
  );

  const valorImpostos = round2(valorBruto * (percentualImpostos / 100));
  const { valorGateway } = calcularTaxaGateway({
    valorBruto,
    percentualGateway: input.percentualGateway,
    valorTaxaGateway: input.valorTaxaGateway,
    valorLiquidoGateway: input.valorLiquidoGateway,
    metodoPagamento: input.metodoPagamento,
    numeroParcelas: input.numeroParcelas,
    configuracoes: input.configuracoes,
  });
  const baseLiquida = round2(
    Math.max(0, valorBruto - valorImpostos - valorGateway)
  );

  const valorRepresentante =
    input.modeloRepresentante === 'custo_fixo'
      ? round2(Math.max(0, Number(input.valorRepresentanteFixo ?? 0)))
      : round2(
          baseLiquida *
            (clamp(Number(input.percentualRepresentante ?? 0), 0, 100) / 100)
        );

  const margemLivre = round2(baseLiquida - valorRepresentante);

  if (margemLivre < 0) {
    return {
      viavel: false,
      valorBruto,
      valorImpostos,
      valorGateway,
      baseLiquida,
      valorRepresentante,
      margemLivre,
      valorParaSocios: 0,
      valorSocioRonaldo: 0,
      valorSocioAntonio: 0,
      totalDistribuido: round2(
        valorImpostos + valorGateway + valorRepresentante
      ),
    };
  }

  const valorParaSocios = round2(margemLivre);
  const somaParticipacao = percentualSocioRonaldo + percentualSocioAntonio;

  const valorSocioRonaldo =
    somaParticipacao > 0
      ? round2(valorParaSocios * (percentualSocioRonaldo / somaParticipacao))
      : 0;
  const valorSocioAntonio = round2(valorParaSocios - valorSocioRonaldo);
  const totalDistribuido = round2(
    valorImpostos +
      valorGateway +
      valorRepresentante +
      valorSocioRonaldo +
      valorSocioAntonio
  );

  return {
    viavel: valorParaSocios >= 0,
    valorBruto,
    valorImpostos,
    valorGateway,
    baseLiquida,
    valorRepresentante,
    margemLivre,
    valorParaSocios,
    valorSocioRonaldo,
    valorSocioAntonio,
    totalDistribuido,
  };
}

export function getConfiguracaoQWorkPadrao(): ConfiguracaoQWorkSociedade {
  return {
    id: 'qwork',
    nome: 'QWork',
    nomeEmpresarial: process.env.NEXUS_QWORK_EMPRESA ?? 'QWork Plataforma',
    documentoFiscal: process.env.NEXUS_QWORK_DOCUMENTO ?? '',
    walletId: process.env.ASAAS_QWORK_WALLET_ID ?? null,
    percentualParticipacao: 0,
    ativo: true,
    observacoes:
      'Wallet institucional da plataforma para recolhimento de impostos e operação do split.',
  };
}

export function getBeneficiariosSociedadePadrao(): BeneficiarioSociedade[] {
  return [
    {
      id: 'ronaldo',
      nome: 'Ronaldo',
      nomeEmpresarial:
        process.env.NEXUS_SOCIO_RONALDO_EMPRESA ?? 'Empresa Ronaldo',
      documentoFiscal: process.env.NEXUS_SOCIO_RONALDO_DOCUMENTO ?? '',
      walletId: process.env.ASAAS_WALLET_SOCIO_RONALDO ?? null,
      percentualParticipacao: 50,
      ativo: true,
      observacoes: 'Beneficiário societário configurável sem perfil de acesso.',
    },
    {
      id: 'antonio',
      nome: 'Antonio',
      nomeEmpresarial:
        process.env.NEXUS_SOCIO_ANTONIO_EMPRESA ?? 'Empresa Antonio',
      documentoFiscal: process.env.NEXUS_SOCIO_ANTONIO_DOCUMENTO ?? '',
      walletId: process.env.ASAAS_WALLET_SOCIO_ANTONIO ?? null,
      percentualParticipacao: 50,
      ativo: true,
      observacoes: 'Beneficiário societário configurável sem perfil de acesso.',
    },
  ];
}
