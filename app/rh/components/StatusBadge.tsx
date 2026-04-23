'use client';

import type {
  LoteStatusTipo,
  StatusPagamentoTipo,
} from '@/app/api/rh/empresas-overview/route';

const LOTE_STATUS_CONFIG: Record<
  LoteStatusTipo,
  { label: string; className: string }
> = {
  rascunho: { label: 'Rascunho', className: 'bg-gray-100 text-gray-600' },
  ativo: { label: 'Em andamento', className: 'bg-blue-100 text-blue-700' },
  concluido: { label: 'Concluído', className: 'bg-green-100 text-green-700' },
  emissao_solicitada: {
    label: 'Emissão Solicitada',
    className: 'bg-amber-100 text-amber-700',
  },
  emissao_em_andamento: {
    label: 'Em Emissão',
    className: 'bg-yellow-100 text-yellow-700',
  },
  laudo_emitido: {
    label: 'Laudo Emitido',
    className: 'bg-purple-100 text-purple-700',
  },
  cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-600' },
  finalizado: {
    label: 'Finalizado',
    className: 'bg-emerald-100 text-emerald-700',
  },
};

const PAGAMENTO_CONFIG: Record<
  NonNullable<StatusPagamentoTipo>,
  { label: string; className: string }
> = {
  aguardando_cobranca: {
    label: 'Aguard. Cobrança',
    className: 'bg-gray-100 text-gray-600',
  },
  aguardando_pagamento: {
    label: 'Aguard. Pagamento',
    className: 'bg-yellow-100 text-yellow-700',
  },
  pago: { label: 'Pago', className: 'bg-green-100 text-green-700' },
  expirado: { label: 'Expirado', className: 'bg-red-100 text-red-600' },
};

interface StatusBadgeProps {
  status: LoteStatusTipo;
  pagamento?: StatusPagamentoTipo;
}

export default function StatusBadge({ status, pagamento }: StatusBadgeProps) {
  const cfg = LOTE_STATUS_CONFIG[status];

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cfg.className}`}
      >
        {cfg.label}
      </span>
      {pagamento &&
        pagamento !== 'pago' &&
        pagamento !== 'aguardando_cobranca' && (
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${PAGAMENTO_CONFIG[pagamento].className}`}
          >
            {PAGAMENTO_CONFIG[pagamento].label}
          </span>
        )}
    </div>
  );
}
