'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Link2,
  Users,
} from 'lucide-react';
import ModalLinkPagamentoEmissao from '../modals/ModalLinkPagamentoEmissao';

interface Solicitacao {
  lote_id: number;
  status_pagamento: 'aguardando_cobranca' | 'aguardando_pagamento' | 'pago';
  solicitacao_emissao_em: string;
  valor_por_funcionario: number | null;
  link_pagamento_token: string | null;
  link_pagamento_enviado_em: string | null;
  pagamento_metodo: string | null;
  pagamento_parcelas: number | null;
  pago_em: string | null;
  empresa_nome: string;
  nome_tomador: string;
  solicitante_nome: string;
  solicitante_cpf: string;
  num_avaliacoes_concluidas: number;
  valor_total_calculado: number | null;
  lote_criado_em: string;
  lote_liberado_em: string;
  lote_status: string;
}

type FilterTab =
  | 'todos'
  | 'aguardando_cobranca'
  | 'aguardando_pagamento'
  | 'pago';

export default function PagamentosContent() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('aguardando_cobranca');
  const [modalLink, setModalLink] = useState<{
    isOpen: boolean;
    token: string;
    loteId: number;
    nomeTomador: string;
    valorTotal: number;
    numAvaliacoes: number;
  } | null>(null);
  const [processando, setProcessando] = useState<number | null>(null);
  const [valorInput, setValorInput] = useState<Record<number, string>>({});

  const carregarSolicitacoes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/emissoes');
      if (!response.ok) throw new Error('Erro ao carregar solicitações');

      const data = await response.json();
      
      // Debug temporário
      console.log('[DEBUG] Solicitações carregadas:', {
        total: data.total,
        count: data.solicitacoes?.length || 0,
        solicitacoes: data.solicitacoes
      });
      
      setSolicitacoes(data.solicitacoes || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      alert('Erro ao carregar solicitações de emissão');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarSolicitacoes();
  }, [carregarSolicitacoes]);

  const handleDefinirValor = async (loteId: number) => {
    const valorString = valorInput[loteId];
    if (!valorString) {
      alert('Informe o valor por funcionário');
      return;
    }

    // Remove formatação e converte para número
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
          valorTotal: solicitacao.valor_total_calculado || 0,
          numAvaliacoes: solicitacao.num_avaliacoes_concluidas,
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
        numAvaliacoes: solicitacao.num_avaliacoes_concluidas,
      });
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSolicitacoesFiltradas = () => {
    if (filterTab === 'todos') return solicitacoes;
    return solicitacoes.filter((s) => s.status_pagamento === filterTab);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      aguardando_cobranca: {
        icon: Clock,
        text: 'Aguardando Cobrança',
        class: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      },
      aguardando_pagamento: {
        icon: CreditCard,
        text: 'Aguardando Pagamento',
        class: 'bg-blue-100 text-blue-800 border-blue-300',
      },
      pago: {
        icon: CheckCircle,
        text: 'Pago',
        class: 'bg-green-100 text-green-800 border-green-300',
      },
    };

    const badge =
      badges[status as keyof typeof badges] || badges['aguardando_cobranca'];
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${badge.class}`}
      >
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  const getTabCount = (tab: FilterTab) => {
    if (tab === 'todos') return solicitacoes.length;
    return solicitacoes.filter((s) => s.status_pagamento === tab).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando solicitações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Pagamentos de Emissão
          </h2>
          <p className="text-gray-600 mt-1">
            Gerencie as solicitações de pagamento para emissão de laudos
          </p>
        </div>
        <button
          onClick={carregarSolicitacoes}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Atualizar
        </button>
      </div>

      {/* Tabs de Filtro */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            {
              key: 'aguardando_cobranca' as FilterTab,
              label: 'Aguardando Cobrança',
              icon: Clock,
            },
            {
              key: 'aguardando_pagamento' as FilterTab,
              label: 'Aguardando Pagamento',
              icon: CreditCard,
            },
            { key: 'pago' as FilterTab, label: 'Pagos', icon: CheckCircle },
            { key: 'todos' as FilterTab, label: 'Todos', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const count = getTabCount(tab.key);
            const isActive = filterTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                <span
                  className={`
                  ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                  ${
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Lista de Solicitações */}
      {getSolicitacoesFiltradas().length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma solicitação encontrada
          </h3>
          <p className="text-gray-600">
            {filterTab === 'todos'
              ? 'Não há solicitações de emissão no momento.'
              : `Não há solicitações com status "${filterTab}".`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {getSolicitacoesFiltradas().map((solicitacao) => (
            <div
              key={solicitacao.lote_id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Lote #{solicitacao.lote_id}
                    </h3>
                    {getStatusBadge(solicitacao.status_pagamento)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tomador:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {solicitacao.nome_tomador}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Solicitante:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {solicitacao.solicitante_nome}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Avaliações:</span>
                      <span className="font-medium text-gray-900">
                        {solicitacao.num_avaliacoes_concluidas}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Solicitado em:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatDate(solicitacao.solicitacao_emissao_em)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações de Pagamento */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">
                      Valor por Funcionário
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(solicitacao.valor_por_funcionario)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Valor Total</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(solicitacao.valor_total_calculado)}
                    </p>
                  </div>
                  {solicitacao.pago_em && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Pago em</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(solicitacao.pago_em)}
                      </p>
                    </div>
                  )}
                  {solicitacao.pagamento_metodo && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Método</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {solicitacao.pagamento_metodo}
                        {solicitacao.pagamento_parcelas &&
                        solicitacao.pagamento_parcelas > 1
                          ? ` (${solicitacao.pagamento_parcelas}x)`
                          : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações baseadas no status */}
              <div className="flex items-center gap-3">
                {solicitacao.status_pagamento === 'aguardando_cobranca' && (
                  <>
                    <input
                      type="text"
                      placeholder="R$ 0,00"
                      value={valorInput[solicitacao.lote_id] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const formatted = (Number(value) / 100).toLocaleString(
                          'pt-BR',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        );
                        setValorInput((prev) => ({
                          ...prev,
                          [solicitacao.lote_id]: `R$ ${formatted}`,
                        }));
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={processando === solicitacao.lote_id}
                    />
                    <button
                      onClick={() => handleDefinirValor(solicitacao.lote_id)}
                      disabled={
                        processando === solicitacao.lote_id ||
                        !valorInput[solicitacao.lote_id]
                      }
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Definir Valor
                    </button>
                    {solicitacao.valor_por_funcionario &&
                      solicitacao.valor_por_funcionario > 0 && (
                        <button
                          onClick={() => handleGerarLink(solicitacao.lote_id)}
                          disabled={processando === solicitacao.lote_id}
                          className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          <Link2 className="w-4 h-4" />
                          Gerar Link
                        </button>
                      )}
                  </>
                )}

                {solicitacao.status_pagamento === 'aguardando_pagamento' && (
                  <button
                    onClick={() => handleVerLink(solicitacao)}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Link / QR Code
                  </button>
                )}

                {solicitacao.status_pagamento === 'pago' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Pagamento confirmado</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Link/QR Code */}
      {modalLink && (
        <ModalLinkPagamentoEmissao
          isOpen={modalLink.isOpen}
          onClose={() => setModalLink(null)}
          token={modalLink.token}
          loteId={modalLink.loteId}
          nomeTomador={modalLink.nomeTomador}
          valorTotal={modalLink.valorTotal}
          numAvaliacoes={modalLink.numAvaliacoes}
        />
      )}
    </div>
  );
}
