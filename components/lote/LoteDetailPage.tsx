/* eslint-disable max-lines */
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalInativarAvaliacao from '@/components/ModalInativarAvaliacao';
import ModalResetarAvaliacao from '@/components/ModalResetarAvaliacao';
import {
  ModalConfirmacaoSolicitar,
  foiExibidaParaLote,
} from '@/components/ModalConfirmacaoSolicitar';
import ModalSetorRelatorioPDF from '@/components/ModalSetorRelatorioPDF';
import LoteStatCards from './LoteStatCards';
import FuncionariosTable from './FuncionariosTable';
import { useLoteFiltros } from '@/hooks/lote/useLoteFiltros';
import { formatDate, formatarData } from '@/lib/lote/utils';
import type {
  LotePageVariant,
  LoteInfo,
  Estatisticas,
  Funcionario,
  ModalInativarState,
  ModalResetarState,
  ModalEmissaoState,
} from '@/lib/lote/types';

// ── Props ─────────────────────────────────────────────────────────────────

interface LoteDetailPageProps {
  variant: LotePageVariant;
  loteId: string;
  empresaId?: string;
}

// ── Helper: normalizar estatísticas da API ──────────────────────────────

interface RawEntidadeStats {
  total_funcionarios: number;
  funcionarios_concluidos: number;
  funcionarios_inativados: number;
  funcionarios_pendentes: number;
}

interface RawRHStats {
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
  avaliacoes_pendentes: number;
}

function normalizeStats(
  variant: LotePageVariant,
  raw: RawEntidadeStats | RawRHStats
): Estatisticas {
  if (variant === 'entidade') {
    const s = raw as RawEntidadeStats;
    return {
      total: s.total_funcionarios,
      concluidas: s.funcionarios_concluidos,
      inativadas: s.funcionarios_inativados,
      pendentes: s.funcionarios_pendentes,
    };
  }
  const s = raw as RawRHStats;
  return {
    total: s.total_avaliacoes,
    concluidas: s.avaliacoes_concluidas,
    inativadas: s.avaliacoes_inativadas,
    pendentes: s.avaliacoes_pendentes,
  };
}

// ── Component ─────────────────────────────────────────────────────────────

