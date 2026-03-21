'use client';

import { useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  X,
  Download,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  FileText,
} from 'lucide-react';

export interface DetalheParcela {
  numero: number;
  valor: number;
  data_vencimento: string;
  pago?: boolean;
  data_pagamento?: string;
}

export interface PagamentoReciboData {
  id: number;
  valor: number;
  metodo: string;
  status: string;
  numeroParcelas: number;
  detalhesParcelas: DetalheParcela[] | Record<string, unknown> | null;
  numeroFuncionarios: number | null;
  valorPorFuncionario: number | null;
  reciboNumero: string | null;
  reciboUrl: string | null;
  dataPagamento: string | null;
  dataConfirmacao: string | null;
  criadoEm: string;
  loteId: number | null;
  loteCodigo: string | null;
  loteNumero: number | null;
  laudoId: number | null;
}

interface ModalReciboProps {
  pagamento: PagamentoReciboData | null;
  organizacaoNome: string;
  organizacaoCnpj?: string;
  parcelaIndex?: number | null; // índice da parcela específica (0-based), null = recibo geral
  onClose: () => void;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarData(dataStr: string | null | undefined): string {
  if (!dataStr) return '-';
  return new Date(dataStr).toLocaleDateString('pt-BR');
}

function labelMetodo(metodo: string): string {
  const map: Record<string, string> = {
    pix: 'PIX',
    boleto: 'Boleto',
    cartao: 'Cartão de Crédito',
    avista: 'À Vista',
    parcelado: 'Parcelado',
  };
  return map[metodo?.toLowerCase()] ?? metodo;
}

function labelStatus(status: string): {
  label: string;
  color: string;
  Icon: typeof CheckCircle;
} {
  if (status === 'pago')
    return { label: 'Pago', color: 'text-green-700', Icon: CheckCircle };
  if (status === 'processando')
    return { label: 'Processando', color: 'text-blue-700', Icon: Clock };
  if (status === 'pendente')
    return { label: 'Pendente', color: 'text-yellow-700', Icon: Clock };
  return { label: 'Cancelado', color: 'text-red-700', Icon: AlertCircle };
}

function parseParcelas(
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

export default function ModalRecibo({
  pagamento,
  organizacaoNome,
  organizacaoCnpj,
  parcelaIndex = null,
  onClose,
}: ModalReciboProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!printAreaRef.current) return;

    const conteudo = printAreaRef.current.innerHTML;
    const janela = window.open('', '_blank', 'width=800,height=900');
    if (!janela) return;

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <base href="${window.location.origin}/" />
        <title>Recibo de Pagamento</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; }
          .recibo-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 20px; }
          .recibo-header h1 { font-size: 18px; font-weight: bold; }
          .recibo-header p { font-size: 12px; color: #555; margin-top: 4px; }
          .recibo-numero { font-size: 13px; font-weight: bold; color: #333; text-align: right; margin-bottom: 16px; }
          .section-title { font-weight: bold; font-size: 13px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 16px 0 8px; }
          .field-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
          .field-label { color: #666; }
          .field-value { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #f0f0f0; padding: 6px 8px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #ddd; }
          td { padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; }
          .status-pago { color: #15803d; font-weight: bold; }
          .status-pendente { color: #b45309; font-weight: bold; }
          .footer { text-align: center; margin-top: 32px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
          @media print {
            body { padding: 16px; }
          }
        </style>
      </head>
      <body>${conteudo}</body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    setTimeout(() => {
      janela.print();
    }, 400);
  }, []);

  const handleDownload = useCallback(() => {
    if (pagamento?.reciboUrl) {
      const link = document.createElement('a');
      link.href = pagamento.reciboUrl;
      link.download = `recibo-${pagamento.reciboNumero ?? pagamento.id}.pdf`;
      link.target = '_blank';
      link.click();
      return;
    }
    // Fallback: abre janela de impressão para salvar como PDF
    handlePrint();
  }, [pagamento, handlePrint]);

  if (!pagamento) return null;

  const parcelas = parseParcelas(pagamento.detalhesParcelas);
  const ehParcelado = pagamento.numeroParcelas > 1;
  const parcelaEspecifica =
    parcelaIndex !== null && parcelaIndex >= 0
      ? (parcelas[parcelaIndex] ?? null)
      : null;
  const {
    label: statusLabel,
    color: statusColor,
    Icon: StatusIcon,
  } = labelStatus(pagamento.status);

  const numeroReciboDisplay = parcelaEspecifica
    ? `${pagamento.reciboNumero ?? pagamento.id} / Parcela ${parcelaEspecifica.numero}`
    : (pagamento.reciboNumero ??
      `PAG-${String(pagamento.id).padStart(6, '0')}`);

  const dataEmissaoDisplay = parcelaEspecifica
    ? formatarData(parcelaEspecifica.data_pagamento ?? pagamento.dataPagamento)
    : formatarData(
        pagamento.dataConfirmacao ??
          pagamento.dataPagamento ??
          pagamento.criadoEm
      );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="text-primary-600" size={20} />
            <h2 className="text-base font-semibold text-gray-900">
              Recibo de Pagamento
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo do Recibo (área para impressão) */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div ref={printAreaRef}>
            {/* Cabeçalho do documento */}
            <div className="recibo-header text-center border-b border-gray-300 pb-4 mb-5">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 size={20} className="text-gray-700" />
                <h1 className="text-lg font-bold text-gray-900">
                  {organizacaoNome}
                </h1>
              </div>
              {organizacaoCnpj && (
                <p className="text-xs text-gray-500">CNPJ: {organizacaoCnpj}</p>
              )}
            </div>

            <div className="recibo-numero text-right mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Nº do Recibo
              </p>
              <p className="text-sm font-bold text-gray-800">
                {numeroReciboDisplay}
              </p>
            </div>

            {/* Identificação do laudo */}
            {pagamento.laudoId && (
              <>
                <p className="section-title text-xs font-bold text-gray-600 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3 mt-4">
                  Referência de Laudo
                </p>
                <div className="space-y-2">
                  <div className="field-row flex justify-between text-sm">
                    <span className="field-label text-gray-500">
                      Número do Laudo
                    </span>
                    <span className="field-value font-semibold text-gray-800">
                      {String(pagamento.laudoId).padStart(6, '0')}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Dados do pagamento */}
            <p className="section-title text-xs font-bold text-gray-600 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3 mt-4">
              Dados do Pagamento
            </p>
            <div className="space-y-2">
              {pagamento.numeroFuncionarios && (
                <div className="field-row flex justify-between text-sm">
                  <span className="field-label text-gray-500">
                    Funcionários
                  </span>
                  <span className="field-value font-semibold text-gray-800">
                    {pagamento.numeroFuncionarios}
                  </span>
                </div>
              )}
              {pagamento.valorPorFuncionario && (
                <div className="field-row flex justify-between text-sm">
                  <span className="field-label text-gray-500">
                    Valor por Funcionário
                  </span>
                  <span className="field-value font-semibold text-gray-800">
                    {formatarMoeda(pagamento.valorPorFuncionario)}
                  </span>
                </div>
              )}
              <div className="field-row flex justify-between text-sm">
                <span className="field-label text-gray-500">Valor Total</span>
                <span className="field-value font-bold text-gray-900 text-base">
                  {formatarMoeda(
                    parcelaEspecifica
                      ? parcelaEspecifica.valor
                      : pagamento.valor
                  )}
                </span>
              </div>
              <div className="field-row flex justify-between text-sm">
                <span className="field-label text-gray-500">
                  Forma de Pagamento
                </span>
                <span className="field-value font-semibold text-gray-800">
                  {labelMetodo(pagamento.metodo)}
                </span>
              </div>
              {ehParcelado && !parcelaEspecifica && (
                <div className="field-row flex justify-between text-sm">
                  <span className="field-label text-gray-500">
                    Parcelamento
                  </span>
                  <span className="field-value font-semibold text-gray-800">
                    {pagamento.numeroParcelas}x de{' '}
                    {formatarMoeda(pagamento.valor / pagamento.numeroParcelas)}
                  </span>
                </div>
              )}
              {parcelaEspecifica && (
                <div className="field-row flex justify-between text-sm">
                  <span className="field-label text-gray-500">Parcela</span>
                  <span className="field-value font-semibold text-gray-800">
                    {parcelaEspecifica.numero} de {pagamento.numeroParcelas}
                  </span>
                </div>
              )}
              <div className="field-row flex justify-between text-sm">
                <span className="field-label text-gray-500">Data</span>
                <span className="field-value font-semibold text-gray-800">
                  {dataEmissaoDisplay}
                </span>
              </div>
              <div className="field-row flex justify-between items-center text-sm">
                <span className="field-label text-gray-500">Status</span>
                <span
                  className={`field-value font-semibold flex items-center gap-1 ${statusColor}`}
                >
                  <StatusIcon size={14} />
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Parcelas (apenas se for recibo geral de um pagamento parcelado) */}
            {ehParcelado && !parcelaEspecifica && parcelas.length > 0 && (
              <>
                <p className="section-title text-xs font-bold text-gray-600 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3 mt-5">
                  Detalhamento das Parcelas
                </p>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-2 px-2 font-semibold text-gray-600 border border-gray-200">
                        Parcela
                      </th>
                      <th className="text-right py-2 px-2 font-semibold text-gray-600 border border-gray-200">
                        Valor
                      </th>
                      <th className="text-center py-2 px-2 font-semibold text-gray-600 border border-gray-200">
                        Vencimento
                      </th>
                      <th className="text-center py-2 px-2 font-semibold text-gray-600 border border-gray-200">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelas.map((p) => (
                      <tr key={p.numero} className="border-b border-gray-100">
                        <td className="py-2 px-2 border border-gray-200 font-medium">
                          {p.numero}ª
                        </td>
                        <td className="py-2 px-2 border border-gray-200 text-right font-semibold">
                          {formatarMoeda(p.valor)}
                        </td>
                        <td className="py-2 px-2 border border-gray-200 text-center">
                          {formatarData(p.data_vencimento)}
                        </td>
                        <td className="py-2 px-2 border border-gray-200 text-center">
                          {p.pago ? (
                            <span className="text-green-700 font-semibold status-pago">
                              Pago
                            </span>
                          ) : (
                            <span className="text-yellow-700 font-semibold status-pendente">
                              Pendente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Logo + Rodapé do documento */}
            <div className="footer text-center mt-6 pt-4 border-t border-gray-100">
              <Image
                src="/logo-qwork.png"
                alt="QWork"
                width={120}
                height={32}
                className="mx-auto mb-3"
                style={{ objectFit: 'contain' }}
              />
              <p className="text-xs text-gray-400">
                Documento gerado em {new Date().toLocaleDateString('pt-BR')} —{' '}
                QWork · Gestão de Saúde Ocupacional
              </p>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <Download size={16} />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium border border-gray-300 py-2.5 px-4 rounded-lg transition-colors"
          >
            <Printer size={16} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
