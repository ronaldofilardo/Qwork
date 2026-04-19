export type ModeloRepresentanteSociedade = 'percentual' | 'custo_fixo';

export interface CalcularDistribuicaoSociedadeInput {
  valorBruto: number;
  modeloRepresentante: ModeloRepresentanteSociedade;
  percentualRepresentante?: number | null;
  valorRepresentanteFixo?: number | null;
  percentualComercial?: number | null;
  percentualImpostos?: number;
  percentualSocioRonaldo?: number;
  percentualSocioAntonio?: number;
}

export interface DistribuicaoSociedade {
  viavel: boolean;
  valorBruto: number;
  valorImpostos: number;
  valorRepresentante: number;
  margemLivre: number;
  valorComercial: number;
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

export const PERCENTUAL_IMPOSTOS_PADRAO = 7;
export const PERCENTUAL_MAXIMO_COMERCIAL = 40;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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
  const percentualComercial = clamp(
    Number(input.percentualComercial ?? 0),
    0,
    PERCENTUAL_MAXIMO_COMERCIAL
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

  const valorRepresentante =
    input.modeloRepresentante === 'custo_fixo'
      ? round2(Math.max(0, Number(input.valorRepresentanteFixo ?? 0)))
      : round2(
          valorBruto *
            (clamp(Number(input.percentualRepresentante ?? 0), 0, 100) / 100)
        );

  const margemLivre = round2(valorBruto - valorImpostos - valorRepresentante);

  if (margemLivre < 0) {
    return {
      viavel: false,
      valorBruto,
      valorImpostos,
      valorRepresentante,
      margemLivre,
      valorComercial: 0,
      valorParaSocios: 0,
      valorSocioRonaldo: 0,
      valorSocioAntonio: 0,
      totalDistribuido: round2(valorImpostos + valorRepresentante),
    };
  }

  const valorComercial = round2(margemLivre * (percentualComercial / 100));
  const valorParaSocios = round2(margemLivre - valorComercial);
  const somaParticipacao = percentualSocioRonaldo + percentualSocioAntonio;

  const valorSocioRonaldo =
    somaParticipacao > 0
      ? round2(valorParaSocios * (percentualSocioRonaldo / somaParticipacao))
      : 0;
  const valorSocioAntonio = round2(valorParaSocios - valorSocioRonaldo);
  const totalDistribuido = round2(
    valorImpostos +
      valorRepresentante +
      valorComercial +
      valorSocioRonaldo +
      valorSocioAntonio
  );

  return {
    viavel: valorParaSocios >= 0,
    valorBruto,
    valorImpostos,
    valorRepresentante,
    margemLivre,
    valorComercial,
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
