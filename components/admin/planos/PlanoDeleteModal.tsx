'use client';

import { X } from 'lucide-react';
import type { Plano } from './types';

interface PlanoDeleteModalProps {
  deleteTarget: Plano;
  deletePassword: string;
  setDeletePassword: (v: string) => void;
  deleteMotivo: string;
  setDeleteMotivo: (v: string) => void;
  deleteLoading: boolean;
  deleteError: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function PlanoDeleteModal({
  deleteTarget,
  deletePassword,
  setDeletePassword,
  deleteMotivo,
  setDeleteMotivo,
  deleteLoading,
  deleteError,
  onConfirm,
  onClose,
}: PlanoDeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Confirmar exclusão</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="fechar-modal-deletar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-700">
            Você está prestes a excluir o plano{' '}
            <strong>{deleteTarget.nome}</strong>. Esta ação será auditada e não
            pode ser desfeita.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha do admin *
            </label>
            <input
              aria-label="senha-admin"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo *
            </label>
            <textarea
              aria-label="motivo-delete"
              rows={3}
              value={deleteMotivo}
              onChange={(e) => setDeleteMotivo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Explique o motivo da exclusão"
            />
          </div>

          {deleteError && (
            <div className="text-sm text-red-600">{deleteError}</div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleteLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {deleteLoading ? 'Excluindo...' : 'Confirmar exclusão'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
