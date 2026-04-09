'use client';

import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';

export interface DeletePreCadastroModalProps {
  isOpen: boolean;
  tomadorNome: string;
  tomadorTipo: 'clinica' | 'entidade';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal de confirmação para remoção de pré-cadastro.
 * Executado apenas no painel de suporte — não expõe nenhum dado sensível.
 */
export function DeletePreCadastroModal({
  isOpen,
  tomadorNome,
  tomadorTipo,
  loading = false,
  onConfirm,
  onCancel,
}: DeletePreCadastroModalProps) {
  if (!isOpen) return null;

  const tipoLabel = tomadorTipo === 'clinica' ? 'Clínica' : 'Entidade';

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="delete-pre-cadastro-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
        aria-hidden="true"
      />

      {/* Painel */}
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        {/* Botão fechar */}
        <button
          onClick={onCancel}
          disabled={loading}
          aria-label="Fechar modal"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Ícone + Título */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <h3
            id="delete-pre-cadastro-title"
            className="text-base font-semibold text-gray-900"
          >
            Remover Pré-Cadastro
          </h3>
        </div>

        {/* Corpo */}
        <p className="text-sm text-gray-600 mb-2">
          Tem certeza que deseja remover o pré-cadastro de{' '}
          <strong className="text-gray-900">{tomadorNome}</strong>{' '}
          ({tipoLabel})?
        </p>
        <p className="text-sm text-red-600 font-medium">
          Esta ação é irreversível. O pré-cadastro será marcado como inativo e
          não aparecerá mais na lista.
        </p>

        {/* Ações */}
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            aria-label="Confirmar remoção do pré-cadastro"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Removendo…
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Remover Pré-Cadastro
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
