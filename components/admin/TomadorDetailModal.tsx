'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle,
  XCircle,
  UserCheck,
  Link2,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';

type TipoTomador = 'clinica' | 'entidade';

interface RepresentanteVinculo {
  vinculo_id: number;
  representante_id: number;
  nome: string;
  codigo: string;
  valor_negociado: number | null;
}

interface Tomador {
  id: string;
  tipo: TipoTomador;
  nome: string;
  cnpj: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  email?: string;
  gestor: {
    nome: string;
    cpf: string;
    email: string;
    perfil: 'rh' | 'gestor';
  } | null;
  ativo: boolean;
  created_at: string;
  representante: RepresentanteVinculo | null;
}

interface TomadorDetailModalProps {
  tomador: Tomador;
  onClose: () => void;
  codigoRepInput: string;
  setCodigoRepInput: (v: string) => void;
  valorNegociadoInput: string;
  setValorNegociadoInput: (v: string) => void;
  vinculando: boolean;
  ativando: boolean;
  onVincular: () => void;
  onToggleAtivo: (t: Tomador) => void;
}

export default function TomadorDetailModal({
  tomador,
  onClose,
  codigoRepInput,
  setCodigoRepInput,
  valorNegociadoInput,
  setValorNegociadoInput,
  vinculando,
  ativando,
  onVincular,
  onToggleAtivo,
}: TomadorDetailModalProps) {
  const [documentos, setDocumentos] = useState<{
    cartao_cnpj: string | null;
    contrato_social: string | null;
    doc_identificacao: string | null;
  } | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    setDocumentos(null);
    setLoadingDocs(true);
    fetch(`/api/admin/tomadores/${tomador.id}/documentos?tipo=${tomador.tipo}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setDocumentos(data.documentos);
      })
      .catch(() => null)
      .finally(() => setLoadingDocs(false));
  }, [tomador.id, tomador.tipo]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header do Modal */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-lg ${
                  tomador.tipo === 'clinica' ? 'bg-blue-100' : 'bg-purple-100'
                }`}
              >
                <Building2
                  className={`h-8 w-8 ${
                    tomador.tipo === 'clinica'
                      ? 'text-blue-600'
                      : 'text-purple-600'
                  }`}
                />
              </div>
              <div>
                <span
                  className={`text-sm font-semibold px-3 py-1 rounded ${
                    tomador.tipo === 'clinica'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {tomador.tipo === 'clinica' ? 'CLÍNICA' : 'ENTIDADE'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Dados do tomador */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {tomador.nome}
              </h2>
              <p className="text-gray-600">CNPJ: {tomador.cnpj}</p>
            </div>

            {/* Endereço Completo */}
            {tomador.endereco && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  Endereço
                </h3>
                <p className="text-gray-700">{tomador.endereco}</p>
                <p className="text-gray-700">
                  {tomador.cidade}/{tomador.estado}
                </p>
              </div>
            )}

            {/* Contato */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Contato</h3>
              <div className="space-y-2">
                {tomador.telefone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-5 w-5 text-gray-600" />
                    <span>{tomador.telefone}</span>
                  </div>
                )}
                {tomador.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-5 w-5 text-gray-600" />
                    <span>{tomador.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Gestor Responsável */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                Gestor Responsável
              </h3>
              {tomador.gestor ? (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">
                    {tomador.gestor.nome}
                  </p>
                  <p className="text-gray-700">CPF: {tomador.gestor.cpf}</p>
                  <p className="text-gray-700">Email: {tomador.gestor.email}</p>
                  <span
                    className={`inline-block text-sm px-3 py-1 rounded ${
                      tomador.gestor.perfil === 'rh'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {tomador.gestor.perfil === 'rh' ? 'RH' : 'Gestor Entidade'}
                  </span>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <p className="text-amber-800">
                    ⚠️ Este tomador não possui gestor vinculado
                  </p>
                </div>
              )}
            </div>

            {/* Representante Vinculado */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-600" />
                Representante
              </h3>
              {tomador.representante ? (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">
                    {tomador.representante.nome}
                  </p>
                  <p className="text-sm text-purple-700">
                    Código: {tomador.representante.codigo}
                  </p>
                  {tomador.representante.valor_negociado != null && (
                    <p className="text-sm text-gray-700">
                      Valor negociado:{' '}
                      <strong>
                        R${' '}
                        {tomador.representante.valor_negociado.toLocaleString(
                          'pt-BR',
                          { minimumFractionDigits: 2 }
                        )}
                      </strong>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Nenhum representante vinculado. Informe o código para
                    vincular:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Código (ex: REP-PJ123)"
                      value={codigoRepInput}
                      onChange={(e) =>
                        setCodigoRepInput(e.target.value.toUpperCase())
                      }
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      disabled={vinculando}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Valor negociado/func (opcional)"
                      value={valorNegociadoInput}
                      onChange={(e) => setValorNegociadoInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      disabled={vinculando}
                    />
                    <button
                      onClick={onVincular}
                      disabled={vinculando || !codigoRepInput.trim()}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Link2 className="h-4 w-4" />
                      {vinculando ? 'Vinculando...' : 'Vincular'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Data de Cadastro */}
            <div className="text-sm text-gray-600">
              Cadastrado em:{' '}
              {new Date(tomador.created_at).toLocaleDateString('pt-BR')}
            </div>

            {/* Documentos do Cadastro */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Documentos do Cadastro
              </h3>
              {loadingDocs ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando documentos...
                </div>
              ) : (
                <div className="space-y-2">
                  {(
                    [
                      { chave: 'cartao_cnpj', label: 'Cartão CNPJ' },
                      { chave: 'contrato_social', label: 'Contrato Social' },
                      {
                        chave: 'doc_identificacao',
                        label: 'Doc. Identificação',
                      },
                    ] as const
                  ).map(({ chave, label }) => {
                    const url = documentos?.[chave] ?? null;
                    return (
                      <div
                        key={chave}
                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm text-gray-700">{label}</span>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Download className="h-4 w-4" />
                            Baixar
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Não enviado
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ação: Ativar / Desativar */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => onToggleAtivo(tomador)}
                disabled={ativando}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  tomador.ativo
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                } disabled:opacity-50`}
              >
                {tomador.ativo ? (
                  <>
                    <XCircle className="h-5 w-5" /> Desativar
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" /> Ativar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
