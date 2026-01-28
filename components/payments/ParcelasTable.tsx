'use client';

import { useState } from 'react';
import { Download, FileText } from 'lucide-react';

interface Parcela {
  numero: number;
  total_parcelas: number;
  valor: number;
  status: 'pago' | 'a_vencer';
  data_vencimento: string;
  data_pagamento?: string;
  recibo?: {
    id: number;
    numero_recibo: string;
    hash: string;
    arquivo_path: string;
    criado_em: string;
  } | null;
}

interface ParcelasTableProps {
  parcelas?: Parcela[];
  pagamentoId?: number;
  contratacaoAt: string;
  onGerarRecibo: (parcelaNumero: number) => Promise<void>;
  apiPrefix?: 'entidade' | 'rh';
}

export default function ParcelasTable({
  parcelas,
  contratacaoAt: _contratacaoAt,
  onGerarRecibo,
  apiPrefix = 'entidade',
}: ParcelasTableProps) {
  const [loadingParcela, setLoadingParcela] = useState<number | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleGerarRecibo = async (parcelaNumero: number) => {
    setLoadingParcela(parcelaNumero);
    try {
      await onGerarRecibo(parcelaNumero);
    } finally {
      setLoadingParcela(null);
    }
  };

  const handleBaixarRecibo = async (recibo: Parcela['recibo']) => {
    if (!recibo) return;

    try {
      // Baixar arquivo do recibo (prefixo dinâmico para 'entidade' ou 'rh')
      const prefix = apiPrefix || 'entidade';
      const response = await fetch(
        `/api/${prefix}/parcelas/download-recibo?id=${recibo.id}`
      );
      if (!response.ok) throw new Error('Erro ao baixar recibo');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recibo.numero_recibo}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar recibo:', error);
      alert('Erro ao baixar recibo');
    }
  };

  if (!parcelas || parcelas.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        Nenhuma parcela encontrada
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Parcela
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Status
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Data
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Recibo
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Hash
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {parcelas.map((parcela) => (
            <tr key={parcela.numero} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-900 font-medium">
                {parcela.numero}/{parcela.total_parcelas}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                    parcela.status === 'pago'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {parcela.status === 'pago' ? 'pago' : 'a vencer'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-700">
                {parcela.data_pagamento
                  ? formatDate(parcela.data_pagamento)
                  : formatDate(parcela.data_vencimento)}
              </td>
              <td className="px-4 py-3">
                {parcela.recibo ? (
                  <button
                    onClick={() => handleBaixarRecibo(parcela.recibo)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    <Download size={14} />
                    Baixar Comprovante
                  </button>
                ) : parcela.status === 'a_vencer' ? (
                  <button
                    disabled
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-100 rounded cursor-not-allowed"
                    title="Função disponível em breve"
                  >
                    <FileText size={14} />
                    Baixar Boleto
                  </button>
                ) : (
                  <button
                    onClick={() => handleGerarRecibo(parcela.numero)}
                    disabled={loadingParcela === parcela.numero}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingParcela === parcela.numero ? (
                      <>Gerando...</>
                    ) : (
                      <>
                        <FileText size={14} />
                        Gerar Comprovante
                      </>
                    )}
                  </button>
                )}
              </td>
              <td className="px-4 py-3">
                {parcela.recibo && parcela.recibo.hash ? (
                  <code className="text-xs text-gray-600 font-mono">
                    {parcela.recibo.hash.substring(0, 12)}...
                  </code>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
