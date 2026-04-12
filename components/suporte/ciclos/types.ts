// Types shared across Ciclos sub-components

export type StatusCiclo =
  | 'aberto'
  | 'fechado'
  | 'nf_enviada'
  | 'nf_aprovada'
  | 'pago';
export type AcaoCiclo = 'fechar' | 'aprovar_nf' | 'rejeitar_nf' | 'pagar';

export interface CicloEnriquecido {
  id: number;
  mes_referencia: string;
  valor_total: number;
  qtd_comissoes: number;
  status: StatusCiclo;
  nf_path: string | null;
  nf_nome_arquivo: string | null;
  nf_enviada_em: string | null;
  nf_aprovada_em: string | null;
  nf_rejeitada_em: string | null;
  nf_motivo_rejeicao: string | null;
  data_pagamento: string | null;
  comprovante_pagamento_path: string | null;
  fechado_em: string | null;
  beneficiario_nome: string;
  beneficiario_tipo_pessoa: 'PF' | 'PJ' | null;
  beneficiario_codigo: string | null;
  beneficiario_email: string | null;
}

export interface ResumoCiclosMes {
  valor_total: number;
  valor_pago: number;
  qtd_ciclos: number;
  qtd_pagos: number;
  qtd_aguardando_nf: number;
  qtd_nf_analise: number;
  qtd_aprovados: number;
}

export interface ComissaoLegadaAgrupada {
  representante_id: number;
  representante_nome: string;
  representante_codigo: string | null;
  qtd_comissoes: number;
  valor_total: number;
}

export interface ResumoCiclosLegadas {
  itens: ComissaoLegadaAgrupada[];
  valor_total: number;
  qtd_comissoes: number;
}

export interface ComissaoProvisionada {
  id: number;
  representante_nome: string;
  representante_codigo: string;
  entidade_nome: string;
  valor_comissao: string;
  percentual_comissao: string;
  parcela_numero: number;
  total_parcelas: number;
  mes_pagamento: string | null;
}

export interface AcaoPendente {
  ciclo: CicloEnriquecido;
  acao: AcaoCiclo;
}

export const COMPROVANTE_MAX_SIZE = 5 * 1024 * 1024;
export const COMPROVANTE_MIMES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

export const STATUS_BADGE: Record<StatusCiclo, { label: string; cor: string }> =
  {
    aberto: { label: 'Aberto', cor: 'bg-gray-100 text-gray-600' },
    fechado: { label: 'Aguardando NF', cor: 'bg-blue-100 text-blue-700' },
    nf_enviada: {
      label: 'NF em Análise',
      cor: 'bg-indigo-100 text-indigo-700',
    },
    nf_aprovada: {
      label: 'Aprovado p/ Pagar',
      cor: 'bg-purple-100 text-purple-700',
    },
    pago: { label: 'Pago', cor: 'bg-green-100 text-green-700' },
  };

export const ACOES_POR_STATUS: Record<StatusCiclo, AcaoCiclo[]> = {
  aberto: ['fechar'],
  fechado: [],
  nf_enviada: ['aprovar_nf', 'rejeitar_nf'],
  nf_aprovada: ['pagar'],
  pago: [],
};

export const ACAO_LABEL: Record<AcaoCiclo, string> = {
  fechar: 'Fechar Ciclo',
  aprovar_nf: 'Aprovar NF/RPA',
  rejeitar_nf: 'Rejeitar NF/RPA',
  pagar: 'Registrar Pagamento',
};

export const ACAO_COR: Record<AcaoCiclo, string> = {
  fechar: 'bg-blue-600 hover:bg-blue-700 text-white',
  aprovar_nf: 'bg-green-600 hover:bg-green-700 text-white',
  rejeitar_nf: 'bg-red-600 hover:bg-red-700 text-white',
  pagar: 'bg-purple-600 hover:bg-purple-700 text-white',
};

export const STATUS_FILTER_OPTIONS: Array<{
  value: StatusCiclo | '';
  label: string;
}> = [
  { value: '', label: 'Todos' },
  { value: 'aberto', label: 'Abertos' },
  { value: 'fechado', label: 'Aguardando NF' },
  { value: 'nf_enviada', label: 'NF em Análise' },
  { value: 'nf_aprovada', label: 'Aprovados' },
  { value: 'pago', label: 'Pagos' },
];

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function fmt(v: number | string | null | undefined): string {
  return `R$ ${parseFloat(String(v ?? 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function fmtMes(mesRef: string): string {
  const d = new Date(mesRef + 'T12:00:00Z');
  return `${MESES[d.getUTCMonth()]}/${d.getUTCFullYear()}`;
}
