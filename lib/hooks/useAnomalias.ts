import { useState, useCallback } from 'react';

export interface AnomaliaIndice {
  cpf: string;
  nome: string;
  setor: string;
  indice_avaliacao: number;
  data_ultimo_lote: string | null;
  dias_desde_ultima_avaliacao: number | null;
  total_inativacoes: number;
  categoria_anomalia: string;
  prioridade: 'CRÍTICA' | 'ALTA' | 'MÉDIA';
  mensagem: string;
}

/**
 * Hook para gerenciar anomalias/pendências de avaliações
 * @param empresaId ID da empresa
 * @returns Estado e funções para manipular anomalias
 */
export function useAnomalias(empresaId: string) {
  const [anomalias, setAnomalias] = useState<AnomaliaIndice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnomalias = useCallback(async () => {
    if (!empresaId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/rh/pendencias?empresa_id=${empresaId}`
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar pendências');
      }

      const anomaliasData = await response.json();
      setAnomalias(anomaliasData.anomalias || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao carregar pendências:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  return {
    anomalias,
    loading,
    error,
    fetchAnomalias,
    setAnomalias,
  };
}
