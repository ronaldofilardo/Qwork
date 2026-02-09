import React from 'react';
import { Check } from 'lucide-react';

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
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: keyof Arquivos
  ) => void;
}

export default function ResponsavelStep({
  dadosResponsavel,
  arquivos,
  onChange,
  onFileChange,
}: Props) {
  // FEATURE FLAG: when true, uploads/anexos are temporarily disabled
  const envAnexosDesabilitados =
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS === 'true';
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="doc_identificacao"
          className="block text-sm font-medium text-gray-700 required mb-2"
        >
          Documento de Identificação
        </label>
        <div className="flex items-center gap-2">
          <input
            id="doc_identificacao"
            type="file"
            onChange={(e) => onFileChange(e, 'doc_identificacao')}
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
          {arquivos.doc_identificacao && (
            <Check size={20} className="text-green-500" />
          )}
        </div>
      </div>
    </div>
  );
}
