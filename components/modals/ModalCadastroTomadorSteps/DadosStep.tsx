import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface Dadostomador {
  nome: string;
  cnpj: string;
  inscricao_estadual?: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface Arquivos {
  cartao_cnpj: File | null;
  contrato_social: File | null;
  doc_identificacao: File | null;
}

interface FileErrors {
  cartao_cnpj?: string;
  contrato_social?: string;
  doc_identificacao?: string;
}

function fmtSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  dadostomador: Dadostomador;
  arquivos: Arquivos;
  cnpjError?: string;
  emailError?: string;
  telefoneError?: string;
  fileErrors?: FileErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (field: string) => void;
  onFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: keyof Arquivos
  ) => void;
}

export default function DadosStep({
  dadostomador,
  arquivos,
  cnpjError,
  emailError,
  telefoneError,
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
          htmlFor="nome"
          className="block text-sm font-medium text-gray-700 required"
        >
          Razão Social
        </label>
        <input
          id="nome"
          type="text"
          name="nome"
          value={dadostomador.nome}
          onChange={onChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="cnpj"
            className="block text-sm font-medium text-gray-700 required"
          >
            CNPJ
          </label>
          <input
            id="cnpj"
            type="text"
            name="cnpj"
            value={dadostomador.cnpj}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
          {cnpjError && (
            <p className="text-sm text-red-600 mt-1">{cnpjError}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="inscricao_estadual"
            className="block text-sm font-medium text-gray-700"
          >
            Inscrição Estadual
          </label>
          <input
            id="inscricao_estadual"
            type="text"
            name="inscricao_estadual"
            value={dadostomador.inscricao_estadual}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="empresa_email"
            className="block text-sm font-medium text-gray-700 required"
          >
            Email
          </label>
          <input
            id="empresa_email"
            type="email"
            name="email"
            value={dadostomador.email}
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
            htmlFor="telefone"
            className="block text-sm font-medium text-gray-700 required"
          >
            Telefone
          </label>
          <input
            id="telefone"
            type="tel"
            name="telefone"
            value={dadostomador.telefone}
            onChange={onChange}
            onBlur={() => onBlur?.('telefone')}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${telefoneError ? 'border-red-500 focus:ring-red-400' : 'border-gray-300'}`}
            required
          />
          {telefoneError && (
            <p className="text-sm text-red-600 mt-1">{telefoneError}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="endereco"
          className="block text-sm font-medium text-gray-700 required"
        >
          Endereço
        </label>
        <input
          id="endereco"
          type="text"
          name="endereco"
          value={dadostomador.endereco}
          onChange={onChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="cidade"
            className="block text-sm font-medium text-gray-700 required"
          >
            Cidade
          </label>
          <input
            id="cidade"
            type="text"
            name="cidade"
            value={dadostomador.cidade}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label
            htmlFor="estado"
            className="block text-sm font-medium text-gray-700 required"
          >
            Estado (UF)
          </label>
          <input
            id="estado"
            type="text"
            name="estado"
            value={dadostomador.estado}
            onChange={onChange}
            maxLength={2}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md uppercase"
            required
          />
        </div>
        <div>
          <label
            htmlFor="cep"
            className="block text-sm font-medium text-gray-700 required"
          >
            CEP
          </label>
          <input
            id="cep"
            type="text"
            name="cep"
            value={dadostomador.cep}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>

      {/* Anexos */}
      <div className="border-t pt-4 mt-6">
        <h4 className="font-medium text-gray-800 mb-4">Documentos</h4>

        <div className="space-y-4">
          {/* Cartão CNPJ */}
          <div>
            <label
              htmlFor="cartao_cnpj"
              className="block text-sm font-medium text-gray-700 required mb-1"
            >
              Cartão CNPJ
            </label>
            <p className="text-xs text-gray-400 mb-2">
              PDF, JPG ou PNG · máx. 3 MB
            </p>
            <div className="flex items-center gap-2">
              <input
                id="cartao_cnpj"
                type="file"
                onChange={(e) => onFileChange(e, 'cartao_cnpj')}
                accept=".pdf,.jpg,.jpeg,.png"
                className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${fileErrors?.cartao_cnpj ? 'border border-red-400 rounded-md' : ''}`}
              />
              {arquivos.cartao_cnpj && !fileErrors?.cartao_cnpj && (
                <Check size={20} className="flex-shrink-0 text-green-500" />
              )}
              {fileErrors?.cartao_cnpj && (
                <AlertCircle size={20} className="flex-shrink-0 text-red-500" />
              )}
            </div>
            {arquivos.cartao_cnpj && !fileErrors?.cartao_cnpj && (
              <p className="text-xs text-gray-500 mt-1">
                {arquivos.cartao_cnpj.name} —{' '}
                {fmtSize(arquivos.cartao_cnpj.size)}
              </p>
            )}
            {fileErrors?.cartao_cnpj && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                {fileErrors.cartao_cnpj}
              </p>
            )}
          </div>

          {/* Contrato Social */}
          <div>
            <label
              htmlFor="contrato_social"
              className="block text-sm font-medium text-gray-700 required mb-1"
            >
              Contrato Social
            </label>
            <p className="text-xs text-gray-400 mb-2">
              PDF, JPG ou PNG · máx. 3 MB
            </p>
            <div className="flex items-center gap-2">
              <input
                id="contrato_social"
                type="file"
                onChange={(e) => onFileChange(e, 'contrato_social')}
                accept=".pdf,.jpg,.jpeg,.png"
                className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${fileErrors?.contrato_social ? 'border border-red-400 rounded-md' : ''}`}
              />
              {arquivos.contrato_social && !fileErrors?.contrato_social && (
                <Check size={20} className="flex-shrink-0 text-green-500" />
              )}
              {fileErrors?.contrato_social && (
                <AlertCircle size={20} className="flex-shrink-0 text-red-500" />
              )}
            </div>
            {arquivos.contrato_social && !fileErrors?.contrato_social && (
              <p className="text-xs text-gray-500 mt-1">
                {arquivos.contrato_social.name} —{' '}
                {fmtSize(arquivos.contrato_social.size)}
              </p>
            )}
            {fileErrors?.contrato_social && (
              <p className="text-xs text-red-600 mt-1">
                {fileErrors.contrato_social}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
