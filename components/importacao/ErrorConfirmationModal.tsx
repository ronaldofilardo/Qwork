'use client';

import { AlertTriangle } from 'lucide-react';

interface ErrorConfirmationModalProps {
  totalErros: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ErrorConfirmationModal({
  totalErros,
  onCancel,
  onConfirm,
}: ErrorConfirmationModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div>
            <h2
              id="error-modal-title"
              className="text-base font-semibold text-gray-900"
            >
              {totalErros} erro{totalErros !== 1 ? 's' : ''} encontrado
              {totalErros !== 1 ? 's' : ''} na planilha
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Os erros encontrados impedirão a importação das linhas com
              problemas. As demais linhas serão processadas normalmente.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Deseja continuar ou encerrar e corrigir a planilha?
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Encerrar importação
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Continuar assim mesmo
          </button>
        </div>
      </div>
    </div>
  );
}
