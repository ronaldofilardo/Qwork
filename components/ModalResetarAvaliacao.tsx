'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ModalResetarAvaliacaoProps {
  avaliacaoId: number;
  loteId: string;
  funcionarioNome: string;
  funcionarioCpf: string;
  basePath: '/api/rh' | '/api/entidade'; // Para definir qual endpoint usar
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalResetarAvaliacao({
  avaliacaoId,
  loteId,
  funcionarioNome,
  funcionarioCpf,
  basePath,
  onClose,
  onSuccess,
}: ModalResetarAvaliacaoProps) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (motivo.trim().length < 5) {
      toast.error('O motivo deve ter pelo menos 5 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Para RH usa 'lotes', para entidade usa 'lote' (singular)
      const path = basePath === '/api/rh' ? 'lotes' : 'lote';
      const response = await fetch(
        `${basePath}/${path}/${loteId}/avaliacoes/${avaliacaoId}/reset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: motivo.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao resetar avaliação');
      }

      toast.success(data.message || 'Avaliação resetada com sucesso!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao resetar avaliação:', error);
      toast.error(error.message || 'Erro ao resetar avaliação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">
              Resetar Avaliação
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Atenção:</strong> Esta ação irá apagar permanentemente
              todas as respostas do funcionário{' '}
              <strong>{funcionarioNome}</strong> (CPF: {funcionarioCpf}).
            </p>
            <p className="text-sm text-amber-800 mt-2">
              Após o reset, o funcionário poderá responder a avaliação novamente
              desde o início.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="motivo"
              className="block text-sm font-medium text-gray-700"
            >
              Motivo do reset <span className="text-red-600">*</span>
            </label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explique o motivo para resetar esta avaliação (mínimo 5 caracteres)"
              rows={4}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
              minLength={5}
            />
            <p className="text-xs text-gray-500">
              {motivo.length}/255 caracteres (mínimo 5)
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || motivo.trim().length < 5}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetando...' : 'Resetar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
