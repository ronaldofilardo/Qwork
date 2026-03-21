'use client';

import type { Comissao } from '../types';
import { fmt } from '../types';

interface NfPendentesTabProps {
  nfPendentes: Comissao[];
  loading: boolean;
  actionLoading: number | null;
  onNfReview: (v: { comissao: Comissao; acao: 'aprovar' | 'rejeitar' }) => void;
}

export function NfPendentesTab({
  nfPendentes,
  loading,
  actionLoading,
  onNfReview,
}: NfPendentesTabProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (nfPendentes.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-lg font-medium">Nenhuma NF pendente de revisão</p>
        <p className="text-sm mt-1">
          Representantes que enviaram NF/RPA aparecerão aqui para análise.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th className="px-3 py-3 text-left">Representante</th>
            <th className="px-3 py-3 text-left">Cliente</th>
            <th className="px-3 py-3 text-right">Comissão</th>
            <th className="px-3 py-3 text-center">Arquivo NF</th>
            <th className="px-3 py-3 text-left">Enviada em</th>
            <th className="px-3 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {nfPendentes.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-3 py-3">
                <div className="font-medium text-gray-900">
                  {c.representante_nome}
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  {c.representante_codigo}
                </div>
              </td>
              <td className="px-3 py-3 text-gray-700">{c.entidade_nome}</td>
              <td className="px-3 py-3 text-right font-semibold text-green-700">
                {fmt(c.valor_comissao)}
              </td>
              <td className="px-3 py-3 text-center">
                <a
                  href={`/api/admin/comissoes/${c.id}/nf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  📥 {c.nf_nome_arquivo || 'Baixar'}
                </a>
              </td>
              <td className="px-3 py-3 text-gray-500 text-xs">
                {c.nf_rpa_enviada_em
                  ? new Date(c.nf_rpa_enviada_em).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2 justify-center">
                  <button
                    onClick={() => onNfReview({ comissao: c, acao: 'aprovar' })}
                    disabled={actionLoading !== null}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    ✅ Aprovar
                  </button>
                  <button
                    onClick={() =>
                      onNfReview({ comissao: c, acao: 'rejeitar' })
                    }
                    disabled={actionLoading !== null}
                    className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    ❌ Rejeitar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
