'use client';

import { AlertTriangle } from 'lucide-react';

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
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div>
            <h2
              id="nivel-cargo-warning-title"
              className="text-base font-semibold text-gray-900"
            >
              {count} funcionário{count !== 1 ? 's' : ''} sem nível de cargo
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              A coluna <strong>nivel_cargo</strong> está mapeada, mas{' '}
              {count !== 1
                ? `${count} funcionários estão`
                : 'um funcionário está'}{' '}
              com o campo em branco na planilha.
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Você poderá definir o nível de cada um no próximo passo. Os dois
              valores aceitos são:{' '}
              <span className="font-mono font-semibold text-gray-900">
                gestao
              </span>{' '}
              ou{' '}
              <span className="font-mono font-semibold text-gray-900">
                operacional
              </span>
              .
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Prefere corrigir na planilha antes de importar? Clique em{' '}
              <strong>Cancelar importação</strong> e reenvie o arquivo
              preenchido.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar importação
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Continuar e classificar
          </button>
        </div>
      </div>
    </div>
  );
}
