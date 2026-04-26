/**
 * Fonte centralizada de status labels e cores para comissões.
 * Importar de `@/lib/status-labels` em admin, suporte e representante.
 */

export interface StatusBadgeConfig {
  label: string;
  cor: string;
}

export const COMISSAO_STATUS_BADGE: Record<string, StatusBadgeConfig> = {
  retida: { label: 'Retida', cor: 'bg-gray-100 text-gray-600' },
  pendente_consolidacao: {
    label: 'Legado (Ciclo)',
    cor: 'bg-gray-200 text-gray-500',
  },
  pendente_nf: { label: 'Legado (NF)', cor: 'bg-gray-200 text-gray-500' },
  nf_em_analise: {
    label: 'Legado (Análise)',
    cor: 'bg-gray-200 text-gray-500',
  },
  congelada_rep_suspenso: {
    label: 'Congelada (Suspensão)',
    cor: 'bg-amber-100 text-amber-700',
  },
  congelada_aguardando_admin: {
    label: 'Aguardando Admin',
    cor: 'bg-yellow-100 text-yellow-700',
  },
  liberada: { label: 'Liberada', cor: 'bg-purple-100 text-purple-700' },
  paga: { label: 'Paga', cor: 'bg-green-100 text-green-700' },
  cancelada: { label: 'Cancelada', cor: 'bg-red-100 text-red-600' },
};

export const CICLO_STATUS_BADGE: Record<string, StatusBadgeConfig> = {
  aberto: { label: 'Aberto', cor: 'bg-blue-100 text-blue-700' },
  fechado: { label: 'Fechado', cor: 'bg-gray-100 text-gray-600' },
  nf_enviada: { label: 'NF Enviada', cor: 'bg-amber-100 text-amber-700' },
  nf_aprovada: { label: 'NF Aprovada', cor: 'bg-green-100 text-green-700' },
  pago: { label: 'Pago', cor: 'bg-emerald-100 text-emerald-700' },
};
