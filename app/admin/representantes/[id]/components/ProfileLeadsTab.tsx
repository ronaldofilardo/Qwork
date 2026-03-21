'use client';

import type { Lead } from '../types';
import type { RepProfile } from '../types';
import {
  STATUS_BADGE_LEAD,
  TIPO_CONVERSAO_LABEL,
  formatCNPJ,
  formatDate,
  n,
} from '../constants';

interface ProfileLeadsTabProps {
  rep: RepProfile;
  leads: Lead[];
  totalLeads: number;
  pageLeads: number;
  setPageLeads: (p: number | ((prev: number) => number)) => void;
  statusLeadFiltro: string;
  setStatusLeadFiltro: (v: string) => void;
  buscaLead: string;
  setBuscaLead: (v: string) => void;
  loadingLeads: boolean;
  contagensLeads: { pendente: number; convertido: number; expirado: number };
}

export function ProfileLeadsTab({
  rep,
  leads,
  totalLeads,
  pageLeads,
  setPageLeads,
  statusLeadFiltro,
  setStatusLeadFiltro,
  buscaLead,
  setBuscaLead,
  loadingLeads,
  contagensLeads,
}: ProfileLeadsTabProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Filtros de leads */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar CNPJ, razão social ou contato..."
          value={buscaLead}
          onChange={(e) => {
            setBuscaLead(e.target.value);
            setPageLeads(1);
          }}
          className="border rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-1">
          {['', 'pendente', 'convertido', 'expirado'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusLeadFiltro(s);
                setPageLeads(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusLeadFiltro === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === '' ? `Todos (${n(rep.total_leads)})` : null}
              {s === 'pendente'
                ? `Pendentes (${contagensLeads.pendente})`
                : null}
              {s === 'convertido'
                ? `Convertidos (${contagensLeads.convertido})`
                : null}
              {s === 'expirado'
                ? `Expirados (${contagensLeads.expirado})`
                : null}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de leads */}
      {loadingLeads ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <p className="text-center py-10 text-gray-400 text-sm">
          Nenhuma indicação encontrada.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Empresa indicada</th>
                <th className="px-4 py-3 text-left">Contato</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Valor Negociado</th>
                <th className="px-4 py-3 text-center">Cadastrado</th>
                <th className="px-4 py-3 text-center">Expira em</th>
                <th className="px-4 py-3 text-center">Conversão</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className={
                    lead.vence_em_breve ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {lead.razao_social ?? (
                        <span className="text-gray-400 italic">
                          Não informado
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {formatCNPJ(lead.cnpj)}
                    </div>
                    {lead.entidade_nome && (
                      <div className="text-xs text-green-600 mt-0.5">
                        → {lead.entidade_nome}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">
                      {lead.contato_nome ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        STATUS_BADGE_LEAD[lead.status] ??
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {lead.status}
                    </span>
                    {lead.vence_em_breve && (
                      <div className="text-xs text-orange-600 mt-1 font-medium">
                        ⚠ Vence em breve
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {lead.valor_negociado != null &&
                    lead.valor_negociado > 0 ? (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        R${' '}
                        {Number(lead.valor_negociado).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">
                    {formatDate(lead.criado_em)}
                  </td>
                  <td className="px-4 py-3 text-center text-xs">
                    {lead.status === 'convertido' ? (
                      <span className="text-green-600">
                        {formatDate(lead.data_conversao)}
                      </span>
                    ) : (
                      <span
                        className={
                          lead.vence_em_breve
                            ? 'text-orange-600 font-medium'
                            : 'text-gray-500'
                        }
                      >
                        {formatDate(lead.data_expiracao)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {lead.tipo_conversao ? (
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                        {TIPO_CONVERSAO_LABEL[lead.tipo_conversao] ??
                          lead.tipo_conversao}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação leads */}
      {totalLeads > 25 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={pageLeads === 1}
            onClick={() => setPageLeads((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Pág. {pageLeads} de {Math.ceil(totalLeads / 25)}
          </span>
          <button
            disabled={pageLeads >= Math.ceil(totalLeads / 25)}
            onClick={() => setPageLeads((p) => p + 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
