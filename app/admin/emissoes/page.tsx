'use client';

import { useState, useEffect, useCallback } from 'react';
import { SolicitacaoEmissao } from '@/lib/types/emissao-pagamento';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Link as LinkIcon,
  Copy,
} from 'lucide-react';

export default function EmissoesAdminPage() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoEmissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<number | null>(null);
  const [valores, setValores] = useState<Record<number, string>>({});
  const [linkGerado, setLinkGerado] = useState<{
    lote_id: number;
    link: string;
  } | null>(null);

  const mostrarNotificacao = (msg: string) => {
    alert(msg);
  };

  const carregarSolicitacoes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/emissoes');
      const data = await res.json();

      if (res.ok) {
        setSolicitacoes(data.solicitacoes);
      } else {
        mostrarNotificacao(
          `Erro: ${data.error || 'Erro ao carregar solicitações'}`
        );
      }
    } catch (error) {
      void error;
      mostrarNotificacao('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarSolicitacoes();
  }, [carregarSolicitacoes]);

  const definirValor = async (loteId: number) => {
    const valor = parseFloat(valores[loteId]);

    if (!valor || valor <= 0) {
      mostrarNotificacao('Valor inválido: Informe um valor maior que zero');
      return;
    }

    setProcessando(loteId);
    try {
      const res = await fetch(`/api/admin/emissoes/${loteId}/definir-valor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_por_funcionario: valor }),
      });

      const data = await res.json();

      if (res.ok) {
        mostrarNotificacao(
          `Valor de R$ ${valor.toFixed(2)} definido com sucesso`
        );
        await carregarSolicitacoes();
      } else {
        mostrarNotificacao(`Erro: ${data.error}`);
      }
    } catch (error) {
      void error;
      mostrarNotificacao('Erro ao definir valor');
    } finally {
      setProcessando(null);
    }
  };

  const gerarLink = async (loteId: number) => {
    setProcessando(loteId);
    try {
      const res = await fetch(`/api/admin/emissoes/${loteId}/gerar-link`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setLinkGerado({
          lote_id: loteId,
          link: data.link_pagamento,
        });
        mostrarNotificacao('Link de pagamento gerado com sucesso');
        await carregarSolicitacoes();
      } else {
        mostrarNotificacao(`Erro: ${data.error}`);
      }
    } catch (error) {
      void error;
      mostrarNotificacao('Erro ao gerar link');
    } finally {
      setProcessando(null);
    }
  };

  const copiarLink = (link: string) => {
    navigator.clipboard.writeText(link);
    mostrarNotificacao('Link copiado para a área de transferência');
  };

  const getStatusBadge = (status: string | null) => {
    const statusColors: Record<string, string> = {
      aguardando_cobranca:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      aguardando_pagamento:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      pago: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };

    const statusLabels: Record<string, string> = {
      aguardando_cobranca: 'Aguardando Valor',
      aguardando_pagamento: 'Aguardando Pagamento',
      pago: 'Pago',
    };

    const colors =
      statusColors[status || 'default'] ||
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    const label = statusLabels[status || 'default'] || 'Indefinido';

    return (
      <span className={`px-2 py-1 rounded text-sm font-medium ${colors}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Clock className="animate-spin h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Solicitações de Emissão</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie solicitações de emissão de laudos e defina valores
        </p>
      </div>

      {solicitacoes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <p>Nenhuma solicitação pendente</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {solicitacoes.map((sol) => (
            <div
              key={sol.lote_id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Lote #{sol.lote_id}</h3>
                  {getStatusBadge(sol.status_pagamento)}
                </div>
              </div>
              <div className="p-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Solicitante</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {sol.tipo_solicitante === 'rh'
                          ? `${sol.clinica_nome || 'Clínica'}`
                          : `${sol.entidade_nome || 'Entidade'}`}
                      </p>
                      {sol.empresa_nome && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Empresa: {sol.empresa_nome}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Avaliações</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {sol.num_avaliacoes_concluidas}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Solicitado em</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {new Date(sol.solicitacao_emissao_em!).toLocaleString(
                          'pt-BR'
                        )}
                      </p>
                    </div>
                    {sol.valor_total_calculado && (
                      <div>
                        <p className="font-medium">Valor Total</p>
                        <p className="text-lg font-bold text-green-600">
                          R$ {sol.valor_total_calculado.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  {sol.status_pagamento === 'aguardando_cobranca' && (
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">
                          Valor por funcionário (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="Ex: 50.00"
                          value={valores[sol.lote_id] || ''}
                          onChange={(e) =>
                            setValores({
                              ...valores,
                              [sol.lote_id]: e.target.value,
                            })
                          }
                          disabled={processando === sol.lote_id}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                        />
                      </div>
                      <button
                        onClick={() => definirValor(sol.lote_id)}
                        disabled={
                          processando === sol.lote_id || !valores[sol.lote_id]
                        }
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Definir e Gerar Link
                      </button>
                    </div>
                  )}

                  {sol.valor_por_funcionario &&
                    sol.status_pagamento === 'aguardando_cobranca' && (
                      <button
                        onClick={() => gerarLink(sol.lote_id)}
                        disabled={processando === sol.lote_id}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Gerar Link de Pagamento
                      </button>
                    )}

                  {sol.status_pagamento === 'aguardando_pagamento' &&
                    sol.link_pagamento_token && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">
                          Link de pagamento gerado
                        </p>
                        <div className="flex gap-2">
                          <input
                            readOnly
                            value={`${window.location.origin}/pagamento/emissao/${sol.link_pagamento_token}`}
                            className="flex-1 px-3 py-2 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={() =>
                              copiarLink(
                                `${window.location.origin}/pagamento/emissao/${sol.link_pagamento_token}`
                              )
                            }
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          ⚠️ Link de uso único
                        </p>
                      </div>
                    )}

                  {sol.status_pagamento === 'pago' && (
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="font-medium">Pagamento confirmado</p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Método: {sol.pagamento_metodo} •{' '}
                        {sol.pagamento_parcelas}x
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Pago em:{' '}
                        {new Date(sol.pago_em!).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {linkGerado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md w-full">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <h2 className="font-bold text-lg">Link de Pagamento Gerado</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Link:</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={linkGerado.link}
                      className="flex-1 px-3 py-2 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => copiarLink(linkGerado.link)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  ⚠️ Link de uso único: será invalidado após o pagamento
                </p>
                <button
                  onClick={() => setLinkGerado(null)}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
