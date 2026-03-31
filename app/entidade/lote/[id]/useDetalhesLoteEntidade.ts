'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { foiExibidaParaLote } from '@/components/ModalConfirmacaoSolicitar';
import { useLoteFiltros } from '@/hooks/useLoteFiltros';
import type {
  LoteInfoEntidade,
  EstatisticasEntidade,
  FuncionarioEntidade,
  ModalInativarState,
  ModalResetarState,
  ModalEmissaoState,
} from './types';

export function useDetalhesLoteEntidade() {
  const router = useRouter();
  const params = useParams();
  const loteId = params.id as string;

  // ── Core state ──────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [lote, setLote] = useState<LoteInfoEntidade | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasEntidade | null>(
    null
  );
  const [funcionarios, setFuncionarios] = useState<FuncionarioEntidade[]>([]);

  // ── Pagamento Asaas reconciliation ──────────────────────────────
  const [pagamentoSincronizando, setPagamentoSincronizando] = useState(false);
  const [pagamentoSincronizado, setPagamentoSincronizado] = useState(false);

  // ── Modals ──────────────────────────────────────────────────────
  const [modalInativar, setModalInativar] = useState<ModalInativarState | null>(
    null
  );
  const [modalResetar, setModalResetar] = useState<ModalResetarState | null>(
    null
  );
  const [modalEmissao, setModalEmissao] = useState<ModalEmissaoState | null>(
    null
  );

  // ── Filters (shared hook — no extraSearchFields for Entidade) ──
  const filtros = useLoteFiltros<FuncionarioEntidade>({ funcionarios });

  // ── Data loading ────────────────────────────────────────────────
  const loadLoteData = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        if (!loteId) {
          toast.error('ID do lote inválido');
          router.push('/entidade/lotes');
          return;
        }
        const timestamp = new Date().getTime();
        const response = await fetch(
          `/api/entidade/lote/${loteId}?_t=${timestamp}`,
          {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || 'Erro ao carregar dados do lote');
          router.push('/entidade/lotes');
          return;
        }
        const data = await response.json();
        setLote(data.lote);
        setEstatisticas(data.estatisticas);
        setFuncionarios(data.funcionarios || []);
        if (forceRefresh) {
          toast.success('Dados atualizados!');
        }
      } catch (error) {
        console.error('Erro ao carregar lote:', error);
        toast.error('Erro ao conectar com o servidor');
        router.push('/entidade/lotes');
      } finally {
        setLoading(false);
      }
    },
    [loteId, router]
  );

  // ── Download laudo with hash verification ───────────────────────
  const handleDownloadLaudo = useCallback(async () => {
    if (!lote?.laudo_id) {
      toast.error('ID do laudo não disponível');
      return;
    }
    try {
      toast.loading('Verificando integridade do laudo...', {
        id: `laudo-verify-${lote.laudo_id}`,
      });
      const verifyResponse = await fetch(
        `/api/entidade/laudos/${lote.laudo_id}/verify-hash`
      );
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Erro ao verificar laudo');
      }
      const verifyData = await verifyResponse.json();
      if (!verifyData.hash_valido) {
        toast.error(
          '⚠️ ATENÇÃO: O hash do laudo não corresponde ao original! O arquivo pode ter sido modificado.',
          { id: `laudo-verify-${lote.laudo_id}`, duration: 8000 }
        );
        console.error('[HASH INV\u00c1LIDO]', {
          laudo_id: lote.laudo_id,
          hash_armazenado: verifyData.hash_armazenado,
          hash_calculado: verifyData.hash_calculado,
        });
        return;
      }
      toast.success(
        '✅ Integridade verificada! O laudo é autêntico e não foi modificado.',
        { id: `laudo-verify-${lote.laudo_id}`, duration: 3000 }
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.loading('Baixando laudo...', {
        id: `laudo-download-${lote.laudo_id}`,
      });
      const response = await fetch(
        `/api/entidade/laudos/${lote.laudo_id}/download`
      );
      if (!response.ok) throw new Error('Erro ao baixar laudo');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laudo_${lote.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Laudo baixado com sucesso!', {
        id: `laudo-download-${lote.laudo_id}`,
      });
    } catch (error: any) {
      console.error('Erro ao baixar laudo:', error);
      toast.error(error.message || 'Erro ao baixar laudo', {
        id: `laudo-verify-${lote?.laudo_id}`,
      });
    }
  }, [lote]);

  // ── Polling: refresh every 30s ──────────────────────────────────
  useEffect(() => {
    loadLoteData();
    const intervalId = setInterval(() => {
      loadLoteData();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [loadLoteData]);

  // ── Auto-reconcilia\u00e7\u00e3o Asaas ──────────────────────────────────
  useEffect(() => {
    if (!lote || !loteId) return;
    if (lote.status_pagamento !== 'aguardando_pagamento') return;
    if (pagamentoSincronizando || pagamentoSincronizado) return;
    const reconciliar = async () => {
      setPagamentoSincronizando(true);
      try {
        console.log(
          `[LotePage] Iniciando reconcilia\u00e7\u00e3o autom\u00e1tica para Lote #${loteId}`
        );
        const res = await fetch('/api/pagamento/asaas/sincronizar-lote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lote_id: parseInt(loteId, 10) }),
        });
        const data = await res.json();
        if (data.synced) {
          setPagamentoSincronizado(true);
          toast.success('\u2705 Pagamento confirmado! Atualizando dados...');
          setTimeout(() => loadLoteData(), 1500);
        }
      } catch (err) {
        console.error(
          '[LotePage] Erro na reconcilia\u00e7\u00e3o autom\u00e1tica:',
          err
        );
      } finally {
        setPagamentoSincronizando(false);
      }
    };
    reconciliar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lote?.status_pagamento, loteId]);

  // ── Manual payment sync ─────────────────────────────────────────
  const sincronizarPagamento = useCallback(async () => {
    setPagamentoSincronizando(true);
    try {
      const res = await fetch('/api/pagamento/asaas/sincronizar-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lote_id: parseInt(loteId, 10) }),
      });
      const data = await res.json();
      if (data.synced) {
        setPagamentoSincronizado(true);
        toast.success('\u2705 Pagamento confirmado!');
        setTimeout(() => loadLoteData(), 1500);
      } else {
        toast('Pagamento ainda não confirmado no gateway.', {
          icon: '\u2139\ufe0f',
        });
      }
    } catch {
      toast.error('Erro ao verificar pagamento');
    } finally {
      setPagamentoSincronizando(false);
    }
  }, [loteId, loadLoteData]);

  // ── PDF generators ──────────────────────────────────────────────
  const gerarRelatorioFuncionario = useCallback(
    async (cpf: string, nome: string) => {
      if (!confirm(`Gerar relatório PDF de ${nome}?`)) return;
      toast.loading('Gerando relatório...', { id: 'rel-individual' });
      try {
        const response = await fetch(
          `/api/entidade/relatorio-individual-pdf?lote_id=${loteId}&cpf=${cpf}`
        );
        if (!response.ok) throw new Error('Erro ao gerar relat\u00f3rio');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${nome.replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Relat\u00f3rio gerado com sucesso!', {
          id: 'rel-individual',
        });
      } catch (error) {
        console.error('Erro:', error);
        toast.error('Erro ao gerar relat\u00f3rio', { id: 'rel-individual' });
      }
    },
    [loteId]
  );

  const gerarRelatorioSetor = useCallback(
    async (setor: string) => {
      toast.loading(`Gerando relatório do setor ${setor}...`, {
        id: 'rel-setor',
      });
      try {
        const response = await fetch(
          `/api/entidade/relatorio-setor-pdf?lote_id=${loteId}&setor=${encodeURIComponent(setor)}`
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao gerar relatório');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-setor-${setor.replace(/\s+/g, '-')}-lote${loteId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Relatório gerado com sucesso!', { id: 'rel-setor' });
      } catch (error: any) {
        console.error('Erro:', error);
        toast.error(error.message || 'Erro ao gerar relat\u00f3rio', {
          id: 'rel-setor',
        });
        throw error;
      }
    },
    [loteId]
  );

  const handleDownloadReport = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/entidade/relatorio-lote-pdf?lote_id=${loteId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar relat\u00f3rio');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-lote-${loteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Relat\u00f3rio gerado com sucesso!', { id: 'report' });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar relat\u00f3rio', { id: 'report' });
    }
  }, [loteId]);

  // ── Emission ────────────────────────────────────────────────────
  const solicitarEmissao = useCallback(async () => {
    if (!lote) return;
    const confirmado = confirm(
      `Confirma a solicita\u00e7\u00e3o de emiss\u00e3o do laudo para o lote ${lote.id}?\n\nO laudo ser\u00e1 gerado e enviado para o emissor respons\u00e1vel.`
    );
    if (!confirmado) return;
    try {
      const response = await fetch(`/api/lotes/${lote.id}/solicitar-emissao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Erro ao solicitar emiss\u00e3o');
      toast.success('Emiss\u00e3o solicitada com sucesso!');
      if (!foiExibidaParaLote(lote.id)) {
        const contato = data.gestor_contato as
          | { email: string | null; celular: string | null }
          | undefined;
        setModalEmissao({
          loteId: lote.id,
          gestorEmail: contato?.email ?? null,
          gestorCelular: contato?.celular ?? null,
        });
      } else {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao solicitar emiss\u00e3o');
    }
  }, [lote]);

  // ── Helpers ─────────────────────────────────────────────────────
  const abrirModalInativar = useCallback(
    (avaliacaoId: number, nome: string, cpf: string) => {
      setModalInativar({
        avaliacaoId,
        funcionarioNome: nome,
        funcionarioCpf: cpf,
      });
    },
    []
  );

  // ── Public API ──────────────────────────────────────────────────
  return {
    router,
    loteId,
    loading,
    lote,
    estatisticas,
    funcionarios,
    // payment sync
    pagamentoSincronizando,
    pagamentoSincronizado,
    sincronizarPagamento,
    // filters (from shared hook)
    ...filtros,
    // modals
    modalInativar,
    setModalInativar,
    modalResetar,
    setModalResetar,
    modalEmissao,
    setModalEmissao,
    // actions
    loadLoteData,
    handleDownloadLaudo,
    handleDownloadReport,
    gerarRelatorioFuncionario,
    gerarRelatorioSetor,
    solicitarEmissao,
    abrirModalInativar,
  };
}
