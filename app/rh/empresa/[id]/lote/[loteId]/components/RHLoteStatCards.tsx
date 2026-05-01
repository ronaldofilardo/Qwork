'use client';

import React from 'react';
import { Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { Estatisticas } from '../types';
import { PERCENTUAL_MINIMO_EMISSAO } from '@/lib/config/business-rules';

interface RHLoteStatCardsProps {
  estatisticas: Estatisticas;
}

export default function RHLoteStatCards({
  estatisticas,
}: RHLoteStatCardsProps) {
  const total = estatisticas.total_avaliacoes;
  const concluidas = estatisticas.avaliacoes_concluidas;
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  const atingiuMinimo = pct >= PERCENTUAL_MINIMO_EMISSAO;
  const progressColor = atingiuMinimo
    ? 'bg-emerald-500'
    : pct >= 50
      ? 'bg-amber-400'
      : 'bg-red-400';
  const textColor = atingiuMinimo
    ? 'text-emerald-700'
    : pct >= 50
      ? 'text-amber-700'
      : 'text-red-600';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users className="text-blue-500" size={18} />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {estatisticas.total_avaliacoes}
          </span>
        </div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total de Avaliacoes</p>
      </div>

      {/* Card de Conclusao com progress bar e marcador 70% */}
      <div className={`rounded-xl shadow-sm p-5 border ${atingiuMinimo ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${atingiuMinimo ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            <CheckCircle
              className={atingiuMinimo ? 'text-emerald-600' : 'text-gray-400'}
              size={18}
            />
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">
              {estatisticas.avaliacoes_concluidas}
            </span>
            <span className="text-sm text-gray-400">/{total}</span>
          </div>
        </div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Avaliacoes Concluidas
        </p>

        {/* Barra de progresso */}
        {total > 0 && (
          <div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-visible mb-1.5">
              {/* Marcador 70% */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                style={{ left: `${PERCENTUAL_MINIMO_EMISSAO}%` }}
                title={`Minimo ${PERCENTUAL_MINIMO_EMISSAO}%`}
              />
              <div
                className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${textColor}`}>
                {pct}% concluido
              </span>
              {atingiuMinimo ? (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                  Pronto para laudo
                </span>
              ) : (
                <span className="text-[10px] text-gray-400">
                  min. {PERCENTUAL_MINIMO_EMISSAO}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
            <XCircle className="text-red-400" size={18} />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {estatisticas.avaliacoes_inativadas}
          </span>
        </div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Avaliacoes Removidas
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
            <Clock className="text-amber-500" size={18} />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {estatisticas.avaliacoes_pendentes}
          </span>
        </div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Avaliacoes Pendentes
        </p>
      </div>
    </div>
  );
}
