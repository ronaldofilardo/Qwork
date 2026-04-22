'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Representante } from '../types';
import {
  STATUS_OPTIONS,
  STATUS_BADGE,
  TRANSICOES,
  ACAO_LABEL,
  fmt,
} from '../constants';

interface RepresentantesTabProps {
  reps: Representante[];
  total: number;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  statusFiltro: string;
  setStatusFiltro: (v: string) => void;
  busca: string;
  setBusca: (v: string) => void;
  loading: boolean;
  actionLoading: number | null;
  reenviarConviteLoading: number | null;
  solicitarDadosLoading: number | null;
  repDocsLoading: Record<number, boolean>;
  openRepDoc: (
    repId: number,
    docType: 'cpf' | 'cnpj' | 'cpf_resp'
  ) => Promise<void>;
  onExecutarAcao: (
    acaoPendente: { id: number; novoStatus: string },
    motivo: string
  ) => Promise<void>;
  onReenviarConvite: (representanteId: number) => Promise<void>;
  onSolicitarDadosBancarios: (representanteId: number) => Promise<void>;
  basePath?: string;
}

export function RepresentantesTab({
  reps,
  total,
  page,
  setPage,
  statusFiltro,
  setStatusFiltro,
  busca,
  setBusca,
  loading,
  actionLoading,
  reenviarConviteLoading,
  solicitarDadosLoading,
  repDocsLoading,
  openRepDoc,
  onExecutarAcao,
  onReenviarConvite,
  onSolicitarDadosBancarios,
  basePath = '/admin/representantes',
}: RepresentantesTabProps) {
  const router = useRouter();
  const [detalhes, setDetalhes] = useState<Representante | null>(null);
  const [motivoAcao, setMotivoAcao] = useState('');
  const [acaoPendente, setAcaoPendente] = useState<{
    id: number;
    novoStatus: string;
  } | null>(null);

  return (
    <>
      {/* Modal de confirmação de ação */}
      {acaoPendente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">
              Confirmar:{' '}
              {ACAO_LABEL[acaoPendente.novoStatus] ?? acaoPendente.novoStatus}
            </h2>
            <p className="text-sm text-gray-600">
              Alterar status do representante para{' '}
              <strong>{acaoPendente.novoStatus}</strong>?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo (opcional)
              </label>
              <textarea
                value={motivoAcao}
                onChange={(e) => setMotivoAcao(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                rows={2}
                placeholder="Ex.: Documentação aprovada, Violação de contrato..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAcaoPendente(null);
                  setMotivoAcao('');
                }}
                className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onExecutarAcao(acaoPendente, motivoAcao);
                  setAcaoPendente(null);
                  setMotivoAcao('');
                  setDetalhes(null);
                }}
                disabled={actionLoading !== null}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer de detalhes */}
      {detalhes && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-end z-40"
          onClick={() => setDetalhes(null)}
        >
          <div
            className="bg-white h-full w-full max-w-md shadow-xl p-6 space-y-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{detalhes.nome}</h2>
              <button
                onClick={() => setDetalhes(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['E-mail', detalhes.email],
                ['Tipo', detalhes.tipo_pessoa.toUpperCase()],
                ['Status', detalhes.status],
                [
                  'Leads',
                  `${detalhes.leads_convertidos}/${detalhes.total_leads} convertidos`,
                ],
                ['Vínculos Ativos', detalhes.vinculos_ativos],
                ['Total Pago', fmt(detalhes.valor_total_pago)],
                [
                  '% Comissão',
                  detalhes.percentual_comissao != null &&
                  detalhes.percentual_comissao !== ''
                    ? `${parseFloat(detalhes.percentual_comissao).toFixed(2)}%`
                    : '—',
                ],
                [
                  'Cadastrado',
                  new Date(detalhes.criado_em).toLocaleDateString('pt-BR'),
                ],
                [
                  'Dados Bancários',
                  detalhes.dados_bancarios_status === 'confirmado'
                    ? `✅ Confirmado em ${detalhes.dados_bancarios_confirmado_em ? new Date(detalhes.dados_bancarios_confirmado_em).toLocaleDateString('pt-BR') : '—'}`
                    : detalhes.dados_bancarios_status === 'pendente_confirmacao'
                      ? `🔴 Pendente (sol. em ${detalhes.dados_bancarios_solicitado_em ? new Date(detalhes.dados_bancarios_solicitado_em).toLocaleDateString('pt-BR') : '—'})`
                      : detalhes.dados_bancarios_status === 'rejeitado'
                        ? '❌ Rejeitado'
                        : '— Não informado',
                ],
              ].map(([l, v]) => (
                <div
                  key={l}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <span className="text-gray-500">{l}</span>
                  <span className="font-medium text-gray-900 text-right max-w-xs">
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                Ações disponíveis
              </h3>
              <div className="space-y-2">
                {detalhes.status === 'apto' &&
                  detalhes.dados_bancarios_status !== 'confirmado' && (
                    <button
                      onClick={() => onSolicitarDadosBancarios(detalhes.id)}
                      disabled={solicitarDadosLoading === detalhes.id}
                      className="w-full text-left px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      {solicitarDadosLoading === detalhes.id
                        ? 'Solicitando...'
                        : '📋 Solicitar dados bancários'}
                    </button>
                  )}
                {(detalhes.status === 'aguardando_senha' ||
                  detalhes.status === 'expirado') && (
                  <button
                    onClick={() => onReenviarConvite(detalhes.id)}
                    disabled={reenviarConviteLoading === detalhes.id}
                    className="w-full text-left px-3 py-2 border border-amber-300 bg-amber-50 rounded-lg text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                  >
                    {reenviarConviteLoading === detalhes.id
                      ? 'Enviando...'
                      : '🔗 Reenviar link de convite'}
                  </button>
                )}
                {(TRANSICOES[detalhes.status] ?? []).map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      setAcaoPendente({ id: detalhes.id, novoStatus: s })
                    }
                    className="w-full text-left px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  >
                    {ACAO_LABEL[s] ?? s}
                  </button>
                ))}
                {(TRANSICOES[detalhes.status] ?? []).length === 0 && (
                  <p className="text-sm text-gray-400 italic">
                    Nenhuma ação disponível (status terminal)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar nome ou e-mail..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFiltro}
          onChange={(e) => {
            setStatusFiltro(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === '' ? 'Todos os status' : s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : reps.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          Nenhum representante encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Representante</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Leads</th>
                <th className="px-4 py-3 text-center">Vínculos</th>
                <th className="px-4 py-3 text-center">% Comissão</th>
                <th className="px-4 py-3 text-right">Total Pago</th>
                <th className="px-4 py-3 text-center">Docs</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reps.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.nome}</div>
                    <div className="text-xs text-gray-400">
                      {r.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {r.leads_convertidos}/{r.total_leads}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {r.vinculos_ativos} ativos
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.percentual_comissao != null &&
                    r.percentual_comissao !== '' ? (
                      <span className="font-medium text-blue-700">
                        {parseFloat(r.percentual_comissao).toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">
                    {fmt(r.valor_total_pago)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {r.tipo_pessoa === 'pf' ? (
                        <button
                          onClick={() => openRepDoc(r.id, 'cpf')}
                          disabled={repDocsLoading[r.id]}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                        >
                          {repDocsLoading[r.id] ? '...' : '📄 Doc'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openRepDoc(r.id, 'cnpj')}
                            disabled={repDocsLoading[r.id]}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                          >
                            {repDocsLoading[r.id] ? '...' : '📄 CNPJ'}
                          </button>
                          <button
                            onClick={() => openRepDoc(r.id, 'cpf_resp')}
                            disabled={repDocsLoading[r.id]}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                          >
                            {repDocsLoading[r.id] ? '...' : '📄 CPF Resp.'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => router.push(`${basePath}/${r.id}`)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Ver Perfil →
                      </button>
                      {(r.status === 'aguardando_senha' ||
                        r.status === 'expirado') && (
                        <button
                          onClick={() => onReenviarConvite(r.id)}
                          disabled={reenviarConviteLoading === r.id}
                          title="Reenviar link de convite de criação de senha"
                          className="text-xs text-amber-600 hover:text-amber-700 border border-amber-300 rounded px-2 py-0.5 hover:bg-amber-50 disabled:opacity-50"
                        >
                          {reenviarConviteLoading === r.id
                            ? '...'
                            : '🔗 Reenviar'}
                        </button>
                      )}
                      <button
                        onClick={() => setDetalhes(r)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ⋯
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
