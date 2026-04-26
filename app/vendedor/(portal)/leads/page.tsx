'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import type { VendedorLead } from './types';
import NovoLeadModal from './components/NovoLeadModal';

function formatarCNPJ(cnpj: string | null): string {
  if (!cnpj) return '—';
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

const STATUS_BADGE: Record<string, string> = {
  aberto: 'bg-blue-100 text-blue-700',
  em_contato: 'bg-yellow-100 text-yellow-700',
  convertido: 'bg-green-100 text-green-700',
  perdido: 'bg-red-100 text-red-700',
};

export default function LeadsVendedor() {
  const [leads, setLeads] = useState<VendedorLead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showNovoLead, setShowNovoLead] = useState(false);
  const [comissionamentoDefinido, setComissionamentoDefinido] = useState<
    boolean | null
  >(null); // null = carregando

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      const res = await fetch(`/api/vendedor/leads?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      setComissionamentoDefinido(!!data.modeloComissionamento);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Meus Leads</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{total} lead(s)</span>
          <button
            onClick={() => {
              if (comissionamentoDefinido) setShowNovoLead(true);
            }}
            disabled={!comissionamentoDefinido}
            title={
              !comissionamentoDefinido
                ? 'Aguardando definição do modelo de comissionamento'
                : undefined
            }
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Novo Lead
          </button>
        </div>
      </div>

      {comissionamentoDefinido === false && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm flex items-start gap-2">
          <span className="mt-0.5">⚠️</span>
          <span>
            <strong>Módulo de leads bloqueado.</strong> O cadastro de leads
            ficará disponível após o Comercial definir o modelo de
            comissionamento do representante ao qual você pertence.
          </span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Carregando...</div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <p className="text-gray-400">Nenhum lead encontrado.</p>
          <button
            onClick={() => setShowNovoLead(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Cadastrar primeiro lead
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CNPJ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {lead.contato_nome ?? '—'}
                      </div>
                      {lead.contato_email && (
                        <div className="text-xs text-gray-500">
                          {lead.contato_email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {formatarCNPJ(lead.cnpj)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          STATUS_BADGE[lead.status] ??
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(lead.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total > 30 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">Página {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 30 >= total}
            className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}

      {showNovoLead && (
        <NovoLeadModal
          onClose={() => setShowNovoLead(false)}
          onSuccess={() => {
            setShowNovoLead(false);
            void carregar();
          }}
        />
      )}
    </div>
  );
}
