import { useState, useCallback, useEffect } from 'react';

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
}

/**
 * Hook para gerenciar dados da empresa
 * @param empresaId ID da empresa
 * @returns Estado e funções para manipular dados da empresa
 */
export function useEmpresa(empresaId: string) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmpresa = useCallback(async () => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/rh/empresas');

      if (!res.ok) {
        throw new Error('Erro ao carregar empresas');
      }

      const empresasData = await res.json();
      const empresaAtual = empresasData.find(
        (e: Empresa) => e.id.toString() === empresaId
      );

      setEmpresa(empresaAtual || null);

      if (!empresaAtual) {
        setError('Empresa não encontrada');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao carregar empresa:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    loadEmpresa();
  }, [loadEmpresa]);

  return {
    empresa,
    loading,
    error,
    refetch: loadEmpresa,
  };
}
