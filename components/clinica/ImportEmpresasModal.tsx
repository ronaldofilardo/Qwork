'use client';

import { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react';

interface ImportStats {
  empresas_criadas: number;
  empresas_existentes: number;
  funcionarios_criados: number;
  funcionarios_vinculados: number;
  total_linhas: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (stats: ImportStats) => void;
}

const COLUNAS_OBRIGATORIAS = [
  'empresa_cnpj',
  'empresa_nome',
  'cpf',
  'nome',
  'data_nascimento',
  'setor',
  'funcao',
];

const COLUNAS_OPCIONAIS = [
  'email',
  'matricula',
  'nivel_cargo',
  'turno',
  'escala',
];

export default function ImportEmpresasModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [result, setResult] = useState<ImportStats | null>(null);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    import('xlsx').then((XLSX) => {
      const rows = [
        [
          'empresa_cnpj',
          'empresa_nome',
          'cpf',
          'nome',
          'data_nascimento',
          'setor',
          'funcao',
          'email',
          'matricula',
          'nivel_cargo',
          'turno',
          'escala',
        ],
        [
          '09.110.380/0001-91',
          'Empresa Exemplo Ltda',
          '859.094.840-44',
          'Pedro Alves',
          '13/02/1987',
          'Operacional',
          'Analista',
          'pedro@empresa.com',
          'MAT001',
          'operacional',
          'Manhã',
          '8x44',
        ],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Importação');
      XLSX.writeFile(wb, 'template-importacao.xlsx');
    });
  };

  const handleFile = (f: File | null) => {
    setErrors(null);
    setResult(null);
    setFile(f);
  };

  const doImport = async () => {
    if (!file) return;

    setUploading(true);
    setErrors(null);
    setResult(null);

    const allowedMime =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (
      file.type !== allowedMime &&
      !file.name.toLowerCase().endsWith('.xlsx')
    ) {
      setErrors(['Apenas arquivos .xlsx são permitidos']);
      setUploading(false);
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/rh/empresas/import', {
        method: 'POST',
        body: fd,
      });

      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      if (res.ok && data['success']) {
        const stats: ImportStats = {
          empresas_criadas: (data['empresas_criadas'] as number) ?? 0,
          empresas_existentes: (data['empresas_existentes'] as number) ?? 0,
          funcionarios_criados: (data['funcionarios_criados'] as number) ?? 0,
          funcionarios_vinculados:
            (data['funcionarios_vinculados'] as number) ?? 0,
          total_linhas: (data['total_linhas'] as number) ?? 0,
        };
        setResult(stats);
        onSuccess(stats);
      } else {
        const details = data['details'] as string[] | undefined;
        const errMsg = data['error'] as string | undefined;
        const list = details ?? [errMsg ?? 'Erro ao importar'];
        setErrors(Array.isArray(list) ? list : [String(list)]);
      }
    } catch {
      setErrors(['Erro de conexão ao enviar arquivo']);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    setFile(null);
    setErrors(null);
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-empresas-modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileSpreadsheet className="text-primary" size={20} />
            </div>
            <div>
              <h2
                id="import-empresas-modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                Importar Empresas e Funcionários
              </h2>
              <p className="text-sm text-gray-500">
                Upload em massa via planilha .xlsx
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Format description */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-800 mb-3">
              Formato esperado da planilha (1ª aba):
            </p>
            <div className="overflow-x-auto">
              <div className="flex flex-wrap gap-1 mb-2">
                {COLUNAS_OBRIGATORIAS.map((col) => (
                  <span
                    key={col}
                    className="inline-block bg-blue-200 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded"
                  >
                    {col}
                  </span>
                ))}
                {COLUNAS_OPCIONAIS.map((col) => (
                  <span
                    key={col}
                    className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded border border-blue-200"
                  >
                    {col}
                    <span className="ml-0.5 opacity-70">*</span>
                  </span>
                ))}
              </div>
            </div>
            <ul className="text-xs text-blue-700 space-y-1 mt-2">
              <li>
                <span className="font-medium">empresa_cnpj:</span> CNPJ
                formatado (ex: 09.110.380/0001-91) ou apenas dígitos
              </li>
              <li>
                <span className="font-medium">data_nascimento:</span> formato{' '}
                <code className="bg-blue-100 px-1 rounded">dd/mm/aaaa</code> ou{' '}
                <code className="bg-blue-100 px-1 rounded">yyyy-mm-dd</code>
              </li>
              <li>
                <span className="font-medium">nivel_cargo*:</span> operacional,
                gestao
              </li>
              <li className="text-blue-500">
                * Colunas opcionais. Múltiplas empresas e funcionários podem
                coexistir na mesma planilha.
              </li>
            </ul>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 transition-colors duration-150 cursor-pointer"
              >
                <Download size={13} />
                Baixar Modelo (.xlsx)
              </button>
            </div>
          </div>

          {/* Rules overview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-1">
            <p className="font-medium text-gray-800 mb-2">Comportamento:</p>
            <p>
              ✅ <strong>Empresa nova</strong> (CNPJ não cadastrado): criada
              automaticamente
            </p>
            <p>
              ↩️ <strong>Empresa já existente</strong> (CNPJ já cadastrado para
              esta clínica): funcionários são adicionados a ela
            </p>
            <p>
              ✅ <strong>Funcionário novo</strong> (CPF não registrado): criado
              com senha gerada pela data de nascimento
            </p>
            <p>
              ↩️ <strong>Funcionário existente</strong> (CPF já cadastrado):
              apenas vinculado à empresa sem duplicar
            </p>
          </div>

          {/* File input */}
          {!result && (
            <div>
              <label
                htmlFor="import-bulk-file"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Arquivo (.xlsx)
              </label>
              <input
                id="import-bulk-file"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                disabled={uploading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary-hover file:transition-colors file:duration-150
                  file:cursor-pointer disabled:opacity-50"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                  <FileSpreadsheet size={14} className="shrink-0" />
                  <span>
                    {file.name}{' '}
                    <span className="text-gray-400">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Errors */}
          {errors && (
            <div
              className="bg-red-50 border border-red-200 rounded-lg p-4"
              role="alert"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-red-600 shrink-0" size={16} />
                <p className="text-sm font-semibold text-red-700">
                  {errors.length === 1
                    ? 'Erro encontrado:'
                    : `${errors.length} erros encontrados:`}
                </p>
              </div>
              <ul className="list-disc ml-5 space-y-1 max-h-48 overflow-y-auto">
                {errors.slice(0, 30).map((e, idx) => (
                  <li key={idx} className="text-sm text-red-700">
                    {e}
                  </li>
                ))}
                {errors.length > 30 && (
                  <li className="text-sm text-red-500 italic">
                    ... e mais {errors.length - 30} erro(s). Corrija e tente
                    novamente.
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Success result */}
          {result && (
            <div
              className="bg-green-50 border border-green-200 rounded-lg p-4"
              role="status"
            >
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="text-green-600 shrink-0" size={20} />
                <p className="text-sm font-semibold text-green-800">
                  Importação concluída!{' '}
                  <span className="text-green-700 font-normal">
                    {result.total_linhas} linha(s) processada(s) com sucesso.
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg border border-green-200 p-3 text-center">
                  <p className="text-3xl font-bold text-green-700">
                    {result.empresas_criadas}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Empresas criadas
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                  <p className="text-3xl font-bold text-gray-500">
                    {result.empresas_existentes}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Empresas já existentes
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-green-200 p-3 text-center">
                  <p className="text-3xl font-bold text-green-700">
                    {result.funcionarios_criados}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Funcionários criados
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-blue-200 p-3 text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {result.funcionarios_vinculados}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Vínculos adicionados
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            {result ? 'Fechar' : 'Cancelar'}
          </button>

          {!result && (
            <button
              onClick={doImport}
              disabled={!file || uploading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Importar Planilha
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
