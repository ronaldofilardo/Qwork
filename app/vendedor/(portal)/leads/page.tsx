'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import VendedorNovoLeadModal from './components/NovoLeadModal';
import type { VendedorLead } from './types';

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  convertido: 'Convertido',
  expirado: 'Expirado',
  rejeitado: 'Rejeitado',
};

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  em_analise: 'bg-blue-100 text-blue-700',
  aprovado: 'bg-green-100 text-green-700',
  convertido: 'bg-emerald-100 text-emerald-700',
  expirado: 'bg-gray-100 text-gray-500',
  rejeitado: 'bg-red-100 text-red-700',
};

const STATUS_OPTS = [
  '',
  'pendente',
  'em_analise',
  'aprovado',
  'convertido',
  'expirado',
  'rejeitado',
];

export default function VendedorLeadsPage() {
  const [leads, setLeads] = useState<VendedorLead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNovoLead, setShowNovoLead] = useState(false);
  const [semRepresentante, setSemRepresentante] = useState(false);

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (s) params.set('status', s);
      const res = await fetch(`/api/vendedor/leads?${params.toString()}`);
      if (res.ok) {
        const d = (await res.json()) as {
          leads?: VendedorLead[];
          total?: number;
          sem_representante?: boolean;
        };
        setLeads(d.leads ?? []);
        setTotal(d.total ?? 0);
        setSemRepresentante(d.total === 0 && !!d.sem_representante);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, statusFilter);
  }, [load, page, statusFilter]);

  const handleStatusChange = (s: string) => {
    setStatusFilter(s);
    setPage(1);
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const fmtBRL = (v: string | null) =>
    v
      ? parseFloat(v).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })
      : '—';

  const totalPages = Math.ceil(total / 30);

  // Agrupar por representante para exibição segregada
  const byRep: Record<
    number,
    { nome: string; codigo: string; leads: VendedorLead[] }
  > = {};
  for (const l of leads) {
    if (!byRep[l.representante_id]) {
      byRep[l.representante_id] = {
        nome: l.representante_nome,
        codigo: l.representante_codigo,
        leads: [],
      };
    }
    byRep[l.representante_id].leads.push(l);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Meus Leads</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} lead{total !== 1 ? 's' : ''} submetido
            {total !== 1 ? 's' : ''} por você
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro status */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos os status</option>
            {STATUS_OPTS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s] ?? s}
              </option>
            ))}
          </select>

          {!semRepresentante && (
            <button
              onClick={() => setShowNovoLead(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <Plus size={15} />
              Novo Lead
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          {semRepresentante ? (
            <>
              <p className="text-gray-500 text-sm font-medium">
                Você precisa estar vinculado a um representante para cadastrar
                leads.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Aguarde o seu representante vincular você à equipe.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-sm">Nenhum lead encontrado.</p>
              <p className="text-gray-400 text-xs mt-1">
                Seus leads aparecerão aqui assim que forem submetidos.
              </p>
              <button
                onClick={() => setShowNovoLead(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-semibold mx-auto"
              >
                <Plus size={15} /> Cadastrar primeiro lead
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byRep).map(
            ([repId, { nome, codigo, leads: repLeads }]) => (
              <div key={repId} className="bg-white rounded-xl border">
                {/* Cabeçalho do representante */}
                <div className="px-5 py-3 bg-gray-50 border-b rounded-t-xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-800 text-sm">
                      {nome}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      #{codigo}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {repLeads.length} lead{repLeads.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Tabela de leads do representante */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase tracking-wide">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">
                          Contato
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          CNPJ
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Valor
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          % Comissão
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Enviado em
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Convertido em
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {repLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-900">
                              {lead.contato_nome}
                            </p>
                            {lead.contato_email && (
                              <p className="text-xs text-gray-400">
                                {lead.contato_email}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">
                            {lead.cnpj ? (
                              lead.cnpj.replace(
                                /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                                '$1.$2.$3/$4-$5'
                              )
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                STATUS_COLORS[lead.status] ??
                                'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {STATUS_LABEL[lead.status] ?? lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {fmtBRL(lead.valor_negociado)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {lead.percentual_comissao !== null &&
                            lead.percentual_comissao !== undefined
                              ? `${parseFloat(String(lead.percentual_comissao)).toFixed(2)}%`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {fmtDate(lead.criado_em)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {fmtDate(lead.data_conversao)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
          </button>
        </div>
      )}

      {showNovoLead && (
        <VendedorNovoLeadModal
          onClose={() => setShowNovoLead(false)}
          onSuccess={() => {
            setShowNovoLead(false);
            void load(1, statusFilter);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
