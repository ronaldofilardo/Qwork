'use client';

import { useCallback, useEffect, useState } from 'react';
import type { LoteMonitor, LaudoMonitor, TabAtiva } from './types';

export function useCentroOperacoes() {
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>('lotes');
  const [lotes, setLotes] = useState<LoteMonitor[]>([]);
  const [laudos, setLaudos] = useState<LaudoMonitor[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [loadingLaudos, setLoadingLaudos] = useState(true);
  const [erroLotes, setErroLotes] = useState<string | null>(null);
  const [erroLaudos, setErroLaudos] = useState<string | null>(null);

  const carregarLotes = useCallback(async () => {
    try {
      setLoadingLotes(true);
      setErroLotes(null);
      const res = await fetch('/api/rh/monitor/lotes');
      if (res.ok) {
        const data = await res.json();
        setLotes(data.lotes ?? []);
      } else {
        setErroLotes('Erro ao carregar lotes.');
      }
    } catch {
      setErroLotes('Erro de rede ao carregar lotes.');
    } finally {
      setLoadingLotes(false);
    }
  }, []);

  const carregarLaudos = useCallback(async () => {
    try {
      setLoadingLaudos(true);
      setErroLaudos(null);
      const res = await fetch('/api/rh/monitor/laudos');
      if (res.ok) {
        const data = await res.json();
        setLaudos(data.laudos ?? []);
      } else {
        setErroLaudos('Erro ao carregar laudos.');
      }
    } catch {
      setErroLaudos('Erro de rede ao carregar laudos.');
    } finally {
      setLoadingLaudos(false);
    }
  }, []);

  useEffect(() => {
    carregarLotes();
    carregarLaudos();
  }, [carregarLotes, carregarLaudos]);

  return {
    tabAtiva,
    setTabAtiva,
    lotes,
    laudos,
    loadingLotes,
    loadingLaudos,
    erroLotes,
    erroLaudos,
    carregarLotes,
    carregarLaudos,
  };
}
