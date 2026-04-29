'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import {
  CUSTO_POR_AVALIACAO,
  TIPO_CLIENTE_LABEL,
  calcularValoresComissao,
} from '@/lib/leads-config';
import type { TipoCliente } from '@/lib/leads-config';

interface LeadAprovacao {
  id: number;
  cnpj: string;
  razao_social: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  tipo_cliente: TipoCliente;
  valor_negociado: number | null;
  percentual_comissao: number | null;
  percentual_comissao_representante: number | null;
  modelo_comissionamento: string | null;
  vendedor_nome: string | null;
  num_vidas_estimado: number | null;
  requer_aprovacao_comercial: boolean;
  status: string;
  criado_em: string;
  representante_id: number | null;
  representante_nome: string | null;
}

interface VinculoSemRep {
  id: number;
  tipo_cliente: string;
  nome: string;
  cnpj: string | null;
  status: string;
  total_laudos: number | null;
  valor_total: number | null;
}

export default function ComercialLeadsAprovacaoPage() {
  const [leads, setLeads] = useState<LeadAprovacao[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<'aprovacao' | 'todos' | 'sem-rep'>(
    'aprovacao'
  );

  // Modal de ação
  const [modal, setModal] = useState<{
    lead: LeadAprovacao;
    acao: 'aprovar' | 'rejeitar' | 'remover';
  } | null>(null);
  const [obs, setObs] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroAcao, setErroAcao] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState('');

  // Sem representante
  const [vinculosSemRep, setVinculosSemRep] = useState<VinculoSemRep[]>([]);
  const [loadingSemRep, setLoadingSemRep] = useState(false);
  const [modalAtribuir, setModalAtribuir] = useState<VinculoSemRep | null>(
    null
  );
  const [atribuirRepId, setAtribuirRepId] = useState('');
  const [atribuindoRep, setAtribuindoRep] = useState(false);
  const [erroAtribuir, setErroAtribuir] = useState('');

  const carregar = useCallback(
    async (p: number, m: 'aprovacao' | 'todos' | 'sem-rep') => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p), modo: m });
        const res = await fetch(`/api/comercial/leads?${params.toString()}`);
        if (res.ok) {
          const d = (await res.json()) as {
            leads?: LeadAprovacao[];
            total?: number;
          };
          setLeads(d.leads ?? []);
          setTotal(d.total ?? 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (modo === 'sem-rep') return;
    void carregar(page, modo);
  }, [carregar, page, modo]);

  useEffect(() => {
    if (modo !== 'sem-rep') return;
    setLoadingSemRep(true);
    fetch('/api/comercial/vinculos/sem-rep')
      .then((r) => r.json())
      .then((d: { vinculos?: VinculoSemRep[] }) =>
        setVinculosSemRep(d.vinculos ?? [])
      )
      .catch(() => {})
      .finally(() => setLoadingSemRep(false));
  }, [modo]);

  const executarAcao = async () => {
    if (!modal) return;
    setSalvando(true);
    setErroAcao('');
    try {
      const res = await fetch(`/api/comercial/leads/${modal.lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: modal.acao,
          obs: obs.trim() || undefined,
        }),
      });
      const d = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setErroAcao(d.error ?? 'Erro ao processar');
        return;
      }
      setSucessoMsg(d.message ?? 'Ação realizada com sucesso.');
      setModal(null);
      setObs('');
      setTimeout(() => setSucessoMsg(''), 3000);
      await carregar(page, modo);
    } catch {
      setErroAcao('Erro ao processar ação');
    } finally {
      setSalvando(false);
    }
  };

  const fmtBRL = (v: number | null | undefined) =>
    v != null
      ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '—';

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const getBreakdown = (lead: LeadAprovacao) => {
    const valor = Number(lead.valor_negociado ?? 0);
    const percRep = Number(
      lead.percentual_comissao_representante ?? lead.percentual_comissao ?? 0
    );
    return calcularValoresComissao(valor, percRep, lead.tipo_cliente);
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {modo === 'aprovacao'
              ? 'Aprovação de Leads'
              : modo === 'sem-rep'
                ? 'Vínculos sem Representante'
                : 'Todos os Leads'}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {modo === 'sem-rep'
              ? `${vinculosSemRep.length} vínculo${vinculosSemRep.length !== 1 ? 's' : ''} sem representante`
              : `${total} lead${total !== 1 ? 's' : ''} ${modo === 'aprovacao' ? 'aguardando aprovação comercial' : 'cadastrados'}`}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 text-sm">
          <button
            onClick={() => {
              setModo('aprovacao');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${modo === 'aprovacao' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Aguardando aprovação
          </button>
          <button
            onClick={() => {
              setModo('todos');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${modo === 'todos' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Todos
          </button>
          <button
            onClick={() => {
              setModo('sem-rep');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${modo === 'sem-rep' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Sem representante
          </button>
        </div>
      </div>

      {sucessoMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          {sucessoMsg}
        </div>
      )}

      {modo === 'sem-rep' ? (
        loadingSemRep ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : vinculosSemRep.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
            <p className="text-gray-500 text-sm">
              Nenhum vínculo sem representante.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Nome / CNPJ
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Laudos</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Valor Total
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vinculosSemRep.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {v.nome}
                        </div>
                        {v.cnpj && (
                          <div className="text-xs text-gray-400">{v.cnpj}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">
                        {v.tipo_cliente}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{v.status}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {v.total_laudos ?? 0}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {fmtBRL(v.valor_total)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setModalAtribuir(v);
                            setAtribuirRepId('');
                            setErroAtribuir('');
                          }}
                          className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          Atribuir rep
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
          <p className="text-gray-500 text-sm">
            Nenhum lead pendente de aprovação.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Representante / Vendedor
                    </th>
                    <th className="px-4 py-3 text-left font-medium">CNPJ</th>
                    <th className="px-4 py-3 text-center font-medium">Tipo</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 text-center font-medium">Vidas</th>
                    <th className="px-4 py-3 text-center font-medium">% Rep</th>
                    <th className="px-4 py-3 text-right font-medium">
                      QWork recebe
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Custo/Aval.
                    </th>
                    <th className="px-4 py-3 text-center font-medium">Data</th>
                    <th className="px-4 py-3 text-center font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.map((lead) => {
                    const bd = getBreakdown(lead);
                    const custo = CUSTO_POR_AVALIACAO[lead.tipo_cliente];
                    const percRep = Number(
                      lead.percentual_comissao_representante ??
                        lead.percentual_comissao ??
                        0
                    );
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {lead.representante_nome}
                          </div>
                          <div className="text-xs text-gray-400">
                            #{lead.representante_id}
                          </div>
                          {lead.vendedor_nome && (
                            <div className="text-xs text-purple-600 mt-0.5">
                              Vendedor: {lead.vendedor_nome}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                          {lead.cnpj}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              lead.tipo_cliente === 'entidade'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {TIPO_CLIENTE_LABEL[lead.tipo_cliente]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {fmtBRL(Number(lead.valor_negociado))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {lead.num_vidas_estimado != null ? (
                            <span
                              className={`text-xs font-medium ${lead.num_vidas_estimado >= 200 ? 'text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded' : 'text-gray-600'}`}
                            >
                              {lead.num_vidas_estimado}
                              {lead.num_vidas_estimado >= 200 && ' (volume)'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-xs space-y-0.5">
                            <div className="text-gray-700">
                              <span className="font-semibold">
                                {percRep.toFixed(1)}%
                              </span>{' '}
                              ({fmtBRL(bd.valorRep)})
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-medium ${bd.valorQWork < custo ? 'text-red-600' : 'text-green-600'}`}
                          >
                            {fmtBRL(bd.valorQWork)}
                          </span>
                          {bd.abaixoCusto && (
                            <div className="text-xs text-red-500">
                              abaixo custo
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          R$ {custo},00
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">
                          {fmtDate(lead.criado_em)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {lead.requer_aprovacao_comercial &&
                              lead.status === 'pendente' && (
                                <button
                                  onClick={() =>
                                    setModal({ lead, acao: 'aprovar' })
                                  }
                                  className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                                  title="Aprovar"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              )}
                            {lead.requer_aprovacao_comercial &&
                              lead.status === 'pendente' && (
                                <button
                                  onClick={() =>
                                    setModal({ lead, acao: 'rejeitar' })
                                  }
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Rejeitar"
                                >
                                  <XCircle size={18} />
                                </button>
                              )}
                            {lead.status === 'pendente' && (
                              <button
                                onClick={() =>
                                  setModal({ lead, acao: 'remover' })
                                }
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                                title="Remover"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal atribuir representante */}
      {modalAtribuir && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">
                Atribuir Representante
              </h3>
              <p className="text-xs text-gray-500 mt-1">{modalAtribuir.nome}</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID do Representante
                </label>
                <input
                  type="number"
                  value={atribuirRepId}
                  onChange={(e) => setAtribuirRepId(e.target.value)}
                  placeholder="Ex: 42"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {erroAtribuir && (
                <p className="text-sm text-red-600">{erroAtribuir}</p>
              )}
            </div>
            <div className="px-6 py-4 border-t flex gap-2">
              <button
                onClick={() => setModalAtribuir(null)}
                disabled={atribuindoRep}
                className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!atribuirRepId.trim()) {
                    setErroAtribuir('Informe o ID do representante.');
                    return;
                  }
                  setAtribuindoRep(true);
                  setErroAtribuir('');
                  try {
                    const res = await fetch(
                      `/api/comercial/vinculos/${modalAtribuir.id}/atribuir-rep`,
                      {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          representante_id: parseInt(atribuirRepId),
                        }),
                      }
                    );
                    const d = (await res.json().catch(() => ({}))) as {
                      error?: string;
                    };
                    if (!res.ok) {
                      setErroAtribuir(d.error ?? 'Erro ao atribuir.');
                      return;
                    }
                    setModalAtribuir(null);
                    setSucessoMsg('Representante atribuído com sucesso.');
                    setTimeout(() => setSucessoMsg(''), 3000);
                    setVinculosSemRep((prev) =>
                      prev.filter((v) => v.id !== modalAtribuir.id)
                    );
                  } catch {
                    setErroAtribuir('Erro de conexão.');
                  } finally {
                    setAtribuindoRep(false);
                  }
                }}
                disabled={atribuindoRep}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {atribuindoRep && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {modal.acao === 'aprovar'
                  ? 'Aprovar Lead'
                  : modal.acao === 'remover'
                    ? 'Remover Lead'
                    : 'Rejeitar Lead'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                CNPJ: {modal.lead.cnpj} — {modal.lead.representante_nome}
              </p>
            </div>
            <div className="px-6 py-4 space-y-3">
              {/* Breakdown financeiro */}
              {(() => {
                const bd = getBreakdown(modal.lead);
                const custo = CUSTO_POR_AVALIACAO[modal.lead.tipo_cliente];
                const percRep = Number(
                  modal.lead.percentual_comissao_representante ??
                    modal.lead.percentual_comissao ??
                    0
                );
                return (
                  <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valor negociado</span>
                      <span className="font-semibold">
                        {fmtBRL(Number(modal.lead.valor_negociado))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Comissão rep ({percRep.toFixed(1)}%)
                      </span>
                      <span className="text-gray-700">
                        {fmtBRL(bd.valorRep)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5">
                      <span
                        className={
                          bd.abaixoCusto
                            ? 'text-red-600 font-semibold'
                            : 'text-green-600 font-semibold'
                        }
                      >
                        QWork recebe
                      </span>
                      <span
                        className={
                          bd.abaixoCusto
                            ? 'text-red-600 font-semibold'
                            : 'text-green-600 font-semibold'
                        }
                      >
                        {fmtBRL(bd.valorQWork)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>
                        Custo por avaliação ({modal.lead.tipo_cliente})
                      </span>
                      <span>R$ {custo},00</span>
                    </div>
                    {bd.abaixoCusto && (
                      <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded px-2 py-1.5 mt-1">
                        <AlertTriangle
                          size={12}
                          className="text-red-500 shrink-0"
                        />
                        <p className="text-red-700">
                          Abaixo do custo por avaliação! Aprovação com desconto
                          ou margem negativa.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
              {modal.acao === 'rejeitar' && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle
                    size={14}
                    className="text-amber-600 mt-0.5 shrink-0"
                  />
                  <p className="text-xs text-amber-700">
                    O lead será rejeitado e o representante será notificado.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observação{' '}
                  {modal.acao === 'rejeitar' ? '(recomendado)' : '(opcional)'}
                </label>
                <textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Motivo ou observação..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
                />
              </div>
              {erroAcao && <p className="text-sm text-red-600">{erroAcao}</p>}
            </div>
            <div className="px-6 py-4 border-t flex gap-2">
              <button
                onClick={() => {
                  setModal(null);
                  setObs('');
                  setErroAcao('');
                }}
                disabled={salvando}
                className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={executarAcao}
                disabled={salvando}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  modal.acao === 'aprovar'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {salvando && <Loader2 size={14} className="animate-spin" />}
                {modal.acao === 'aprovar'
                  ? 'Aprovar'
                  : modal.acao === 'remover'
                    ? 'Remover'
                    : 'Rejeitar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
