'use client';

import { Zap, X } from 'lucide-react';

interface AcoesEmMassaBarProps {
  totalSelecionadas: number;
  onLiberarCiclos: () => void;
  onDesmarcarTodas: () => void;
  loading?: boolean;
}

export default function AcoesEmMassaBar({
  totalSelecionadas,
  onLiberarCiclos,
  onDesmarcarTodas,
  loading = false,
}: AcoesEmMassaBarProps) {
  if (totalSelecionadas === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-gray-900 text-white rounded-xl shadow-2xl px-5 py-3 border border-gray-700">
      <span className="text-sm font-medium">
        {totalSelecionadas} empresa{totalSelecionadas !== 1 ? 's' : ''}{' '}
        selecionada{totalSelecionadas !== 1 ? 's' : ''}
      </span>

      <button
        type="button"
        onClick={onLiberarCiclos}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Zap size={15} />
        Liberar Ciclos
      </button>

      <button
        type="button"
        onClick={onDesmarcarTodas}
        title="Desmarcar todas"
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}
