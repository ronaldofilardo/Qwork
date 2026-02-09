'use client';

import { X, CreditCard, Calendar, DollarSign, CheckCircle } from 'lucide-react';

interface ModalVerPagamentoProps {
  isOpen: boolean;
  onClose: () => void;
  pagamento: {
    id: number;
    valor: number;
    metodo: string;
    status: string;
    plataforma_id?: string;
    plataforma_nome?: string;
    criado_em: string;
    data_pagamento?: string;
  } | null;
  tomador: {
    nome: string;
    cnpj: string;
  };
}

export default function ModalVerPagamento({
  isOpen,
  onClose,
  pagamento,
  tomador,
}: ModalVerPagamentoProps) {
  if (!isOpen || !pagamento) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'processando':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      case 'reembolsado':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pago: '✓ Pago',
      pendente: '⏳ Pendente',
      processando: '🔄 Processando',
      cancelado: '❌ Cancelado',
      reembolsado: '↩️ Reembolsado',
    };
    return labels[status] || status;
  };

  const getMetodoLabel = (metodo: string) => {
    const labels: Record<string, string> = {
      avista: 'À Vista',
      prazo: 'A Prazo',
      pix: 'PIX',
      cartao: 'Cartão de Crédito',
      boleto: 'Boleto Bancário',
      transferencia: 'Transferência Bancária',
    };
    return labels[metodo] || metodo;
  };

  const formatCurrency = (value: any) => {
    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(Number(value))
    )
      return '-';
    return Number(value).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Detalhes do Pagamento
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              ID #{pagamento.id} - {tomador.nome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="px-6 py-4 border-b">
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${getStatusColor(pagamento.status)}`}
          >
            {pagamento.status === 'pago' && <CheckCircle className="w-5 h-5" />}
            {getStatusLabel(pagamento.status)}
          </span>
        </div>

        {/* Detalhes */}
        <div className="p-6 space-y-6">
          {/* Valor */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">Valor</div>
              <div className="text-2xl font-bold text-gray-900">
                R$ {formatCurrency(pagamento.valor)}
              </div>
            </div>
          </div>

          {/* Método de Pagamento */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">
                Método de Pagamento
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {getMetodoLabel(pagamento.metodo)}
              </div>
            </div>
          </div>

          {/* Plataforma */}
          {pagamento.plataforma_nome && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">
                Plataforma de Pagamento
              </div>
              <div className="text-base font-medium text-gray-900">
                {pagamento.plataforma_nome}
              </div>
              {pagamento.plataforma_id && (
                <div className="text-xs text-gray-500 mt-1">
                  ID: {pagamento.plataforma_id}
                </div>
              )}
            </div>
          )}

          {/* Datas */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <div className="text-sm text-gray-600">Data de Criação</div>
                <div className="text-base font-medium text-gray-900">
                  {new Date(pagamento.criado_em).toLocaleString('pt-BR')}
                </div>
              </div>
              {pagamento.data_pagamento && (
                <div>
                  <div className="text-sm text-gray-600">
                    Data de Confirmação
                  </div>
                  <div className="text-base font-medium text-green-700">
                    {new Date(pagamento.data_pagamento).toLocaleString('pt-BR')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informações do tomador */}
          <div className="border-t pt-4">
            <div className="text-sm text-gray-600 mb-2">tomador</div>
            <div className="text-base font-medium text-gray-900">
              {tomador.nome}
            </div>
            <div className="text-sm text-gray-500">CNPJ: {tomador.cnpj}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
