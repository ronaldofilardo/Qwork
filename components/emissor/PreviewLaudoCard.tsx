'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface PreviewLaudoCardProps {
  loteStatus: 'ativo' | 'concluido' | 'finalizado' | 'cancelado';
  children: React.ReactNode;
  showDownloadButton?: boolean;
  onDownload?: () => void;
}

/**
 * Card de pré-visualização do laudo
 * Mostra alerta se lote não estiver concluído
 * Controla exibição de botões baseado no status
 */
export function PreviewLaudoCard({
  loteStatus,
  children,
  showDownloadButton = false,
  onDownload,
}: PreviewLaudoCardProps) {
  // Lote não concluído - mostrar alerta
  if (loteStatus !== 'concluido' && loteStatus !== 'finalizado') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">
              Pré-visualização Parcial
            </h3>
            <p className="text-sm text-yellow-800">
              Este lote ainda não está concluído. A pré-visualização é parcial e
              não representa o laudo final. O laudo só poderá ser emitido após a
              conclusão de todas as avaliações.
            </p>
          </div>
        </div>

        <div className="mt-6 opacity-50 pointer-events-none">{children}</div>
      </div>
    );
  }

  // Lote concluído ou finalizado - exibir normalmente
  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Pré-visualização do Laudo
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {loteStatus === 'finalizado'
              ? 'Laudo finalizado e enviado'
              : loteStatus === 'concluido'
                ? 'Aguardando emissão do laudo'
                : 'Laudo pronto para emissão'}
          </p>
        </div>

        {showDownloadButton && loteStatus === 'finalizado' && onDownload && (
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 print-area">{children}</div>

      {/* Footer info */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <p className="text-xs text-gray-600">
          {loteStatus === 'finalizado' ? (
            <>
              <strong>Observação:</strong> Este laudo foi gerado automaticamente
              e está disponível para download.
            </>
          ) : loteStatus === 'concluido' ? (
            <>
              <strong>Observação:</strong> O lote foi concluído e o laudo está
              sendo processado. A emissão será feita automaticamente em
              instantes.
            </>
          ) : (
            <>
              <strong>Observação:</strong> A emissão do laudo será feita
              automaticamente após a validação final. Você pode forçar a emissão
              usando o modo emergência se necessário.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * Hook para controlar visualização de laudo
 */
export function useLaudoVisualization(loteStatus: string) {
  const canPreview = ['pendente', 'concluido', 'finalizado'].includes(
    loteStatus
  );
  const canDownload = loteStatus === 'finalizado';
  const canPrint = loteStatus === 'finalizado';
  const isPartial = loteStatus === 'pendente';

  return {
    canPreview,
    canDownload,
    canPrint,
    isPartial,
  };
}

export default PreviewLaudoCard;
