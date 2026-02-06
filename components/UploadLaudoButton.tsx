/**
 * Componente UploadLaudoButton
 *
 * Botão para fazer upload de laudo (PDF) para o bucket Backblaze
 * - Exibe botão "Enviar ao Bucket" se laudo emitido e sem arquivo_remoto_key
 * - Exibe botão "Re-sincronizar" apenas se houve falha de upload anterior
 * - Validação client-side: PDF, máximo 2MB
 * - Indicador de progresso
 * - Após sucesso: desabilita botão (imutabilidade)
 */

'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

interface UploadLaudoButtonProps {
  laudoId: number;
  loteId: number;
  status: string;
  arquivoRemotoKey: string | null;
  onUploadSuccess?: () => void;
  hasUploadFailed?: boolean; // Indica se houve falha anterior (para mostrar Re-sincronizar)
}

export default function UploadLaudoButton({
  laudoId: _laudoId,
  loteId,
  status,
  arquivoRemotoKey,
  onUploadSuccess,
  hasUploadFailed = false,
}: UploadLaudoButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar se pode fazer upload
  const canUpload =
    (status === 'emitido' || status === 'enviado') && !arquivoRemotoKey;
  const canResync = hasUploadFailed && !arquivoRemotoKey;

  // Se já foi feito upload (imutável), não mostrar botão
  if (arquivoRemotoKey && !hasUploadFailed) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>Sincronizado com bucket</span>
      </div>
    );
  }

  // Se não pode fazer upload e não há falha, não mostrar nada
  if (!canUpload && !canResync) {
    return null;
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simular progresso inicial
      setUploadProgress(10);

      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(20);

      const response = await fetch(`/api/emissor/laudos/${loteId}/upload`, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      setUploadProgress(100);

      // Sucesso
      toast.success(
        'Upload realizado com sucesso! O laudo está agora disponível no bucket.'
      );

      // Callback de sucesso
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('[UPLOAD] Erro:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao fazer upload. Tente novamente.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validação client-side
    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são permitidos');
      return;
    }

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      toast.error('Arquivo excede o tamanho máximo de 2 MB');
      return;
    }

    // Iniciar upload
    void handleUpload(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <button
        onClick={handleButtonClick}
        disabled={isUploading}
        className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          canResync
            ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white'
            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white'
        }`}
      >
        {isUploading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Enviando... {uploadProgress}%
          </span>
        ) : canResync ? (
          'Re-sincronizar'
        ) : (
          'Enviar ao Bucket'
        )}
      </button>

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-600 h-2 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <p className="text-xs text-gray-500">
        {canResync
          ? 'Houve falha no envio anterior. Tente novamente.'
          : 'Selecione o arquivo PDF do laudo (máx. 2MB)'}
      </p>
    </div>
  );
}
