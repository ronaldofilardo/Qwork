'use client';

import type { LoteMonitor } from './types';

export function formatarData(data: string | null | undefined): string {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function BadgeLoteStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ativo: { label: 'Em andamento', cls: 'bg-blue-100 text-blue-700' },
    concluido: { label: 'Concluído', cls: 'bg-green-100 text-green-700' },
    cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
    liberado: { label: 'Liberado', cls: 'bg-purple-100 text-purple-700' },
    emissao_solicitada: {
      label: 'Emissão Solicitada',
      cls: 'bg-amber-100 text-amber-700',
    },
    emissao_em_andamento: {
      label: 'Emissão em Andamento',
      cls: 'bg-orange-100 text-orange-700',
    },
    emitido: { label: 'Emitido', cls: 'bg-teal-100 text-teal-700' },
  };
  const { label, cls } = map[status] ?? {
    label: status,
    cls: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

export function BadgeLaudoStatus({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
        Sem laudo
      </span>
    );
  }
  const map: Record<string, { label: string; cls: string }> = {
    rascunho: { label: 'Em Elaboração', cls: 'bg-yellow-100 text-yellow-700' },
    emitido: { label: 'Emitido', cls: 'bg-blue-100 text-blue-700' },
    enviado: { label: 'Enviado', cls: 'bg-green-100 text-green-700' },
    cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
  };
  const { label, cls } = map[status] ?? {
    label: status,
    cls: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

/** Calcula o status efetivo de um lote (lógica de negócio reutilizável) */
export function getStatusEfetivoLote(lote: LoteMonitor): string {
  if (
    lote.total_avaliacoes > 0 &&
    lote.avaliacoes_inativadas === lote.total_avaliacoes &&
    lote.avaliacoes_concluidas === 0
  ) {
    return 'cancelado';
  }
  if (lote.emissao_solicitada && lote.status === 'concluido') {
    return 'emissao_solicitada';
  }
  return lote.status;
}

/** Verifica se todas as avaliações do lote foram inativadas */
export function isLoteTotalmenteInativado(lote: LoteMonitor): boolean {
  return (
    lote.total_avaliacoes > 0 &&
    lote.avaliacoes_inativadas === lote.total_avaliacoes &&
    lote.avaliacoes_concluidas === 0
  );
}
