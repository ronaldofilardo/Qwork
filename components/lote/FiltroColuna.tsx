'use client';

import React from 'react';
import type { FiltrosColuna } from '@/lib/lote/types';

interface FiltroColunaProps {
  coluna: keyof FiltrosColuna;
  titulo: string;
  filtrosColuna: FiltrosColuna;
  setFiltrosColuna: React.Dispatch<React.SetStateAction<FiltrosColuna>>;
  getValoresUnicos: (coluna: keyof FiltrosColuna) => string[];
  toggleFiltroColuna: (coluna: keyof FiltrosColuna, valor: string) => void;
  /** Largura do dropdown (default: w-48) */
  dropdownWidth?: string;
}

export default function FiltroColuna({
  coluna,
  titulo,
  filtrosColuna,
  setFiltrosColuna,
  getValoresUnicos,
  toggleFiltroColuna,
  dropdownWidth = 'w-48',
}: FiltroColunaProps) {
  const valores = getValoresUnicos(coluna);
  const hasFiltros = filtrosColuna[coluna].length > 0;
  const isGrupoColumn = coluna.startsWith('g') && coluna.length <= 3;

  return (
    <div className="relative inline-block">
      <button
        className={`flex items-center justify-center gap-1 rounded transition-colors ${
          isGrupoColumn
            ? `w-6 h-6 text-xs ${
                hasFiltros
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300'
              }`
            : `px-2 py-1 text-xs border ${
                hasFiltros
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`
        }`}
        onClick={(e) => {
          e.stopPropagation();
          const dropdown = document.getElementById(`dropdown-${coluna}`);
          if (dropdown) dropdown.classList.toggle('hidden');
        }}
        title={
          isGrupoColumn
            ? hasFiltros
              ? `${filtrosColuna[coluna].length} filtro(s) ativo(s)`
              : 'Filtrar'
            : ''
        }
      >
        {isGrupoColumn ? (
          hasFiltros ? (
            <span className="font-bold">{filtrosColuna[coluna].length}</span>
          ) : (
            <span>{'\u25BC'}</span>
          )
        ) : (
          <>
            <span>{'\uD83D\uDD3D'}</span>
            {titulo && <span>{titulo}</span>}
            {hasFiltros && (
              <span
                className={`${
                  titulo ? 'ml-1' : ''
                } bg-blue-600 text-white rounded-full px-1 text-xs`}
              >
                {filtrosColuna[coluna].length}
              </span>
            )}
          </>
        )}
      </button>

      <div
        id={`dropdown-${coluna}`}
        className={`absolute top-full left-0 mt-1 ${dropdownWidth} bg-white border border-gray-300 rounded shadow-lg z-10 hidden max-h-60 overflow-y-auto`}
      >
        <div className="p-2">
          {hasFiltros && (
            <div className="flex items-center justify-end mb-2 pb-2 border-b">
              <button
                onClick={() => {
                  setFiltrosColuna((prev) => ({ ...prev, [coluna]: [] }));
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {'\u2715'} Limpar
              </button>
            </div>
          )}
          {valores.length === 0 ? (
            <div className="text-sm text-gray-500 py-2">
              Nenhum valor dispon{'\u00ed'}vel
            </div>
          ) : (
            valores.map((valor) => {
              const isChecked = filtrosColuna[coluna].includes(valor);
              return (
                <label
                  key={valor}
                  className="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFiltroColuna(coluna, valor)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className="text-sm text-gray-700 truncate"
                    title={valor}
                  >
                    {valor || '(vazio)'}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
