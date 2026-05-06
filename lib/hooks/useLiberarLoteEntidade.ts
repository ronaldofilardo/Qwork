import { useState, useCallback } from 'react';

export interface LoteEntidadeResponse {
  success: boolean;
  message?: string;
  resultados?: Array<{
    empresaId: number;
    empresaNome: string;
    created: boolean;
    loteId?: number;
    codigo?: string;
    numero_ordem?: number;
    avaliacoesCriadas?: number;
    funcionariosConsiderados?: number;
    message?: string;
  }>;
}

export interface LiberarLoteEntidadeParams {
  loteReferenciaId?: number;
}

export function useLiberarLoteEntidade() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [result, setResult] = useState<LoteEntidadeResponse | null>(null);

  const liberarLote = useCallback(async (params: LiberarLoteEntidadeParams) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/entidade/liberar-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data: LoteEntidadeResponse = await response.json();

      if (!response.ok) {
        const errorMsg =
          (data as any).detalhes ||
          data.message ||
          data['error'] ||
          'Erro ao liberar lote (entidade)';
        setError(errorMsg);
        setErrorModalOpen(true);
        // Armazenar resultado mesmo em erro para exibir detalhes
        setResult(data);
        return data;
      }

      setResult(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      setErrorModalOpen(true);
      return { success: false, message: errorMsg } as LoteEntidadeResponse;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setErrorModalOpen(false);
    setResult(null);
  }, []);

  const closeErrorModal = useCallback(() => {
    setErrorModalOpen(false);
  }, []);

  return {
    liberarLote,
    loading,
    error,
    result,
    reset,
    errorModalOpen,
    closeErrorModal,
  };
}
