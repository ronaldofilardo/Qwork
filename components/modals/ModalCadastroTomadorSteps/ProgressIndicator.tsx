'use client';

import { Check } from 'lucide-react';

const ETAPAS = [
  'tipo',
  'plano',
  'dados',
  'responsavel',
  'contrato',
  'confirmacao',
] as const;

interface ProgressIndicatorProps {
  etapaAtual: string;
}

export function ProgressIndicator({ etapaAtual }: ProgressIndicatorProps) {
  const currentIdx = ETAPAS.indexOf(etapaAtual as (typeof ETAPAS)[number]);

  return (
    <div className="flex items-center justify-center p-4 bg-gray-50">
      <div className="flex items-center gap-2">
        {ETAPAS.map((etapa, idx) => {
          const isActive = etapaAtual === etapa;
          const isCompleted = currentIdx > idx;

          return (
            <div key={etapa} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isCompleted ? <Check size={16} /> : idx + 1}
              </div>
              {idx < ETAPAS.length - 1 && (
                <div className="w-8 h-1 bg-gray-300">
                  <div
                    className={`h-full ${currentIdx > idx ? 'bg-orange-500' : ''}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
