'use client';

import type { PaymentData } from './types';

interface CreditCardScreenProps {
  paymentData: PaymentData;
  pollingPayment: boolean;
  setPollingPayment: (v: boolean) => void;
  onVoltar: () => void;
}

export function CreditCardScreen({
  paymentData,
  pollingPayment,
  setPollingPayment,
  onVoltar,
}: CreditCardScreenProps) {
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        💳 Pagamento com Cartão
      </h2>

      {pollingPayment ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="font-semibold text-blue-700">
              Aguardando confirmação...
            </span>
          </div>
          <p className="text-sm text-blue-600">
            Complete o pagamento na aba do Asaas. Esta página atualizará
            automaticamente após a confirmação.
          </p>
        </div>
      ) : (
        <p className="mb-4 text-gray-600">
          Clique no botão abaixo para abrir o checkout seguro do Asaas.
        </p>
      )}

      {paymentData.paymentUrl && (
        <a
          href={paymentData.paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => !pollingPayment && setPollingPayment(true)}
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 mb-4"
        >
          🔒 Abrir Checkout Asaas
        </a>
      )}

      <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left text-sm text-gray-600">
        <p className="font-semibold mb-1">ℹ️ Como funciona:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Clique em &quot;Abrir Checkout Asaas&quot; (nova aba)</li>
          <li>Preencha seus dados de cartão no site seguro da Asaas</li>
          <li>Esta página detectará a confirmação automaticamente</li>
        </ol>
      </div>

      <button
        onClick={onVoltar}
        className="text-blue-600 hover:underline text-sm"
      >
        ← Voltar e escolher outro método
      </button>
    </div>
  );
}
