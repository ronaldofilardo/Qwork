'use client';

import React from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';
import type { EstatisticasEntidade } from '../types';

interface EntidadeStatCardsProps {
  estatisticas: EstatisticasEntidade;
}

export default function EntidadeStatCards({
  estatisticas,
}: EntidadeStatCardsProps) {
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

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <CheckCircle className="text-green-500" size={32} />
          <span className="text-3xl font-bold text-gray-900">
            {estatisticas.funcionarios_concluidos}
          </span>
        </div>
        <p className="text-sm text-gray-600 font-medium">
          Avalia&#231;&#245;es Conclu&#237;das
        </p>
        {estatisticas.total_funcionarios > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(
              (estatisticas.funcionarios_concluidos /
                estatisticas.total_funcionarios) *
                100
            )}
            % de conclus&#227;o
          </p>
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
