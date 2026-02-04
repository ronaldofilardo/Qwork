'use client';

import React, { useState, useEffect } from 'react';

interface ModalInativarAvaliacaoProps {
  avaliacaoId: number;
  funcionarioNome: string;
  funcionarioCpf: string;
  _loteId: string;
  contexto: 'rh' | 'entidade';
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalInativarAvaliacao({
  avaliacaoId,
  funcionarioNome,
  funcionarioCpf,
  _loteId,
  contexto,
  onClose,
  onSuccess,
}: ModalInativarAvaliacaoProps) {
  const [mounted, setMounted] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [submetendo, setSubmetendo] = useState(false);
  const motivoRef = React.useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // Focar o campo de motivo quando o modal carregar
    setTimeout(() => motivoRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submetendo) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      setMounted(false);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, submetendo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const minimoCaracteres = 10;
    if (motivo.trim().length < minimoCaracteres) {
      alert(`O motivo deve ter pelo menos ${minimoCaracteres} caracteres.`);
      return;
    }

    if (
      !confirm(
        `Tem certeza que deseja inativar a avaliação de ${funcionarioNome}?\n\n` +
          `Motivo: ${motivo.trim()}\n\n` +
          `Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    setSubmetendo(true);

    try {
      // Construir endpoint baseado no contexto
      const endpoint =
        contexto === 'rh'
          ? `/api/rh/lotes/${_loteId}/avaliacoes/${avaliacaoId}/inativar`
          : `/api/entidade/lote/${_loteId}/avaliacoes/${avaliacaoId}/inativar`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo: motivo.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert('Erro: ' + (data.error || 'Erro ao inativar avaliação'));
        setSubmetendo(false);
        return;
      }

      alert(data.mensagem || '✅ Avaliação inativada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao inativar:', error);
      alert('Erro ao processar inativação');
      setSubmetendo(false);
    }
  };

  if (!mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !submetendo) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ⚠️ Inativar Avaliação
          </h2>

          {/* Informações do Funcionário */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600">Funcionário</div>
            <div className="font-semibold text-gray-800">{funcionarioNome}</div>
            <div className="text-xs text-gray-500 font-mono mt-1">
              {funcionarioCpf}
            </div>
          </div>

          {/* Aviso Geral */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
            <div className="flex items-start">
              <div className="text-2xl mr-3">⚠️</div>
              <div className="flex-1">
                <p className="text-sm text-yellow-700">
                  A inativação só será permitida se o laudo ainda não tiver sido
                  emitido e a emissão não tiver sido solicitada.
                </p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form
            onSubmit={handleSubmit}
            className="mt-6 pt-4 border-t border-gray-200"
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da Inativação *
                <span className="text-xs text-gray-500 ml-2">
                  (mínimo 10 caracteres)
                </span>
              </label>
              <textarea
                ref={motivoRef}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Funcionário desligado da empresa, férias prolongadas, afastamento temporário..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                maxLength={500}
                required
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {motivo.length}/500 caracteres
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submetendo}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submetendo || motivo.trim().length < 10}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submetendo ? '⏳ Processando...' : '✅ Confirmar Inativação'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
