'use client';

import { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, User, Filter } from 'lucide-react';

type TipoContratante = 'clinica' | 'entidade';

interface Contratante {
  id: string;
  tipo: TipoContratante;
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
}

export function ContratantesContent({
  activeSubSection,
}: {
  activeSubSection?: string;
}) {
  const [contratantes, setContratantes] = useState<Contratante[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<TipoContratante | 'todos'>(
    activeSubSection === 'clinicas'
      ? 'clinica'
      : activeSubSection === 'entidades'
        ? 'entidade'
        : 'todos'
  );
  const [contratanteSelecionado, setContratanteSelecionado] =
    useState<Contratante | null>(null);

  const fetchContratantes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/entidades');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setContratantes(data.entidades || []);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar contratantes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContratantes();
  }, []);

  useEffect(() => {
    setFiltro(
      activeSubSection === 'clinicas'
        ? 'clinica'
        : activeSubSection === 'entidades'
          ? 'entidade'
          : 'todos'
    );
  }, [activeSubSection]);

  const contratantesFiltrados = contratantes.filter(
    (c) => filtro === 'todos' || c.tipo === filtro
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contratantes</h1>
            <p className="text-sm text-gray-600 mt-1">
              Visualização de clínicas e entidades com seus gestores
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filtro}
              onChange={(e) =>
                setFiltro(e.target.value as TipoContratante | 'todos')
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="clinica">Clínicas</option>
              <option value="entidade">Entidades</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-gray-600">
              Clínicas:{' '}
              {contratantes.filter((c) => c.tipo === 'clinica').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <span className="text-gray-600">
              Entidades:{' '}
              {contratantes.filter((c) => c.tipo === 'entidade').length}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contratantesFiltrados.map((contratante) => (
          <div
            key={contratante.id}
            onClick={() => setContratanteSelecionado(contratante)}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 border-l-4"
            style={{
              borderLeftColor:
                contratante.tipo === 'clinica' ? '#3b82f6' : '#a855f7',
            }}
          >
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    contratante.tipo === 'clinica'
                      ? 'bg-blue-100'
                      : 'bg-purple-100'
                  }`}
                >
                  <Building2
                    className={`h-6 w-6 ${
                      contratante.tipo === 'clinica'
                        ? 'text-blue-600'
                        : 'text-purple-600'
                    }`}
                  />
                </div>
                <div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      contratante.tipo === 'clinica'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {contratante.tipo === 'clinica' ? 'CLÍNICA' : 'ENTIDADE'}
                  </span>
                </div>
              </div>

              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  contratante.ativo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {contratante.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {/* Nome e CNPJ */}
            <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2">
              {contratante.nome}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              CNPJ: {contratante.cnpj}
            </p>

            {/* Informações de Contato */}
            <div className="space-y-2 mb-4 text-sm">
              {contratante.cidade && contratante.estado && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {contratante.cidade}/{contratante.estado}
                  </span>
                </div>
              )}
              {contratante.telefone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{contratante.telefone}</span>
                </div>
              )}
              {contratante.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{contratante.email}</span>
                </div>
              )}
            </div>

            {/* Gestor */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500 font-medium">Gestor:</span>
              </div>
              {contratante.gestor ? (
                <div className="mt-2 text-sm">
                  <p className="font-semibold text-gray-900">
                    {contratante.gestor.nome}
                  </p>
                  <p className="text-gray-600">{contratante.gestor.email}</p>
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                      contratante.gestor.perfil === 'rh'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {contratante.gestor.perfil === 'rh'
                      ? 'RH'
                      : 'Gestor Entidade'}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ Sem gestor vinculado
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalhes */}
      {contratanteSelecionado && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setContratanteSelecionado(null)}
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
                      contratanteSelecionado.tipo === 'clinica'
                        ? 'bg-blue-100'
                        : 'bg-purple-100'
                    }`}
                  >
                    <Building2
                      className={`h-8 w-8 ${
                        contratanteSelecionado.tipo === 'clinica'
                          ? 'text-blue-600'
                          : 'text-purple-600'
                      }`}
                    />
                  </div>
                  <div>
                    <span
                      className={`text-sm font-semibold px-3 py-1 rounded ${
                        contratanteSelecionado.tipo === 'clinica'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {contratanteSelecionado.tipo === 'clinica'
                        ? 'CLÍNICA'
                        : 'ENTIDADE'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setContratanteSelecionado(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Dados do Contratante */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {contratanteSelecionado.nome}
                  </h2>
                  <p className="text-gray-600">
                    CNPJ: {contratanteSelecionado.cnpj}
                  </p>
                </div>

                {/* Endereço Completo */}
                {contratanteSelecionado.endereco && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      Endereço
                    </h3>
                    <p className="text-gray-700">
                      {contratanteSelecionado.endereco}
                    </p>
                    <p className="text-gray-700">
                      {contratanteSelecionado.cidade}/
                      {contratanteSelecionado.estado}
                    </p>
                  </div>
                )}

                {/* Contato */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Contato</h3>
                  <div className="space-y-2">
                    {contratanteSelecionado.telefone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="h-5 w-5 text-gray-600" />
                        <span>{contratanteSelecionado.telefone}</span>
                      </div>
                    )}
                    {contratanteSelecionado.email && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="h-5 w-5 text-gray-600" />
                        <span>{contratanteSelecionado.email}</span>
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
                  {contratanteSelecionado.gestor ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">
                        {contratanteSelecionado.gestor.nome}
                      </p>
                      <p className="text-gray-700">
                        CPF: {contratanteSelecionado.gestor.cpf}
                      </p>
                      <p className="text-gray-700">
                        Email: {contratanteSelecionado.gestor.email}
                      </p>
                      <span
                        className={`inline-block text-sm px-3 py-1 rounded ${
                          contratanteSelecionado.gestor.perfil === 'rh'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {contratanteSelecionado.gestor.perfil === 'rh'
                          ? 'RH'
                          : 'Gestor Entidade'}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3">
                      <p className="text-amber-800">
                        ⚠️ Este contratante não possui gestor vinculado
                      </p>
                    </div>
                  )}
                </div>

                {/* Data de Cadastro */}
                <div className="text-sm text-gray-600">
                  Cadastrado em:{' '}
                  {new Date(
                    contratanteSelecionado.created_at
                  ).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem quando não há contratantes */}
      {contratantesFiltrados.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {filtro === 'todos'
              ? 'Nenhum contratante cadastrado'
              : `Nenhuma ${filtro} cadastrada`}
          </p>
        </div>
      )}
    </div>
  );
}
