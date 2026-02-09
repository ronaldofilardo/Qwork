'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  X,
  Copy,
  CheckCircle,
  Link2,
  QrCode as QrCodeIcon,
  Download,
} from 'lucide-react';
import QRCode from 'qrcode';

interface ModalLinkPagamentoEmissaoProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  loteId: number;
  nomeTomador: string;
  valorTotal: number;
  numAvaliacoes: number;
}

export default function ModalLinkPagamentoEmissao({
  isOpen,
  onClose,
  token,
  loteId,
  nomeTomador,
  valorTotal,
  numAvaliacoes,
}: ModalLinkPagamentoEmissaoProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/pagamento/emissao/${token}`;

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  }, [link]);

  useEffect(() => {
    if (isOpen && link) {
      // Gera o QR Code
      QRCode.toDataURL(link, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Erro ao gerar QR Code:', err));

      // Auto-copia o link quando o modal abre
      copyToClipboard();
    }
  }, [isOpen, link, copyToClipboard]);

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const linkDownload = document.createElement('a');
    linkDownload.href = qrCodeDataUrl;
    linkDownload.download = `qrcode-pagamento-lote-${loteId}.png`;
    document.body.appendChild(linkDownload);
    linkDownload.click();
    document.body.removeChild(linkDownload);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Link de Pagamento Gerado
              </h2>
              <p className="text-blue-100 text-sm">
                Envie este link para {nomeTomador} realizar o pagamento
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações do Lote */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">
              Informações do Pagamento
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Lote:</p>
                <p className="font-semibold text-blue-900">#{loteId}</p>
              </div>
              <div>
                <p className="text-blue-700">Tomador:</p>
                <p className="font-semibold text-blue-900">{nomeTomador}</p>
              </div>
              <div>
                <p className="text-blue-700">Avaliações:</p>
                <p className="font-semibold text-blue-900">{numAvaliacoes}</p>
              </div>
              <div>
                <p className="text-blue-700">Valor Total:</p>
                <p className="font-semibold text-blue-900 text-lg">
                  {formatCurrency(valorTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCodeIcon className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">
                QR Code para Pagamento
              </h3>
            </div>

            {qrCodeDataUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-md border-2 border-gray-200">
                    <Image
                      src={qrCodeDataUrl}
                      alt="QR Code Pagamento"
                      width={256}
                      height={256}
                    />
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={downloadQRCode}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Baixar QR Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Link */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Link de Pagamento</h3>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm text-gray-700 break-all">
                {link}
              </div>
              <button
                onClick={copyToClipboard}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all
                  ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }
                `}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar
                  </>
                )}
              </button>
            </div>

            {copied && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Link copiado automaticamente para a área de transferência
              </p>
            )}
          </div>

          {/* Instruções */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">
              Próximos Passos
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
              <li>Copie o link acima ou baixe o QR Code</li>
              <li>Envie para {nomeTomador} por e-mail, WhatsApp ou SMS</li>
              <li>
                O gestor/RH acessará o link para escolher a forma de pagamento
              </li>
              <li>
                Após o pagamento, o status será atualizado automaticamente
              </li>
              <li>O emissor poderá então gerar o laudo oficial</li>
            </ol>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
