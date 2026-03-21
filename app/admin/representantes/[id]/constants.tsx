export const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-blue-100 text-blue-700',
  apto_pendente: 'bg-yellow-100 text-yellow-700',
  apto: 'bg-green-100 text-green-700',
  apto_bloqueado: 'bg-orange-100 text-orange-700',
  suspenso: 'bg-red-100 text-red-700',
  desativado: 'bg-gray-100 text-gray-500',
  rejeitado: 'bg-red-200 text-red-800',
};

export const STATUS_BADGE_LEAD: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  convertido: 'bg-green-100 text-green-700',
  expirado: 'bg-gray-100 text-gray-500',
};

export const STATUS_BADGE_VINCULO: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-500',
  suspenso: 'bg-orange-100 text-orange-700',
  encerrado: 'bg-red-100 text-red-700',
};

export const TIPO_CONVERSAO_LABEL: Record<string, string> = {
  link_representante: 'Link',
  codigo_representante: 'Código',
  verificacao_cnpj: 'CNPJ automático',
};

export const TRANSICOES: Record<string, string[]> = {
  ativo: ['apto_pendente', 'apto', 'suspenso', 'desativado', 'rejeitado'],
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

export function formatCNPJ(cnpj: string | null) {
  if (!cnpj || cnpj.length !== 14) return cnpj ?? '—';
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export function formatCPF(cpf: string | null) {
  if (!cpf || cpf.length !== 11) return cpf ?? '—';
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

export function formatDate(
  d: string | null,
  opts?: Intl.DateTimeFormatOptions
) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(
    'pt-BR',
    opts ?? { day: '2-digit', month: '2-digit', year: 'numeric' }
  );
}

export function fmtMoney(v: string | number) {
  return `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function n(v: string | number) {
  return parseInt(String(v), 10) || 0;
}

export function KPICard({
  label,
  value,
  sub,
  highlight,
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 space-y-1 ${
        alert
          ? 'border-orange-200 bg-orange-50'
          : highlight
            ? 'border-green-200 bg-green-50'
            : 'border-gray-200 bg-white'
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide ${alert ? 'text-orange-600' : 'text-gray-500'}`}
      >
        {label}
      </p>
      <p
        className={`text-2xl font-bold ${alert ? 'text-orange-700' : highlight ? 'text-green-700' : 'text-gray-900'}`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
