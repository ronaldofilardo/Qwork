'use client';

import { useState, useEffect } from 'react';
import { CreditCard, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';

interface PagamentoPendente {
  lote_id: number;
  status_pagamento: string;
  token: string;
  disponibilizado_em: string;
  valor_por_funcionario: number;
  num_avaliacoes: number;
  valor_total: number;
  metodo: string | null;
  entidade_nome?: string;
  empresa_nome?: string;
}

interface PagamentosEmAbertoProps {
  apiUrl: string;
}

// eslint-disable-next-line max-lines-per-function
export default function PagamentosEmAberto({
  apiUrl,
}: PagamentosEmAbertoProps) {
  const [pagamentos, setPagamentos] = useState<PagamentoPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPagamentos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Erro ao carregar pagamentos');
      const data = await res.json();
      setPagamentos(data.pagamentos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="text-orange-500" size={20} />
          <h3 className="font-semibold text-gray-900">Pagamentos em Aberto</h3>
        </div>
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="text-orange-500" size={20} />
          <h3 className="font-semibold text-gray-900">Pagamentos em Aberto</h3>
        </div>
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            onClick={fetchPagamentos}
            className="ml-2 text-blue-600 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (pagamentos.length === 0) {
    return null;
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const _formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFormatted = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateFormatted} às ${timeFormatted}`;
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="text-orange-500" size={20} />
          <h3 className="font-semibold text-gray-900">Pagamentos em Aberto</h3>
          <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 font-medium">
            {pagamentos.length}
          </span>
        </div>
        <button
          onClick={fetchPagamentos}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Atualizar"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {/* eslint-disable-next-line max-lines-per-function */}
        {pagamentos.map((pag) => (
          <div
            key={pag.lote_id}
            className="border border-orange-200 bg-orange-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Lote #{pag.lote_id}
                </span>
                {(pag.entidade_nome || pag.empresa_nome) && (
                  <span className="text-sm text-gray-500 ml-2">
                    — {pag.entidade_nome || pag.empresa_nome}
                  </span>
                )}
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-orange-200 text-orange-800 font-medium">
                💳 Aguardando pagamento
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <span className="text-gray-500">Avaliações</span>
                <p className="font-medium">{pag.num_avaliacoes}</p>
              </div>
              <div>
                <span className="text-gray-500">Valor unitário</span>
                <p className="font-medium">
                  {formatCurrency(pag.valor_por_funcionario)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Valor total</span>
                <p className="font-semibold text-orange-700">
                  {formatCurrency(pag.valor_total)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Disponibilizado em {formatDateTime(pag.disponibilizado_em)}
              </span>
              {pag.token && (
                <a
                  href={`${baseUrl}/pagamento/emissao/${pag.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <ExternalLink size={14} />
                  Pagar
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
