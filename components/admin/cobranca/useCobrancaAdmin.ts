'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { ContratoPlano } from './types';

export function useCobrancaAdmin() {
  const [contratos, setContratos] = useState<ContratoPlano[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<
    'todos' | 'clinica' | 'entidade'
  >('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [contratoExpandido, setContratoExpandido] = useState<number | null>(
    null
  );
  const [busca, setBusca] = useState('');
  const [cnpjFilter, setCnpjFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('data_pagamento');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchContratos = useCallback(
    async (cnpj?: string, pageParam?: number) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (cnpj) params.set('cnpj', cnpj);
        params.set('page', String(pageParam ?? page));
        params.set('limit', String(limit));
        params.set('sort_by', sortBy);
        params.set('sort_dir', sortDir);

        const url = `/api/admin/cobranca?${params.toString()}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setContratos(data.contratos || []);
          if (data.page) setPage(data.page);
        }
      } catch (error) {
        console.error('Erro ao buscar contratos:', error);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, sortBy, sortDir]
  );

  useEffect(() => {
    fetchContratos();
  }, [fetchContratos]);

  const contratosFiltrados = useMemo(() => {
    return contratos.filter((contrato) => {
      if (filtroTipo !== 'todos' && contrato.tipo_tomador !== filtroTipo)
        return false;
      if (filtroStatus !== 'todos' && contrato.status !== filtroStatus)
        return false;
      if (busca) {
        const buscaLower = busca.toLowerCase();
        const buscaDigits = busca.replace(/\D/g, '');
        return (
          contrato.nome_tomador.toLowerCase().includes(buscaLower) ||
          (contrato.cnpj &&
            contrato.cnpj.replace(/\D/g, '').includes(buscaDigits))
        );
      }
      return true;
    });
  }, [contratos, filtroTipo, filtroStatus, busca]);

  const clinicas = useMemo(
    () => contratosFiltrados.filter((c) => c.tipo_tomador === 'clinica'),
    [contratosFiltrados]
  );

  const entidades = useMemo(
    () => contratosFiltrados.filter((c) => c.tipo_tomador === 'entidade'),
    [contratosFiltrados]
  );

  return {
    // Data
    contratos,
    loading,
    contratosFiltrados,
    clinicas,
    entidades,

    // Filters
    filtroTipo,
    setFiltroTipo,
    filtroStatus,
    setFiltroStatus,
    busca,
    setBusca,
    cnpjFilter,
    setCnpjFilter,

    // Pagination / sort
    page,
    limit,
    setLimit,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,

    // Expansion
    contratoExpandido,
    setContratoExpandido,

    // Actions
    fetchContratos,
  };
}
