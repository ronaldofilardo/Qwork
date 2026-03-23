'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Lead } from '../types';

interface UseLeadsReturn {
  leads: Lead[];
  leadsTotal: number;
  leadsPendentes: number;
  leadsPage: number;
  setLeadsPage: (p: number | ((prev: number) => number)) => void;
  leadsStatusFiltro: string;
  setLeadsStatusFiltro: (v: string) => void;
  leadsBusca: string;
  setLeadsBusca: (v: string) => void;
  leadsLoading: boolean;
  carregarLeads: () => Promise<void>;
}

export function useLeads(
  tabAtiva: string,
  defaultStatus: string = ''
): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPendentes, setLeadsPendentes] = useState(0);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsStatusFiltro, setLeadsStatusFiltro] = useState(defaultStatus);
  const [leadsBusca, setLeadsBusca] = useState('');
  const [leadsLoading, setLeadsLoading] = useState(false);

  const carregarLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(leadsPage),
        limit: '30',
      });
      if (leadsStatusFiltro) params.set('status', leadsStatusFiltro);
      if (leadsBusca.trim()) params.set('busca', leadsBusca.trim());
      const res = await fetch(`/api/admin/representantes-leads?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setLeads(data.leads ?? []);
      setLeadsTotal(data.total ?? 0);
      setLeadsPendentes(data.pendentes ?? 0);
    } finally {
      setLeadsLoading(false);
    }
  }, [leadsPage, leadsStatusFiltro, leadsBusca]);

  useEffect(() => {
    if (tabAtiva === 'candidatos') {
      carregarLeads();
    }
  }, [tabAtiva, carregarLeads]);

  return {
    leads,
    leadsTotal,
    leadsPendentes,
    leadsPage,
    setLeadsPage,
    leadsStatusFiltro,
    setLeadsStatusFiltro,
    leadsBusca,
    setLeadsBusca,
    leadsLoading,
    carregarLeads,
  };
}
