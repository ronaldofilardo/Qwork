'use client';

import {
  Stethoscope,
  Edit,
  ChevronDown,
  ChevronUp,
  Users,
  Building2,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Trash2,
} from 'lucide-react';
import type { Clinica, Gestor, Empresa } from './types';

interface ClinicaCardProps {
  clinica: Clinica;
  isExpanded: boolean;
  gestores: Gestor[];
  empresas: Empresa[];
  isLoadingDetails: boolean;
  deletingClinica: number | null;
  onToggleExpand: (id: number) => void;
  onRequestDelete: (id: number) => void;
}

export function ClinicaCard({
  clinica,
  isExpanded,
  gestores,
  empresas,
  isLoadingDetails,
  deletingClinica,
  onToggleExpand,
  onRequestDelete,
}: ClinicaCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Stethoscope className="w-8 h-8 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {clinica.nome} [ID={clinica.id}]
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1 truncate">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{clinica.email}</span>
                </div>
                <div className="flex items-center gap-1 truncate">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{clinica.telefone}</span>
                </div>
                <div className="flex items-center gap-1 truncate">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span>CNPJ: {clinica.cnpj}</span>
                </div>
                <div className="flex items-center gap-1 truncate">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {clinica.cidade}/{clinica.estado}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                clinica.ativa
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {clinica.ativa ? 'Ativa' : 'Inativa'}
            </span>
            <button
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(clinica.id);
              }}
              disabled={deletingClinica === clinica.id}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
              title="Deletar clínica definitivamente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleExpand(clinica.id)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          {isLoadingDetails ? (
            <div className="p-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Responsável Principal */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Responsável Principal
                </h4>
                <div className="bg-white rounded-md p-4 border border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Nome:</span>
                      <p className="font-medium text-gray-900">
                        {clinica.responsavel_nome}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">CPF:</span>
                      <p className="font-medium text-gray-900">
                        {clinica.responsavel_cpf}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium text-gray-900">
                        {clinica.responsavel_email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gestores RH */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Gestores RH (
                  {gestores.filter((g) => !g.is_responsavel).length})
                </h4>
                {gestores.filter((g) => !g.is_responsavel).length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    Nenhum gestor RH adicional
                  </p>
                ) : (
                  <div className="space-y-2">
                    {gestores
                      .filter((g) => !g.is_responsavel)
                      .map((gestor) => (
                        <div
                          key={gestor.cpf}
                          className="bg-white rounded-md p-4 border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="grid grid-cols-4 gap-4 text-sm flex-1">
                              <div>
                                <span className="text-gray-500">Nome:</span>
                                <p className="font-medium text-gray-900">
                                  {gestor.nome}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Login (CPF):
                                </span>
                                <p className="font-medium text-gray-900">
                                  {gestor.cpf}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Email:</span>
                                <p className="font-medium text-gray-900">
                                  {gestor.email}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Empresas geridas:
                                </span>
                                <p className="font-medium text-gray-900">
                                  {gestor.total_empresas_geridas}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ml-4 ${
                                gestor.ativo
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {gestor.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Empresas Clientes */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Empresas Clientes ({empresas.length})
                </h4>
                {empresas.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    Nenhuma empresa cliente
                  </p>
                ) : (
                  <div className="space-y-2">
                    {empresas.map((empresa) => (
                      <div
                        key={empresa.id}
                        className="bg-white rounded-md p-4 border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium text-gray-900">
                                {empresa.nome} [ID={empresa.id}]
                              </h5>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  empresa.ativa
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {empresa.ativa ? 'Ativa' : 'Inativa'}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="text-gray-500">
                                  Funcionários:
                                </span>
                                <p className="font-medium text-gray-900">
                                  {empresa.total_funcionarios}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Avaliações:
                                </span>
                                <p className="font-medium text-gray-900">
                                  {empresa.total_avaliacoes}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Concluídas:
                                </span>
                                <p className="font-medium text-green-700">
                                  {empresa.avaliacoes_concluidas}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Liberadas:
                                </span>
                                <p className="font-medium text-blue-700">
                                  {empresa.avaliacoes_liberadas}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              {empresa.cidade && empresa.estado && (
                                <span>
                                  {empresa.cidade}/{empresa.estado} •{' '}
                                </span>
                              )}
                              {empresa.cnpj && (
                                <span>CNPJ: {empresa.cnpj}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
