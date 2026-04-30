'use client';

import { Info } from 'lucide-react';

interface NivelCargoWarningModalProps {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function NivelCargoWarningModal({
  count,
  onCancel,
  onConfirm,
}: NivelCargoWarningModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nivel-cargo-warning-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
            <Info size={18} className="text-amber-600" />
          </div>
          <div>
            <h2
              id="nivel-cargo-warning-title"
              className="text-base font-semibold text-gray-900"
            >
              {count} funcionário{count !== 1 ? 's' : ''} sem nível de cargo
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {count !== 1
                ? 'Esses funcionários estão'
                : 'Esse funcionário está'}{' '}
              sem nível de cargo na planilha. Você poderá classificá-
              {count !== 1 ? 'los' : 'lo'} manualmente no próximo passo.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Deseja continuar ou voltar para corrigir a planilha?
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Continuar assim mesmo
          </button>
        </div>
      </div>
    </div>
  );
}
