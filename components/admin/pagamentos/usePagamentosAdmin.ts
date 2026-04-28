'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Solicitacao, FilterTab, ModalLinkState } from './types';

export function usePagamentosAdmin() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('aguardando_cobranca');
  const [modalLink, setModalLink] = useState<ModalLinkState | null>(null);
  const [processando, setProcessando] = useState<number | null>(null);
  const [valorInput, setValorInput] = useState<Record<number, string>>({});
  const [codigoRepInput, setCodigoRepInput] = useState<Record<number, string>>(
    {}
  );
  const [manutencaoCount, setManutencaoCount] = useState(0);

  const carregarSolicitacoes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/emissoes');
      if (!response.ok) throw new Error('Erro ao carregar solicitações');
      const data = await response.json();
      console.log('[DEBUG] Solicitações carregadas:', {
        total: data.total,
        count: data.solicitacoes?.length || 0,
        solicitacoes: data.solicitacoes,
      });
      setSolicitacoes(data.solicitacoes || []);
      // Pré-popular valorInput para solicitações aguardando cobrança:
      // - custo_fixo: usar valor_custo_fixo_snapshot (valor unitário por avaliação)
      // - percentual: usar lead_valor_negociado (% negociado)
      const preFill: Record<number, string> = {};
      for (const s of data.solicitacoes || []) {
        if (s.status_pagamento !== 'aguardando_cobranca') continue;
        // Prioridade: lead_valor_negociado > valor_custo_fixo_snapshot > valor_negociado_vinculo
        const val =
          s.lead_valor_negociado ??
          s.valor_custo_fixo_snapshot ??
          s.valor_negociado_vinculo;
        if (val != null && Number(val) > 0) {
          preFill[s.lote_id] =
            `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      }
      setValorInput((prev) => ({ ...preFill, ...prev }));
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      alert('Erro ao carregar solicitações de emissão');
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarManutencaoCount = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/manutencao/relatorio');
      if (!response.ok)
        throw new Error('Erro ao carregar contagem de manutenção');

      const data = await response.json();
      const total =
        (data.entidades?.length || 0) + (data.empresas?.length || 0);

      setManutencaoCount(total);
    } catch (error) {
      console.error('Erro ao carregar contagem de manutenção:', error);
      setManutencaoCount(0);
    }
  }, []);

  useEffect(() => {
    carregarSolicitacoes();
    carregarManutencaoCount();
  }, [carregarSolicitacoes, carregarManutencaoCount]);

  const handleDefinirValor = async (loteId: number) => {
    const valorString = valorInput[loteId];
    if (!valorString) {
      alert('Informe o valor por funcionário');
      return;
    }
    const valor = parseFloat(
      valorString.replace(/[^\d,]/g, '').replace(',', '.')
    );
    if (isNaN(valor) || valor <= 0) {
      alert('Valor inválido');
      return;
    }
    try {
      setProcessando(loteId);
      const response = await fetch(
        `/api/admin/emissoes/${loteId}/definir-valor`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor_por_funcionario: valor }),
        }
      );
      if (!response.ok) throw new Error('Erro ao definir valor');
      alert('Valor definido com sucesso!');
      setValorInput((prev) => ({ ...prev, [loteId]: '' }));
      await carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao definir valor:', error);
      alert('Erro ao definir valor');
    } finally {
      setProcessando(null);
    }
  };

  const handleGerarLink = async (loteId: number) => {
    try {
      setProcessando(loteId);
      const response = await fetch(`/api/admin/emissoes/${loteId}/gerar-link`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Erro ao gerar link');
      const data = await response.json();
      const solicitacao = solicitacoes.find((s) => s.lote_id === loteId);
      if (solicitacao) {
        setModalLink({
          isOpen: true,
          token: data.token,
          loteId: loteId,
          nomeTomador: solicitacao.nome_tomador,
          valorTotal:
            data.valor_total ?? solicitacao.valor_total_calculado ?? 0,
          numAvaliacoes:
            data.num_avaliacoes ??
            solicitacao.num_avaliacoes_cobradas ??
            solicitacao.num_avaliacoes_concluidas,
        });
      }
      await carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      alert('Erro ao gerar link de pagamento');
    } finally {
      setProcessando(null);
    }
  };

  const handleVerLink = (solicitacao: Solicitacao) => {
    if (solicitacao.link_pagamento_token) {
      setModalLink({
        isOpen: true,
        token: solicitacao.link_pagamento_token,
        loteId: solicitacao.lote_id,
        nomeTomador: solicitacao.nome_tomador,
        valorTotal: solicitacao.valor_total_calculado || 0,
        numAvaliacoes:
          solicitacao.num_avaliacoes_cobradas ??
          solicitacao.num_avaliacoes_concluidas,
      });
    }
  };

  const handleVerificarPagamento = async (loteId: number) => {
    try {
      setProcessando(loteId);
      const response = await fetch('/api/pagamento/asaas/sincronizar-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lote_id: loteId }),
      });
      if (!response.ok) throw new Error('Erro ao verificar pagamento');
      const data = await response.json();
      if (data.synced) {
        await carregarSolicitacoes();
        alert('✅ Pagamento confirmado pelo gateway! Status atualizado.');
      } else {
        alert(
          `ℹ️ ${data.message || 'Pagamento ainda não confirmado pelo gateway. Tente novamente em instantes.'}`
        );
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      alert('Erro ao verificar pagamento. Tente novamente.');
    } finally {
      setProcessando(null);
    }
  };

  const handleDeletarLink = async (loteId: number) => {
    if (
      !confirm(
        'Deletar o link de pagamento deste lote? Ele voltará para "Aguardando Cobrança" e o tomador não terá mais acesso ao link.'
      )
    )
      return;
    try {
      setProcessando(loteId);
      const response = await fetch(
        `/api/admin/emissoes/${loteId}/deletar-link`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Erro ao deletar link');
        return;
      }
      await carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao deletar link:', error);
      alert('Erro ao deletar link. Tente novamente.');
    } finally {
      setProcessando(null);
    }
  };

  const handleCancelarCobranca = async (loteId: number) => {
    if (
      !confirm(
        'Cancelar esta cobrança? O lote voltará ao estado anterior à solicitação de emissão.'
      )
    )
      return;
    try {
      setProcessando(loteId);
      const response = await fetch(
        `/api/admin/emissoes/${loteId}/cancelar-cobranca`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Erro ao cancelar cobrança');
        return;
      }
      await carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao cancelar cobrança:', error);
      alert('Erro ao cancelar cobrança. Tente novamente.');
    } finally {
      setProcessando(null);
    }
  };

  const handleDisponibilizarLink = async (loteId: number) => {
    try {
      setProcessando(loteId);
      const response = await fetch(
        `/api/admin/emissoes/${loteId}/disponibilizar-link`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Erro ao disponibilizar link');
        return;
      }
      alert('✅ Link disponibilizado na conta do tomador!');
      await carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao disponibilizar link:', error);
      alert('Erro ao disponibilizar link. Tente novamente.');
    } finally {
      setProcessando(null);
    }
  };

  // Auto-reconcilia silenciosamente ao entrar na aba de pagamentos pendentes
  useEffect(() => {
    if (filterTab !== 'aguardando_pagamento' || loading) return;
    const pendentes = solicitacoes.filter(
      (s) => s.status_pagamento === 'aguardando_pagamento'
    );
    if (pendentes.length === 0) return;

    const reconciliar = async () => {
      let houveAtualizacao = false;
      await Promise.all(
        pendentes.map(async (s) => {
          try {
            const res = await fetch('/api/pagamento/asaas/sincronizar-lote', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lote_id: s.lote_id }),
            });
            const data = await res.json();
            if (data.synced) houveAtualizacao = true;
          } catch {
            // falha silenciosa
          }
        })
      );
      if (houveAtualizacao) await carregarSolicitacoes();
    };

    reconciliar();
  }, [filterTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const getSolicitacoesFiltradas = () => {
    if (filterTab === 'todos') return solicitacoes;
    if (filterTab === 'manutencao') return []; // gerenciado pelo ManutencaoTab
    return solicitacoes.filter((s) => s.status_pagamento === filterTab);
  };

  const getTabCount = (tab: FilterTab) => {
    if (tab === 'todos') return solicitacoes.length;
    if (tab === 'a_vencer') return -1; // Contagem gerenciada pelo componente ParcelasAVencer
    if (tab === 'manutencao') return manutencaoCount;
    return solicitacoes.filter((s) => s.status_pagamento === tab).length;
  };

  const handleConfirmarPagamento = async (
    loteId: number,
    metodo: string,
    parcelas: number
  ) => {
    try {
      setProcessando(loteId);
      const response = await fetch(
        `/api/admin/emissoes/${loteId}/confirmar-pagamento`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metodo_pagamento: metodo,
            num_parcelas: parcelas,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Erro ao confirmar pagamento');
        return;
      }
      alert('✅ Pagamento confirmado com sucesso!');
      await carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      alert('Erro ao confirmar pagamento. Tente novamente.');
    } finally {
      setProcessando(null);
    }
  };

  const handleVincularRepresentante = async (loteId: number) => {
    const codigo = codigoRepInput[loteId]?.trim();
    if (!codigo) {
      alert('Informe o código do representante');
      return;
    }
    const solicitacao = solicitacoes.find((s) => s.lote_id === loteId);
    if (!solicitacao?.entidade_id && !solicitacao?.clinica_id) {
      alert('Entidade/clínica não encontrada para esta solicitação.');
      return;
    }
    try {
      setProcessando(loteId);
      // Monta payload: gestor usa entidade_id; clínica pura usa clinica_id
      const vinculoPayload: Record<string, unknown> = { codigo };
      if (solicitacao.entidade_id) {
        vinculoPayload.entidade_id = solicitacao.entidade_id;
      } else {
        vinculoPayload.clinica_id = solicitacao.clinica_id;
      }
      const response = await fetch(
        '/api/admin/comissoes/vincular-representante',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vinculoPayload),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Erro ao vincular representante');
        return;
      }
      alert(`Representante ${data.representante_nome} vinculado com sucesso!`);
      setCodigoRepInput((prev) => ({ ...prev, [loteId]: '' }));
      await carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao vincular representante:', error);
      alert('Erro ao vincular representante');
    } finally {
      setProcessando(null);
    }
  };

  return {
    solicitacoes,
    loading,
    filterTab,
    setFilterTab,
    modalLink,
    setModalLink,
    processando,
    valorInput,
    setValorInput,
    codigoRepInput,
    setCodigoRepInput,
    carregarSolicitacoes,
    handleDefinirValor,
    handleGerarLink,
    handleVerLink,
    handleVerificarPagamento,
    handleDeletarLink,
    handleCancelarCobranca,
    handleDisponibilizarLink,
    handleConfirmarPagamento,
    handleVincularRepresentante,
    getSolicitacoesFiltradas,
    getTabCount,
  };
}

export function formatCurrency(value: number | null) {
  if (value === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
