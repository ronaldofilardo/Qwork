'use client';

interface ParcelItemProps {
  parcela: {
    numero: number;
    valor: number;
    data_vencimento: string;
    pago?: boolean;
    data_pagamento?: string;
  };
}

export default function ParcelItem({ parcela }: ParcelItemProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="flex justify-between items-center text-xs">
      <div className="flex items-center gap-2">
        <span className="text-gray-600">Parcela {parcela.numero}</span>
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
            parcela.pago
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-700'
          }`}
          aria-label={parcela.pago ? 'Pago' : 'Em aberto'}
        >
          {parcela.pago ? 'Pago' : 'Em aberto'}
        </span>
      </div>
      <div
        className={
          parcela.pago ? 'text-green-600 font-medium' : 'text-gray-900'
        }
      >
        {formatCurrency(parcela.valor)} - {formatDate(parcela.data_vencimento)}
      </div>
    </div>
  );
}
