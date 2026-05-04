'use client';

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

interface RepAutoFill {
  id: number;
  nome: string;
  modelo: 'percentual' | 'custo_fixo';
  percRep: number | null;
}

interface TomadorDetailModalProps {
  tomador: Tomador;
  onClose: () => void;
  codigoRepInput: string;
  setCodigoRepInput: (v: string) => void;
  vinculando: boolean;
  ativando: boolean;
  onVincular: () => void;
  onToggleAtivo: (t: Tomador) => void;
  repAutoFill: RepAutoFill | null;
  buscandoRep: boolean;
}

export default function TomadorDetailModal({
  tomador,
  onClose,
  codigoRepInput,
  setCodigoRepInput,
  vinculando,
  ativando,
  onVincular,
  onToggleAtivo,
  repAutoFill,
  buscandoRep,
}: TomadorDetailModalProps) {
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
                    Nenhum representante vinculado. Informe o ID para vincular:
                  </p>
                  {/* Campo: ID do representante */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ID do representante
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="ID numérico (ex: 42)"
                        value={codigoRepInput}
                        onChange={(e) =>
                          setCodigoRepInput(e.target.value.replace(/\D/g, ''))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pr-8"
                        disabled={vinculando}
                      />
                      {buscandoRep && (
                        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                      )}
                      {!buscandoRep &&
                        codigoRepInput.length > 0 &&
                        repAutoFill && (
                          <CheckCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      {!buscandoRep &&
                        codigoRepInput.length > 0 &&
                        !repAutoFill && (
                          <XCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                        )}
                    </div>
                    {repAutoFill && (
                      <p className="text-xs text-green-700 mt-1 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {repAutoFill.nome}
                      </p>
                    )}
                    {!buscandoRep &&
                      codigoRepInput.length > 0 &&
                      !repAutoFill && (
                        <p className="text-xs text-red-500 mt-1">
                          Representante não encontrado
                        </p>
                      )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={onVincular}
                      disabled={vinculando || !repAutoFill}
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
