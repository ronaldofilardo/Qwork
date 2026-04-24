'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, ChevronDown, ChevronRight } from 'lucide-react';
import { TIPO_CLIENTE_LABEL } from '@/lib/leads-config';
import type { TipoCliente } from '@/lib/leads-config';

interface LeadEquipe {
  id: number;
  cnpj: string | null;
  razao_social: string | null;
  contato_nome: string | null;
  status: string;
  origem: string | null;
  criado_em: string;
  data_expiracao: string | null;
  vendedor_id: number | null;
  vendedor_nome: string | null;
  valor_negociado: number | null;
  percentual_comissao_representante: number | null;
  num_vidas_estimado: number | null;
  requer_aprovacao_comercial: boolean;
  tipo_cliente: TipoCliente | null;
}

interface VendedorGroup {
  vendedor_id: number;
  vendedor_nome: string;
  leads: LeadEquipe[];
}

export default function EquipeLeadsPage() {
  const [porVendedor, setPorVendedor] = useState<VendedorGroup[]>([]);
  const [diretos, setDiretos] = useState<LeadEquipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<Set<number>>(new Set());
  const [statusFiltro, setStatusFiltro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFiltro) params.set('status', statusFiltro);
      const res = await fetch(
        `/api/representante/equipe/leads?${params.toString()}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setPorVendedor(data.por_vendedor ?? []);
      setDiretos(data.diretos ?? []);
      setTotal(data.total ?? 0);
      // Expandir todos os vendedores que têm leads por padrão
      const ids = new Set<number>(
        (data.por_vendedor ?? []).map((v: VendedorGroup) => v.vendedor_id)
      );
      setExpandido(ids);
    } finally {
      setLoading(false);
    }
  }, [statusFiltro]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const toggleVendedor = (vid: number) => {
    setExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(vid)) next.delete(vid);
      else next.add(vid);
      return next;
    });
  };

  const fmtBRL = (v: number | null | undefined) =>
    v != null
      ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '—';

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const STATUS_COR: Record<string, string> = {
    pendente: 'bg-blue-100 text-blue-700',
    convertido: 'bg-green-100 text-green-700',
    expirado: 'bg-gray-100 text-gray-500',
    rejeitado: 'bg-red-100 text-red-700',
  };

  const renderLead = (lead: LeadEquipe) => {
    const tipo = (lead.tipo_cliente ?? 'entidade') as TipoCliente;
    const percRep = Number(lead.percentual_comissao_representante ?? 0);
    const valor = Number(lead.valor_negociado ?? 0);
    const temComissaoRep = percRep > 0;

    return (
      <tr key={lead.id} className="hover:bg-gray-50 text-sm">
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">
            {lead.contato_nome ?? lead.razao_social ?? '—'}
          </div>
          {lead.cnpj && (
            <div className="text-xs text-gray-400 font-mono">{lead.cnpj}</div>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COR[lead.status] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {lead.status}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
              tipo === 'entidade'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}
          >
            {TIPO_CLIENTE_LABEL[tipo]}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-gray-700">{fmtBRL(valor)}</td>
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
            <div
              className={
                temComissaoRep
                  ? 'text-gray-700'
                  : 'text-amber-600 font-semibold'
              }
            >
              Rep: {temComissaoRep ? `${percRep.toFixed(1)}%` : 'Pendente'}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-center text-gray-500 text-xs">
          {fmtDate(lead.criado_em)}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            Leads da Equipe
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} lead{total !== 1 ? 's' : ''} registrados
          </p>
        </div>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="convertido">Convertidos</option>
          <option value="expirado">Expirados</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : total === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm">Nenhum lead encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Vendedores */}
          {porVendedor.map((grupo) => (
            <div
              key={grupo.vendedor_id}
              className="bg-white rounded-xl border overflow-hidden"
            >
              <button
                onClick={() => toggleVendedor(grupo.vendedor_id)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {expandido.has(grupo.vendedor_id) ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                  <span className="font-medium text-gray-900">
                    {grupo.vendedor_nome}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {grupo.leads.length} lead
                    {grupo.leads.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>
              {expandido.has(grupo.vendedor_id) && grupo.leads.length > 0 && (
                <div className="overflow-x-auto border-t">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">
                          Lead
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Status
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Tipo
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Valor
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Vidas
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Comissão
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {grupo.leads.map(renderLead)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {/* Leads diretos */}
          {diretos.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-5 py-3 border-b">
                <span className="font-medium text-gray-900">
                  Leads Diretos (sem vendedor)
                </span>
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {diretos.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Lead</th>
                      <th className="px-4 py-2 text-center font-medium">
                        Status
                      </th>
                      <th className="px-4 py-2 text-center font-medium">
                        Tipo
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        Valor
                      </th>
                      <th className="px-4 py-2 text-center font-medium">
                        Vidas
                      </th>
                      <th className="px-4 py-2 text-center font-medium">
                        Comissão
                      </th>
                      <th className="px-4 py-2 text-center font-medium">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">{diretos.map(renderLead)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
