'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Vinculo } from '../types';

interface UseProfileVinculosReturn {
  vinculos: Vinculo[];
  totalVinculos: number;
  pageVinculos: number;
  setPageVinculos: (p: number | ((prev: number) => number)) => void;
  statusVinculoFiltro: string;
  setStatusVinculoFiltro: (v: string) => void;
  loadingVinculos: boolean;
  contagensVinculos: {
    ativo: number;
    inativo: number;
    suspenso: number;
    encerrado: number;
  };
}

export function useProfileVinculos(id: string): UseProfileVinculosReturn {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [totalVinculos, setTotalVinculos] = useState(0);
  const [pageVinculos, setPageVinculos] = useState(1);
  const [statusVinculoFiltro, setStatusVinculoFiltro] = useState('');
  const [loadingVinculos, setLoadingVinculos] = useState(false);
  const [contagensVinculos, setContagensVinculos] = useState({
    ativo: 0,
    inativo: 0,
    suspenso: 0,
    encerrado: 0,
  });

  const carregarVinculos = useCallback(async () => {
    setLoadingVinculos(true);
    try {
      const p = new URLSearchParams({ page: String(pageVinculos) });
      if (statusVinculoFiltro) p.set('status', statusVinculoFiltro);
      const res = await fetch(`/api/admin/representantes/${id}/vinculos?${p}`);
      if (!res.ok) return;
      const data = await res.json();
      setVinculos(data.vinculos ?? []);
      setTotalVinculos(data.total ?? 0);
      setContagensVinculos(
        data.contagens ?? { ativo: 0, inativo: 0, suspenso: 0, encerrado: 0 }
      );
    } finally {
      setLoadingVinculos(false);
    }
  }, [id, pageVinculos, statusVinculoFiltro]);

  useEffect(() => {
    carregarVinculos();
  }, [carregarVinculos]);

  return {
    vinculos,
    totalVinculos,
    pageVinculos,
    setPageVinculos,
    statusVinculoFiltro,
    setStatusVinculoFiltro,
    loadingVinculos,
    contagensVinculos,
  };
}
