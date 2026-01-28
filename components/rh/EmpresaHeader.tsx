import React from 'react';

interface EmpresaHeaderProps {
  empresaNome: string;
  onVoltar: () => void;
  onSair: () => void;
}

/**
 * Componente de cabeçalho da página de empresa
 */
export function EmpresaHeader({
  empresaNome,
  onVoltar,
  onSair,
}: EmpresaHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onVoltar}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg border border-gray-200 transition-colors text-sm"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard {empresaNome || 'Empresa'}
          </h1>
        </div>
        <p className="text-sm text-gray-600">
          Análise das avaliações psicossociais
        </p>
      </div>
      <button
        onClick={onSair}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
      >
        Sair
      </button>
    </div>
  );
}
