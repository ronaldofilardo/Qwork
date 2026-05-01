'use client';

import React from 'react';
import { ArrowLeft, RefreshCw, CheckCircle2, CreditCard } from 'lucide-react';
import { formatDate } from '@/lib/lote/utils';
import type { LoteInfoEntidade } from '../types';

interface EntidadeHeaderProps {
  lote: LoteInfoEntidade;
  loading: boolean;
  pagamentoSincronizando: boolean;
  pagamentoSincronizado: boolean;
  sincronizarPagamento: () => Promise<void>;
  loadLoteData: (forceRefresh?: boolean) => Promise<void>;
  onBack: () => void;
}

const statusMap: Record<string, { label: string; className: string }> = {
  cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
  concluido: {
    label: 'Concluído',
    className: 'bg-emerald-100 text-emerald-700',
  },
  enviado: { label: 'Enviado', className: 'bg-blue-100 text-blue-700' },
  finalizado: { label: 'Finalizado', className: 'bg-blue-100 text-blue-700' },
  ativo: { label: 'Ativo', className: 'bg-blue-100 text-blue-700' },
};

export default function EntidadeHeader({
  lote,
  loading,
  pagamentoSincronizando,
  pagamentoSincronizado,
  sincronizarPagamento,
  loadLoteData,
  onBack,
}: EntidadeHeaderProps) {
  const statusInfo = statusMap[lote.status] ?? {
    label: lote.status,
    className: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar para Lotes
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">
              Detalhes do Lote
            </p>
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">#{lote.id}</h1>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
              >
                {statusInfo.label}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <span className="text-gray-400">Tipo</span>{' '}
                <span className="font-medium text-gray-800">
                  {lote.tipo === 'completo'
                    ? 'Completo'
                    : lote.tipo === 'operacional'
                      ? 'Operacional'
                      : 'Gestão'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Criado em</span>{' '}
                <span className="font-medium text-gray-800">
                  {formatDate(lote.criado_em)}
                </span>
              </div>
            </div>

            {lote.status_pagamento === 'aguardando_pagamento' && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                {pagamentoSincronizando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span>Verificando pagamento...</span>
                  </>
                ) : pagamentoSincronizado ? (
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Pagamento confirmado!
                  </span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    <span>Aguardando confirmação de pagamento</span>
                    <button
                      onClick={sincronizarPagamento}
                      className="ml-2 underline text-amber-700 hover:text-amber-900 text-xs font-medium"
                    >
                      Verificar agora
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() => loadLoteData(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title="Atualizar dados"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              Atualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EntidadeHeaderProps {
  lote: LoteInfoEntidade;
  loading: boolean;
  pagamentoSincronizando: boolean;
  pagamentoSincronizado: boolean;
  sincronizarPagamento: () => Promise<void>;
  loadLoteData: (forceRefresh?: boolean) => Promise<void>;
  onBack: () => void;
}
