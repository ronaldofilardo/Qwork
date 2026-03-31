'use client';

import React, { useEffect, useState } from 'react';

interface ModalSetorRelatorioPDFProps {
  isOpen: boolean;
  setores: string[];
  onClose: () => void;
  onConfirm: (setor: string) => Promise<void>;
}

export default function ModalSetorRelatorioPDF({
  isOpen,
  setores,
  onClose,
  onConfirm,
}: ModalSetorRelatorioPDFProps) {
  const [setorSelecionado, setSetorSelecionado] = useState('');
  const [loading, setLoading] = useState(false);

  // Seleciona o primeiro setor por padrão ao abrir
  useEffect(() => {
    if (isOpen && setores.length > 0) {
      setSetorSelecionado(setores[0]);
    }
  }, [isOpen, setores]);

  // Fecha com Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!setorSelecionado) return;
    setLoading(true);
    try {
      await onConfirm(setorSelecionado);
      onClose();
    } catch {
      // Erro já exibido via toast pelo hook — modal permanece aberto para nova tentativa
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={!loading ? onClose : undefined}
      />

      {/* Card */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 z-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Gerar Relatório PDF por Setor
        </h2>
        <p className="text-sm text-gray-600 mb-5">
          Selecione o setor para gerar um relatório com as médias de todos os
          funcionários com avaliação concluída.
        </p>

        <div className="mb-6">
          <label
            htmlFor="setor-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Setor
          </label>
          {setores.length === 0 ? (
            <p className="text-sm text-red-600">
              Nenhum setor disponível neste ciclo.
            </p>
          ) : (
            <select
              id="setor-select"
              value={setorSelecionado}
              onChange={(e) => setSetorSelecionado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              {setores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || setores.length === 0 || !setorSelecionado}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Gerando...
              </>
            ) : (
              <>📊 Gerar PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
