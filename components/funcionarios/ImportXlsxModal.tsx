'use client';

import { useState } from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: (created?: number) => void;
  contexto: 'entidade' | 'clinica';
  empresaId?: number;
}

interface ParsedError {
  linha: number | null;
  mensagem: string;
}

function parseImportError(raw: string): ParsedError {
  const match = raw.match(/^Linha (\d+):\s*(.+)$/);
  if (match) {
    return { linha: parseInt(match[1], 10), mensagem: match[2] };
  }
  return { linha: null, mensagem: raw };
}

function exportarCSV(erros: ParsedError[], nomeArquivo: string): void {
  const linhas = erros.map((e) => {
    const linha = e.linha ?? 'Geral';
    const mensagem = e.mensagem.replace(/"/g, '""');
    return `${linha},"${mensagem}"`;
  });
  const csv = 'Linha,Mensagem\n' + linhas.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  const [errors, setErrors] = useState<ParsedError[] | null>(null);
  const [warnings, setWarnings] = useState<ParsedError[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!show) return null;

  const endpoint =
    contexto === 'entidade'
      ? '/api/entidade/funcionarios/import'
      : `/api/rh/funcionarios/import${empresaId ? `?empresa_id=${empresaId}` : ''}`;

  const handleFile = (f: File | null) => {
    setErrors(null);
    setWarnings(null);
    setMessage(null);
    setFile(f);
  };

  const doImport = async () => {
    if (!file) return;
    setUploading(true);
    setErrors(null);
    setWarnings(null);
    setMessage(null);

    const allowed =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (file.type !== allowed && !file.name.toLowerCase().endsWith('.xlsx')) {
      setErrors([
        { linha: null, mensagem: 'Apenas arquivos .xlsx são permitidos' },
      ]);
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
        const created: number = (data as any).created ?? 0;
        const linked: number = (data as any).linked ?? 0;
        const parts: string[] = [];
        if (created > 0)
          parts.push(
            `${created} novo${created === 1 ? '' : 's'} importado${created === 1 ? '' : 's'}`
          );
        if (linked > 0)
          parts.push(
            `${linked} vinculado${linked === 1 ? '' : 's'} (já existia${linked === 1 ? '' : 'm'} no sistema)`
          );
        setMessage(
          parts.length > 0
            ? parts.join(', ')
            : 'Nenhum funcionário novo ou vinculado'
        );
        const rawWarnings: unknown[] = (data as any).warnings ?? [];
        if (Array.isArray(rawWarnings) && rawWarnings.length > 0) {
          setWarnings(rawWarnings.map((w) => parseImportError(String(w))));
        }
        onSuccess(created);
      } else {
        const rawDetails: unknown[] = (data as any).details
          ? (data as any).details
          : [(data as any).error || 'Erro ao importar'];
        const lista = Array.isArray(rawDetails)
          ? rawDetails
          : [String(rawDetails)];
        setErrors(lista.map((e) => parseImportError(String(e))));
      }
    } catch {
      setErrors([
        { linha: null, mensagem: 'Erro de conexão ao enviar arquivo' },
      ]);
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
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-red-700">
                  {errors.length}{' '}
                  {errors.length === 1
                    ? 'erro encontrado'
                    : 'erros encontrados'}{' '}
                  — corrija o arquivo e tente novamente
                </p>
                <button
                  type="button"
                  onClick={() =>
                    exportarCSV(errors, `erros-importacao-${Date.now()}.csv`)
                  }
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-2 py-1 transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
                  aria-label="Baixar relatório de erros em CSV"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                    />
                  </svg>
                  Baixar relatório (CSV)
                </button>
              </div>
              <div className="border border-red-200 rounded overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="bg-red-100">
                      <th className="text-left px-3 py-2 text-red-800 font-medium w-20 whitespace-nowrap">
                        Linha
                      </th>
                      <th className="text-left px-3 py-2 text-red-800 font-medium">
                        Mensagem de Erro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-red-50">
                    {errors.map((e, idx) => (
                      <tr key={idx} className="border-t border-red-100">
                        <td className="px-3 py-2 text-red-700 font-mono text-xs whitespace-nowrap">
                          {e.linha ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-red-700">{e.mensagem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {message && (
            <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded text-green-700 text-sm">
              {message}
            </div>
          )}

          {warnings && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-amber-700">
                  {warnings.length}{' '}
                  {warnings.length === 1
                    ? 'registro ignorado (CPF já existente no sistema)'
                    : 'registros ignorados (CPF já existente no sistema)'}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    exportarCSV(warnings, `avisos-importacao-${Date.now()}.csv`)
                  }
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-2 py-1 transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
                  aria-label="Baixar relatório de avisos em CSV"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                    />
                  </svg>
                  Baixar lista (CSV)
                </button>
              </div>
              <div className="border border-amber-200 rounded overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="bg-amber-100">
                      <th className="text-left px-3 py-2 text-amber-800 font-medium w-20 whitespace-nowrap">
                        Linha
                      </th>
                      <th className="text-left px-3 py-2 text-amber-800 font-medium">
                        Aviso
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-amber-50">
                    {warnings.map((w, idx) => (
                      <tr key={idx} className="border-t border-amber-100">
                        <td className="px-3 py-2 text-amber-700 font-mono text-xs whitespace-nowrap">
                          {w.linha ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-amber-700">
                          {w.mensagem}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
