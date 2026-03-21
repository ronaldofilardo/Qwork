'use client';

import { Check } from 'lucide-react';

interface SuccessViewProps {
  onClose: () => void;
}

export function SuccessView({ onClose }: SuccessViewProps) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
        <Check size={32} className="text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        Cadastro Enviado com Sucesso!
      </h3>
      <p className="text-gray-600 mb-6">
        Seu cadastro está em análise. Você receberá um email com o resultado em
        breve.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
      >
        Fechar
      </button>
    </div>
  );
}
