'use client';

import React from 'react';

interface FiltroColunaLocalProps {
  coluna: string;
  titulo: string;
  filtrosColuna: Record<string, string[]>;
  setFiltrosColuna: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  getValoresUnicos: (coluna: string) => string[];
  toggleFiltroColuna: (coluna: string, valor: string) => void;
}

export default function FiltroColunaLocal({
  coluna,
  titulo,
  filtrosColuna,
  setFiltrosColuna,
  getValoresUnicos,
  toggleFiltroColuna,
}: FiltroColunaLocalProps) {
  const valores = getValoresUnicos(coluna);
  const hasFiltros = filtrosColuna[coluna].length > 0;
  const isGrupoColumn = coluna.startsWith('g');

  return (
    <div className="relative inline-block">
      <button
        className={`text-xs px-1 py-0.5 rounded ${
          hasFiltros
            ? 'bg-blue-600 text-white font-bold'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          const dropdown = document.getElementById(`dropdown-${coluna}`);
          if (dropdown) {
            dropdown.classList.toggle('hidden');
          }
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
            <span>▼</span>
          )
        ) : (
          <>
            <span>🔽</span>
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
        className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-300 rounded shadow-lg z-10 hidden max-h-60 overflow-y-auto"
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
                ✕ Limpar
              </button>
            </div>
          )}
          {valores.length === 0 ? (
            <div className="text-sm text-gray-500 py-2">
              Nenhum valor disponível
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
