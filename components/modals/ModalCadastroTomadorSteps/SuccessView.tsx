'use client';

import { Check } from 'lucide-react';

interface SuccessViewProps {
  isPlanoPersonalizado: boolean;
  onClose: () => void;
}

export function SuccessView({
  isPlanoPersonalizado,
  onClose,
}: SuccessViewProps) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
        <Check size={32} className="text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        Cadastro Enviado com Sucesso!
      </h3>
      {isPlanoPersonalizado ? (
        <div className="space-y-4">
          <p className="text-gray-700 font-medium">
            Seus dados foram enviados para análise pela equipe QWork.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-900 mb-2">
              <strong>📧 Próximos passos:</strong>
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Nossa equipe analisará sua solicitação</li>
              <li>
                Definiremos o valor personalizado conforme seu número de
                funcionários
              </li>
              <li>Você receberá um link por email para aceitar a proposta</li>
              <li>Após aceitar, poderá prosseguir com contrato e pagamento</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            ⏱️ Tempo estimado de resposta: até 48 horas úteis
          </p>
        </div>
      ) : (
        <p className="text-gray-600 mb-6">
          Seu cadastro está em análise. Você receberá um email com o resultado
          em breve.
        </p>
      )}
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
