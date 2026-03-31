'use client';

import type { PaymentData } from './types';
import { formatDate } from './useCheckoutAsaas';

interface PixScreenProps {
  paymentData: PaymentData;
  pollingPayment: boolean;
  onCopiarCodigo: () => void;
  onVoltar: () => void;
}

export function PixScreen({
  paymentData,
  pollingPayment,
  onCopiarCodigo,
  onVoltar,
}: PixScreenProps) {
  if (!paymentData.pixQrCode) return null;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        📱 Pague com PIX
      </h2>

      {pollingPayment && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg">
          <p className="font-semibold">Aguardando pagamento...</p>
          <p className="text-sm">
            A página atualizará automaticamente após confirmação
          </p>
        </div>
      )}

      <div className="mb-4">
        {paymentData.pixQrCode.encodedImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${paymentData.pixQrCode.encodedImage}`}
            alt="QR Code PIX"
            className="mx-auto max-w-xs border-4 border-gray-200 rounded-lg"
          />
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Escaneie o QR Code com seu aplicativo bancário
      </p>

      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <p className="text-xs text-gray-500 mb-2">Ou copie e cole o código:</p>
        <code className="text-xs break-all block bg-white p-3 rounded border">
          {paymentData.pixQrCode.payload}
        </code>
      </div>

      <button
        onClick={onCopiarCodigo}
        className="w-full mb-3 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
      >
        📋 Copiar Código PIX
      </button>

      {paymentData.dueDate && (
        <p className="text-sm text-gray-500 mb-4">
          Válido até: {formatDate(paymentData.dueDate)}
        </p>
      )}

      <button
        onClick={onVoltar}
        className="text-blue-600 hover:underline text-sm"
      >
        ← Voltar e escolher outro método
      </button>
    </div>
  );
}
