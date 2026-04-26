'use client';

import { Check } from 'lucide-react';

interface PagamentoSucessoProps {
  confirmResponse: unknown;
  pagamentoId: number | null;
  onFechar: () => void;
}

interface ConfirmResponseShape {
  proximos_passos?: string[];
}

export function PagamentoSucesso({
  confirmResponse,
  pagamentoId,
  onFechar,
}: PagamentoSucessoProps) {
  const resp = confirmResponse as ConfirmResponseShape | null;
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Pagamento Confirmado!
      </h3>
      {resp?.proximos_passos ? (
        <div className="mb-4 text-left">
          {resp.proximos_passos.map((p, i) => (
            <p key={i} className="text-gray-600 mb-1">
              {p}
            </p>
          ))}
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-1">
            Seu pagamento foi processado com sucesso.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Aguarde a aprovação final do administrador para liberar seu acesso.
          </p>
        </>
      )}
      {pagamentoId && (
        <p className="text-xs text-gray-400 mb-6">
          ID do Pagamento: #{pagamentoId}
        </p>
      )}
      <button
        onClick={onFechar}
        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        Fechar
      </button>
    </div>
  );
}
