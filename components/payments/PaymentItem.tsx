'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ParcelItem from './ParcelItem';

interface PaymentItemProps {
  pagamento: {
    id: number;
    valor: number;
    status: string;
    numero_parcelas?: number;
    metodo?: string;
    data_pagamento?: string;
    data_solicitacao?: string;
    criado_em?: string;
    plataforma?: string;
    parcelas_json?: Array<{
      numero: number;
      valor: number;
      data_vencimento: string;
      pago?: boolean;
      data_pagamento?: string;
    }>;
    detalhes_parcelas?: Array<{
      numero: number;
      valor: number;
      data_vencimento: string;
      pago: boolean;
      data_pagamento?: string;
    }>;
    recibo?: {
      id: number;
      numero_recibo: string;
    };
    resumo?: {
      totalParcelas: number;
      parcelasPagas: number;
      valorPendente: number;
      statusGeral: 'quitado' | 'em_aberto';
    };
  };
  onOpenModal?: (pagamento: any) => void;
}

export default function PaymentItem({
  pagamento,
  onOpenModal,
}: PaymentItemProps) {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatarValor = (valor: number | null | undefined) => {
    if (valor == null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(valor));
  };

  const parcelas = pagamento.detalhes_parcelas || pagamento.parcelas_json || [];

  const getStatusBadge = () => {
    const statusGeral = pagamento.resumo?.statusGeral;
    if (statusGeral === 'quitado') {
      return (
        <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
          pago
        </span>
      );
    }
    if (statusGeral === 'em_aberto') {
      return (
        <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          pendente
        </span>
      );
    }
    // Fallback para status do pagamento
    return (
      <span
        className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
          pagamento.status === 'pago'
            ? 'bg-green-100 text-green-800'
            : pagamento.status === 'pendente'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
        }`}
      >
        {pagamento.status}
      </span>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className="text-base font-semibold text-gray-900">
          {formatCurrency(pagamento.valor)}
        </span>
        {getStatusBadge()}
      </div>

      <p className="text-xs text-gray-500 mb-2">
        {pagamento.data_pagamento ? (
          <>Pago em {formatDateTime(pagamento.data_pagamento)}</>
        ) : (
          <>
            Solicitado em{' '}
            {formatDateTime(pagamento.data_solicitacao || pagamento.criado_em)}
          </>
        )}
      </p>

      <p className="text-xs text-gray-500 mb-2">
        Método: {pagamento.metodo || pagamento.plataforma || '-'}{' '}
        {pagamento.numero_parcelas && pagamento.numero_parcelas > 1
          ? `· ${pagamento.numero_parcelas} parcelas`
          : '· À vista'}
      </p>

      {pagamento.recibo?.numero_recibo && (
        <>
          <p className="text-xs text-gray-500 mb-2">
            Recibo: {pagamento.recibo.numero_recibo}
          </p>
          <p className="text-xs text-gray-400 mb-2">
            Baixe em <span className="font-medium">Conta &gt; Plano</span>
          </p>
        </>
      )}

      {/* Detalhamento de Parcelas */}
      {((pagamento.numero_parcelas && pagamento.numero_parcelas > 1) ||
        parcelas.length > 0) && (
        <div className="mt-3 bg-gray-50 rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-medium text-gray-700">Parcelas:</p>
            {parcelas.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
                aria-expanded={expanded}
              >
                {expanded ? (
                  <>
                    Ocultar <ChevronUp size={12} />
                  </>
                ) : (
                  <>
                    Ver todas <ChevronDown size={12} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Resumo rápido */}
          {pagamento.resumo && (
            <p className="text-xs text-gray-500 mb-2">
              {`${pagamento.resumo.parcelasPagas} / ${pagamento.resumo.totalParcelas} parcelas pagas`}{' '}
              · Valor pendente: {formatarValor(pagamento.resumo.valorPendente)}
            </p>
          )}

          <div className="space-y-1">
            {parcelas.slice(0, expanded ? undefined : 3).map((parcela) => (
              <ParcelItem key={parcela.numero} parcela={parcela} />
            ))}

            {!expanded && parcelas.length > 3 && (
              <p className="text-xs text-gray-400 text-center pt-1">
                +{parcelas.length - 3} parcelas
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botão para abrir modal (opcional) */}
      {onOpenModal && (
        <button
          onClick={() => onOpenModal(pagamento)}
          className="mt-3 w-full text-xs text-center text-primary hover:underline"
        >
          Ver detalhes completos
        </button>
      )}
    </div>
  );
}
