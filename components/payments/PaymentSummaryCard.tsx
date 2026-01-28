'use client';

import { DollarSign } from 'lucide-react';

interface PaymentSummaryCardProps {
  total: number;
  pago: number;
  restante: number;
}

export default function PaymentSummaryCard({
  total,
  pago,
  restante,
}: PaymentSummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <DollarSign className="text-blue-600" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Resumo Financeiro
          </h3>
          <p className="text-sm text-gray-600">Status dos pagamentos</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Total
          </p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(total)}
          </p>
        </div>

        <div className="bg-white rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Pago
          </p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(pago)}
          </p>
        </div>

        <div className="bg-white rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Restante
          </p>
          <p className="text-lg font-bold text-orange-600">
            {formatCurrency(restante)}
          </p>
        </div>
      </div>
    </div>
  );
}
