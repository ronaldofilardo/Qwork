'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Comissao, Resumo } from '../types';

interface UseComissoesReturn {
  comissoes: Comissao[];
  resumo: Resumo | null;
  total: number;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  statusFiltro: string;
  setStatusFiltro: (s: string) => void;
  mesFilter: string;
  setMesFilter: (v: string) => void;
  loading: boolean;
  actionLoading: number | null;
  erro: string;
  setErro: (v: string) => void;
  sucesso: string;
  acaoPendente: { comissao: Comissao; acao: string } | null;
  setAcaoPendente: (v: { comissao: Comissao; acao: string } | null) => void;
  motivoAcao: string;
  setMotivoAcao: (v: string) => void;
  comprovante: string;
  setComprovante: (v: string) => void;
  executarAcao: () => Promise<void>;
}

export function useComissoes(): UseComissoesReturn {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [mesFilter, setMesFilter] = useState(''); // YYYY-MM
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [acaoPendente, setAcaoPendente] = useState<{
    comissao: Comissao;
    acao: string;
  } | null>(null);
  const [motivoAcao, setMotivoAcao] = useState('');
  const [comprovante, setComprovante] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (statusFiltro) params.set('status', statusFiltro);
      if (mesFilter) params.set('mes', mesFilter);
      const res = await fetch(`/api/admin/comissoes?${params}`);
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
      setErro(`Falha de rede: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [page, statusFiltro, mesFilter]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const executarAcao = useCallback(async () => {
    if (!acaoPendente) return;
    setActionLoading(acaoPendente.comissao.id);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/comissoes/${acaoPendente.comissao.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            acao: acaoPendente.acao,
            motivo: motivoAcao || null,
            comprovante_path: comprovante || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao executar ação');
        return;
      }
      setSucesso(`Ação '${acaoPendente.acao}' executada com sucesso`);
      setTimeout(() => setSucesso(''), 3000);
      setAcaoPendente(null);
      setMotivoAcao('');
      setComprovante('');
      await carregar();
    } finally {
      setActionLoading(null);
    }
  }, [acaoPendente, motivoAcao, comprovante, carregar]);

  return {
    comissoes,
    resumo,
    total,
    page,
    setPage,
    statusFiltro,
    setStatusFiltro,
    mesFilter,
    setMesFilter,
    loading,
    actionLoading,
    erro,
    setErro,
    sucesso,
    acaoPendente,
    setAcaoPendente,
    motivoAcao,
    setMotivoAcao,
    comprovante,
    setComprovante,
    executarAcao,
  };
}
