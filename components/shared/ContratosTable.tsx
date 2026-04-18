'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, UserPlus, FileDown, ShieldOff, X } from 'lucide-react';
import { VincularRepDrawer } from '@/components/comercial/contratos/VincularRepDrawer';

interface ContratoRow {
  contratante_nome: string;
  contratante_cnpj: string;
  contratante_id: number;
  vinculo_id: number | null;
  tipo_contratante: string;
  rep_nome: string | null;
  rep_codigo: string | null;
  rep_cpf: string | null;
  lead_data: string | null;
  contrato_data: string | null;
  tempo_dias: string | null;
  tipo_comissionamento: string | null;
  percentual_comissao: string | null;
  valor_custo_fixo: string | null;
  valor_negociado: string | null;
  total_laudos: string | null;
  total_lotes: string | null;
  avaliacoes_concluidas: string;
  valor_avaliacao: string | null;
  valor_total: string | null;
  perc_comercial: string | null;
  valor_comercial: string | null;
  perc_rep: string | null;
  valor_rep: string | null;
  valor_qwork?: string | null;
  isento_pagamento?: boolean;
}

interface ContratosTableProps {
  endpoint: string;
  showQWork?: boolean;
  allowVincular?: boolean;
  comercial?: boolean;
  allowGerarContrato?: boolean;
  allowIsentarParceiro?: boolean;
}

const fmtBRL = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === '') return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
};

