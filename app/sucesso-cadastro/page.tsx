'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import ModalContrato from '@/components/modals/ModalContrato';

export default function SucessoCadastroPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contratoIdParam = searchParams.get('contrato_id');

  const [contratoId, setContratoId] = useState<number | null>(null);
  const [mostrarModalContrato, setMostrarModalContrato] = useState(false);

  useEffect(() => {
    if (contratoIdParam) {
      const id = Number(contratoIdParam);
      if (!isNaN(id)) {
        setContratoId(id);
        setMostrarModalContrato(true);
      }
    }
  }, [contratoIdParam]);

  const handleAceiteSuccess = (boasVindasUrl: string) => {
    router.push(boasVindasUrl);
  };

  if (!contratoIdParam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow rounded-lg p-8 max-w-md text-center">
          <p className="text-red-600 font-semibold">Link inv&aacute;lido</p>
          <p className="text-gray-500 mt-2">
            O link de cadastro est&aacute; incompleto. Solicite um novo link ao suporte.
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
      </div>

      {mostrarModalContrato && contratoId && (
        <ModalContrato
          contratoId={contratoId}
          onClose={() => setMostrarModalContrato(false)}
          onAceiteSuccess={handleAceiteSuccess}
        />
      )}
    </div>
  );
}
