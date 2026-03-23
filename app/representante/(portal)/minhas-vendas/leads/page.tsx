'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import RepNovoLeadDiretoModal from './components/NovoLeadDiretoModal';

interface LeadDireto {
  id: number;
  status: string;
  contato_nome: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  cnpj: string | null;
  razao_social: string | null;
  valor_negociado: string | null;
  percentual_comissao: string | number | null;
  criado_em: string;
  data_conversao: string | null;
  tipo_cliente: string | null;
  requer_aprovacao_comercial: boolean;
}

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

export default function MinhasVendasLeadsPage() {
  const [leads, setLeads] = useState<LeadDireto[]>([]);
  const [total, setTotal] = useState(0);
  const [contagens, setContagens] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNovoLead, setShowNovoLead] = useState(false);

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (s) params.set('status', s);
      const res = await fetch(
        `/api/representante/minhas-vendas/leads?${params.toString()}`
      );
      if (res.ok) {
        const d = (await res.json()) as {
          leads?: LeadDireto[];
          total?: number;
          contagens?: Record<string, number>;
        };
        setLeads(d.leads ?? []);
        setTotal(d.total ?? 0);
        setContagens(d.contagens ?? {});
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

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Meus Leads — Vendas Diretas
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} lead{total !== 1 ? 's' : ''} criado{total !== 1 ? 's' : ''}{' '}
            diretamente por você
          </p>
        </div>

        <div className="flex items-center gap-3">
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
          <button
            onClick={() => setShowNovoLead(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <Plus size={15} />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Cards de contagem por status */}
      {Object.keys(contagens).some((k) => contagens[k] > 0) && (
        <div className="flex gap-3 flex-wrap">
          {[
            'pendente',
            'em_analise',
            'aprovado',
            'convertido',
            'expirado',
            'rejeitado',
          ].map((s) =>
            contagens[s] ? (
              <button
                key={s}
                onClick={() => handleStatusChange(statusFilter === s ? '' : s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${STATUS_COLORS[s]} ${statusFilter === s ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-80 hover:opacity-100'}`}
              >
                {STATUS_LABEL[s]}: {contagens[s]}
              </button>
            ) : null
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-500 text-sm font-medium">
            Nenhum lead direto encontrado.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Crie seu primeiro lead de venda direta usando o botão acima.
          </p>
          <button
            onClick={() => setShowNovoLead(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <Plus size={15} /> Cadastrar primeiro lead
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Contato / Empresa</th>
                  <th className="px-4 py-3 text-left">CNPJ</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-right">% Comissão</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {l.contato_nome ?? l.razao_social ?? '—'}
                      </p>
                      {l.contato_email && (
                        <p className="text-xs text-gray-400">
                          {l.contato_email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {l.cnpj ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                      {l.tipo_cliente?.replace('_', ' ') ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 font-medium">
                      {fmtBRL(l.valor_negociado)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {l.percentual_comissao != null
                        ? `${parseFloat(String(l.percentual_comissao)).toFixed(1)}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[l.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_LABEL[l.status] ?? l.status}
                      </span>
                      {l.requer_aprovacao_comercial && (
                        <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                          Aprovação
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {fmtDate(l.criado_em)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
              <span>
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showNovoLead && (
        <RepNovoLeadDiretoModal
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
