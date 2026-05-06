'use client';

import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ErrorLiberacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mensagem: string;
  title?: string;
}

export function ErrorLiberacaoModal({
  isOpen,
  onClose,
  mensagem,
  title = 'Não foi possível criar o ciclo',
}: ErrorLiberacaoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1001] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="sticky top-0 border-b px-6 py-4 bg-white rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {mensagem}
          </p>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
