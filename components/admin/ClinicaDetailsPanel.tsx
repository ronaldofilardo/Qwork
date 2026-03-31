import { UserCheck, Users, Building2 } from 'lucide-react';

interface Clinica {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  ativa: boolean;
  status: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_email: string;
  criado_em: string;
}

interface Gestor {
  cpf: string;
  nome: string;
  email: string;
  ativo: boolean;
  total_empresas_geridas: string;
  is_responsavel?: boolean;
}

interface Empresa {
  id: number;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  ativa: boolean;
  total_funcionarios: number;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_liberadas: number;
}

interface Props {
  clinica: Clinica;
  gestores: Gestor[];
  empresas: Empresa[];
  isLoading: boolean;
}

export default function ClinicaDetailsPanel({
  clinica,
  gestores,
  empresas,
  isLoading,
}: Props) {
  return (
    <div className="border-t border-gray-200 bg-gray-50">
      {isLoading ? (
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
              Gestores RH ({gestores.filter((g) => !g.is_responsavel).length})
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
                            <span className="text-gray-500">Login (CPF):</span>
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
                            <span className="text-gray-500">Funcionários:</span>
                            <p className="font-medium text-gray-900">
                              {empresa.total_funcionarios}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Avaliações:</span>
                            <p className="font-medium text-gray-900">
                              {empresa.total_avaliacoes}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Concluídas:</span>
                            <p className="font-medium text-green-700">
                              {empresa.avaliacoes_concluidas}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Liberadas:</span>
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
                          {empresa.cnpj && <span>CNPJ: {empresa.cnpj}</span>}
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
  );
}
