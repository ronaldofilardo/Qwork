'use client';

import React from 'react';

interface LiberandoCicloOverlayProps {
  visible: boolean;
  empresaNome?: string;
}

/**
 * Overlay de tela cheia exibido enquanto a liberação de um novo ciclo está em andamento.
 * Bloqueia toda interação com a página até a operação concluir.
 */
export function LiberandoCicloOverlay({
  visible,
  empresaNome,
}: LiberandoCicloOverlayProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Liberando ciclo, aguarde"
      data-testid="liberando-ciclo-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl shadow-2xl px-10 py-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
        {/* Spinner */}
        <div className="relative flex items-center justify-center">
          <span
            className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"
            aria-hidden="true"
          />
        </div>

        {/* Texto */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-900">
            Liberando ciclo...
          </p>
          {empresaNome && (
            <p className="text-sm text-gray-500 font-medium">{empresaNome}</p>
          )}
          <p className="text-sm text-gray-400">
            Calculando elegibilidade e criando avaliações.
            <br />
            Isso pode levar alguns segundos.
          </p>
        </div>

        {/* Barra de progresso indeterminada */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-[progressIndeterminate_1.4s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
