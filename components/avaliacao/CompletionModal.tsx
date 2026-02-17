"use client";

interface CompletionModalProps {
  isOpen: boolean;
  status: 'processing' | 'success';
}

export default function CompletionModal({ isOpen, status }: CompletionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {status === 'processing' && (
          <>
            {/* Spinner animado */}
            <div className="mb-6 flex justify-center">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-primary"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Finalizando sua avaliação...
            </h2>
            
            <p className="text-gray-600 mb-2">
              Estamos processando suas respostas e calculando os resultados.
            </p>
            
            <p className="text-sm text-gray-500">
              Por favor, aguarde um momento.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            {/* Checkmark animado */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-full h-20 w-20 bg-green-100 flex items-center justify-center">
                <svg 
                  className="h-12 w-12 text-green-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={3} 
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-green-600 mb-3">
              Avaliação enviada com sucesso!
            </h2>
            
            <p className="text-gray-600 mb-2">
              Todas as suas respostas foram processadas corretamente.
            </p>
            
            <p className="text-sm text-gray-500">
              Redirecionando para o comprovante...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
