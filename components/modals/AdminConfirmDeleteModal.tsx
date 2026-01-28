'use client';

import { useState } from 'react';
import { X, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onConfirm: (payload: {
    admin_password: string;
    motivo?: string;
  }) => Promise<void>;
}

export default function AdminConfirmDeleteModal({
  isOpen,
  title = 'Confirmar exclusão',
  description,
  onClose,
  onConfirm,
}: Props) {
  const [adminPassword, setAdminPassword] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setError('');
    if (!adminPassword) {
      setError('Senha do admin é obrigatória');
      return;
    }

    setLoading(true);
    try {
      await onConfirm({ admin_password: adminPassword, motivo: motivo.trim() });
      setAdminPassword('');
      setMotivo('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha do admin
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Digite sua senha de administrador"
              data-testid="admin-password-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Motivo da exclusão (ex.: limpeza de dados)"
              data-testid="motivo-input"
            />
          </div>

          {error && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
              data-testid="modal-error"
            >
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            disabled={loading}
            data-testid="modal-confirm-button"
          >
            {loading ? 'Confirmando...' : 'Confirmar exclusão'}
          </button>
        </div>
      </div>
    </div>
  );
}
