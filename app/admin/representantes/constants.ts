export const STATUS_OPTIONS = [
  '',
  'ativo',
  'apto_pendente',
  'apto',
  'apto_bloqueado',
  'aguardando_senha',
  'expirado',
  'suspenso',
  'desativado',
  'rejeitado',
];

export const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-blue-100 text-blue-700',
  apto_pendente: 'bg-yellow-100 text-yellow-700',
  apto: 'bg-green-100 text-green-700',
  apto_bloqueado: 'bg-orange-100 text-orange-700',
  aguardando_senha: 'bg-amber-100 text-amber-700',
  expirado: 'bg-red-100 text-red-600',
  suspenso: 'bg-red-100 text-red-700',
  desativado: 'bg-gray-100 text-gray-500',
  rejeitado: 'bg-red-200 text-red-800',
};

export const LEAD_STATUS_BADGE: Record<string, string> = {
  pendente_verificacao: 'bg-amber-100 text-amber-700',
  verificado: 'bg-blue-100 text-blue-700',
  rejeitado: 'bg-red-200 text-red-800',
  convertido: 'bg-green-100 text-green-700',
};

export const LEAD_STATUS_OPTIONS = [
  '',
  'pendente_verificacao',
  'verificado',
  'rejeitado',
  'convertido',
];

export const TRANSICOES: Record<string, string[]> = {
  ativo: ['apto_pendente', 'suspenso', 'desativado', 'rejeitado'],
  apto_pendente: ['apto', 'suspenso', 'desativado', 'rejeitado'],
  apto: ['suspenso', 'desativado'],
  apto_bloqueado: [
    'apto',
    'apto_pendente',
    'suspenso',
    'desativado',
    'rejeitado',
  ],
  suspenso: ['apto', 'ativo', 'desativado'],
  desativado: [],
  rejeitado: [],
};

export const ACAO_LABEL: Record<string, string> = {
  apto_pendente: 'Solicitar Análise',
  apto: '✅ Aprovar (Apto)',
  suspenso: '⏸ Suspender',
  desativado: '🚫 Desativar',
  rejeitado: '❌ Rejeitar',
  ativo: '▶ Restaurar (Ativo)',
};

export const fmt = (v: string | number): string =>
  `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export const fmtData = (d: string): string =>
  new Date(d).toLocaleDateString('pt-BR');
