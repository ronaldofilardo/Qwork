'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import ModalContrato from '@/components/modals/ModalContrato';

export default function SucessoCadastroPage() {
  const searchParams = useSearchParams();
  const contratoIdParam = searchParams.get('contrato_id');

  const [contratoId, setContratoId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (contratoIdParam) {
      const id = Number(contratoIdParam);
      if (!isNaN(id) && id > 0) {
        setContratoId(id);
        setIsModalOpen(true);
      }
    }
  }, [contratoIdParam]);

  if (!contratoIdParam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow rounded-lg p-8 max-w-md text-center">
          <p className="text-red-600 font-semibold">Link inválido</p>
          <p className="text-gray-500 mt-2">
            O link de cadastro está incompleto. Solicite um novo link ao
            suporte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow rounded-lg p-8 max-w-md text-center">
        <FileText className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Cadastro Realizado!
        </h1>
        <p className="text-gray-600 mb-6">
          Aceite o contrato para finalizar e receber suas credenciais de acesso.
        </p>
        {!isModalOpen && contratoId && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ver e Aceitar Contrato
          </button>
        )}
      </div>

      {contratoId && (
        <ModalContrato
          isOpen={isModalOpen}
          contratoId={contratoId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
