import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

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
  onCodigoRepresentanteChange: (v: string) => void;
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
  onCodigoRepresentanteChange,
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

      {/* Seção de Indicação */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-800">Indicação</h4>
          <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            Obrigatório
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Informe o código do representante que indicou sua empresa, ou marque
          que não possui indicação.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código do Representante
          </label>
          <input
            type="text"
            value={codigoRepresentante}
            onChange={(e) =>
              onCodigoRepresentanteChange(e.target.value.toUpperCase())
            }
            placeholder="REP-ABC123"
            disabled={semIndicacao}
            maxLength={20}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={semIndicacao}
            onChange={(e) => {
              setSemIndicacao(e.target.checked);
              if (e.target.checked) onCodigoRepresentanteChange('');
            }}
            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">
            Não fui indicado por nenhum representante
          </span>
        </label>
        {!codigoRepresentante.trim() && !semIndicacao && (
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span className="text-xs">
              Informe o código do representante ou marque que não possui
              indicação para prosseguir.
            </span>
          </div>
        )}
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
