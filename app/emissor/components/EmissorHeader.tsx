'use client';

/**
 * app/emissor/components/EmissorHeader.tsx
 *
 * Header section with title, PWA install, refresh and logout buttons.
 */

interface EmissorHeaderProps {
  canInstall: boolean;
  onInstallClick: () => void;
  loading: boolean;
  onRefresh: () => void;
}

export default function EmissorHeader({
  canInstall,
  onInstallClick,
  loading,
  onRefresh,
}: EmissorHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard do Emissor
          </h1>
          <p className="mt-2 text-gray-600">
            Histórico completo dos lotes processados para emissão de laudos
          </p>
        </div>
        <div className="flex gap-3">
          {canInstall && (
            <button
              onClick={onInstallClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
              title="Instalar aplicativo na tela inicial"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Instalar App
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>
    </div>
  );
}
