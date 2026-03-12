'use client';

import type { FormaPagamento } from './types';
import { formatCurrency } from './useCheckoutAsaas';

interface PaymentSelectorProps {
  valor: number;
  formaPagamento: FormaPagamento;
  setFormaPagamento: (fp: FormaPagamento) => void;
  loading: boolean;
  error: string;
  onSubmit: () => void;
}

const PAYMENT_OPTIONS: {
  value: FormaPagamento;
  icon: string;
  label: string;
  desc: string;
}[] = [
  {
    value: 'PIX',
    icon: '💳',
    label: 'PIX',
    desc: 'Pagamento instantâneo via QR Code',
  },
  {
    value: 'BOLETO',
    icon: '📄',
    label: 'Boleto Bancário',
    desc: 'Vencimento em 3 dias úteis',
  },
  {
    value: 'CREDIT_CARD',
    icon: '💳',
    label: 'Cartão de Crédito',
    desc: 'Parcelamento disponível',
  },
];

export function PaymentSelector({
  valor,
  formaPagamento,
  setFormaPagamento,
  loading,
  error,
  onSubmit,
}: PaymentSelectorProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Finalizar Pagamento
      </h2>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-gray-700">
          <strong>Valor total:</strong> {formatCurrency(valor)}
        </p>
      </div>

      <h3 className="text-lg font-semibold mb-3 text-gray-700">
        Escolha a forma de pagamento:
      </h3>

      <div className="space-y-3 mb-6">
        {PAYMENT_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formaPagamento === opt.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="pagamento"
              value={opt.value}
              checked={formaPagamento === opt.value}
              onChange={(e) =>
                setFormaPagamento(e.target.value as FormaPagamento)
              }
              className="mr-3 w-5 h-5"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{opt.icon}</span>
                <span className="font-semibold text-gray-800">{opt.label}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Processando...' : 'Continuar para Pagamento'}
      </button>

      <p className="mt-4 text-xs text-center text-gray-500">
        Pagamento seguro processado por Asaas
      </p>
    </div>
  );
}
