import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface FileErrors {
  cartao_cnpj?: string;
  contrato_social?: string;
  doc_identificacao?: string;
}

function fmtSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface DadosResponsavel {
  nome: string;
  cpf: string;
  cargo?: string;
  email: string;
  celular: string;
}

interface Arquivos {
  cartao_cnpj: File | null;
  contrato_social: File | null;
  doc_identificacao: File | null;
}

interface Props {
  dadosResponsavel: DadosResponsavel;
  arquivos: Arquivos;
  emailError?: string;
  celularError?: string;
  fileErrors?: FileErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (field: string) => void;
  onFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: keyof Arquivos
  ) => void;
}

export default function ResponsavelStep({
  dadosResponsavel,
  arquivos,
  emailError,
  celularError,
  fileErrors,
  onChange,
  onBlur,
  onFileChange,
}: Props) {
  // Uploads de documentos sempre habilitados.

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="responsavel_nome"
          className="block text-sm font-medium text-gray-700 required"
        >
          Nome Completo
        </label>
        <input
          id="responsavel_nome"
          type="text"
          name="nome"
          value={dadosResponsavel.nome}
          onChange={onChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="responsavel_cpf"
            className="block text-sm font-medium text-gray-700 required"
          >
            CPF
          </label>
          <input
            id="responsavel_cpf"
            type="text"
            name="cpf"
            value={dadosResponsavel.cpf}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label
            htmlFor="responsavel_cargo"
            className="block text-sm font-medium text-gray-700"
          >
            Cargo
          </label>
          <input
            id="responsavel_cargo"
            type="text"
            name="cargo"
            value={dadosResponsavel.cargo}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="responsavel_email"
            className="block text-sm font-medium text-gray-700 required"
          >
            Email
          </label>
          <input
            id="responsavel_email"
            type="email"
            name="email"
            value={dadosResponsavel.email}
            onChange={onChange}
            onBlur={() => onBlur?.('email')}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${emailError ? 'border-red-500 focus:ring-red-400' : 'border-gray-300'}`}
            required
          />
          {emailError && (
            <p className="text-sm text-red-600 mt-1">{emailError}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="responsavel_celular"
            className="block text-sm font-medium text-gray-700 required"
          >
            Celular
          </label>
          <input
            id="responsavel_celular"
            type="tel"
            name="celular"
            value={dadosResponsavel.celular}
            onChange={onChange}
            onBlur={() => onBlur?.('celular')}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${celularError ? 'border-red-500 focus:ring-red-400' : 'border-gray-300'}`}
            required
          />
          {celularError && (
            <p className="text-sm text-red-600 mt-1">{celularError}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="doc_identificacao"
          className="block text-sm font-medium text-gray-700 required mb-1"
        >
          Documento de Identificação
        </label>
        <p className="text-xs text-gray-400 mb-2">
          PDF, JPG ou PNG · máx. 3 MB
        </p>
        <div className="flex items-center gap-2">
          <input
            id="doc_identificacao"
            type="file"
            onChange={(e) => onFileChange(e, 'doc_identificacao')}
            accept=".pdf,.jpg,.jpeg,.png"
            className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${fileErrors?.doc_identificacao ? 'border border-red-400 rounded-md' : ''}`}
          />
          {arquivos.doc_identificacao && !fileErrors?.doc_identificacao && (
            <Check size={20} className="flex-shrink-0 text-green-500" />
          )}
          {fileErrors?.doc_identificacao && (
            <AlertCircle size={20} className="flex-shrink-0 text-red-500" />
          )}
        </div>
        {arquivos.doc_identificacao && !fileErrors?.doc_identificacao && (
          <p className="text-xs text-gray-500 mt-1">
            {arquivos.doc_identificacao.name} —{' '}
            {fmtSize(arquivos.doc_identificacao.size)}
          </p>
        )}
        {fileErrors?.doc_identificacao && (
          <p className="text-xs text-red-600 mt-1">
            {fileErrors.doc_identificacao}
          </p>
        )}
      </div>
    </div>
  );
}
