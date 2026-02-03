'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalEmergenciaProps {
  loteId: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

/**
 * Modal para forçar emissão de laudo em modo emergência
 * Acesso restrito a emissores
 * Requer justificativa obrigatória (auditada)
 */
export function ModalEmergencia({
  loteId,
  onSuccess,
  onClose,
}: ModalEmergenciaProps) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setOpen(true);
    setMotivo('');
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setMotivo('');
    setError(null);
    if (onClose) {
      onClose();
    }
  };

  const handleEmergencia = async () => {
    if (!motivo.trim() || motivo.trim().length < 20) {
      setError('Justificativa deve ter no mínimo 20 caracteres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/emissor/laudos/${loteId}/emergencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo: motivo.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erro ao forçar emissão');
      }

      // Sucesso
      if (onSuccess) {
        onSuccess();
      }
      handleClose();

      // Mostrar feedback de sucesso (pode usar toast library aqui)
      alert(
        `Laudo emitido com sucesso em modo emergência!\nLaudo ID: ${data.laudo_id}`
      );
    } catch (err) {
      console.error('Erro ao forçar emissão:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm"
        title="Forçar emissão em modo emergência (requer justificativa)"
      >
        <AlertTriangle size={16} />
        Modo Emergência
      </button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg shadow-xl max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={24} />
              <h2 className="text-lg font-semibold text-gray-900">
                Modo Emergência
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Atenção:</strong> Use o modo emergência apenas se a
                emissão automática falhar. Esta ação será auditada e registrada
                permanentemente.
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Lote #</strong> {loteId}
              </p>
            </div>

            <div>
              <label
                htmlFor="motivo"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Justificativa da intervenção{' '}
                <span className="text-red-600">*</span>
              </label>
              <textarea
                id="motivo"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Descreva o motivo da intervenção manual (mínimo 20 caracteres)..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                disabled={loading}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {motivo.length}/500 caracteres
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleEmergencia}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!motivo.trim() || motivo.trim().length < 20 || loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Processando...
                </span>
              ) : (
                'Forçar Emissão'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
