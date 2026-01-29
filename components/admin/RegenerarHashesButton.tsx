'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface ResultadoRegeneracao {
  processados: number;
  atualizados: number;
  erros: number;
  detalhes?: Array<{
    laudoId: number;
    status: 'atualizado' | 'erro' | 'arquivo_nao_encontrado';
    hash?: string;
    erro?: string;
  }>;
}

export default function RegenerarHashesButton() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoRegeneracao | null>(null);

  const handleRegenerar = async () => {
    if (
      !confirm(
        'Deseja regenerar os hashes de todos os laudos sem hash? Esta operação pode levar alguns minutos.'
      )
    ) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Regenerando hashes dos laudos...');

    try {
      const response = await fetch('/api/admin/laudos/regenerar-hashes', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResultado(data);
        toast.success(data.message, { id: toastId });
      } else {
        toast.error(data.error || 'Erro ao regenerar hashes', { id: toastId });
      }
    } catch (error) {
      console.error('Erro ao regenerar hashes:', error);
      toast.error('Erro ao regenerar hashes', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        🔒 Regenerar Hashes de Laudos
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Calcula e atualiza o hash SHA-256 de laudos existentes que não possuem
        hash armazenado. Isso é útil para laudos gerados antes da implementação
        do sistema de hash.
      </p>

      <button
        onClick={handleRegenerar}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Processando...' : '🔄 Regenerar Hashes'}
      </button>

      {resultado && (
        <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">📊 Resultado:</h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Laudos processados:</span>{' '}
              {resultado.processados}
            </p>
            <p className="text-green-700">
              <span className="font-medium">✅ Hashes atualizados:</span>{' '}
              {resultado.atualizados}
            </p>
            {resultado.erros > 0 && (
              <p className="text-red-700">
                <span className="font-medium">❌ Erros:</span> {resultado.erros}
              </p>
            )}
          </div>

          {resultado.detalhes && resultado.detalhes.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                Ver detalhes ({resultado.detalhes.length} laudos)
              </summary>
              <div className="mt-2 max-h-60 overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-1 text-left">Laudo ID</th>
                      <th className="px-2 py-1 text-left">Status</th>
                      <th className="px-2 py-1 text-left">Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.detalhes.map((detalhe, idx) => (
                      <tr
                        key={idx}
                        className={
                          detalhe.status === 'atualizado'
                            ? 'bg-green-50'
                            : 'bg-red-50'
                        }
                      >
                        <td className="px-2 py-1">{detalhe.laudoId}</td>
                        <td className="px-2 py-1">
                          {detalhe.status === 'atualizado' && '✅ Atualizado'}
                          {detalhe.status === 'arquivo_nao_encontrado' &&
                            '📁 Arquivo não encontrado'}
                          {detalhe.status === 'erro' && '❌ Erro'}
                        </td>
                        <td className="px-2 py-1 font-mono">
                          {detalhe.hash || detalhe.erro || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
