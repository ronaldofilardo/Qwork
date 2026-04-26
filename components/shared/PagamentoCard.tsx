'use client';

import {
  Receipt,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
} from 'lucide-react';
import {
  type PagamentoReciboData,
  type DetalheParcela,
} from '@/components/shared/ModalRecibo';

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatarData(dataStr: string | null | undefined): string {
  if (!dataStr) return '-';
  return new Date(dataStr).toLocaleDateString('pt-BR');
}

export function labelMetodo(metodo: string): { label: string; badge: string } {
  const map: Record<string, { label: string; badge: string }> = {
    pix: { label: 'PIX', badge: 'bg-green-100 text-green-800' },
    boleto: { label: 'Boleto', badge: 'bg-blue-100 text-blue-800' },
    cartao: {
      label: 'Cartão de Crédito',
      badge: 'bg-purple-100 text-purple-800',
    },
    avista: { label: 'À Vista', badge: 'bg-gray-100 text-gray-700' },
    parcelado: { label: 'Parcelado', badge: 'bg-orange-100 text-orange-800' },
  };
  return (
    map[metodo?.toLowerCase()] ?? {
      label: metodo,
      badge: 'bg-gray-100 text-gray-700',
    }
  );
}

export function parseParcelas(
  detalhesParcelas: PagamentoReciboData['detalhesParcelas']
): DetalheParcela[] {
  if (!detalhesParcelas) return [];
  if (Array.isArray(detalhesParcelas))
    return detalhesParcelas as DetalheParcela[];
  if (typeof detalhesParcelas === 'object' && 'parcelas' in detalhesParcelas) {
    return (detalhesParcelas as { parcelas: DetalheParcela[] }).parcelas ?? [];
  }
  return [];
}

export function StatusBadge({ status }: { status: string }) {
  if (status === 'pago')
    return (
      <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium">
        <CheckCircle size={12} /> Pago
      </span>
    );
  if (status === 'processando')
    return (
      <span className="inline-flex items-center gap-1 text-blue-700 text-xs font-medium">
        <Clock size={12} /> Processando
      </span>
    );
  if (status === 'pendente')
    return (
      <span className="inline-flex items-center gap-1 text-yellow-700 text-xs font-medium">
        <Clock size={12} /> Pendente
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-red-700 text-xs font-medium">
      <AlertCircle size={12} /> Cancelado
    </span>
  );
}

