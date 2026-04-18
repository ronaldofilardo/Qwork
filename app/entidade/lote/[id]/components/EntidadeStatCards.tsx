'use client';

import React from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';
import type { EstatisticasEntidade } from '../types';
import { PERCENTUAL_MINIMO_EMISSAO } from '@/lib/config/business-rules';

interface EntidadeStatCardsProps {
  estatisticas: EstatisticasEntidade;
}

export default function EntidadeStatCards({
  estatisticas,
}: EntidadeStatCardsProps) {
  const total = estatisticas.total_funcionarios;
  const concluidos = estatisticas.funcionarios_concluidos;
  const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0;
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <Users className="text-blue-500" size={32} />
          <span className="text-3xl font-bold text-gray-900">
            {estatisticas.total_funcionarios}
          </span>
        </div>
        <p className="text-sm text-gray-600 font-medium">
          Total de Funcion&#225;rios
        </p>
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
              {estatisticas.funcionarios_concluidos}
            </span>
            <span className="text-sm text-gray-500">/{total}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 font-medium mb-3">
          Avalia&#231;&#245;es Conclu&#237;das
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
                {pct}% conclu&#237;do
              </span>
              {atingiuMinimo ? (
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  ✓ Liberado para laudo
                </span>
              ) : (
                <span className="text-xs text-gray-500">
                  m&#237;n. {PERCENTUAL_MINIMO_EMISSAO}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <Clock className="text-orange-500" size={32} />
          <span className="text-3xl font-bold text-gray-900">
            {estatisticas.funcionarios_pendentes}
          </span>
        </div>
        <p className="text-sm text-gray-600 font-medium">
          Avalia&#231;&#245;es Pendentes
        </p>
      </div>
    </div>
  );
}
