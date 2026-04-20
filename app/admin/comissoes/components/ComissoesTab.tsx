'use client';

import type { Comissao, Resumo } from '../types';
import {
  STATUS_BADGE,
  ACOES_POR_STATUS,
  ACAO_LABEL,
  ACOES_COMERCIAL_BLOQUEADAS,
  fmt,
} from '../types';

interface ComissoesTabProps {
  comissoes: Comissao[];
  resumo: Resumo | null;
  total: number;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  statusFiltro: string;
  setStatusFiltro: (s: string) => void;
  loading: boolean;
  actionLoading: number | null;
  onSetAcaoPendente: (v: { comissao: Comissao; acao: string }) => void;
  /** Quando 'comercial', filtra ações bloqueadas (liberar, pagar). */
  perfil?: string;
}

export function ComissoesTab({
  comissoes,
  resumo,
  total,
  page,
  setPage,
  statusFiltro,
  setStatusFiltro,
  loading,
  actionLoading,
  onSetAcaoPendente,
  perfil,
}: ComissoesTabProps) {
  return (
    <>
      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'A Pagar',
              value: fmt(resumo.valor_a_pagar),
              icon: '💳',
              cor: 'text-blue-700',
            },
            {
              label: 'Liberado',
              value: fmt(resumo.valor_liberado),
              icon: '🟢',
              cor: 'text-purple-700',
            },
            {
              label: 'Total Pago',
              value: fmt(resumo.valor_pago_total),
              icon: '✅',
              cor: 'text-green-700',
            },
            {
              label: 'No Ciclo',
              value: resumo.pendentes_consolidacao,
              icon: '📅',
              cor: 'text-blue-700',
            },
            {
              label: 'Liberadas',
              value: resumo.liberadas,
              icon: '🟢',
              cor: 'text-purple-700',
            },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border p-4">
              <span className="text-2xl">{c.icon}</span>
              <div className={`text-xl font-bold mt-2 ${c.cor}`}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros de status */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setStatusFiltro('');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFiltro === '' ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
        >
          Todos
        </button>
        {Object.entries(STATUS_BADGE).map(([s, { label, cor }]) => (
          <button
            key={s}
            onClick={() => {
              setStatusFiltro(statusFiltro === s ? '' : s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${cor} ${statusFiltro === s ? 'ring-2 ring-offset-1 ring-blue-400' : 'opacity-70 hover:opacity-100'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : comissoes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          Nenhuma comissão encontrada.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-3 py-3 text-left">Representante</th>
                <th className="px-3 py-3 text-left">Cliente</th>
                <th className="px-3 py-3 text-left">Lote</th>
                <th className="px-3 py-3 text-right">Valor Total</th>
                <th className="px-3 py-3 text-center">Comissão</th>
                <th className="px-3 py-3 text-center">Parcelas</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">Mês Pag.</th>
                <th className="px-3 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {comissoes.map((c) => {
                const rawAcoes = ACOES_POR_STATUS[c.status] ?? [];
                const acoes =
                  perfil === 'comercial'
                    ? rawAcoes.filter(
                        (a) =>
                          !ACOES_COMERCIAL_BLOQUEADAS.includes(
                            a as (typeof ACOES_COMERCIAL_BLOQUEADAS)[number]
                          )
                      )
                    : rawAcoes;
                const valorTotal = Number(c.valor_laudo ?? 0);
                const totalParcelas = Math.max(
                  1,
                  Number(c.total_parcelas ?? 1)
                );
                const valorParcela = valorTotal / totalParcelas;
                const percentual = Number(c.percentual_comissao ?? 0);
                const usaCustoFixo =
                  percentual <= 0 && Number(c.valor_comissao ?? 0) > 0;
                // % efetivo do rep (usa valor atual do representante como fonte primária)
                const repPct = parseFloat(
                  String(
                    c.representante_percentual ?? c.percentual_comissao ?? '0'
                  )
                );
                const rawComPct = parseFloat(
                  String(c.vinculo_percentual_comercial ?? '0')
                );
                // Fallback de exibição: se comercial zerado e rep > 0, derivar 40−rep%
                const comPct =
                  rawComPct === 0 && repPct > 0 ? 40 - repPct : rawComPct;
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900">
                        {c.representante_nome}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {c.representante_codigo} ·{' '}
                        {c.representante_tipo_pessoa?.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {c.entidade_nome}
                    </td>
                    <td className="px-3 py-3 text-gray-500 font-mono text-xs">
                      {c.lote_pagamento_id ? (
                        <span title={c.numero_laudo ?? undefined}>
                          Lote #{c.lote_pagamento_id}
                        </span>
                      ) : (
                        (c.numero_laudo ?? '—')
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700">
                      <div className="font-medium">{fmt(c.valor_laudo)}</div>
                      {totalParcelas > 1 && (
                        <div className="text-[11px] text-gray-500">
                          Parcela: {fmt(valorParcela)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600 text-xs">
                      {usaCustoFixo ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                          Fixo
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-green-700 font-semibold">
                            {repPct}% Rep
                          </div>
                          <div className="text-green-700">
                            {fmt(c.valor_comissao)}
                          </div>
                          <div className="text-blue-600 font-semibold mt-1">
                            {comPct}% Com
                          </div>
                          <div className="text-blue-600">
                            {fmt(c.valor_comissao_comercial ?? 0)}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-xs">
                      {(c.total_parcelas ?? 1) > 1 ? (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                          {c.parcela_numero ?? 1}/{c.total_parcelas}
                        </span>
                      ) : (
                        <span className="text-gray-400">À vista</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[c.status]?.cor ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_BADGE[c.status]?.label ?? c.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">
                      {c.mes_pagamento
                        ? new Date(
                            c.mes_pagamento.substring(0, 10) + 'T12:00:00'
                          ).toLocaleDateString('pt-BR', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 justify-center flex-wrap">
                        {acoes.map((acao) => (
                          <button
                            key={acao}
                            onClick={() =>
                              onSetAcaoPendente({ comissao: c, acao })
                            }
                            className="text-xs px-2 py-1 border rounded hover:bg-gray-50 hover:border-blue-300 transition-colors whitespace-nowrap"
                            disabled={actionLoading !== null}
                          >
                            {ACAO_LABEL[acao]}
                          </button>
                        ))}
                        {acoes.length === 0 && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {total > 30 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Pág. {page} de {Math.ceil(total / 30)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 30)}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </>
  );
}
