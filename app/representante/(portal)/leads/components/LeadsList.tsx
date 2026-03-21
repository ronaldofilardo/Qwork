'use client';

import type { Lead } from '../types';
import { STATUS_COR } from '../types';

interface LeadsListProps {
  leads: Lead[];
  loading: boolean;
  total: number;
  page: number;
  setPage: (fn: (p: number) => number) => void;
  ordenacao: 'recente' | 'antigo' | 'expirando';
  copiado: number | null;
  copiarCodigo: (lead: Lead) => void;
}

export default function LeadsList({
  leads,
  loading,
  total,
  page,
  setPage,
  ordenacao,
  copiado,
  copiarCodigo,
}: LeadsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <div className="text-5xl mb-4">🎯</div>
        <p className="text-lg font-medium">Nenhum lead encontrado</p>
        <p className="text-sm mt-1">
          Clique em <strong>+ Novo Lead</strong> para registrar sua primeira
          indicação.
        </p>
      </div>
    );
  }

  const sorted = [...leads].sort((a, b) => {
    if (ordenacao === 'antigo')
      return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime();
    if (ordenacao === 'expirando')
      return (
        new Date(a.data_expiracao).getTime() -
        new Date(b.data_expiracao).getTime()
      );
    return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
  });

  return (
    <>
      <div className="space-y-3">
        {sorted.map((lead) => {
          const expiraSoon =
            lead.status === 'pendente' &&
            new Date(lead.data_expiracao).getTime() - Date.now() <
              7 * 24 * 60 * 60 * 1000;
          return (
            <div
              key={lead.id}
              className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow ${expiraSoon ? 'border-l-4 border-l-orange-400' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {lead.razao_social && (
                      <span className="font-semibold text-gray-900">
                        {lead.razao_social}
                      </span>
                    )}
                    <span className="font-mono text-xs text-gray-400">
                      {lead.cnpj}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COR[lead.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {lead.status}
                    </span>
                    {lead.valor_negociado > 0 && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                        R${' '}
                        {Number(lead.valor_negociado).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </div>
                  {lead.contato_nome && (
                    <p className="text-sm text-gray-500 mt-1">
                      Contato: {lead.contato_nome}
                      {lead.contato_email ? ` · ${lead.contato_email}` : ''}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>
                      Criado:{' '}
                      {new Date(lead.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                    {lead.status === 'convertido' ? (
                      <span className="text-green-600 font-medium">
                        📋 Cadastrado em:{' '}
                        {lead.data_conversao
                          ? new Date(lead.data_conversao).toLocaleDateString(
                              'pt-BR'
                            )
                          : '—'}
                      </span>
                    ) : (
                      <span>
                        Expira:{' '}
                        {new Date(lead.data_expiracao).toLocaleDateString(
                          'pt-BR'
                        )}
                      </span>
                    )}
                    {expiraSoon && (
                      <span className="text-orange-500 font-medium">
                        ⚠ Expira em{' '}
                        {Math.max(
                          0,
                          Math.ceil(
                            (new Date(lead.data_expiracao).getTime() -
                              Date.now()) /
                              (1000 * 60 * 60 * 24)
                          )
                        )}{' '}
                        dias
                      </span>
                    )}
                  </div>
                </div>

                {lead.status === 'pendente' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copiarCodigo(lead)}
                      className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      {copiado === lead.id ? (
                        <span>✅ Copiado!</span>
                      ) : (
                        <span>📋 Compartilhar</span>
                      )}
                    </button>
                  </div>
                )}
                {lead.status === 'convertido' && (
                  <span className="text-green-600 text-sm font-medium">
                    ✅ Convertido
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Pág. {page} de {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </>
  );
}
