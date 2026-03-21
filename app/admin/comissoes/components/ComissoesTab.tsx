'use client';

import type { Comissao, Resumo } from '../types';
import { STATUS_BADGE, ACOES_POR_STATUS, ACAO_LABEL, fmt } from '../types';

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
              label: 'Total Pago',
              value: fmt(resumo.valor_pago_total),
              icon: '✅',
              cor: 'text-green-700',
            },
            {
              label: 'Aguardando NF',
              value: resumo.pendentes_nf,
              icon: '📄',
              cor: 'text-blue-700',
            },
            {
              label: 'NF em Análise',
              value: resumo.em_analise,
              icon: '🔍',
              cor: 'text-indigo-700',
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
                <th className="px-3 py-3 text-left">Laudo</th>
                <th className="px-3 py-3 text-right">Comissão</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-center">NF/RPA</th>
                <th className="px-3 py-3 text-left">Mês Pag.</th>
                <th className="px-3 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {comissoes.map((c) => {
                const acoes = ACOES_POR_STATUS[c.status] ?? [];
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
                      {c.numero_laudo ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-green-700">
                      {fmt(c.valor_comissao)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[c.status]?.cor ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_BADGE[c.status]?.label ?? c.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {c.nf_rpa_aprovada_em ? (
                        <span className="text-xs text-green-700">✅</span>
                      ) : c.nf_rpa_enviada_em ? (
                        <a
                          href={`/api/admin/comissoes/${c.id}/nf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                          title={c.nf_nome_arquivo || 'Ver NF'}
                        >
                          📄 Ver
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">
                      {c.mes_pagamento
                        ? new Date(c.mes_pagamento).toLocaleDateString(
                            'pt-BR',
                            { month: 'short', year: 'numeric' }
                          )
                        : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 justify-center flex-wrap">
                        {c.nf_rpa_enviada_em && !c.nf_rpa_aprovada_em && (
                          <a
                            href={`/api/admin/comissoes/${c.id}/nf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 border border-blue-300 rounded text-blue-700 hover:bg-blue-50 transition-colors whitespace-nowrap"
                            title={c.nf_nome_arquivo || 'Ver NF/RPA'}
                          >
                            📄 Ver NF
                          </a>
                        )}
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
