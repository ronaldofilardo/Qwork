'use client';

import { AlertCircle } from 'lucide-react';

interface LoteErrorMessageProps {
  error: string;
  isEntidade: boolean;
  errorHint?: string | null;
  entidadeResultDetalhes?: string | null;
}

export function LoteErrorMessage({
  error,
  isEntidade,
  errorHint,
  entidadeResultDetalhes,
}: LoteErrorMessageProps) {
  return (
    <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">
            Não foi possível criar o lote
          </h3>
          <p className="text-sm text-red-700 mt-1 whitespace-pre-line">
            {error}
          </p>
          {!isEntidade && errorHint && (
            <p className="text-sm text-red-600 mt-2">{errorHint}</p>
          )}
          {isEntidade && entidadeResultDetalhes && (
            <div className="mt-3 p-3 bg-red-100 rounded text-xs text-red-800 whitespace-pre-line">
              {entidadeResultDetalhes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