// eslint-disable-next-line max-lines-per-function, complexity
export default function LoteDetailPage({
  variant,
  loteId,
  empresaId,
}: LoteDetailPageProps) {
  const router = useRouter();
  const isEntidade = variant === 'entidade';

  // ── State ─────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [lote, setLote] = useState<LoteInfo | null>(null);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  // Entidade-only: pagamento Asaas
  const [pagamentoSincronizando, setPagamentoSincronizando] = useState(false);
  const [pagamentoSincronizado, setPagamentoSincronizado] = useState(false);

  // RH-only: permissão
  const [permissionErrorHint, setPermissionErrorHint] = useState<string | null>(
    null
  );

  // Modais
  const [modalInativar, setModalInativar] = useState<ModalInativarState | null>(
    null
  );
  const [modalResetar, setModalResetar] = useState<ModalResetarState | null>(
    null
  );
  const [modalEmissao, setModalEmissao] = useState<ModalEmissaoState | null>(
    null
  );
  const [showSetorModal, setShowSetorModal] = useState(false);

  // ── Filtros (hook) ────────────────────────────────────────────────────
  const {
    busca,
    setBusca,
    buscaDebouncedValue,
    filtroStatus,
    setFiltroStatus,
    filtrosColuna,
    setFiltrosColuna,
    funcionariosFiltrados,
    setores,
    getValoresUnicos,
    toggleFiltroColuna,
    limparFiltrosColuna,
  } = useLoteFiltros({ funcionarios });

  // ── Data loading ──────────────────────────────────────────────────────

  const loadLoteData = useCallback(
    // eslint-disable-next-line max-lines-per-function, complexity
    async (forceRefresh = false) => {
      try {
        setLoading(true);

        let response: Response;

        if (isEntidade) {
          if (!loteId) {
            toast.error('ID do lote inválido');
            router.push('/entidade/lotes');
            return;
          }
          const timestamp = new Date().getTime();
          response = await fetch(
            `/api/entidade/lote/${loteId}?_t=${timestamp}`,
            {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
              },
            }
          );
        } else {
          if (!empresaId || !loteId) {
            alert('Parâmetros inválidos');
            router.push('/rh');
            return;
          }
          response = await fetch(
            `/api/rh/lotes/${loteId}/funcionarios?empresa_id=${empresaId}`
          );
        }

        if (!response.ok) {
          const errorData = await response.json();

          // RH: mismatch de clínica
          if (
            !isEntidade &&
            response.status === 403 &&
            errorData?.error_code === 'permission_clinic_mismatch'
          ) {
            setPermissionErrorHint(
              errorData.hint || 'Acesso negado. Verifique sua clínica.'
            );
            setLoading(false);
            return;
          }

          if (isEntidade) {
            toast.error(errorData.error || 'Erro ao carregar dados do lote');
            router.push('/entidade/lotes');
          } else {
            alert(`Erro: ${errorData.error || 'Erro ao carregar dados'}`);
            router.push(`/rh/empresa/${empresaId}`);
          }
          return;
        }

        const data = await response.json();

        if (!isEntidade && !data.success) {
          alert(`Erro: ${data.error || 'Resposta inválida do servidor'}`);
          router.push(`/rh/empresa/${empresaId}`);
          return;
        }

        setLote(data.lote);
        setEstatisticas(normalizeStats(variant, data.estatisticas));
        setFuncionarios(data.funcionarios || []);

        if (isEntidade && forceRefresh) {
          toast.success('Dados atualizados!');
        }
      } catch (error) {
        console.error('Erro ao carregar lote:', error);
        if (isEntidade) {
          toast.error('Erro ao conectar com o servidor');
          router.push('/entidade/lotes');
        } else {
          alert('Erro ao carregar dados do lote.');
          router.push(`/rh/empresa/${empresaId}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [loteId, empresaId, router, variant, isEntidade]
  );

  // ── Effects ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (isEntidade) {
      loadLoteData();
      const intervalId = setInterval(() => loadLoteData(), 30000);
      return () => clearInterval(intervalId);
    } else {
      // RH: session check antes de carregar
      const checkSessionAndLoad = async () => {
        try {
          const sessionRes = await fetch('/api/auth/session');
          if (!sessionRes.ok) {
            router.push('/login');
            return;
          }
          const sessionData = await sessionRes.json();
          if (sessionData.perfil !== 'rh' && sessionData.perfil !== 'admin') {
            alert(
              'Acesso negado. Apenas usuários RH podem acessar esta página.'
            );
            router.push('/dashboard');
            return;
          }
          await loadLoteData();
        } catch {
          router.push('/login');
        }
      };
      checkSessionAndLoad();
    }
  }, [loadLoteData, router, isEntidade]);

  // Entidade: auto-reconciliação Asaas
  useEffect(() => {
    if (!isEntidade || !lote || !loteId) return;
    if (lote.status_pagamento !== 'aguardando_pagamento') return;
    if (pagamentoSincronizando || pagamentoSincronizado) return;

    const reconciliar = async () => {
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
          toast.success('✅ Pagamento confirmado! Atualizando dados...');
          setTimeout(() => loadLoteData(), 1500);
        }
      } catch (err) {
        console.error('[LotePage] Erro na reconciliação automática:', err);
      } finally {
        setPagamentoSincronizando(false);
      }
    };
    reconciliar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lote?.status_pagamento, loteId, isEntidade]);

  // Fechar dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[id^="dropdown-"]') && !target.closest('button')) {
        document.querySelectorAll('[id^="dropdown-"]').forEach((d) => {
          d.classList.add('hidden');
        });
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ── Entidade: download de laudo com hash SHA-256 ──────────────────────

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
          '⚠️ ATENÇÃO: O hash do laudo não corresponde ao original!',
          { id: `laudo-verify-${lote.laudo_id}`, duration: 8000 }
        );
        return;
      }
      toast.success('✅ Integridade verificada!', {
        id: `laudo-verify-${lote.laudo_id}`,
        duration: 3000,
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.loading('Baixando laudo...', {
        id: `laudo-download-${lote.laudo_id}`,
      });
      const dlRes = await fetch(
        `/api/entidade/laudos/${lote.laudo_id}/download`
      );
      if (!dlRes.ok) throw new Error('Erro ao baixar laudo');
      const blob = await dlRes.blob();
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
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || 'Erro ao baixar laudo', {
        id: `laudo-verify-${lote?.laudo_id}`,
      });
    }
  }, [lote]);

  // ── RH: download de laudo direto ──────────────────────────────────────

  const handleDownloadLaudoRH = useCallback(async () => {
    if (!lote?.laudo_id) return;
    try {
      toast.loading('Baixando laudo...', { id: 'laudo-download' });
      const response = await fetch(`/api/rh/laudos/${lote.laudo_id}/download`);
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
      toast.success('Laudo baixado com sucesso!', { id: 'laudo-download' });
    } catch (err) {
      console.error('Erro ao baixar laudo:', err);
      toast.error('Erro ao baixar laudo', { id: 'laudo-download' });
    }
  }, [lote]);

  // ── Relatórios ────────────────────────────────────────────────────────

  const handleDownloadReport = useCallback(async () => {
    toast.loading('Gerando relatório...', { id: 'report' });
    try {
      const endpoint = isEntidade
        ? `/api/entidade/relatorio-lote-pdf?lote_id=${loteId}`
        : `/api/rh/relatorio-lote-pdf?lote_id=${loteId}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar relatório');
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
      toast.success('Relatório gerado com sucesso!', { id: 'report' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || 'Erro ao gerar relatório', { id: 'report' });
    }
  }, [isEntidade, loteId]);

  const gerarRelatorioSetor = useCallback(
    async (setor: string) => {
      toast.loading(`Gerando relatório do setor ${setor}...`, {
        id: 'rel-setor',
      });
      try {
        const endpoint = isEntidade
          ? `/api/entidade/relatorio-setor-pdf?lote_id=${loteId}&setor=${encodeURIComponent(setor)}`
          : `/api/rh/relatorio-setor-pdf?lote_id=${loteId}&empresa_id=${empresaId}&setor=${encodeURIComponent(setor)}`;
        const response = await fetch(endpoint);
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
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(msg || 'Erro ao gerar relatório', { id: 'rel-setor' });
        throw error;
      }
    },
    [isEntidade, loteId, empresaId]
  );

  // ── Derived state ─────────────────────────────────────────────────────

  const isPronto = useMemo(() => {
    if (!estatisticas) return false;
    return (
      estatisticas.concluidas === estatisticas.total - estatisticas.inativadas
    );
  }, [estatisticas]);

  const backPath = isEntidade ? '/entidade/lotes' : `/rh/empresa/${empresaId}`;

  const backLabel = isEntidade
    ? 'Voltar para Lotes'
    : '← Voltar para Dashboard';

  // ── Solicitar emissão (shared) ────────────────────────────────────────

  const solicitarEmissao = useCallback(async () => {
    if (!lote || !estatisticas) return;
    const totalRef = estatisticas.total;
    const confirmado = confirm(
      `Confirma a solicitação de emissão do laudo para o lote ${lote.id}?\n\n` +
        `O laudo será gerado e enviado para o emissor responsável.\n\n` +
        `💳 A cobrança será gerada pelo total de ${totalRef} avaliação(ões) liberada(s) no lote.`
    );
    if (!confirmado) return;

    try {
      const response = await fetch(`/api/lotes/${lote.id}/solicitar-emissao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Erro ao solicitar emissão');
      toast.success('Emissão solicitada com sucesso!');

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
        if (isEntidade) {
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setTimeout(() => loadLoteData(), 1500);
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || 'Erro ao solicitar emissão');
    }
  }, [lote, estatisticas, isEntidade, loadLoteData]);

  const canSolicitarEmissao = useMemo(() => {
    if (!lote || !estatisticas) return false;
    if (lote.status !== 'concluido') return false;
    if (lote.emissao_solicitada || lote.tem_laudo) return false;
    const totalLiberados = estatisticas.concluidas + estatisticas.pendentes;
    const threshold70 = Math.ceil(0.7 * totalLiberados);
    return totalLiberados > 0 && estatisticas.concluidas >= threshold70;
  }, [lote, estatisticas]);

  // ── Loading/Error states ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Carregando detalhes do lote...</p>
        </div>
      </div>
    );
  }

  if (!isEntidade && permissionErrorHint) {
    return (
      <div className="bg-gray-50">
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-3xl mx-auto mt-6 p-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-700 font-semibold">
                  Acesso restrito
                </div>
                <div className="flex-1 text-sm text-yellow-800">
                  {permissionErrorHint}
                </div>
              </div>
              <div className="mt-4">
                <button
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  onClick={() => router.push(backPath)}
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!lote || !estatisticas) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Lote não encontrado</p>
          <button
            onClick={() => router.push(backPath)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            {backLabel}
          </button>
        </div>
      </div>
    );
  }

  // ── JSX ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-gray-50">
      <main
        className={
          isEntidade
            ? 'max-w-screen-2xl mx-auto'
            : 'container mx-auto px-4 py-6'
        }
      >
        {/* Header */}
        <div className={isEntidade ? 'bg-white shadow-sm border-b' : 'mb-6'}>
          <div
            className={isEntidade ? 'max-w-screen-2xl mx-auto px-4 py-6' : ''}
          >
            <button
              onClick={() => router.push(backPath)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
            >
              {isEntidade && <ArrowLeft size={20} />}
              {backLabel}
            </button>

            <div
              className={
                isEntidade
                  ? ''
                  : 'bg-white rounded-lg shadow-md border border-gray-200 p-6'
              }
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-800">
                      Lote ID: {lote.id}
                    </h1>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        lote.status === 'concluido'
                          ? 'bg-green-100 text-green-800'
                          : lote.status === 'enviado'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {lote.status}
                    </span>
                  </div>

                  {/* Variant-specific info */}
                  {isEntidade ? (
                    <>
                      <p className="text-gray-600">Código: {lote.id}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Tipo: {lote.tipo} | Criado em:{' '}
                        {formatDate(lote.criado_em ?? null)}
                      </p>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                      <div>
                        <span className="text-gray-500">Empresa:</span>{' '}
                        <span className="font-medium">{lote.empresa_nome}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tipo:</span>{' '}
                        <span className="font-medium">
                          {lote.tipo === 'completo'
                            ? 'Completo'
                            : lote.tipo === 'operacional'
                              ? 'Operacional'
                              : 'Gestão'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Liberado em:</span>{' '}
                        <span className="font-medium">
                          {formatarData(lote.liberado_em)}
                        </span>
                      </div>
                      {lote.liberado_por_nome && (
                        <div>
                          <span className="text-gray-500">Liberado por:</span>{' '}
                          <span className="font-medium">
                            {lote.liberado_por_nome}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Entidade: Banner de pagamento pendente */}
                  {isEntidade &&
                    lote.status_pagamento === 'aguardando_pagamento' && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        {pagamentoSincronizando ? (
                          <>
                            <svg
                              className="w-4 h-4 animate-spin flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            <span>Verificando pagamento...</span>
                          </>
                        ) : pagamentoSincronizado ? (
                          <span className="text-green-600 font-semibold">
                            ✅ Pagamento confirmado!
                          </span>
                        ) : (
                          <>
                            <span>💳 Aguardando confirmação de pagamento</span>
                            <button
                              onClick={async () => {
                                setPagamentoSincronizando(true);
                                try {
                                  const res = await fetch(
                                    '/api/pagamento/asaas/sincronizar-lote',
                                    {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        lote_id: parseInt(loteId, 10),
                                      }),
                                    }
                                  );
                                  const data = await res.json();
                                  if (data.synced) {
                                    setPagamentoSincronizado(true);
                                    toast.success('✅ Pagamento confirmado!');
                                    setTimeout(() => loadLoteData(), 1500);
                                  } else {
                                    toast(
                                      'Pagamento ainda não confirmado no gateway.',
                                      { icon: 'ℹ️' }
                                    );
                                  }
                                } catch {
                                  toast.error('Erro ao verificar pagamento');
                                } finally {
                                  setPagamentoSincronizando(false);
                                }
                              }}
                              className="ml-2 underline text-amber-700 hover:text-amber-900 text-xs font-medium"
                            >
                              Verificar agora
                            </button>
                          </>
                        )}
                      </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  {isEntidade && (
                    <button
                      onClick={() => loadLoteData(true)}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                      title="Atualizar dados"
                    >
                      <svg
                        className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Atualizar
                    </button>
                  )}
                  <button
                    onClick={handleDownloadReport}
                    disabled={!isEntidade && !isPronto}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <FileText size={18} />
                    {!isEntidade && !isPronto
                      ? '⏳ Aguardando conclusão'
                      : 'Gerar Relatório PDF'}
                  </button>
                  <button
                    onClick={() => setShowSetorModal(true)}
                    disabled={
                      !['emitido', 'enviado'].includes(
                        lote.laudo_status ?? ''
                      ) || setores.length === 0
                    }
                    title={
                      !['emitido', 'enviado'].includes(lote.laudo_status ?? '')
                        ? 'Aguardando emissão do laudo'
                        : setores.length === 0
                          ? 'Nenhum setor disponível'
                          : 'Gerar relatório por setor'
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <FileText size={18} />
                    Relatório por Setor
                  </button>

                  {/* RH: aviso inativações */}
                  {!isEntidade && estatisticas.inativadas > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      <p className="font-medium">⚠️ Avaliações inativadas</p>
                      <p className="text-xs">
                        {estatisticas.inativadas} inativada
                        {estatisticas.inativadas !== 1 ? 's' : ''} não{' '}
                        {estatisticas.inativadas !== 1 ? 'contam' : 'conta'}{' '}
                        para a prontidão.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emissão section (shared) */}
              {canSolicitarEmissao && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Lote Pronto para Emissão
                        </h4>
                        <p className="text-sm text-gray-700">
                          Mínimo de 70% das avaliações concluídas. Você pode
                          solicitar a emissão do laudo.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={solicitarEmissao}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-base flex items-center justify-center gap-2 shadow-md"
                    >
                      <span className="text-xl">🚀</span>
                      <span>Solicitar Emissão do Laudo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Emissão solicitada */}
              {lote.emissao_solicitada && !lote.tem_laudo && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Emissão Solicitada
                        </h4>
                        <p className="text-sm text-gray-700">
                          A emissão do laudo foi solicitada em{' '}
                          {lote.emissao_solicitado_em
                            ? formatDate(lote.emissao_solicitado_em)
                            : 'data não disponível'}
                          . O laudo está sendo processado.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Laudo emitido */}
              {lote.tem_laudo && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 border-2 border-purple-300 rounded-lg">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Laudo Emitido
                        </h4>
                        <p className="text-sm text-gray-700 mb-2">
                          O laudo deste lote já foi emitido
                          {lote.laudo_status === 'enviado' ? ' e enviado' : ''}.
                          {lote.emitido_em &&
                            ` Emitido em ${formatDate(lote.emitido_em)}`}
                        </p>
                        {(lote.emissor_cpf || lote.emissor_nome) && (
                          <p className="text-xs text-purple-700">
                            Emissor: {lote.emissor_nome || lote.emissor_cpf}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Download Laudo */}
                    {lote.arquivo_remoto_url && (
                      <button
                        onClick={
                          isEntidade
                            ? handleDownloadLaudo
                            : handleDownloadLaudoRH
                        }
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors mb-3 font-medium"
                      >
                        📄 Ver Laudo / Baixar PDF
                      </button>
                    )}

                    {/* Hash de Integridade */}
                    {lote.hash_pdf && lote.arquivo_remoto_url && (
                      <div className="bg-white p-3 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-purple-800 uppercase">
                            🔒 Hash de Integridade (SHA-256)
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard
                                .writeText(lote.hash_pdf!)
                                .then(() => toast.success('Hash copiado!'))
                                .catch(() =>
                                  toast.error('Erro ao copiar hash')
                                );
                            }}
                            className="inline-flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                          >
                            📋 Copiar
                          </button>
                        </div>
                        <code className="text-[10px] font-mono text-gray-700 break-all block">
                          {lote.hash_pdf}
                        </code>
                        <p className="text-xs text-purple-600 mt-2">
                          Use este hash para verificar a autenticidade e
                          integridade do PDF
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className={isEntidade ? 'max-w-screen-2xl mx-auto px-4 py-8' : ''}>
          <LoteStatCards estatisticas={estatisticas} />

          {/* Filtros e Busca */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                {isEntidade && (
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar Funcionário
                  </label>
                )}
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder={
                    isEntidade
                      ? 'Nome, CPF, setor ou função... (ignora acentos)'
                      : 'Buscar por nome, CPF, setor, função, matrícula... (ignora acentos)'
                  }
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {busca !== buscaDebouncedValue && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  </div>
                )}
              </div>

              <div>
                {isEntidade && (
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="inline mr-1" size={16} />
                    Filtrar por Status
                  </label>
                )}
                <select
                  value={filtroStatus}
                  onChange={(e) =>
                    setFiltroStatus(
                      e.target.value as 'todos' | 'concluido' | 'pendente'
                    )
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="todos">
                    {isEntidade ? 'Todos' : 'Todos os status'}
                  </option>
                  <option value="concluido">Concluídas</option>
                  <option value="pendente">Pendentes</option>
                </select>
              </div>

              <div className="self-end">
                <button
                  onClick={limparFiltrosColuna}
                  className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  title="Limpar todos os filtros por coluna"
                >
                  🧹 Limpar Filtros
                </button>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Exibindo {funcionariosFiltrados.length} de {funcionarios.length}{' '}
              funcionários
              {busca !== buscaDebouncedValue && (
                <span className="ml-2 text-gray-500 italic">• Buscando...</span>
              )}
              {Object.values(filtrosColuna).some((arr) => arr.length > 0) && (
                <span className="ml-2 text-blue-600">
                  • Filtros ativos:{' '}
                  {Object.values(filtrosColuna).reduce(
                    (acc, arr) => acc + arr.length,
                    0
                  )}{' '}
                  aplicado(s)
                </span>
              )}
            </div>
          </div>

          {/* Tabela */}
          <FuncionariosTable
            variant={variant}
            funcionariosFiltrados={funcionariosFiltrados}
            funcionariosTotal={funcionarios.length}
            lote={lote}
            busca={busca}
            filtroStatus={filtroStatus}
            filtrosColuna={filtrosColuna}
            setFiltrosColuna={setFiltrosColuna}
            getValoresUnicos={getValoresUnicos}
            toggleFiltroColuna={toggleFiltroColuna}
            onInativar={(avaliacaoId, nome, cpf) =>
              setModalInativar({
                avaliacaoId,
                funcionarioNome: nome,
                funcionarioCpf: cpf,
              })
            }
            onResetar={(avaliacaoId, nome, cpf) =>
              setModalResetar({
                avaliacaoId,
                funcionarioNome: nome,
                funcionarioCpf: cpf,
              })
            }
          />
        </div>
      </main>

      {/* Modais */}
      {modalInativar && (
        <ModalInativarAvaliacao
          avaliacaoId={modalInativar.avaliacaoId}
          funcionarioNome={modalInativar.funcionarioNome}
          funcionarioCpf={modalInativar.funcionarioCpf}
          _loteId={loteId}
          contexto={variant}
          onClose={() => setModalInativar(null)}
          onSuccess={loadLoteData}
        />
      )}

      {modalResetar && (
        <ModalResetarAvaliacao
          avaliacaoId={modalResetar.avaliacaoId}
          loteId={loteId}
          funcionarioNome={modalResetar.funcionarioNome}
          funcionarioCpf={modalResetar.funcionarioCpf}
          basePath={isEntidade ? '/api/entidade' : '/api/rh'}
          onClose={() => setModalResetar(null)}
          onSuccess={loadLoteData}
        />
      )}

      {modalEmissao && (
        <ModalConfirmacaoSolicitar
          isOpen={true}
          onClose={() => {
            setModalEmissao(null);
            if (isEntidade) {
              window.location.reload();
            } else {
              void loadLoteData();
            }
          }}
          loteId={modalEmissao.loteId}
          gestorEmail={modalEmissao.gestorEmail}
          gestorCelular={modalEmissao.gestorCelular}
          contexto={isEntidade ? 'gestor' : 'rh'}
        />
      )}

      <ModalSetorRelatorioPDF
        isOpen={showSetorModal}
        setores={setores}
        onClose={() => setShowSetorModal(false)}
        onConfirm={gerarRelatorioSetor}
      />
    </div>
  );
}
