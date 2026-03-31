'use client';

import { CheckCircle } from 'lucide-react';
import type { EntidadeLiberarResponse } from './types';

interface RhSuccessProps {
  result: any;
}

export function RhSuccessMessage({ result }: RhSuccessProps) {
  if (!result?.lote) return null;

  return (
    <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-start gap-3">
        <CheckCircle
          className="text-green-600 flex-shrink-0 mt-0.5"
          size={20}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-green-900">
            Lote liberado com sucesso!
          </h3>
          <p className="text-sm text-green-700 mt-1">{result.message}</p>
          <div className="mt-2 text-sm text-green-800">
            <strong>Lote nº:</strong> {result.lote?.numero_ordem} |{' '}
            <strong>ID:</strong> {result.lote?.id}
          </div>
        </div>
      </div>
    </div>
  );
}

interface EntidadeSuccessProps {
  entidadeResponse: EntidadeLiberarResponse | null;
  result: EntidadeLiberarResponse | null;
}

export function EntidadeSuccessMessage({
  entidadeResponse,
  result,
}: EntidadeSuccessProps) {
  const resultados = entidadeResponse?.resultados ?? result?.resultados ?? [];
  if (resultados.length === 0) return null;

  return (
    <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-start gap-3">
        <CheckCircle
          className="text-green-600 flex-shrink-0 mt-0.5"
          size={20}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-green-900">
            Lotes criados com sucesso!
          </h3>
          <p className="text-sm text-green-700 mt-1">
            Foram processadas as empresas a seguir:
          </p>
          <ul className="mt-2 text-sm text-green-800 list-disc list-inside">
            {resultados.map((r: any) => (
              <li key={r.empresaId}>
                <strong>{r.empresaNome}</strong>:{' '}
                {r.created
                  ? `${r.avaliacoesCriadas} avaliações criadas`
                  : r.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
