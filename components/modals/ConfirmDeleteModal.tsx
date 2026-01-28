'use client';

import { useState } from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  entityType: 'clinica' | 'entidade';
  entityId: number;
  entityName: string;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  entityType,
  entityId,
  entityName,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Senha é obrigatória');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPassword('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-red-600 text-white p-4 rounded-t-lg">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Warning Message */}
          <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
            <p className="font-semibold mb-2">⚠️ Atenção: Ação Irreversível</p>
            <p className="text-sm">{message}</p>
          </div>

          {/* Entity Details */}
          <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">
              {entityType === 'clinica' ? 'Clínica' : 'Entidade'}:
            </p>
            <p className="font-semibold text-gray-900">{entityName}</p>
            <p className="text-xs text-gray-500 mt-1">ID: {entityId}</p>
          </div>

          {/* Impact List */}
          <div className="mb-4 text-sm text-gray-700">
            <p className="font-semibold mb-2">Serão excluídos:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Todos os gestores vinculados</li>
              <li>Todas as empresas clientes</li>
              <li>Todos os funcionários cadastrados</li>
              <li>Todas as avaliações realizadas</li>
              <li>Todos os documentos e relatórios</li>
            </ul>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Senha do Administrador *
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Digite sua senha para confirmar"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
