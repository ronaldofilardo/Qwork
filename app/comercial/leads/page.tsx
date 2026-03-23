'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CUSTO_PRODUTO, TIPO_CLIENTE_LABEL } from '@/lib/leads-config';
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
  criado_em: string;
  representante_nome: string;
  representante_codigo: string;
}

export default function ComercialLeadsAprovacaoPage() {
  const [leads, setLeads] = useState<LeadAprovacao[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal de ação
  const [modal, setModal] = useState<{
    lead: LeadAprovacao;
    acao: 'aprovar' | 'rejeitar';
  } | null>(null);
  const [obs, setObs] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroAcao, setErroAcao] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState('');

  const carregar = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
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
  }, []);

  useEffect(() => {
    void carregar(page);
  }, [carregar, page]);

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
      await carregar(page);
    } catch {
      setErroAcao('Erro ao processar ação');
    } finally {
      setSalvando(false);
    }
  };

  const fmtBRL = (v: number | null) =>
    v != null
      ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '—';

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const calcValorQWork = (lead: LeadAprovacao) => {
    const v = Number(lead.valor_negociado ?? 0);
    const c = Number(lead.percentual_comissao ?? 0);
    return v * (1 - c / 100);
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Aprovação de Leads
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {total} lead{total !== 1 ? 's' : ''} aguardando aprovação comercial
        </p>
      </div>

      {sucessoMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          {sucessoMsg}
        </div>
      )}

      {loading ? (
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
                      Representante
                    </th>
                    <th className="px-4 py-3 text-left font-medium">CNPJ</th>
                    <th className="px-4 py-3 text-center font-medium">Tipo</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 text-center font-medium">
                      Comissão
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Valor QWork
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Custo Ref.
                    </th>
                    <th className="px-4 py-3 text-center font-medium">Data</th>
                    <th className="px-4 py-3 text-center font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.map((lead) => {
                    const valorQWork = calcValorQWork(lead);
                    const custo = CUSTO_PRODUTO[lead.tipo_cliente];
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {lead.representante_nome}
                          </div>
                          <div className="text-xs text-gray-400">
                            #{lead.representante_codigo}
                          </div>
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
                        <td className="px-4 py-3 text-center text-gray-700">
                          {lead.percentual_comissao != null
                            ? `${Number(lead.percentual_comissao).toFixed(1)}%`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-medium ${valorQWork < custo ? 'text-red-600' : 'text-green-600'}`}
                          >
                            {fmtBRL(valorQWork)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          R$ {custo},00
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">
                          {fmtDate(lead.criado_em)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                setModal({ lead, acao: 'aprovar' })
                              }
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                              title="Aprovar"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() =>
                                setModal({ lead, acao: 'rejeitar' })
                              }
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Rejeitar"
                            >
                              <XCircle size={18} />
                            </button>
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

      {/* Modal de confirmação */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {modal.acao === 'aprovar' ? 'Aprovar Lead' : 'Rejeitar Lead'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                CNPJ: {modal.lead.cnpj} — {modal.lead.representante_nome}
              </p>
            </div>
            <div className="px-6 py-4 space-y-3">
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
                {modal.acao === 'aprovar' ? 'Aprovar' : 'Rejeitar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
