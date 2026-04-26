'use client';

import { useState, useCallback } from 'react';

export interface Anomalia {
  cpf: string;
  nome: string;
  setor: string;
  indice_avaliacao: number;
  data_ultimo_lote: string | null;
  dias_desde_ultima_avaliacao: number | null;
  total_inativacoes: number;
  categoria_anomalia: string;
  prioridade: 'CRÍTICA' | 'ALTA' | 'MÉDIA' | 'BAIXA';
  mensagem: string;
}

interface UseAnomaliasReturn {
  anomalias: Anomalia[];
  loading: boolean;
  error: string | null;
  fetchAnomalias: () => Promise<void>;
}

export function useAnomalias(empresaId: string): UseAnomaliasReturn {
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnomalias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/rh/pendencias?empresa_id=${empresaId}`
      );
      if (!response.ok) {
        throw new Error(`Erro ao carregar pendências: ${response.status}`);
      }
      const data = await response.json();
      setAnomalias(data.anomalias ?? []);
    } catch (err) {
      setAnomalias([]);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  return { anomalias, loading, error, fetchAnomalias };
}
