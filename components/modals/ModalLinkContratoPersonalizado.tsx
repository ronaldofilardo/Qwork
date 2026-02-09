'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Copy,
  CheckCircle,
  Link2,
  QrCode as QrCodeIcon,
} from 'lucide-react';
import QRCode from 'qrcode';

interface ModalLinkContratoPersonalizadoProps {
  isOpen: boolean;
  onClose: () => void;
  contratoId: number;
  tomadorNome: string;
  valorPorFuncionario: number;
  numeroFuncionarios: number;
  valorTotal: number;
  linkContrato?: string;
  baseUrl?: string; // Para testes - permite sobrescrever window.location.origin
}

export default function ModalLinkContratoPersonalizado({
  isOpen,
  onClose,
  contratoId,
  tomadorNome,
  valorPorFuncionario,
  numeroFuncionarios,
  valorTotal,
  linkContrato,
  baseUrl,
}: ModalLinkContratoPersonalizadoProps) {
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const link =
    linkContrato ||
    `${baseUrl || window.location.origin}/contrato/${contratoId}`;

  useEffect(() => {
    if (isOpen) {
      // Copiar automaticamente quando o modal abrir
      if (link) {
        navigator.clipboard
          .writeText(link)
          .then(() => {
            setLinkCopiado(true);
            setTimeout(() => setLinkCopiado(false), 3000);
          })
          .catch((err) => {
            console.error('Erro ao copiar link automaticamente:', err);
          });
      }

      // Gerar QR Code
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
    }
  }, [isOpen, link]);

  if (!isOpen) return null;

  const handleCopiarLink = () => {
    navigator.clipboard.writeText(link);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 3000);
  };

  const handleBaixarQRCode = () => {
    if (!qrCodeDataUrl) return;

    const linkDownload = document.createElement('a');
    linkDownload.href = qrCodeDataUrl;
    linkDownload.download = `qrcode-contrato-${contratoId}.png`;
    linkDownload.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <Link2 className="w-6 h-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Contrato Personalizado Gerado
              </h2>
              <p className="text-sm text-gray-600">{tomadorNome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Resumo do Contrato */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">
              Resumo do Contrato
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Valor por funcionário:</span>
                <span className="font-medium text-blue-900">
                  R$ {valorPorFuncionario.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Número de funcionários:</span>
                <span className="font-medium text-blue-900">
                  {numeroFuncionarios}
                </span>
              </div>
              <div className="border-t border-blue-300 pt-2 flex justify-between">
                <span className="text-blue-700 font-semibold">
                  Valor total anual:
                </span>
                <span className="font-bold text-blue-900 text-lg">
                  R$ {valorTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-2">
              📋 Próximos Passos
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-orange-800">
              <li>Copie o link abaixo ou use o QR Code</li>
              <li>Envie para o tomador por email, WhatsApp ou outro meio</li>
              <li>
                O tomador acessará o link para visualizar e aceitar o contrato
              </li>
              <li>Após aceite, será redirecionado para pagamento</li>
              <li>
                Com pagamento confirmado, você poderá fazer a aprovação final
              </li>
            </ol>
          </div>

          {/* Link para Copiar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link do Contrato
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={link}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopiarLink}
                className="px-4 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                {linkCopiado ? (
                  <>
                    <CheckCircle size={18} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <QrCodeIcon className="w-5 h-5 text-orange-500" />
              QR Code para Acesso Rápido
            </h3>
            {qrCodeDataUrl ? (
              <div className="space-y-3">
                <Image
                  src={qrCodeDataUrl}
                  alt="QR Code do Contrato"
                  width={256}
                  height={256}
                  className="border-4 border-white shadow-lg rounded-lg"
                />
                <button
                  onClick={handleBaixarQRCode}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
                >
                  Baixar QR Code
                </button>
              </div>
            ) : (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            )}
          </div>

          {/* Observação Importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-yellow-900">
              ⚠️ Status Atual: Aguardando Aceite e Pagamento
            </p>
            <p className="text-xs text-yellow-800">
              O login do tomador será liberado automaticamente após o fluxo
              completo:
            </p>
            <ol className="text-xs text-yellow-800 space-y-1 ml-4 list-decimal">
              <li>tomador acessa o link e visualiza o contrato</li>
              <li>Aceita os termos do contrato</li>
              <li>Realiza o pagamento</li>
              <li>
                <strong>Sistema libera login automaticamente</strong> (sem
                necessidade de aprovação manual do admin)
              </li>
            </ol>
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
