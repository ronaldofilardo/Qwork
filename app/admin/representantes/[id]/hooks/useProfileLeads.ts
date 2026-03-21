'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Lead } from '../types';

interface UseProfileLeadsReturn {
  leads: Lead[];
  totalLeads: number;
  pageLeads: number;
  setPageLeads: (p: number | ((prev: number) => number)) => void;
  statusLeadFiltro: string;
  setStatusLeadFiltro: (v: string) => void;
  buscaLead: string;
  setBuscaLead: (v: string) => void;
  loadingLeads: boolean;
  contagensLeads: { pendente: number; convertido: number; expirado: number };
}

export function useProfileLeads(id: string): UseProfileLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [pageLeads, setPageLeads] = useState(1);
  const [statusLeadFiltro, setStatusLeadFiltro] = useState('');
  const [buscaLead, setBuscaLead] = useState('');
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [contagensLeads, setContagensLeads] = useState({
    pendente: 0,
    convertido: 0,
    expirado: 0,
  });

  const carregarLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const p = new URLSearchParams({ page: String(pageLeads), limit: '25' });
      if (statusLeadFiltro) p.set('status', statusLeadFiltro);
      if (buscaLead.trim()) p.set('q', buscaLead.trim());
      const res = await fetch(`/api/admin/representantes/${id}/leads?${p}`);
      if (!res.ok) return;
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotalLeads(data.total ?? 0);
      setContagensLeads(
        data.contagens ?? { pendente: 0, convertido: 0, expirado: 0 }
      );
    } finally {
      setLoadingLeads(false);
    }
  }, [id, pageLeads, statusLeadFiltro, buscaLead]);

  useEffect(() => {
    carregarLeads();
  }, [carregarLeads]);

  return {
    leads,
    totalLeads,
    pageLeads,
    setPageLeads,
    statusLeadFiltro,
    setStatusLeadFiltro,
    buscaLead,
    setBuscaLead,
    loadingLeads,
    contagensLeads,
  };
}