const fmtCpf = (cpf: string | null | undefined) => {
  if (!cpf) return '—';
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export function ContratosTable({
  endpoint,
  showQWork = false,
  allowVincular = false,
  comercial = false,
  allowGerarContrato = false,
  allowIsentarParceiro = false,
}: ContratosTableProps) {
  const [data, setData] = useState<ContratoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [drawerRow, setDrawerRow] = useState<ContratoRow | null>(null);
  const [filtroRep, setFiltroRep] = useState<string>('');
  const [showIsentarModal, setShowIsentarModal] = useState(false);
  const [cnpjIsentar, setCnpjIsentar] = useState('');
  const [isentarLoading, setIsentarLoading] = useState(false);
  const [isentarErro, setIsentarErro] = useState<string | null>(null);
  const [isentarSucesso, setIsentarSucesso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Erro ${res.status}`);
      }
      const j = await res.json();
      setData(j.contratos ?? []);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const handleIsentar = async () => {
    const cnpjLimpo = cnpjIsentar.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      setIsentarErro('CNPJ inválido — deve ter 14 dígitos');
      return;
    }
    setIsentarLoading(true);
    setIsentarErro(null);
    setIsentarSucesso(null);
    try {
      const res = await fetch('/api/admin/tomadores/isentar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj: cnpjLimpo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
      setIsentarSucesso(`${json.nome} (${json.tipo}) marcado como isento com sucesso.`);
      setCnpjIsentar('');
      void carregar();
    } catch (e) {
      setIsentarErro(e instanceof Error ? e.message : 'Erro ao isentar parceiro');
    } finally {
      setIsentarLoading(false);
    }
  };

  const handleDownloadContrato = async (row: ContratoRow) => {
    try {
      const res = await fetch(
        `/api/suporte/contratos/${row.contratante_id}/pdf?tipo=${row.tipo_contratante}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? 'Erro ao baixar contrato');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${row.contratante_id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao baixar contrato');
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Contratos</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Um registro por tomador — laudos e comissões acumulados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allowIsentarParceiro && (
            <button
              onClick={() => { setShowIsentarModal(true); setIsentarErro(null); setIsentarSucesso(null); setCnpjIsentar(''); }}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
            >
              <ShieldOff size={14} />
              Isentar Parceiro
            </button>
          )}
          <button
            onClick={() => void carregar()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {erro && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ⚠️ {erro}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 rounded-full border-2 border-green-500 border-t-transparent" />
            <p className="text-sm text-gray-400">Carregando contratos...</p>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-400">Nenhum contrato encontrado.</p>
        </div>
      ) : (
        <>
          {comercial &&
            (() => {
              const reps = Array.from(
                new Set(data.map((r) => r.rep_nome).filter(Boolean))
              ).sort() as string[];
              return reps.length > 1 ? (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500 shrink-0">
                    Filtrar por representante
                  </label>
                  <select
                    value={filtroRep}
                    onChange={(e) => setFiltroRep(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                  >
                    <option value="">Todos</option>
                    {reps.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null;
            })()}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div
              className="overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {comercial ? (
                      <>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          Representante
                          <br />
                          <span className="font-normal text-xs text-gray-400">
                            CPF
                          </span>
                        </th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          Entidade/Clínica
                          <br />
                          <span className="font-normal text-xs text-gray-400">
                            CNPJ
                          </span>
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600">
                          Lead
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600">
                          Contrato
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600">
                          Tempo
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600">
                          Tipo
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          Comissão
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          Entidade/Clínica
                          <br />
                          <span className="font-normal text-xs text-gray-400">
                            CNPJ
                          </span>
                        </th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          Representante
                          <br />
                          <span className="font-normal text-xs text-gray-400">
                            CPF
                          </span>
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600">
                          Lead
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600">
                          Contrato
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600">
                          Tempo
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600">
                          Tipo
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          Valor/%
                        </th>
                        <th className="text-right px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          Com. Com.
                        </th>
                        <th className="text-right px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          Com. Rep.
                        </th>
                        {showQWork && (
                          <th className="text-right px-4 py-3 font-semibold text-gray-600">
                            QWork
                          </th>
                        )}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(comercial && filtroRep
                    ? data.filter((r) => r.rep_nome === filtroRep)
                    : data
                  ).map((row, idx) => {
                    const visibleData =
                      comercial && filtroRep
                        ? data.filter((r) => r.rep_nome === filtroRep)
                        : data;
                    const percComercial = row.perc_comercial
                      ? parseFloat(row.perc_comercial).toFixed(1)
                      : null;
                    const percRep = row.perc_rep
                      ? parseFloat(row.perc_rep).toFixed(1)
                      : null;
                    const isClinica = row.tipo_contratante === 'clinica';
                    const isPercentual =
                      row.tipo_comissionamento === 'percentual';
                    const semRep = !row.rep_nome;
                    const rowClickable = allowVincular && semRep;

                    const tdRep = (
                      <td className="px-4 py-3">
                        {row.rep_nome ? (
                          <div>
                            <p className="font-medium text-gray-900 text-xs leading-tight">
                              {row.rep_nome}
                              {row.rep_codigo && (
                                <span className="ml-1 text-[10px] font-mono font-semibold text-gray-500">
                                  [{row.rep_codigo}]
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                              {fmtCpf(row.rep_cpf)}
                            </p>
                          </div>
                        ) : allowVincular ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                            <UserPlus size={12} />
                            Clique para vincular
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    );

                    const tdEntidade = (
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isClinica
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-purple-50 text-purple-600'
                            }`}
                          >
                            {isClinica ? 'CLÍ' : 'ENT'}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 text-xs leading-tight flex items-center gap-1">
                              {row.contratante_nome || '—'}
                              {row.isento_pagamento && (
                                <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                  ISENTO
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono">
                              {row.contratante_cnpj || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                    );

                    return (
                      <tr
                        key={`${row.vinculo_id ?? `novinc-${row.contratante_id}`}-${idx}`}
                        onClick={
                          rowClickable ? () => setDrawerRow(row) : undefined
                        }
                        className={`border-b border-gray-50 transition-colors ${
                          idx === visibleData.length - 1 ? 'border-b-0' : ''
                        } ${
                          rowClickable
                            ? 'hover:bg-green-50/60 cursor-pointer'
                            : 'hover:bg-gray-50/50'
                        }`}
                      >
                        {comercial ? (
                          <>
                            {tdRep}
                            {tdEntidade}
                          </>
                        ) : (
                          <>
                            {tdEntidade}
                            {tdRep}
                          </>
                        )}

                        {/* Lead date */}
                        <td className="text-center px-3 py-3 text-xs text-gray-600">
                          {fmtDate(row.lead_data)}
                        </td>

                        {/* Contrato date */}
                        <td className="text-center px-3 py-3 text-xs text-gray-600">
                          <div className="inline-flex items-center gap-1">
                            <span>{fmtDate(row.contrato_data)}</span>
                            {allowGerarContrato && row.contrato_data && (
                              <button
                                onClick={(e) => { e.stopPropagation(); void handleDownloadContrato(row); }}
                                title="Baixar contrato PDF"
                                className="text-gray-400 hover:text-gray-700 transition-colors"
                              >
                                <FileDown size={13} />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Tempo (dias) */}
                        <td className="text-center px-3 py-3">
                          {row.tempo_dias ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {Math.round(parseFloat(row.tempo_dias))}d
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Tipo comissionamento */}
                        <td className="text-center px-3 py-3">
                          {row.tipo_comissionamento ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                isPercentual
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {isPercentual ? '%' : 'Fixo'}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Coluna Comissão — visível na view comercial e admin */}
                        {comercial && (
                          <td className="text-center px-3 py-3 text-xs">
                            {isPercentual ? (
                              <div className="space-y-0.5">
                                {row.perc_comercial ? (
                                  <p className="font-semibold text-indigo-700">
                                    Com.{' '}
                                    {parseFloat(row.perc_comercial).toFixed(1)}%
                                  </p>
                                ) : null}
                                {row.perc_rep !== null &&
                                row.perc_rep !== undefined ? (
                                  <p className="font-semibold text-blue-700">
                                    Rep. {parseFloat(row.perc_rep).toFixed(1)}%
                                  </p>
                                ) : row.percentual_comissao ? (
                                  <p className="font-semibold text-blue-700">
                                    Rep.{' '}
                                    {parseFloat(
                                      row.percentual_comissao
                                    ).toFixed(1)}
                                    %
                                  </p>
                                ) : null}
                                {!row.perc_comercial &&
                                  !row.perc_rep &&
                                  !row.percentual_comissao && (
                                    <span className="text-gray-300">—</span>
                                  )}
                              </div>
                            ) : row.tipo_comissionamento === 'custo_fixo' ? (
                              <span className="font-semibold text-amber-700">
                                {fmtBRL(
                                  row.valor_negociado ?? row.valor_custo_fixo
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        )}

                        {!comercial && (
                          <>
                            {/* Valor/% */}
                            <td className="text-center px-3 py-3 text-xs">
                              {isPercentual ? (
                                <span className="font-semibold text-gray-900">
                                  {row.percentual_comissao
                                    ? `${parseFloat(row.percentual_comissao).toFixed(1)}%`
                                    : '—'}
                                </span>
                              ) : row.tipo_comissionamento === 'custo_fixo' ? (
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-gray-900">
                                    {fmtBRL(
                                      row.valor_negociado ??
                                        row.valor_custo_fixo
                                    )}
                                    <span className="text-gray-400 font-normal">
                                      /avaliação
                                    </span>
                                  </p>
                                  {row.valor_custo_fixo &&
                                    row.valor_negociado && (
                                      <p className="text-[10px] text-amber-600">
                                        Custo: {fmtBRL(row.valor_custo_fixo)} →
                                        Rep:{' '}
                                        {fmtBRL(
                                          String(
                                            parseFloat(row.valor_negociado) -
                                              parseFloat(row.valor_custo_fixo)
                                          )
                                        )}
                                      </p>
                                    )}
                                </div>
                              ) : (
                                <span className="font-semibold text-gray-900">
                                  {fmtBRL(
                                    row.valor_negociado ?? row.valor_custo_fixo
                                  )}
                                </span>
                              )}
                            </td>

                            {/* Com. Com. (comercial) */}
                            <td className="text-right px-3 py-3 text-xs">
                              <div className="space-y-0.5">
                                {percComercial ? (
                                  <>
                                    <p className="font-semibold text-blue-700">
                                      {percComercial}%
                                    </p>
                                    <p className="text-blue-500">
                                      {fmtBRL(row.valor_comercial)}
                                    </p>
                                  </>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </div>
                            </td>

                            {/* Com. Rep. */}
                            <td className="text-right px-3 py-3 text-xs">
                              {percRep !== null ? (
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-green-700">
                                    {percRep}%
                                  </p>
                                  <p className="text-green-500">
                                    {fmtBRL(row.valor_rep)}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>

                            {/* QWork (admin only) */}
                            {showQWork && (
                              <td className="text-right px-4 py-3 text-xs">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-gray-900">
                                    {fmtBRL(row.valor_qwork)}
                                  </p>
                                </div>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-gray-50 bg-gray-50/50 text-xs text-gray-400">
              {
                (comercial && filtroRep
                  ? data.filter((r) => r.rep_nome === filtroRep)
                  : data
                ).length
              }{' '}
              registro{data.length !== 1 ? 's' : ''}
            </div>
          </div>
        </>
      )}

      {allowVincular && (
        <VincularRepDrawer
          vinculoId={drawerRow?.vinculo_id ?? null}
          contratanteId={drawerRow?.contratante_id ?? null}
          contratanteTipo={
            (drawerRow?.tipo_contratante as 'clinica' | 'entidade' | null) ??
            null
          }
          contratanteNome={drawerRow?.contratante_nome ?? ''}
          onClose={() => setDrawerRow(null)}
          onSaved={() => void carregar()}
        />
      )}

      {/* Modal Isentar Parceiro */}
      {showIsentarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Isentar Parceiro</h3>
              <button onClick={() => setShowIsentarModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Informe o CNPJ do parceiro para conceder isenção total de cobranças (laudos e multa por inatividade).
            </p>
            <input
              type="text"
              value={cnpjIsentar}
              onChange={(e) => setCnpjIsentar(e.target.value)}
              placeholder="CNPJ do parceiro (apenas números)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-3"
            />
            {isentarErro && (
              <p className="text-sm text-red-600 mb-3">⚠️ {isentarErro}</p>
            )}
            {isentarSucesso && (
              <p className="text-sm text-green-700 mb-3">✓ {isentarSucesso}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowIsentarModal(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                onClick={() => void handleIsentar()}
                disabled={isentarLoading}
                className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {isentarLoading ? 'Salvando...' : 'Confirmar Isenção'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
