import React from 'react';
import { Check } from 'lucide-react';

interface DadosContratante {
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

interface Props {
  dadosContratante: DadosContratante;
  arquivos: Arquivos;
  cnpjError?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: keyof Arquivos
  ) => void;
}

export default function DadosStep({
  dadosContratante,
  arquivos,
  cnpjError,
  onChange,
  onFileChange,
}: Props) {
  // FEATURE FLAG: when true, uploads/anexos are temporarily disabled
  const envAnexosDesabilitados =
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS === 'true';

  // Runtime config fetch (to allow toggling w/out rebuild). Start optimistic with env
  const [runtimeDisable, setRuntimeDisable] = React.useState<boolean | null>(
    null
  );

  React.useEffect(() => {
    let mounted = true;
    fetch('/api/public-config')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (typeof json?.disableAnexos === 'boolean')
          setRuntimeDisable(json.disableAnexos);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      mounted = false;
    };
  }, []);

  const anexosDesabilitados = envAnexosDesabilitados || runtimeDisable === true;

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
          value={dadosContratante.nome}
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
            value={dadosContratante.cnpj}
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
            value={dadosContratante.inscricao_estadual}
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
            value={dadosContratante.email}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
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
            value={dadosContratante.telefone}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
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
          value={dadosContratante.endereco}
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
            value={dadosContratante.cidade}
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
            value={dadosContratante.estado}
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
            value={dadosContratante.cep}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>

      {/* Anexos */}
      <div className="border-t pt-4 mt-6">
        <h4 className="font-medium text-gray-800 mb-4">Documentos</h4>
        {anexosDesabilitados && (
          <div className="mb-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-sm text-sm">
            Uploads estão temporariamente desabilitados. Você poderá anexar
            posteriormente.
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label
              htmlFor="cartao_cnpj"
              className="block text-sm font-medium text-gray-700 required mb-2"
            >
              Cartão CNPJ
            </label>
            <div className="flex items-center gap-2">
              <input
                id="cartao_cnpj"
                type="file"
                onChange={(e) => onFileChange(e, 'cartao_cnpj')}
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                required={!anexosDesabilitados}
                disabled={anexosDesabilitados}
              />
              {anexosDesabilitados && (
                <p className="mt-2 text-sm text-yellow-700">
                  Uploads temporariamente desabilitados
                </p>
              )}
              {arquivos.cartao_cnpj && (
                <Check size={20} className="text-green-500" />
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="contrato_social"
              className="block text-sm font-medium text-gray-700 required mb-2"
            >
              Contrato Social
            </label>
            <div className="flex items-center gap-2">
              <input
                id="contrato_social"
                type="file"
                onChange={(e) => onFileChange(e, 'contrato_social')}
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                required={!anexosDesabilitados}
                disabled={anexosDesabilitados}
              />
              {anexosDesabilitados && (
                <p className="mt-2 text-sm text-yellow-700">
                  Uploads temporariamente desabilitados
                </p>
              )}
              {arquivos.contrato_social && (
                <Check size={20} className="text-green-500" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
