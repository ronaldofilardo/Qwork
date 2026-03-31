'use client';

import { RefreshCw } from 'lucide-react';
import { MESES } from './types';

interface CiclosHeaderProps {
  selectedAno: number;
  selectedMes: number;
  loading: boolean;
  mesLabel: string;
  anoOptions: number[];
  onChangeMes: (mes: number) => void;
  onChangeAno: (ano: number) => void;
  onRecarregar: () => void;
}

// eslint-disable-next-line max-lines-per-function
export function CiclosHeader({
  selectedAno,
  selectedMes,
  loading,
  mesLabel,
  anoOptions,
  onChangeMes,
  onChangeAno,
  onRecarregar,
}: CiclosHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Comissões por Ciclos
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Provisão de pagamentos mensais — {mesLabel}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedMes}
          onChange={(e) => onChangeMes(Number(e.target.value))}
          className="text-sm border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none cursor-pointer"
          aria-label="Mês de referência"
        >
          {MESES.map((m, i) => (
            <option key={i + 1} value={i + 1}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={selectedAno}
          onChange={(e) => onChangeAno(Number(e.target.value))}
          className="text-sm border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none cursor-pointer"
          aria-label="Ano de referência"
        >
          {anoOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button
          onClick={onRecarregar}
          disabled={loading}
          className="p-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          aria-label="Recarregar"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}
