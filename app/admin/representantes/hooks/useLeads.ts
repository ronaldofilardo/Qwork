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
  leadsError: string | null;
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
  const [leadsError, setLeadsError] = useState<string | null>(null);

  const carregarLeads = useCallback(async () => {
    setLeadsLoading(true);
    setLeadsError(null);
    try {
      const params = new URLSearchParams({
        page: String(leadsPage),
        limit: '30',
      });
      if (leadsStatusFiltro) params.set('status', leadsStatusFiltro);
      if (leadsBusca.trim()) params.set('busca', leadsBusca.trim());
      const res = await fetch(`/api/admin/representantes-leads?${params}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('[useLeads] Erro ao buscar leads:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData,
        });
        setLeadsError(errorData.error || `Erro ${res.status}`);
        setLeads([]);
        setLeadsTotal(0);
        setLeadsPendentes(0);
        return;
      }
      const data = await res.json();
      setLeads(data.leads ?? []);
      setLeadsTotal(data.total ?? 0);
      setLeadsPendentes(data.pendentes ?? 0);
    } catch (err) {
      console.error('[useLeads] Erro ao buscar:', err);
      setLeadsError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLeads([]);
      setLeadsTotal(0);
      setLeadsPendentes(0);
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
    leadsError,
    carregarLeads,
  };
}
