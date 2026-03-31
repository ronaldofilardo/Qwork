'use client';

import type { PaymentData } from './types';
import { formatDate } from './useCheckoutAsaas';

function SpinnerSvg({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? 'h-4 w-4'}`}
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
  );
}

interface BoletoScreenProps {
  paymentData: PaymentData;
  pollingPayment: boolean;
  loading: boolean;
  onVerificar: () => void;
  onVoltar: () => void;
}

export function BoletoScreen({
  paymentData,
  pollingPayment,
  loading,
  onVerificar,
  onVoltar,
}: BoletoScreenProps) {
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        📄 Boleto Gerado
      </h2>

      <p className="text-gray-600 mb-6">Seu boleto foi gerado com sucesso!</p>

      <a
        href={paymentData.bankSlipUrl || paymentData.paymentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 mb-4"
      >
        📥 Visualizar Boleto
      </a>

      {paymentData.dueDate && (
        <p className="text-sm text-gray-600 mb-4">
          <strong>Vencimento:</strong> {formatDate(paymentData.dueDate)}
        </p>
      )}

      {pollingPayment && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-blue-700">
            <SpinnerSvg />
            <span className="text-sm font-medium">
              Monitorando pagamento automaticamente...
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Esta página atualizará quando o pagamento for confirmado.
          </p>
        </div>
      )}

      <div className="bg-yellow-50 p-4 rounded-lg mb-4 text-left">
        <p className="text-sm text-gray-700">
          <strong>ℹ️ Instruções:</strong>
        </p>
        <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
          <li>Pague o boleto em qualquer banco ou lotérica</li>
          <li>O pagamento pode levar até 2 dias úteis para confirmar</li>
          <li>Você receberá um email quando o pagamento for confirmado</li>
        </ul>
      </div>

      <button
        onClick={onVerificar}
        disabled={loading}
        className="w-full mb-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Verificando...' : '🔍 Já paguei — Verificar Confirmação'}
      </button>

      <button
        onClick={onVoltar}
        className="text-blue-600 hover:underline text-sm"
      >
        ← Voltar e escolher outro método
      </button>
    </div>
  );
}
