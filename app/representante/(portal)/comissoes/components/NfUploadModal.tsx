'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import type { Comissao } from '../types';
import { NF_MAX_SIZE, NF_TIPOS } from '../types';

interface NfUploadModalProps {
  comissao: Comissao;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NfUploadModal({
  comissao,
  onClose,
  onSuccess,
}: NfUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    setErro('');
    setPreview(null);
    if (!f) return;
    if (f.size > NF_MAX_SIZE) {
      setErro(`Arquivo excede 2MB (${(f.size / (1024 * 1024)).toFixed(1)}MB)`);
      return;
    }
    if (!NF_TIPOS.includes(f.type)) {
      setErro('Tipo não aceito. Use PDF, PNG, JPG ou WEBP.');
      return;
    }
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setErro('');
    try {
      const formData = new FormData();
      formData.append('nf', file);
      const res = await fetch(
        `/api/representante/comissoes/${comissao.id}/nf`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao enviar NF');
        return;
      }
      alert(
        data.previsao
          ? `NF enviada! Previsão de pagamento: ${new Date(data.previsao.data_prevista_pagamento).toLocaleDateString('pt-BR')}`
          : 'NF enviada com sucesso!'
      );
      onSuccess();
    } catch {
      setErro('Erro de rede. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-1">Enviar NF/RPA</h3>
        <p className="text-sm text-gray-500 mb-4">
          Comissão #{comissao.id} — {comissao.entidade_nome}
        </p>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFile(e.dataTransfer.files?.[0] || null);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <div>
              {preview && (
                <Image
                  src={preview}
                  alt="Preview"
                  width={160}
                  height={160}
                  className="mx-auto mb-3 max-h-40 rounded"
                />
              )}
              <p className="text-sm font-medium text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          ) : (
            <div>
              <span className="text-4xl">📄</span>
              <p className="text-sm text-gray-600 mt-2">
                Clique ou arraste o arquivo aqui
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, PNG, JPG ou WEBP — máx. 2MB
              </p>
            </div>
          )}
        </div>
        {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Enviando...' : 'Enviar NF'}
          </button>
        </div>
      </div>
    </div>
  );
}
