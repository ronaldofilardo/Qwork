'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Representante } from '../types';

interface UseRepresentantesReturn {
  reps: Representante[];
  total: number;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  statusFiltro: string;
  setStatusFiltro: (v: string) => void;
  busca: string;
  setBusca: (v: string) => void;
  loading: boolean;
  carregar: () => Promise<void>;
}

export function useRepresentantes(): UseRepresentantesReturn {
  const [reps, setReps] = useState<Representante[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (statusFiltro) params.set('status', statusFiltro);
      if (busca.trim()) params.set('busca', busca.trim());
      const res = await fetch(`/api/admin/representantes?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setReps(data.representantes ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFiltro, busca]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    reps,
    total,
    page,
    setPage,
    statusFiltro,
    setStatusFiltro,
    busca,
    setBusca,
    loading,
    carregar,
  };
}
