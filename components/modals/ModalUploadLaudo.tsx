'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ModalUploadLaudoProps {
  loteId: number;
  loteCodigo: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (laudoId: number) => void;
}

interface UploadState {
  status:
    | 'idle'
    | 'selecting'
    | 'uploading'
    | 'confirming'
    | 'success'
    | 'error';
  progress: number;
  error?: string;
  file?: File;
  sha256?: string;
  laudoId?: number;
}

const MAX_FILE_SIZE = 1048576; // 1 MB

export default function ModalUploadLaudo({
  loteId,
  loteCodigo,
  isOpen,
  onClose,
  onSuccess,
}: ModalUploadLaudoProps) {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const calculateSHA256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const validatePDF = (file: File): string | null => {
    // Validar extensão
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return 'Arquivo deve ter extensão .pdf';
    }

    // Validar tipo MIME
    if (file.type !== 'application/pdf') {
      return 'Tipo de arquivo inválido. Apenas PDF é permitido.';
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1048576).toFixed(2);
      return `Arquivo muito grande (${sizeMB} MB). Máximo permitido: 1 MB`;
    }

    if (file.size === 0) {
      return 'Arquivo está vazio';
    }

    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validatePDF(file);
    if (error) {
      setState({ status: 'error', progress: 0, error });
      return;
    }

    setState({ status: 'selecting', progress: 10, file });

    try {
      // Calcular hash do cliente
      const sha256 = await calculateSHA256(file);
      setState((prev) => ({ ...prev, sha256, progress: 20 }));
    } catch {
      setState({
        status: 'error',
        progress: 0,
        error: 'Erro ao calcular hash do arquivo',
      });
    }
  };

  const handleUpload = async () => {
    if (!state.file || !state.sha256) {
      setState({
        status: 'error',
        progress: 0,
        error: 'Arquivo não selecionado',
      });
      return;
    }

    try {
      setState((prev) => ({ ...prev, status: 'uploading', progress: 25 }));

      // PASSO 1: Obter URL de upload
      const urlResponse = await fetch(
        `/api/emissor/laudos/${loteId}/upload-url`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json();
        throw new Error(errorData.error || 'Erro ao obter URL de upload');
      }

      const { key, uploadUrl } = await urlResponse.json();
      setState((prev) => ({ ...prev, progress: 40 }));

      // PASSO 2: Upload do arquivo
      const formData = new FormData();
      formData.append('key', key);
      formData.append('file', state.file);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Erro ao enviar arquivo');
      }

      setState((prev) => ({ ...prev, progress: 70, status: 'confirming' }));

      // PASSO 3: Confirmar upload
      const confirmResponse = await fetch(
        `/api/emissor/laudos/${loteId}/upload-confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            filename: state.file.name,
            size: state.file.size,
            clientSha256: state.sha256,
          }),
        }
      );

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || 'Erro ao confirmar upload');
      }

      const confirmData = await confirmResponse.json();

      setState({
        status: 'success',
        progress: 100,
        laudoId: confirmData.laudo_id,
        sha256: state.sha256,
        file: state.file,
      });

      setTimeout(() => {
        onSuccess(confirmData.laudo_id);
      }, 2000);
    } catch (err) {
      console.error('[ModalUploadLaudo] Erro no upload:', err);
      setState({
        status: 'error',
        progress: 0,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  };

  const handleReset = () => {
    setState({ status: 'idle', progress: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Upload de Laudo
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Lote: <span className="font-semibold">#{loteId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={
              state.status === 'uploading' || state.status === 'confirming'
            }
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Estado: Idle / Selecting */}
          {(state.status === 'idle' || state.status === 'selecting') &&
            !state.file && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Selecione o laudo em PDF
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Arquivo deve ser PDF válido, máximo 1 MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Escolher Arquivo
                </button>
              </div>
            )}

          {/* Preview do arquivo */}
          {state.file && state.status !== 'success' && (
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-10 w-10 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {state.file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(state.file.size)}
                    </p>
                  </div>
                </div>
                {state.status === 'selecting' && (
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Remover
                  </button>
                )}
              </div>

              {state.sha256 && (
                <div className="bg-white rounded p-3">
                  <p className="text-xs text-gray-500 mb-1">SHA-256:</p>
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {state.sha256}
                  </p>
                </div>
              )}

              {/* Barra de progresso */}
              {state.progress > 0 && state.progress < 100 && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>
                      {state.status === 'uploading' && 'Enviando...'}
                      {state.status === 'confirming' && 'Confirmando...'}
                      {state.status === 'selecting' && 'Processando...'}
                    </span>
                    <span>{state.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Botões */}
              {state.status === 'selecting' && state.sha256 && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpload}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Confirmar Upload
                  </button>
                </div>
              )}

              {(state.status === 'uploading' ||
                state.status === 'confirming') && (
                <div className="flex items-center justify-center text-blue-600 pt-4">
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  <span>
                    {state.status === 'uploading' && 'Enviando arquivo...'}
                    {state.status === 'confirming' &&
                      'Confirmando e emitindo laudo...'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Sucesso */}
          {state.status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
              <h3 className="mt-4 text-xl font-bold text-gray-900">
                Laudo Emitido com Sucesso!
              </h3>
              <p className="mt-2 text-gray-600">
                ID do Laudo:{' '}
                <span className="font-mono font-semibold">{state.laudoId}</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">
                O laudo foi confirmado e está imutável.
              </p>
            </div>
          )}

          {/* Erro */}
          {state.status === 'error' && state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-900">Erro no Upload</h3>
                  <p className="mt-1 text-sm text-red-700">{state.error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instruções */}
          {state.status === 'idle' && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Instruções:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>O arquivo deve estar em formato PDF</li>
                <li>Tamanho máximo: 1 MB</li>
                <li>O sistema calculará um hash SHA-256 para validação</li>
                <li>
                  Após confirmação, o laudo será marcado como emitido e se
                  tornará imutável
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
