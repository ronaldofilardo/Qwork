'use client';

import { useState } from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: (created?: number) => void;
  contexto: 'entidade' | 'clinica';
  empresaId?: number;
}

export default function ImportXlsxModal({
  show,
  onClose,
  onSuccess,
  contexto,
  empresaId,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!show) return null;

  const endpoint =
    contexto === 'entidade'
      ? '/api/entidade/funcionarios/import'
      : `/api/rh/funcionarios/import${empresaId ? `?empresa_id=${empresaId}` : ''}`;

  const handleFile = (f: File | null) => {
    setErrors(null);
    setMessage(null);
    setFile(f);
  };

  const doImport = async () => {
    if (!file) return;
    setUploading(true);
    setErrors(null);
    setMessage(null);

    const allowed =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (file.type !== allowed && !file.name.toLowerCase().endsWith('.xlsx')) {
      setErrors(['Apenas arquivos .xlsx são permitidos']);
      setUploading(false);
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && (data as any).success) {
        setMessage(
          `${(data as any).created} funcionários importados com sucesso`
        );
        onSuccess((data as any).created);
      } else {
        const details = (data as any).details
          ? (data as any).details
          : [(data as any).error || 'Erro ao importar'];
        setErrors(Array.isArray(details) ? details : [String(details)]);
      }
    } catch {
      setErrors(['Erro de conexão ao enviar arquivo']);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg z-10 w-full max-w-2xl p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">
            Importar Funcionários (XLSX)
          </h3>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-700">
            Use o modelo oficial para preparar o arquivo. A coluna{' '}
            <strong>Data de Nascimento</strong> deve estar no formato{' '}
            <code>dd/mm/aaaa</code> ou <code>yyyy-mm-dd</code>. O arquivo deve
            ser <strong>.xlsx</strong>.
          </p>

          <div className="mt-4">
            <label
              htmlFor="import-file"
              className="block text-sm font-medium text-gray-700"
            >
              Arquivo (.xlsx)
            </label>
            <input
              id="import-file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) =>
                handleFile(e.target.files ? e.target.files[0] : null)
              }
              className="mt-2"
            />
            {file && (
              <div className="text-sm text-gray-600 mt-2">
                Selecionado: {file.name}
              </div>
            )}
          </div>

          {errors && (
            <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded">
              <p className="font-medium text-red-700">Erros:</p>
              <ul className="list-disc ml-5 mt-2 text-sm text-red-700">
                {errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {message && (
            <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded text-green-700">
              {message}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border rounded"
          >
            Fechar
          </button>
          <button
            onClick={doImport}
            disabled={!file || uploading}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {uploading ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}
