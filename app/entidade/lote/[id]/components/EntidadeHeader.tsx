'use client';

import React from 'react';
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

export default function EntidadeHeader({
  lote,
  loading,
  pagamentoSincronizando,
  pagamentoSincronizado,
  sincronizarPagamento,
  loadLoteData,
  onBack,
}: EntidadeHeaderProps) {
  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm"
      >
        ← Voltar para Lotes
      </button>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Lote ID
              </span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">{lote.id}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  lote.status === 'cancelado'
                    ? 'bg-red-100 text-red-800'
                    : lote.status === 'concluido'
                      ? 'bg-green-100 text-green-800'
                      : lote.status === 'enviado' ||
                          lote.status === 'finalizado'
                        ? 'bg-blue-100 text-blue-800'
                        : lote.status === 'ativo'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {lote.status === 'cancelado'
                  ? 'Cancelado'
                  : lote.status === 'concluido'
                    ? 'Concluído'
                    : lote.status === 'finalizado'
                      ? 'Finalizado'
                      : lote.status === 'ativo'
                        ? 'Ativo'
                        : lote.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
              <div>
                <span className="text-gray-500">Tipo:</span>{' '}
                <span className="font-medium">
                  {lote.tipo === 'completo'
                    ? 'Completo'
                    : lote.tipo === 'operacional'
                      ? 'Operacional'
                      : 'Gestão'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Criado em:</span>{' '}
                <span className="font-medium">
                  {formatDate(lote.criado_em)}
                </span>
              </div>
            </div>

            {/* Banner de pagamento pendente */}
            {lote.status_pagamento === 'aguardando_pagamento' && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                {pagamentoSincronizando ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin flex-shrink-0"
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
                    <span>Verificando pagamento...</span>
                  </>
                ) : pagamentoSincronizado ? (
                  <span className="text-green-600 font-semibold">
                    ✅ Pagamento confirmado!
                  </span>
                ) : (
                  <>
                    <span>💳 Aguardando confirmação de pagamento</span>
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
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title="Atualizar dados"
            >
              <svg
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Atualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
