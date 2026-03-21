'use client';

import type { Comissao } from '../types';
import { STATUS_BADGE, fmt } from '../types';
import NfStatusCell from './NfStatusCell';

interface ComissoesTableProps {
  comissoes: Comissao[];
  total: number;
  page: number;
  setPage: (fn: (p: number) => number) => void;
  loading: boolean;
  setUploadModal: (c: Comissao | null) => void;
}

export default function ComissoesTable({
  comissoes,
  total,
  page,
  setPage,
  loading,
  setUploadModal,
}: ComissoesTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (comissoes.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <div className="text-5xl mb-4">💸</div>
        <p className="text-lg font-medium">Nenhuma comissão encontrada</p>
        <p className="text-sm mt-1">
          Comissões aparecem quando o admin gera a comissão a partir de
          pagamentos de clientes indicados por você.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Laudo</th>
              <th className="px-4 py-3 text-left">Mês Emissão</th>
              <th className="px-4 py-3 text-center">Parcela</th>
              <th className="px-4 py-3 text-right">Valor Laudo</th>
              <th className="px-4 py-3 text-right">Comissão</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Previsão</th>
              <th className="px-4 py-3 text-center">NF/RPA</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {comissoes.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {c.entidade_nome}
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                  {c.numero_laudo ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {c.mes_emissao
                    ? new Date(c.mes_emissao).toLocaleDateString('pt-BR', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-500 font-medium">
                  {(c.total_parcelas ?? 1) > 1
                    ? `${c.parcela_numero ?? 1}/${c.total_parcelas}`
                    : 'À vista'}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {fmt(c.valor_laudo)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-green-700">
                  {fmt(c.valor_comissao)}
                </td>
                <td className="px-4 py-3">
                  <div>
                    {c.status === 'retida' && !c.parcela_confirmada_em ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                        ⏳ Aguardando parcela
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[c.status]?.cor ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_BADGE[c.status]?.label ?? c.status}
                      </span>
                    )}
                    {c.status === 'retida' && !!c.parcela_confirmada_em && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Aguardando aprovação
                      </div>
                    )}
                    {c.motivo_congelamento && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {c.motivo_congelamento.replace(/_/g, ' ')}
                      </div>
                    )}
                    {c.data_pagamento && (
                      <div className="text-xs text-green-600 mt-0.5">
                        Pago em{' '}
                        {new Date(c.data_pagamento).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {c.status === 'paga' && c.comprovante_pagamento_path && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <a
                          href={`/api/representante/comissoes/${c.id}/comprovante`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 border border-green-300 rounded text-green-700 hover:bg-green-50 transition-colors cursor-pointer"
                          aria-label="Visualizar comprovante de pagamento"
                        >
                          📄 Ver
                        </a>
                        <a
                          href={`/api/representante/comissoes/${c.id}/comprovante?download=1`}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                          aria-label="Baixar comprovante de pagamento"
                        >
                          ↓ Baixar
                        </a>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {c.mes_pagamento
                    ? new Date(c.mes_pagamento).toLocaleDateString('pt-BR', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <NfStatusCell
                    comissao={c}
                    onUpload={() => setUploadModal(c)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 30 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Pág. {page} de {Math.ceil(total / 30)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 30)}
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
