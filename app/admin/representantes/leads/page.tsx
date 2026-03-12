'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Lead {
  id: number;
  representante_id: number;
  representante_nome: string;
  representante_email: string;
  representante_codigo: string;
  cnpj: string;
  razao_social: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  status: string;
  criado_em: string;
  data_expiracao: string;
  data_conversao: string | null;
  entidade_nome: string | null;
  tipo_conversao: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  convertido: 'bg-green-100 text-green-700',
  expirado: 'bg-gray-100 text-gray-500',
};

const STATUS_ICON: Record<string, string> = {
  pendente: '⏳',
  convertido: '✅',
  expirado: '⌛',
};

function formatCNPJ(cnpj: string) {
  if (!cnpj || cnpj.length !== 14) return cnpj;
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function AdminLeadsRepresentantes() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [contagens, setContagens] = useState<Record<string, number>>({
    pendente: 0,
    convertido: 0,
    expirado: 0,
  });
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 25;

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFiltro) params.set('status', statusFiltro);
      if (busca.trim()) params.set('q', busca.trim());
      const res = await fetch(`/api/admin/representantes/leads?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      setContagens(
        data.contagens ?? { pendente: 0, convertido: 0, expirado: 0 }
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFiltro, busca]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totalPages = Math.ceil(total / limit);
  const totalLeads =
    contagens.pendente + contagens.convertido + contagens.expirado;
  const taxaConversao =
    totalLeads > 0
      ? ((contagens.convertido / totalLeads) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Indicações (Leads) de Representantes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visão global de todas as indicações feitas por representantes
          </p>
        </div>
        <Link
          href="/admin/representantes"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Voltar para Representantes
        </Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalLeads}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-yellow-600 uppercase tracking-wide">
            Pendentes
          </p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">
            {contagens.pendente}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-green-600 uppercase tracking-wide">
            Convertidos
          </p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {contagens.convertido}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Expirados
          </p>
          <p className="text-2xl font-bold text-gray-500 mt-1">
            {contagens.expirado}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-blue-600 uppercase tracking-wide">
            Conversão
          </p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {taxaConversao}%
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por CNPJ, razão social, contato ou representante..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFiltro}
          onChange={(e) => {
            setStatusFiltro(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="convertido">Convertido</option>
          <option value="expirado">Expirado</option>
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          Nenhuma indicação encontrada.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Representante
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    CNPJ
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Razão Social
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Contato
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Criado em
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Expira em
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Entidade Convertida
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => {
                  const expiraSoon =
                    lead.status === 'pendente' &&
                    new Date(lead.data_expiracao).getTime() - Date.now() <
                      7 * 24 * 60 * 60 * 1000;

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        expiraSoon ? 'border-l-4 border-l-orange-400' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {lead.representante_nome}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {lead.representante_codigo}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {formatCNPJ(lead.cnpj)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {lead.razao_social || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {lead.contato_nome ? (
                          <div>
                            <p className="text-gray-700">{lead.contato_nome}</p>
                            {lead.contato_email && (
                              <p className="text-xs text-gray-400">
                                {lead.contato_email}
                              </p>
                            )}
                            {lead.contato_telefone && (
                              <p className="text-xs text-gray-400">
                                {lead.contato_telefone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            STATUS_BADGE[lead.status] ??
                            'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {STATUS_ICON[lead.status] ?? ''}{' '}
                          {lead.status.charAt(0).toUpperCase() +
                            lead.status.slice(1)}
                        </span>
                        {expiraSoon && (
                          <p className="text-[10px] text-orange-500 mt-0.5">
                            Expira em breve
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(lead.criado_em)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(lead.data_expiracao)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {lead.entidade_nome ? (
                          <span className="text-green-700 font-medium">
                            {lead.entidade_nome}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <p className="text-xs text-gray-500">
                Mostrando {(page - 1) * limit + 1}–
                {Math.min(page * limit, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                >
                  ‹ Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                >
                  Próximo ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
