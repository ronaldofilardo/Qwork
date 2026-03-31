'use client';

import { StatusCiclo, STATUS_FILTER_OPTIONS } from './types';

interface CiclosFiltrosProps {
  statusFiltro: StatusCiclo | '';
  onChangeFiltro: (filtro: StatusCiclo | '') => void;
}

export function CiclosFiltros({ statusFiltro, onChangeFiltro }: CiclosFiltrosProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChangeFiltro(value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${
            statusFiltro === value
              ? 'bg-gray-900 text-white'
              : 'bg-white border text-gray-600 hover:bg-gray-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
