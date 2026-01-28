import { useState, useCallback } from 'react';

export interface LoteAvaliacao {
  id: number;
  codigo: string;
  titulo: string;
  tipo: string;
  liberado_em: string;
  status: string;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
  // Novos campos de validação de laudo
  pode_emitir_laudo?: boolean;
  motivos_bloqueio?: string[];
  taxa_conclusao?: number;
}

/**
 * Hook para gerenciar lotes de avaliação
 * @param empresaId ID da empresa
 * @returns Estado e funções para manipular lotes
 */
export function useLotesAvaliacao(empresaId: string) {
  const [lotes, setLotes] = useState<LoteAvaliacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);

  const fetchLotes = useCallback(async () => {
    if (!empresaId) return;

    try {
      setLoading(true);
      setError(null);
      setErrorCode(null);
      setErrorHint(null);

      const response = await fetch(`/api/rh/lotes?empresa_id=${empresaId}`);

      if (!response.ok) {
        // Tentar extrair payload da API para verificar códigos de erro estruturados
        let data: any = null;
        try {
          data = await response.json();
        } catch {
          // ignore
        }

        if (
          response.status === 403 &&
          data?.error_code === 'permission_clinic_mismatch'
        ) {
          setError(data.error || 'Acesso negado');
          setErrorCode(data.error_code);
          setErrorHint(data.hint || null);
          setLotes([]);
          return data;
        }

        throw new Error(data?.error || 'Erro ao carregar lotes');
      }

      const lotesData = await response.json();
      setLotes(lotesData.lotes || []);
      return lotesData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao carregar lotes recentes:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  return {
    lotes,
    loading,
    error,
    errorCode,
    errorHint,
    fetchLotes,
    setLotes,
  };
}
