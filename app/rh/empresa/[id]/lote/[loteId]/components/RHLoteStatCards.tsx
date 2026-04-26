'use client';

import React from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';
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
    ? 'bg-green-500'
    : pct >= 50
      ? 'bg-amber-400'
      : 'bg-red-400';
  const textColor = atingiuMinimo
    ? 'text-green-700'
    : pct >= 50
      ? 'text-amber-700'
      : 'text-red-600';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <Users className="text-blue-500" size={32} />
          <span className="text-3xl font-bold text-gray-900">
            {estatisticas.total_avaliacoes}
          </span>
        </div>
        <p className="text-sm text-gray-600 font-medium">Total de Avaliações</p>
      </div>

      {/* Card de Conclusão com progress bar e marcador 70% */}
      <div
        className={`rounded-lg shadow-sm p-6 border-2 ${atingiuMinimo ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}
      >
        <div className="flex items-center justify-between mb-2">
          <CheckCircle
            className={atingiuMinimo ? 'text-green-600' : 'text-gray-400'}
            size={32}
          />
          <div className="text-right">
            <span className="text-3xl font-bold text-gray-900">
              {estatisticas.avaliacoes_concluidas}
            </span>
            <span className="text-sm text-gray-500">/{total}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 font-medium mb-3">
          Avaliações Concluídas
        </p>

        {/* Barra de progresso */}
        {total > 0 && (
          <div>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-visible mb-1">
              {/* Marcador 70% */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-gray-500 z-10"
                style={{ left: `${PERCENTUAL_MINIMO_EMISSAO}%` }}
                title={`Mínimo ${PERCENTUAL_MINIMO_EMISSAO}%`}
              />
              {/* Barra de progresso */}
              <div
                className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${textColor}`}>
                {pct}% concluído
              </span>
              {atingiuMinimo ? (
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  ✓ Liberado para laudo
                </span>
              ) : (
                <span className="text-xs text-gray-500">
                  mín. {PERCENTUAL_MINIMO_EMISSAO}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <svg
            className="text-gray-400 w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          <span className="text-3xl font-bold text-gray-900">
            {estatisticas.avaliacoes_inativadas}
          </span>
        </div>
        <p className="text-sm text-gray-600 font-medium">
          Avaliações Inativadas
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <Clock className="text-amber-500" size={32} />
          <span className="text-3xl font-bold text-gray-900">
            {estatisticas.avaliacoes_pendentes}
          </span>
        </div>
        <p className="text-sm text-gray-600 font-medium">
          Avaliações Pendentes
        </p>
      </div>
    </div>
  );
}
