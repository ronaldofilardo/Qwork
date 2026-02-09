'use client';

import { X } from 'lucide-react';

interface ModalVerContratoProps {
  isOpen: boolean;
  onClose: () => void;
  contrato: {
    numero_contrato: string;
    conteudo: string;
    aceito: boolean;
    data_aceite?: string;
    ip_aceite?: string;
  };
  tomador: {
    nome: string;
    cnpj: string;
  };
}

export default function ModalVerContrato({
  isOpen,
  onClose,
  contrato,
  tomador,
}: ModalVerContratoProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Contrato de Prestação de Serviços
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Nº {contrato.numero_contrato} - {tomador.nome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Informações de Aceite */}
        <div className="px-6 py-4 bg-green-50 border-b">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 font-semibold">
              ✓ Contrato Aceito
            </span>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            {contrato.data_aceite && (
              <div>
                <span className="font-medium">Data/Hora:</span>{' '}
                {new Date(contrato.data_aceite).toLocaleString('pt-BR')}
              </div>
            )}
            {contrato.ip_aceite && (
              <div>
                <span className="font-medium">IP de Aceite:</span>{' '}
                {contrato.ip_aceite}
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo do Contrato */}
        <div className="flex-1 overflow-y-auto p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
            {contrato.conteudo}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-xs text-gray-500">
            CNPJ tomador: {tomador.cnpj}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
