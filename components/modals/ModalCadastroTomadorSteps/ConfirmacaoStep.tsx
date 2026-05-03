import React from 'react';
import { Check } from 'lucide-react';

interface Dadostomador {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
}

interface DadosResponsavel {
  nome: string;
  cpf: string;
  cargo?: string;
  email: string;
  celular?: string;
}

interface Arquivos {
  cartao_cnpj: File | null;
  contrato_social: File | null;
  doc_identificacao: File | null;
}

interface Props {
  dadostomador: Dadostomador;
  dadosResponsavel: DadosResponsavel;
  arquivos: Arquivos;
  confirmacaoFinalAceita: boolean;
  setConfirmacaoFinalAceita: (v: boolean) => void;
  responsavelLabel?: string;
  codigoRepresentante: string;
  setCodigoRepresentante: (v: string) => void;
  semIndicacao: boolean;
  setSemIndicacao: (v: boolean) => void;
}

export default function ConfirmacaoStep({
  dadostomador,
  dadosResponsavel,
  arquivos,
  confirmacaoFinalAceita,
  setConfirmacaoFinalAceita,
  responsavelLabel = 'Responsável',
  codigoRepresentante,
  setCodigoRepresentante,
  semIndicacao,
  setSemIndicacao,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Revise seus dados antes de enviar.</strong> Após o envio, seu
          cadastro ficará em análise e você receberá um email com o resultado.
        </p>
      </div>

      <div className="border rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-gray-800">Dados da Empresa</h4>
        <p className="text-sm">
          <strong>Razão Social:</strong> {dadostomador.nome}
        </p>
        <p className="text-sm">
          <strong>CNPJ:</strong> {dadostomador.cnpj}
        </p>
        <p className="text-sm">
          <strong>Email:</strong> {dadostomador.email}
        </p>
        <p className="text-sm">
          <strong>Telefone:</strong> {dadostomador.telefone}
        </p>
        <p className="text-sm">
          <strong>Endereço:</strong> {dadostomador.endereco},{' '}
          {dadostomador.cidade}/{dadostomador.estado}
        </p>
      </div>

      <div className="border rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-gray-800">
          Dados do {responsavelLabel}
        </h4>
        <p className="text-sm">
          <strong>Nome:</strong> {dadosResponsavel.nome}
        </p>
        <p className="text-sm">
          <strong>CPF:</strong> {dadosResponsavel.cpf}
        </p>
        <p className="text-sm">
          <strong>Cargo:</strong> {dadosResponsavel.cargo || 'Não informado'}
        </p>
        <p className="text-sm">
          <strong>Email:</strong> {dadosResponsavel.email}
        </p>
        <p className="text-sm">
          <strong>Celular:</strong> {dadosResponsavel.celular}
        </p>
      </div>

      <div className="border rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">
          Documentos Anexados
        </h4>
        <ul className="text-sm space-y-1">
          <li className="flex items-center gap-2">
            <Check size={16} className="text-green-500" /> Cartão CNPJ:{' '}
            {arquivos.cartao_cnpj?.name}
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-green-500" /> Contrato Social:{' '}
            {arquivos.contrato_social?.name}
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-green-500" /> Doc. Identificação:{' '}
            {arquivos.doc_identificacao?.name}
          </li>
        </ul>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-gray-800">Código do Representante</h4>
        <p className="text-xs text-gray-500">
          Se você foi indicado por um representante QWork, informe o código
          aqui. Campo opcional.
        </p>
        <div className="space-y-2">
          <input
            type="text"
            value={codigoRepresentante}
            onChange={(e) =>
              setCodigoRepresentante(e.target.value.toUpperCase())
            }
            disabled={semIndicacao}
            placeholder="Ex: REP-ABC123"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={semIndicacao}
              onChange={(e) => {
                setSemIndicacao(e.target.checked);
                if (e.target.checked) setCodigoRepresentante('');
              }}
              className="w-4 h-4 text-gray-600 rounded"
            />
            <span className="text-sm text-gray-600">
              Não possuo código de representante
            </span>
          </label>
        </div>
      </div>

      <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmacaoFinalAceita}
            onChange={(e) => setConfirmacaoFinalAceita(e.target.checked)}
            className="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
          />
          <span className="text-sm text-gray-800">
            <strong className="text-orange-700">
              Confirmo que revisei todos os dados
            </strong>{' '}
            e estou ciente de que, após o envio, você precisará aceitar os
            termos do contrato para liberar seu acesso imediatamente. Declaro
            que as informações fornecidas são verdadeiras.
          </span>
        </label>
      </div>
    </div>
  );
}
