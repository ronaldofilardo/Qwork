'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { foiExibidaParaLote } from '@/components/ModalConfirmacaoSolicitar';
import {
  normalizeString,
  formatarData,
  getClassificacaoLabel,
  getClassificacaoStyle,
  getStatusBadgeInfo,
} from '@/lib/lote/utils';
import type {
  ModalInativarState,
  ModalResetarState,
  ModalEmissaoState,
} from '@/lib/lote/types';
import { useLoteFiltros } from '@/hooks/useLoteFiltros';
import type { LoteInfo, Estatisticas, Funcionario } from './types';

export {
  normalizeString,
  formatarData,
  getClassificacaoLabel,
  getClassificacaoStyle,
  getStatusBadgeInfo,
};

export function useDetalhesLote() {
  const router = useRouter();
  const params = useParams();
  const empresaId = params.id as string;
  const loteId = params.loteId as string;

  // == Core state ==
  const [loading, setLoading] = useState(true);
  const [lote, setLote] = useState<LoteInfo | null>(null);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [permissionErrorHint, setPermissionErrorHint] = useState<string | null>(
    null
  );

  // == Modal state ==
  const [modalInativar, setModalInativar] = useState<ModalInativarState | null>(
    null
  );
  const [modalResetar, setModalResetar] = useState<ModalResetarState | null>(
    null
  );
  const [modalEmissao, setModalEmissao] = useState<ModalEmissaoState | null>(
    null
  );

  // == Filters (delegated to shared hook) ==
  const filtros = useLoteFiltros<Funcionario>({
    funcionarios,
    extraSearchFields: (func, buscaNorm) =>
      !!(func.matricula && normalizeString(func.matricula).includes(buscaNorm)),
  });

  // == Data loading ==
  const loadLoteData = useCallback(async () => {
    try {
      setLoading(true);
      if (!empresaId || !loteId) {
        alert('Par\u00e2metros inv\u00e1lidos');
        router.push('/rh');
        return;
      }

      const response = await fetch(
        `/api/rh/lotes/${loteId}/funcionarios?empresa_id=${empresaId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (
          response.status === 403 &&
          errorData?.error_code === 'permission_clinic_mismatch'
        ) {
          setPermissionErrorHint(
            errorData.hint || 'Acesso negado. Verifique sua cl\u00ednica.'
          );
          setLoading(false);
          return;
        }
        alert(`Erro: ${errorData.error || 'Erro ao carregar dados'}`);
        router.push(`/rh/empresa/${empresaId}`);
        return;
      }

      const data = await response.json();
      if (!data.success) {
        alert(`Erro: ${data.error || 'Resposta inv\u00e1lida do servidor'}`);
        router.push(`/rh/empresa/${empresaId}`);
        return;
      }

      setLote(data.lote);
      setEstatisticas(data.estatisticas);
      setFuncionarios(data.funcionarios || []);
    } catch (error) {
      console.error('Erro ao carregar dados do lote:', error);
      alert('Erro ao carregar dados do lote. Por favor, tente novamente.');
      router.push(`/rh/empresa/${empresaId}`);
    } finally {
      setLoading(false);
    }
  }, [empresaId, loteId, router]);

  // == Session check + initial load ==
  useEffect(() => {
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
            'Acesso negado. Apenas usu\u00e1rios RH podem acessar esta p\u00e1gina.'
          );
          router.push('/dashboard');
          return;
        }
        await loadLoteData();
      } catch (error) {
        console.error('Erro ao verificar sess\u00e3o:', error);
        router.push('/login');
      }
    };
    checkSessionAndLoad();
  }, [loadLoteData, router]);

  // == PDF generators ==
  const gerarRelatorioLote = useCallback(async () => {
    if (!lote) return;
    if (!confirm(`Gerar relat\u00f3rio PDF do lote ${lote.id}?`)) return;
    try {
      const response = await fetch(
        `/api/rh/relatorio-lote-pdf?lote_id=${loteId}`
      );
      if (!response.ok) {
        const error = await response.json();
        alert(
          'Erro ao gerar relat\u00f3rio: ' +
            (error.error || 'Erro desconhecido')
        );
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-lote-${lote.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao gerar relat\u00f3rio:', error);
      alert(
        'Erro ao gerar relat\u00f3rio: ' +
          (error instanceof Error ? error.message : 'Erro desconhecido')
      );
    }
  }, [lote, loteId]);

  const gerarRelatorioFuncionario = useCallback(
    async (cpf: string, nome: string) => {
      if (!confirm(`Gerar relat\u00f3rio PDF de ${nome}?`)) return;
      try {
        const response = await fetch(
          `/api/rh/relatorio-individual-pdf?lote_id=${loteId}&cpf=${cpf}`
        );
        if (!response.ok) {
          const error = await response.json();
          alert(
            'Erro ao gerar relat\u00f3rio: ' +
              (error.error || 'Erro desconhecido')
          );
          return;
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-individual-${nome.replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Erro ao gerar relat\u00f3rio:', error);
        alert(
          'Erro ao gerar relat\u00f3rio: ' +
            (error instanceof Error ? error.message : 'Erro desconhecido')
        );
      }
    },
    [loteId]
  );

  const gerarRelatorioSetor = useCallback(
    async (setor: string) => {
      try {
        const response = await fetch(
          `/api/rh/relatorio-setor-pdf?lote_id=${loteId}&empresa_id=${empresaId}&setor=${encodeURIComponent(setor)}`
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            'Erro ao gerar relat\u00f3rio: ' +
              (error.error || 'Erro desconhecido')
          );
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
      } catch (error) {
        console.error('Erro ao gerar relat\u00f3rio de setor:', error);
        throw error;
      }
    },
    [loteId, empresaId]
  );

  // == Emission ==
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
        setTimeout(() => loadLoteData(), 1500);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao solicitar emiss\u00e3o');
    }
  }, [lote, loadLoteData]);

  // == Laudo download ==
  const downloadLaudo = useCallback(async () => {
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

  // == Helpers ==
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

  // isPronto: delega ao status do lote (trigger DB garante 'concluido' ao atingir 70%)
  // NÃO usa contagem local — evita divergência com a regra do banco
  const isPronto = useMemo(() => {
    if (!lote) return false;
    return [
      'concluido',
      'finalizado',
      'emissao_solicitada',
      'emissao_em_andamento',
    ].includes(lote.status);
  }, [lote]);

  // == Public API ==
  return {
    router,
    empresaId,
    loteId,
    loading,
    permissionErrorHint,
    lote,
    estatisticas,
    funcionarios,
    isPronto,
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
    gerarRelatorioLote,
    gerarRelatorioFuncionario,
    gerarRelatorioSetor,
    solicitarEmissao,
    downloadLaudo,
    abrirModalInativar,
  };
}
