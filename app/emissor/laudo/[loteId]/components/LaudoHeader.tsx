'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type LaudoStatus =
  | 'rascunho'
  | 'pdf_gerado'
  | 'emitido'
  | 'enviado'
  | null;

interface LaudoHeaderProps {
  onBack: () => void;
  isPrevia: boolean;
  laudoStatus: LaudoStatus;
  gerandoLaudo: boolean;
  loteId: number;
  onOpenUploadModal: () => void;
  onGerarLaudo: () => void;
  onDownloadLaudo: () => void;
  onUploadSuccess: (laudoId: number) => void;
}

export default function LaudoHeader({
  onBack,
  isPrevia,
  laudoStatus,
  gerandoLaudo,
  loteId,
  onOpenUploadModal,
  onGerarLaudo,
  onDownloadLaudo,
  onUploadSuccess,
}: LaudoHeaderProps) {
  const [uploadando, setUploadando] = useState(false);

  const showGerarButtons =
    isPrevia && (!laudoStatus || laudoStatus === 'rascunho');
  const showEnviarBucketButtons = laudoStatus === 'pdf_gerado';

  const handleFileForBucket = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      setUploadando(true);
      toast.loading('Enviando ao bucket...', { id: 'upload-bucket' });
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/emissor/laudos/${loteId}/upload`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      toast.dismiss('upload-bucket');
      if (data.success) {
        toast.success('Laudo enviado ao bucket com sucesso!');
        onUploadSuccess(loteId);
      } else {
        toast.error(data.error || 'Erro ao enviar ao bucket');
      }
    } catch {
      toast.dismiss('upload-bucket');
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setUploadando(false);
    }
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <button
        onClick={onBack}
        className="text-blue-600 hover:text-blue-800 inline-flex items-center text-sm"
      >
        ← Voltar ao Dashboard
      </button>

      {showGerarButtons && (
        <div className="flex gap-3">
          <button
            onClick={onOpenUploadModal}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload de Laudo
          </button>
          <button
            onClick={onGerarLaudo}
            disabled={gerandoLaudo}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {gerandoLaudo ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Gerando...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Gerar Automaticamente
              </>
            )}
          </button>
        </div>
      )}

      {showEnviarBucketButtons && (
        <div className="flex gap-3 items-center">
          <button
            onClick={onDownloadLaudo}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Baixar PDF
          </button>
          <label
            htmlFor={`upload-bucket-${loteId}`}
            className={`bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md flex items-center gap-2 ${
              uploadando
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:from-purple-700 hover:to-purple-800 cursor-pointer'
            }`}
          >
            {uploadando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Enviando...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Enviar ao Bucket
              </>
            )}
          </label>
          <input
            id={`upload-bucket-${loteId}`}
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={uploadando}
            onChange={handleFileForBucket}
          />
        </div>
      )}
    </div>
  );
}




