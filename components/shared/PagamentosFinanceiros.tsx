'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CreditCard,
  Receipt,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';
import ModalRecibo, {
  type PagamentoReciboData,
  type DetalheParcela,
} from '@/components/shared/ModalRecibo';

interface PagamentosFinanceirosProps {
  apiUrl: string; // '/api/rh/pagamentos-laudos' ou '/api/entidade/pagamentos-laudos'
  organizacaoNome: string;
  organizacaoCnpj?: string;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarData(dataStr: string | null | undefined): string {
  if (!dataStr) return '-';
  return new Date(dataStr).toLocaleDateString('pt-BR');
}

function labelMetodo(metodo: string): { label: string; badge: string } {
  const map: Record<string, { label: string; badge: string }> = {
    pix: {
      label: 'PIX',
      badge: 'bg-green-100 text-green-800',
    },
    boleto: {
      label: 'Boleto',
      badge: 'bg-blue-100 text-blue-800',
    },
    cartao: {
      label: 'Cartão de Crédito',
      badge: 'bg-purple-100 text-purple-800',
    },
    avista: {
      label: 'À Vista',
      badge: 'bg-gray-100 text-gray-700',
    },
    parcelado: {
      label: 'Parcelado',
      badge: 'bg-orange-100 text-orange-800',
    },
  };
  return (
    map[metodo?.toLowerCase()] ?? {
      label: metodo,
      badge: 'bg-gray-100 text-gray-700',
    }
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'pago')
    return (
      <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium">
        <CheckCircle size={12} /> Pago
      </span>
    );
  if (status === 'processando')
    return (
      <span className="inline-flex items-center gap-1 text-blue-700 text-xs font-medium">
        <Clock size={12} /> Processando
      </span>
    );
  if (status === 'pendente')
    return (
      <span className="inline-flex items-center gap-1 text-yellow-700 text-xs font-medium">
        <Clock size={12} /> Pendente
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-red-700 text-xs font-medium">
      <AlertCircle size={12} /> Cancelado
    </span>
  );
}

function parseParcelas(
  detalhesParcelas: PagamentoReciboData['detalhesParcelas']
): DetalheParcela[] {
  if (!detalhesParcelas) return [];
  if (Array.isArray(detalhesParcelas))
    return detalhesParcelas as DetalheParcela[];
  if (typeof detalhesParcelas === 'object' && 'parcelas' in detalhesParcelas) {
    return (detalhesParcelas as { parcelas: DetalheParcela[] }).parcelas ?? [];
  }
  return [];
}

export default function PagamentosFinanceiros({
  apiUrl,
  organizacaoNome,
  organizacaoCnpj,
}: PagamentosFinanceirosProps) {
  const [pagamentos, setPagamentos] = useState<PagamentoReciboData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado do modal
  const [modalAberto, setModalAberto] = useState(false);
  const [pagamentoSelecionado, setPagamentoSelecionado] =
    useState<PagamentoReciboData | null>(null);
  const [parcelaIndexSelecionado, setParcelaIndexSelecionado] = useState<
    number | null
  >(null);

  // Estado de expansão por pagamento (para ver parcelas)
  const [expandidos, setExpandidos] = useState<Record<number, boolean>>({});

  const carregarPagamentos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}?_=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setPagamentos(data.pagamentos ?? []);
        setError(null);
      } else {
        setError('Erro ao carregar dados financeiros.');
      }
    } catch {
      setError('Erro ao carregar dados financeiros.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    carregarPagamentos();
  }, [carregarPagamentos]);

  const abrirModalGeral = (pagamento: PagamentoReciboData) => {
    setPagamentoSelecionado(pagamento);
    setParcelaIndexSelecionado(null);
    setModalAberto(true);
  };

  const abrirModalParcela = (
    pagamento: PagamentoReciboData,
    parcelaIdx: number
  ) => {
    setPagamentoSelecionado(pagamento);
    setParcelaIndexSelecionado(parcelaIdx);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setPagamentoSelecionado(null);
    setParcelaIndexSelecionado(null);
  };

  const toggleExpandido = (pagamentoId: number) => {
    setExpandidos((prev) => ({ ...prev, [pagamentoId]: !prev[pagamentoId] }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <CreditCard className="text-primary-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Dados Financeiros de Laudos
            </h2>
            <p className="text-sm text-gray-600">Histórico de pagamentos</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Carregando pagamentos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <CreditCard className="text-primary-600" size={24} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Dados Financeiros de Laudos
          </h2>
        </div>
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={16} />
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={carregarPagamentos}
            className="text-xs text-primary-600 hover:text-primary-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (pagamentos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <CreditCard className="text-primary-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Dados Financeiros de Laudos
            </h2>
            <p className="text-sm text-gray-600">Histórico de pagamentos</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <div className="p-4 bg-gray-100 rounded-full">
            <CreditCard className="text-gray-400" size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              Nenhum pagamento registrado
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Os pagamentos de laudos aparecerão aqui após a contratação do
              primeiro ciclo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        {/* Título do bloco */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-primary-100 rounded-lg">
            <CreditCard className="text-primary-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Dados Financeiros de Laudos
            </h2>
            <p className="text-sm text-gray-600">
              Histórico de pagamentos ({pagamentos.length}{' '}
              {pagamentos.length === 1 ? 'registro' : 'registros'})
            </p>
          </div>
        </div>

        {/* Lista de pagamentos */}
        <div className="space-y-4">
          {pagamentos.map((pag) => {
            // Normalizar parcelas: quando status='pago' mas nenhuma parcela tem pago=true
            // (webhook processou antes do fix), infere parcela 1 como paga.
            const _rawParcelas = parseParcelas(pag.detalhesParcelas);
            const parcelas: ReturnType<typeof parseParcelas> =
              _rawParcelas.length > 0 &&
              !_rawParcelas.some((p) => p.pago) &&
              pag.status === 'pago'
                ? _rawParcelas.map((p, idx) =>
                    idx === 0
                      ? {
                          ...p,
                          pago: true,
                          data_pagamento:
                            pag.dataPagamento ??
                            pag.dataConfirmacao ??
                            pag.criadoEm,
                        }
                      : p
                  )
                : _rawParcelas;
            const ehParcelado = pag.numeroParcelas > 1;
            const expandido = expandidos[pag.id] ?? false;
            const { label: metodoLabel, badge: metodoBadge } = labelMetodo(
              pag.metodo ?? 'avista'
            );
            const dataFormatada = formatarData(
              pag.dataConfirmacao ?? pag.dataPagamento ?? pag.criadoEm
            );

            return (
              <div
                key={pag.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Cabeçalho do pagamento */}
                <div className="p-4 bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    {/* Infos principais */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Lote e Laudo */}
                      {(pag.loteNumero || pag.laudoId) && (
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {pag.loteNumero && (
                            <span>
                              <span className="font-medium text-gray-700">
                                Lote:
                              </span>{' '}
                              {pag.loteCodigo
                                ? `${pag.loteNumero} — ${pag.loteCodigo}`
                                : `Lote ${pag.loteNumero}`}
                            </span>
                          )}
                          {pag.laudoId && (
                            <span>
                              <span className="font-medium text-gray-700">
                                Laudo nº:
                              </span>{' '}
                              {String(pag.laudoId).padStart(6, '0')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Valor e método */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-gray-900">
                          {formatarMoeda(pag.valor)}
                        </span>
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${metodoBadge}`}
                        >
                          {metodoLabel}
                        </span>
                        {ehParcelado && (
                          <span className="text-xs text-gray-500">
                            {pag.numeroParcelas}x de{' '}
                            {formatarMoeda(pag.valor / pag.numeroParcelas)}
                          </span>
                        )}
                      </div>

                      {/* Funcionários e data */}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {pag.numeroFuncionarios && (
                          <span className="flex items-center gap-1">
                            <Users size={11} />
                            {pag.numeroFuncionarios}{' '}
                            {pag.numeroFuncionarios === 1
                              ? 'funcionário'
                              : 'funcionários'}
                            {pag.valorPorFuncionario && (
                              <span className="text-gray-400">
                                {' '}
                                @ {formatarMoeda(pag.valorPorFuncionario)}/func.
                              </span>
                            )}
                          </span>
                        )}
                        <span>{dataFormatada}</span>
                        <StatusBadge status={pag.status} />
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Ícone de recibo geral */}
                      <button
                        onClick={() => abrirModalGeral(pag)}
                        title="Ver recibo"
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Receipt size={16} />
                      </button>

                      {/* Expandir parcelas */}
                      {ehParcelado && (
                        <button
                          onClick={() => toggleExpandido(pag.id)}
                          title={
                            expandido ? 'Ocultar parcelas' : 'Ver parcelas'
                          }
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {expandido ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabela de parcelas (expandida) */}
                {ehParcelado && expandido && (
                  <div className="border-t border-gray-200">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="text-left py-2 pl-4 pr-2 font-semibold text-gray-600">
                            Parcela
                          </th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-600">
                            Valor
                          </th>
                          <th className="text-center py-2 px-2 font-semibold text-gray-600">
                            Vencimento
                          </th>
                          <th className="text-center py-2 px-2 font-semibold text-gray-600">
                            Status
                          </th>
                          <th className="text-center py-2 pl-2 pr-4 font-semibold text-gray-600">
                            Recibo
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {parcelas.length > 0
                          ? parcelas.map((parcela, idx) => (
                              <tr
                                key={parcela.numero}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-2.5 pl-4 pr-2 font-medium text-gray-700">
                                  {parcela.numero}ª
                                </td>
                                <td className="py-2.5 px-2 text-right font-semibold text-gray-800">
                                  {formatarMoeda(parcela.valor)}
                                </td>
                                <td className="py-2.5 px-2 text-center text-gray-600">
                                  {formatarData(parcela.data_vencimento)}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  {parcela.pago ? (
                                    <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                                      <CheckCircle size={11} /> Pago
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-yellow-700 font-medium">
                                      <Clock size={11} /> Pendente
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 pl-2 pr-4 text-center">
                                  <button
                                    onClick={() =>
                                      parcela.pago
                                        ? abrirModalParcela(pag, idx)
                                        : undefined
                                    }
                                    disabled={!parcela.pago}
                                    title={
                                      parcela.pago
                                        ? `Recibo da ${parcela.numero}ª parcela`
                                        : 'Parcela ainda não paga'
                                    }
                                    className={`p-1 rounded transition-colors inline-flex ${
                                      parcela.pago
                                        ? 'text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer'
                                        : 'text-gray-200 cursor-not-allowed'
                                    }`}
                                  >
                                    <Receipt size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          : // Parcelas sem detalhes: renderiza linhas genéricas
                            Array.from(
                              { length: pag.numeroParcelas },
                              (_, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                  <td className="py-2.5 pl-4 pr-2 font-medium text-gray-700">
                                    {i + 1}ª
                                  </td>
                                  <td className="py-2.5 px-2 text-right font-semibold text-gray-800">
                                    {formatarMoeda(
                                      pag.valor / pag.numeroParcelas
                                    )}
                                  </td>
                                  <td className="py-2.5 px-2 text-center text-gray-400">
                                    -
                                  </td>
                                  <td className="py-2.5 px-2 text-center">
                                    <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
                                      <Clock size={11} />-
                                    </span>
                                  </td>
                                  <td className="py-2.5 pl-2 pr-4 text-center">
                                    <button
                                      onClick={() => abrirModalParcela(pag, i)}
                                      title={`Recibo da ${i + 1}ª parcela`}
                                      className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors inline-flex"
                                    >
                                      <Receipt size={14} />
                                    </button>
                                  </td>
                                </tr>
                              )
                            )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Recibo */}
      {modalAberto && pagamentoSelecionado && (
        <ModalRecibo
          pagamento={pagamentoSelecionado}
          organizacaoNome={organizacaoNome}
          organizacaoCnpj={organizacaoCnpj}
          parcelaIndex={parcelaIndexSelecionado}
          onClose={fecharModal}
        />
      )}
    </>
  );
}
