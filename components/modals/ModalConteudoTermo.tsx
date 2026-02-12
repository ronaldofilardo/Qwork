'use client';

import { useState } from 'react';
import ContratoPadrao from '@/components/terms/ContratoPadrao';
import PoliticaPrivacidade from '@/components/terms/PoliticaPrivacidade';

interface Props {
  tipo: 'termos_uso' | 'politica_privacidade';
  onAceitar: () => Promise<void>;
  onVoltar: () => void;
}

export default function ModalConteudoTermo({
  tipo,
  onAceitar,
  onVoltar,
}: Props) {
  const [processando, setProcessando] = useState(false);

  const handleAceitar = async () => {
    if (processando) return;

    setProcessando(true);
    try {
      await onAceitar();
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold">
            {tipo === 'termos_uso'
              ? 'Termos de Uso'
              : 'Política de Privacidade'}
          </h2>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tipo === 'termos_uso' ? <ContratoPadrao /> : <PoliticaPrivacidade />}
        </div>

        {/* Footer com botões */}
        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 justify-end flex-shrink-0">
          <button
            onClick={onVoltar}
            disabled={processando}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Voltar
          </button>
          <button
            onClick={handleAceitar}
            disabled={processando}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processando ? 'Processando...' : 'Li e Concordo'}
          </button>
        </div>
      </div>
    </div>
  );
}
