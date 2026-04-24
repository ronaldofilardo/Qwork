'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AcaoPendente,
  AcaoCiclo,
  CicloEnriquecido,
  ACOES_POR_STATUS,
  ACAO_COR,
  ACAO_LABEL,
  STATUS_BADGE,
  fmt,
  fmtMes,
} from './types';

interface CiclosTabelaRowProps {
  c: CicloEnriquecido;
  hasPagas: boolean;
  actionLoading: number | null;
  onAcao: (ap: AcaoPendente) => void;
}

function RowTipo({ c }: { c: CicloEnriquecido }) {
  return (
    <td className="px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">Representante</span>
        {c.beneficiario_tipo_pessoa && (
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold w-fit ${
              c.beneficiario_tipo_pessoa === 'PF'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-cyan-50 text-cyan-700'
            }`}
          >
            {c.beneficiario_tipo_pessoa}
          </span>
        )}
      </div>
    </td>
  );
}

function RowPagamento({
  c,
  hasPagas,
}: {
  c: CicloEnriquecido;
  hasPagas: boolean;
}) {
  if (!hasPagas) return null;
  return (
    <td className="px-4 py-3 text-xs">
      {c.status === 'pago' && c.data_pagamento ? (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-green-700">
            {new Date(c.data_pagamento).toLocaleDateString('pt-BR')}
          </span>
          {c.comprovante_pagamento_path && (
            <span className="text-gray-400 text-xs">✓ Comprovante</span>
          )}
        </div>
      ) : (
        <span className="text-gray-300">—</span>
      )}
    </td>
  );
}

function RowAcoes({
  c,
  actionLoading,
  onAcao,
}: {
  c: CicloEnriquecido;
  actionLoading: number | null;
  onAcao: (ap: AcaoPendente) => void;
}) {
  const acoes: AcaoCiclo[] = ACOES_POR_STATUS[c.status] ?? [];
  return (
    <td className="px-4 py-3 text-center">
      {acoes.length > 0 ? (
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {acoes.map((acao) => (
            <button
              key={acao}
              disabled={actionLoading === c.id}
              onClick={() => onAcao({ ciclo: c, acao })}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${ACAO_COR[acao]}`}
            >
              {ACAO_LABEL[acao]}
            </button>
          ))}
        </div>
      ) : (
        <span className="text-gray-300 text-xs">—</span>
      )}
    </td>
  );
}

function CiclosTabelaRow({
  c,
  hasPagas,
  actionLoading,
  onAcao,
}: CiclosTabelaRowProps) {
  const badge = STATUS_BADGE[c.status];
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">
          {c.beneficiario_nome ?? '—'}
        </div>
        {c.beneficiario_codigo && (
          <div className="text-xs text-gray-400 font-mono">
            {c.beneficiario_codigo}
          </div>
        )}
      </td>
      <RowTipo c={c} />
      <td className="px-4 py-3 text-gray-700 font-mono text-xs">
        {fmtMes(c.mes_referencia)}
      </td>
      <td className="px-4 py-3 text-center text-gray-700 font-medium">
        {c.qtd_comissoes}
      </td>
      <td className="px-4 py-3 text-right font-semibold text-gray-900">
        {fmt(c.valor_total)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${badge?.cor ?? 'bg-gray-100 text-gray-600'}`}
        >
          {badge?.label ?? c.status}
        </span>
        {c.nf_rejeitada_em && (
          <div className="text-xs text-red-600 mt-1">NF rejeitada</div>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {c.nf_nome_arquivo ? (
          <span
            className="underline underline-offset-2 text-blue-600"
            title={c.nf_path ?? undefined}
          >
            {c.nf_nome_arquivo}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
        {c.nf_motivo_rejeicao && (
          <div
            className="text-red-500 text-xs mt-0.5 max-w-[140px] truncate"
            title={c.nf_motivo_rejeicao}
          >
            Motivo: {c.nf_motivo_rejeicao}
          </div>
        )}
      </td>
      <RowPagamento c={c} hasPagas={hasPagas} />
      <RowAcoes c={c} actionLoading={actionLoading} onAcao={onAcao} />
    </tr>
  );
}

interface CiclosTabelaProps {
  ciclos: CicloEnriquecido[];
  loading: boolean;
  statusFiltro: string;
  mesLabel: string;
  total: number;
  page: number;
  totalPages: number;
  actionLoading: number | null;
  onPageChange: (fn: (prev: number) => number) => void;
  onAcao: (ap: AcaoPendente) => void;
}

// eslint-disable-next-line max-lines-per-function
export function CiclosTabela({
  ciclos,
  loading,
  statusFiltro,
  mesLabel,
  total,
  page,
  totalPages,
  actionLoading,
  onPageChange,
  onAcao,
}: CiclosTabelaProps) {
  const hasPagas = ciclos.some((c) => c.status === 'pago');
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent"
          role="status"
          aria-label="Carregando"
        />
      </div>
    );
  }
  if (ciclos.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 bg-white rounded-xl border">
        <p className="font-medium">Nenhum ciclo encontrado</p>
        <p className="text-sm mt-1 text-gray-400">
          {statusFiltro
            ? `Sem ciclos com status selecionado em ${mesLabel}`
            : `Sem ciclos em ${mesLabel}`}
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                Beneficiário
              </th>
              <th className="px-4 py-3 text-left font-semibold">Tipo</th>
              <th className="px-4 py-3 text-left font-semibold">Mês Ref.</th>
              <th className="px-4 py-3 text-center font-semibold">Laudos</th>
              <th className="px-4 py-3 text-right font-semibold">
                Valor Total
              </th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">NF/RPA</th>
              {hasPagas && (
                <th className="px-4 py-3 text-left font-semibold">
                  Data Pagamento
                </th>
              )}
              <th className="px-4 py-3 text-center font-semibold min-w-[160px]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ciclos.map((c) => (
              <CiclosTabelaRow
                key={c.id}
                c={c}
                hasPagas={hasPagas}
                actionLoading={actionLoading}
                onAcao={onAcao}
              />
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            {total} ciclos · Página {page} de {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded border bg-white hover:bg-gray-100 disabled:opacity-40 cursor-pointer transition-colors focus:ring-2 focus:ring-blue-400"
              aria-label="Página anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded border bg-white hover:bg-gray-100 disabled:opacity-40 cursor-pointer transition-colors focus:ring-2 focus:ring-blue-400"
              aria-label="Próxima página"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
