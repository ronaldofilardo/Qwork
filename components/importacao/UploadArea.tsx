'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

const ACCEPT = '.xlsx,.xls,.csv';
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export default function UploadArea({
  onFileSelect,
  isLoading,
}: UploadAreaProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      const name = file.name.toLowerCase();
      if (
        !name.endsWith('.xlsx') &&
        !name.endsWith('.xls') &&
        !name.endsWith('.csv')
      ) {
        setError('Formato não suportado. Use .xlsx, .xls ou .csv');
        return;
      }

      if (file.size > MAX_SIZE) {
        setError('Arquivo excede o limite de 10 MB');
        return;
      }

      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
          ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleInputChange}
          className="hidden"
          disabled={isLoading}
        />

        {selectedFile ? (
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={32} className="text-green-600" />
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {!isLoading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 rounded hover:bg-gray-200"
              >
                <X size={18} className="text-gray-500" />
              </button>
            )}
          </div>
        ) : (
          <>
            <Upload size={40} className="text-gray-400 mb-3" />
            <p className="text-gray-700 font-medium">
              Arraste sua planilha aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Formatos aceitos: .xlsx, .xls, .csv — Máximo: 10 MB
            </p>
          </>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg">
            <div className="flex items-center gap-2 text-primary-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
              <span className="font-medium">Analisando arquivo...</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
