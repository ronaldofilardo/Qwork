import { useState, useCallback } from 'react';

export interface DashboardData {
  stats: {
    total_avaliacoes: number;
    concluidas: number;
    funcionarios_avaliados: number;
  };
  resultados: Array<{
    grupo: number;
    dominio: string;
    media_score: number;
    categoria: string;
    total: number;
    baixo: number;
    medio: number;
    alto: number;
  }>;
  distribuicao: Array<{
    categoria: string;
    total: number;
  }>;
}

/**
 * Hook para gerenciar dados do dashboard
 * @param empresaId ID da empresa
 * @returns Estado e funções para manipular dados do dashboard
 */
export function useDashboardData(empresaId: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!empresaId) return;

    try {
      setLoading(true);
      setError(null);

      const dashboardRes = await fetch(
        `/api/rh/dashboard?empresa_id=${empresaId}`
      );

      if (!dashboardRes.ok) {
        throw new Error('Erro ao carregar dashboard');
      }

      const dashboardData = await dashboardRes.json();
      setData(dashboardData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao carregar dashboard:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  return {
    data,
    loading,
    error,
    fetchDashboardData,
    setData,
  };
}
