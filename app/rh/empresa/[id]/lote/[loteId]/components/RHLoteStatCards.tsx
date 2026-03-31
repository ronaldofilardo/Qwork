'use client';

import React from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';
import type { Estatisticas } from '../types';

interface RHLoteStatCardsProps {
  estatisticas: Estatisticas;
}

export default function RHLoteStatCards({
  estatisticas,
}: RHLoteStatCardsProps) {
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

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <CheckCircle className="text-green-500" size={32} />
          <span className="text-3xl font-bold text-gray-900">
            {estatisticas.avaliacoes_concluidas}
          </span>
        </div>
        <p className="text-sm text-gray-600 font-medium">
          Avaliações Concluídas
        </p>
        {estatisticas.total_avaliacoes > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(
              (estatisticas.avaliacoes_concluidas /
                estatisticas.total_avaliacoes) *
                100
            )}
            % de conclusão
          </p>
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
          <Clock className="text-orange-500" size={32} />
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
