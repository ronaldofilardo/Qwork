'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Comissao, Resumo } from '../types';

export function useComissoes() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState<Comissao | null>(null);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (statusFiltro) params.set('status', statusFiltro);
      const res = await fetch(`/api/representante/comissoes?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErro(
          `Erro ao carregar comissões (${res.status}): ${errData.error ?? res.statusText}`
        );
        return;
      }
      const data = await res.json();
      setComissoes(data.comissoes ?? []);
      setResumo(data.resumo ?? null);
      setTotal(data.total ?? 0);
    } catch (e) {
      setErro(
        `Falha de rede ao carregar comissões: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFiltro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    comissoes,
    resumo,
    total,
    page,
    setPage,
    statusFiltro,
    setStatusFiltro,
    loading,
    uploadModal,
    setUploadModal,
    erro,
    carregar,
  };
}
