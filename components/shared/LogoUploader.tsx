'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Trash2, Eye } from 'lucide-react';
import Image from 'next/image';

interface LogoUploaderProps {
  currentLogoUrl: string | null;
  orgName: string;
  onSave: (base64: string, mimeType: string) => Promise<void>;
  onRemove: () => Promise<void>;
  isSaving: boolean;
}

const MAX_FILE_SIZE = 256 * 1024; // 256 KB
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WEBP',
  'image/svg+xml': 'SVG',
};

// eslint-disable-next-line max-lines-per-function
export default function LogoUploader({
  currentLogoUrl,
  orgName,
  onSave,
  onRemove,
  isSaving,
}: LogoUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);
  const [pendingMime, setPendingMime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveLogo = previewUrl || currentLogoUrl;

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError(null);

      // Validar tipo
      if (!ALLOWED_TYPES[file.type]) {
        setError(
          `Formato não suportado. Use: ${Object.values(ALLOWED_TYPES).join(', ')}.`
        );
        return;
      }

      // Validar tamanho
      if (file.size > MAX_FILE_SIZE) {
        setError(
          `Arquivo muito grande (${Math.round(file.size / 1024)} KB). Máximo: 256 KB.`
        );
        return;
      }

      // Preview imediato via blob URL
      const blobUrl = URL.createObjectURL(file);
      setPreviewUrl(blobUrl);

      // Converter para base64
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPendingBase64(result);
        setPendingMime(file.type);
      };
      reader.onerror = () => {
        setError('Erro ao ler o arquivo. Tente novamente.');
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleSave = async () => {
    if (!pendingBase64 || !pendingMime) return;
    try {
      await onSave(pendingBase64, pendingMime);
      // Limpar estado pendente após salvar com sucesso
      setPendingBase64(null);
      setPendingMime(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch {
      setError('Erro ao salvar logo. Tente novamente.');
    }
  };

  const handleRemove = async () => {
    try {
      await onRemove();
      setPendingBase64(null);
      setPendingMime(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch {
      setError('Erro ao remover logo. Tente novamente.');
    }
  };

  const handleCancel = () => {
    setPendingBase64(null);
    setPendingMime(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Upload className="text-blue-600" size={24} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Logo da Organização
          </h2>
          <p className="text-sm text-gray-600">
            Será exibido no dashboard dos funcionários
          </p>
        </div>
      </div>

      {/* Upload area */}
      <div className="space-y-4">
        {/* Current / Preview logo */}
        {effectiveLogo && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-16 h-16 flex-shrink-0 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
              <Image
                src={effectiveLogo}
                alt="Logo atual"
                width={64}
                height={64}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700">
                {previewUrl ? 'Novo logo selecionado' : 'Logo atual'}
              </p>
              {previewUrl && (
                <p className="text-xs text-amber-600">
                  Clique em &quot;Salvar Logo&quot; para confirmar
                </p>
              )}
            </div>
          </div>
        )}

        {/* File input */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isSaving}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Upload size={16} />
            {effectiveLogo ? 'Trocar imagem' : 'Selecionar imagem'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            PNG, JPG, WEBP ou SVG · Máximo 256 KB
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {pendingBase64 && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Logo'
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </>
          )}

          {currentLogoUrl && !pendingBase64 && (
            <button
              onClick={handleRemove}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              Remover Logo
            </button>
          )}

          {/* Preview toggle */}
          {effectiveLogo && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              <Eye size={16} />
              {showPreview ? 'Ocultar Preview' : 'Como ficará no dashboard'}
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Preview */}
      {showPreview && effectiveLogo && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Preview — Dashboard do Funcionário
          </p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            {/* Simulated header */}
            <div className="bg-black rounded-lg px-4 py-3 flex items-center justify-between">
              {/* Left side */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-500">Q</span>
                </div>
                <span className="text-white text-sm font-medium">
                  Avaliação Psicossocial
                </span>
              </div>
              {/* Right side — org branding */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-white text-xs font-medium truncate max-w-[160px]">
                    {orgName}
                  </p>
                  <p className="text-gray-400 text-[10px]">Powered by QWork</p>
                </div>
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-600">
                  <Image
                    src={effectiveLogo}
                    alt="Logo preview"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                </div>
              </div>
            </div>
            {/* Simulated content */}
            <div className="mt-3 px-2">
              <div className="h-3 bg-gray-300 rounded w-48 mb-2" />
              <div className="h-2 bg-gray-200 rounded w-64" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
