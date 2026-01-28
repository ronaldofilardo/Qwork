'use client';

import React, { useState } from 'react';
import { RefreshCw, Download, Eye, Clock } from 'lucide-react';
import { StatusLoteBadge } from './StatusLoteBadge';

interface LoteAcoesProps {
  lote: {
    id: number;
    codigo: string;
    status: 'ativo' | 'concluido' | 'finalizado' | 'cancelado';
    processamento_em?: string | null;
  };
  onReprocessar?: (loteId: number) => void;
  onVisualizar?: (loteId: number) => void;
  onDownload?: (loteId: number) => void;
}

/**
 * Componente para exibir ações disponíveis para um lote
 * Baseado no status e estado de processamento
 */
export function LoteAcoes({
  lote,
  onReprocessar,
  onVisualizar,
  onDownload,
}: LoteAcoesProps) {
  const [loading, setLoading] = useState(false);

  const handleReprocessar = () => {
    if (!onReprocessar) return;

    setLoading(true);
    try {
      onReprocessar(lote.id);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar baseado no status
  switch (lote.status) {
    case 'ativo':
      return (
        <div className="flex items-center gap-2">
          <StatusLoteBadge status="ativo" />
          <span className="text-sm text-gray-600">Aguardando conclusão</span>
        </div>
      );

    case 'concluido':
      // Se está em processamento
      if (lote.processamento_em) {
        const processamentoEm = new Date(lote.processamento_em);
        const agora = new Date();
        const segundos = Math.floor(
          (agora.getTime() - processamentoEm.getTime()) / 1000
        );

        return (
          <div className="flex items-center gap-2">
            <StatusLoteBadge
              status="concluido"
              processamentoEm={lote.processamento_em}
            />
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Clock size={14} />
              {segundos}s
            </span>
          </div>
        );
      }

      // Concluído mas não em processamento - pode reprocessar
      return (
        <div className="flex items-center gap-2">
          <StatusLoteBadge status="concluido" />
          <button
            onClick={handleReprocessar}
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Adicionar à fila de processamento"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Aguarde...
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                Reprocessar
              </>
            )}
          </button>
          {onVisualizar && (
            <button
              onClick={() => onVisualizar(lote.id)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
              title="Visualizar laudo"
            >
              <Eye size={14} />
              Visualizar
            </button>
          )}
        </div>
      );

    case 'finalizado':
      return (
        <div className="flex items-center gap-2">
          <StatusLoteBadge status="finalizado" />
          {onDownload && (
            <button
              onClick={() => onDownload(lote.id)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
              title="Download do PDF"
            >
              <Download size={14} />
              PDF
            </button>
          )}
          {onVisualizar && (
            <button
              onClick={() => onVisualizar(lote.id)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
              title="Visualizar laudo"
            >
              <Eye size={14} />
              Visualizar
            </button>
          )}
        </div>
      );

    case 'cancelado':
      return (
        <div className="flex items-center gap-2">
          <StatusLoteBadge status="cancelado" />
          <span className="text-sm text-gray-500">Cancelado</span>
        </div>
      );

    default:
      return <span className="text-sm text-gray-500">Status desconhecido</span>;
  }
}

/**
 * Hook para gerenciar ações de lotes
 */
export function useLoteAcoes() {
  const [loading, setLoading] = useState<number | null>(null);

  const reprocessar = async (loteId: number) => {
    setLoading(loteId);
    try {
      const response = await fetch(
        `/api/emissor/laudos/${loteId}/reprocessar`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao reprocessar');
      }

      alert(data.message || 'Lote adicionado à fila de processamento');

      // Recarregar página para atualizar status
      window.location.reload();
    } catch (error) {
      console.error('Erro ao reprocessar:', error);
      alert(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(null);
    }
  };

  const downloadPdf = async (loteId: number) => {
    try {
      const response = await fetch(`/api/emissor/laudos/${loteId}/download`);

      if (!response.ok) {
        throw new Error('Erro ao baixar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo-lote-${loteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      alert(
        `Erro ao baixar PDF: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return {
    loading,
    reprocessar,
    downloadPdf,
  };
}
