'use client';

interface LaudoHeaderProps {
  onBack: () => void;
  isPrevia: boolean;
  gerandoLaudo: boolean;
  onOpenUploadModal: () => void;
  onGerarLaudo: () => void;
}

export default function LaudoHeader({
  onBack,
  isPrevia,
  gerandoLaudo,
  onOpenUploadModal,
  onGerarLaudo,
}: LaudoHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <button
        onClick={onBack}
        className="text-blue-600 hover:text-blue-800 inline-flex items-center text-sm"
      >
        ← Voltar ao Dashboard
      </button>
      {isPrevia && (
        <div className="flex gap-3">
          <button
            onClick={onOpenUploadModal}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload de Laudo
          </button>
          <button
            onClick={onGerarLaudo}
            disabled={gerandoLaudo}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {gerandoLaudo ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Gerando...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Gerar Automaticamente
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
