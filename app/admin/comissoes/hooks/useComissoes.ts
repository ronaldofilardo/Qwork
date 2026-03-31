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
  nfReviewModal: { comissao: Comissao; acao: 'aprovar' | 'rejeitar' } | null;
  setNfReviewModal: (
    v: { comissao: Comissao; acao: 'aprovar' | 'rejeitar' } | null
  ) => void;
  nfRejectMotivo: string;
  setNfRejectMotivo: (v: string) => void;
  nfPendentes: Comissao[];
  nfPendentesCount: number;
  executarAcao: () => Promise<void>;
  executarNfReview: () => Promise<void>;
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
  const [nfReviewModal, setNfReviewModal] = useState<{
    comissao: Comissao;
    acao: 'aprovar' | 'rejeitar';
  } | null>(null);
  const [nfRejectMotivo, setNfRejectMotivo] = useState('');

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

  const executarNfReview = useCallback(async () => {
    if (!nfReviewModal) return;
    const { comissao, acao } = nfReviewModal;
    setActionLoading(comissao.id);
    setErro('');
    try {
      const res = await fetch(`/api/admin/comissoes/${comissao.id}/nf`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao,
          motivo: acao === 'rejeitar' ? nfRejectMotivo : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao processar NF');
        return;
      }
      setSucesso(
        `NF ${acao === 'aprovar' ? 'aprovada' : 'rejeitada'} com sucesso`
      );
      setTimeout(() => setSucesso(''), 3000);
      setNfReviewModal(null);
      setNfRejectMotivo('');
      await carregar();
    } finally {
      setActionLoading(null);
    }
  }, [nfReviewModal, nfRejectMotivo, carregar]);

  const nfPendentes = comissoes.filter(
    (c) =>
      c.nf_rpa_enviada_em &&
      !c.nf_rpa_aprovada_em &&
      !c.nf_rpa_rejeitada_em &&
      c.status === 'nf_em_analise'
  );
  const nfPendentesCount = resumo
    ? parseInt(resumo.em_analise ?? '0')
    : nfPendentes.length;

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
    nfReviewModal,
    setNfReviewModal,
    nfRejectMotivo,
    setNfRejectMotivo,
    nfPendentes,
    nfPendentesCount,
    executarAcao,
    executarNfReview,
  };
}