// eslint-disable-next-line max-lines-per-function
function ParcelasTabela({
  pag,
  parcelas,
  onAbrirModalParcela,
}: {
  pag: PagamentoReciboData;
  parcelas: DetalheParcela[];
  onAbrirModalParcela: (pag: PagamentoReciboData, idx: number) => void;
}) {
  return (
    <div className="border-t border-gray-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            <th className="text-left py-2 pl-4 pr-2 font-semibold text-gray-600">
              Parcela
            </th>
            <th className="text-right py-2 px-2 font-semibold text-gray-600">
              Valor
            </th>
            <th className="text-center py-2 px-2 font-semibold text-gray-600">
              Vencimento
            </th>
            <th className="text-center py-2 px-2 font-semibold text-gray-600">
              Status
            </th>
            <th className="text-center py-2 pl-2 pr-4 font-semibold text-gray-600">
              Recibo
            </th>
          </tr>
        </thead>
        <tbody>
          {parcelas.length > 0
            ? parcelas.map((parcela, idx) => (
                <tr
                  key={parcela.numero}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-2.5 pl-4 pr-2 font-medium text-gray-700">
                    {parcela.numero}ª
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold text-gray-800">
                    {formatarMoeda(parcela.valor)}
                  </td>
                  <td className="py-2.5 px-2 text-center text-gray-600">
                    {formatarData(parcela.data_vencimento)}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {parcela.pago ? (
                      <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                        <CheckCircle size={11} /> Pago
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-yellow-700 font-medium">
                        <Clock size={11} /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pl-2 pr-4 text-center">
                    <button
                      onClick={() =>
                        parcela.pago ? onAbrirModalParcela(pag, idx) : undefined
                      }
                      disabled={!parcela.pago}
                      title={
                        parcela.pago
                          ? `Recibo da ${parcela.numero}ª parcela`
                          : 'Parcela ainda não paga'
                      }
                      className={`p-1 rounded transition-colors inline-flex ${parcela.pago ? 'text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`}
                    >
                      <Receipt size={14} />
                    </button>
                  </td>
                </tr>
              ))
            : Array.from({ length: pag.numeroParcelas }, (_, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-2.5 pl-4 pr-2 font-medium text-gray-700">
                    {i + 1}ª
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold text-gray-800">
                    {formatarMoeda(pag.valor / pag.numeroParcelas)}
                  </td>
                  <td className="py-2.5 px-2 text-center text-gray-400">-</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
                      <Clock size={11} />-
                    </span>
                  </td>
                  <td className="py-2.5 pl-2 pr-4 text-center">
                    <button
                      onClick={() => onAbrirModalParcela(pag, i)}
                      title={`Recibo da ${i + 1}ª parcela`}
                      className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors inline-flex"
                    >
                      <Receipt size={14} />
                    </button>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

interface PagamentoCardProps {
  pag: PagamentoReciboData;
  expandido: boolean;
  onAbrirModalGeral: (pag: PagamentoReciboData) => void;
  onAbrirModalParcela: (pag: PagamentoReciboData, idx: number) => void;
  onToggleExpandido: (id: number) => void;
}

// eslint-disable-next-line max-lines-per-function, complexity
export function PagamentoCard({
  pag,
  expandido,
  onAbrirModalGeral,
  onAbrirModalParcela,
  onToggleExpandido,
}: PagamentoCardProps) {
  const _rawParcelas = parseParcelas(pag.detalhesParcelas);
  const parcelas: typeof _rawParcelas =
    _rawParcelas.length > 0 &&
    !_rawParcelas.some((p) => p.pago) &&
    pag.status === 'pago'
      ? _rawParcelas.map((p, idx) =>
          idx === 0
            ? {
                ...p,
                pago: true,
                data_pagamento:
                  pag.dataPagamento ?? pag.dataConfirmacao ?? pag.criadoEm,
              }
            : p
        )
      : _rawParcelas;
  const ehParcelado = pag.numeroParcelas > 1;
  const { label: metodoLabel, badge: metodoBadge } = labelMetodo(
    pag.metodo ?? 'avista'
  );
  const dataFormatada = formatarData(
    pag.dataConfirmacao ?? pag.dataPagamento ?? pag.criadoEm
  );

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {(pag.loteId || pag.laudoId) && (
              <div className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">Lote/Laudo</span> #
                {pag.loteId ?? pag.laudoId}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-gray-900">
                {formatarMoeda(pag.valor)}
              </span>
              <span
                className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${metodoBadge}`}
              >
                {metodoLabel}
              </span>
              {ehParcelado && (
                <span className="text-xs text-gray-500">
                  {pag.numeroParcelas}x de{' '}
                  {formatarMoeda(pag.valor / pag.numeroParcelas)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              {pag.numeroFuncionarios && (
                <span className="flex items-center gap-1">
                  <Users size={11} />
                  {pag.numeroFuncionarios}{' '}
                  {pag.numeroFuncionarios === 1
                    ? 'funcionário'
                    : 'funcionários'}
                  {pag.valorPorFuncionario && (
                    <span className="text-gray-400">
                      {' '}
                      @ {formatarMoeda(pag.valorPorFuncionario)}/func.
                    </span>
                  )}
                </span>
              )}
              <span>{dataFormatada}</span>
              <StatusBadge status={pag.status} />
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onAbrirModalGeral(pag)}
              title="Ver recibo"
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Receipt size={16} />
            </button>
            {ehParcelado && (
              <button
                onClick={() => onToggleExpandido(pag.id)}
                title={expandido ? 'Ocultar parcelas' : 'Ver parcelas'}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {expandido ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {ehParcelado && expandido && (
        <ParcelasTabela
          pag={pag}
          parcelas={parcelas}
          onAbrirModalParcela={onAbrirModalParcela}
        />
      )}
    </div>
  );
}
