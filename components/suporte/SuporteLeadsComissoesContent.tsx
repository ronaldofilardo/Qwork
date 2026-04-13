'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LeadComissao {
  id: number;
  cnpj: string | null;
  razao_social: string | null;
  tipo_cliente: string;
  valor_negociado: number | null;
  percentual_comissao_representante: number | null;
  percentual_comissao_comercial: number | null;
  valor_custo_fixo_snapshot: number | null;
  requer_aprovacao_comercial: boolean;
  status: string;
  criado_em: string;
  representante_nome: string | null;
  representante_codigo: string | null;
  modelo_comissionamento: string | null;
  rep_percentual_atual: number | null;
  valor_custo_fixo_entidade: number | null;
  valor_custo_fixo_clinica: number | null;
}

interface ApiResponse {
  leads?: LeadComissao[];
  total?: number;
  page?: number;
  limit?: number;
}

const fmtBRL = (v: number | null | undefined) =>
  v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  convertido: 'Convertido',
  expirado: 'Expirado',
};

export function SuporteLeadsComissoesContent() {
  const [leads, setLeads] = useState<LeadComissao[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  const carregar = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/suporte/comissionamento/leads?page=${p}&limit=${limit}`);
      if (res.ok) {
        const d = (await res.json()) as ApiResponse;
        setLeads(d.leads ?? []);
        setTotal(d.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void carregar(page); }, [carregar, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Lead / Comissões</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total} lead{total !== 1 ? 's' : ''} registrados</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-gray-500 text-sm">Nenhum lead encontrado.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Representante</th>
                    <th className="px-3 py-3 text-left font-medium">CNPJ / Razão</th>
                    <th className="px-3 py-3 text-left font-medium">Tipo</th>
                    <th className="px-3 py-3 text-left font-medium">Modelo</th>
                    <th className="px-3 py-3 text-left font-medium">Valor neg.</th>
                    <th className="px-3 py-3 text-left font-medium">Comissão rep</th>
                    <th className="px-3 py-3 text-left font-medium">Status</th>
                    <th className="px-3 py-3 text-left font-medium">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900">{l.representante_nome ?? '—'}</div>
                        {l.representante_codigo && (
                          <div className="text-xs text-gray-400">{l.representante_codigo}</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-gray-700">{l.cnpj ?? '—'}</div>
                        {l.razao_social && (
                          <div className="text-xs text-gray-400 truncate max-w-[160px]">{l.razao_social}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-600 capitalize">{l.tipo_cliente}</td>
                      <td className="px-3 py-3">
                        {l.modelo_comissionamento === 'custo_fixo' ? (
                          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                            Custo Fixo
                          </span>
                        ) : l.modelo_comissionamento === 'percentual' ? (
                          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                            Percentual
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-700">{fmtBRL(l.valor_negociado)}</td>
                      <td className="px-3 py-3 text-gray-600">
                        {l.modelo_comissionamento === 'custo_fixo'
                          ? l.valor_custo_fixo_snapshot != null
                            ? `CF: ${fmtBRL(l.valor_custo_fixo_snapshot)}`
                            : '—'
                          : l.percentual_comissao_representante != null
                            ? `${l.percentual_comissao_representante}%`
                            : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          l.status === 'aprovado' || l.status === 'convertido'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : l.status === 'rejeitado' || l.status === 'expirado'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {STATUS_LABEL[l.status] ?? l.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-400 text-xs">{fmtDate(l.criado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
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
    </div>
  );
}
