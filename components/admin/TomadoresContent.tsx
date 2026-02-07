'use client';

import { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, User, Filter } from 'lucide-react';

type TipoTomador = 'clinica' | 'entidade';

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
}

export function TomadoresContent({
  activeSubSection,
}: {
  activeSubSection?: string;
}) {
  const [tomadores, setTomadores] = useState<Tomador[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<TipoTomador | 'todos'>(
    activeSubSection === 'clinicas'
      ? 'clinica'
      : activeSubSection === 'entidades'
        ? 'entidade'
        : 'todos'
  );
  const [tomadorSelecionado, setTomadorSelecionado] = useState<Tomador | null>(
    null
  );

  const fetchTomadores = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/entidades');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTomadores(data.entidades || []);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar tomadores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTomadores();
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

  const tomadoresFiltrados = tomadores.filter(
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
            <h1 className="text-2xl font-bold text-gray-900">Tomadores</h1>
            <p className="text-sm text-gray-600 mt-1">
              Visualização de clínicas e entidades com seus gestores
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filtro}
              onChange={(e) =>
                setFiltro(e.target.value as TipoTomador | 'todos')
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
              Clínicas: {tomadores.filter((c) => c.tipo === 'clinica').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <span className="text-gray-600">
              Entidades: {tomadores.filter((c) => c.tipo === 'entidade').length}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tomadoresFiltrados.map((tomador) => (
          <div
            key={tomador.id}
            onClick={() => setTomadorSelecionado(tomador)}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 border-l-4"
            style={{
              borderLeftColor:
                tomador.tipo === 'clinica' ? '#3b82f6' : '#a855f7',
            }}
          >
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    tomador.tipo === 'clinica' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}
                >
                  <Building2
                    className={`h-6 w-6 ${
                      tomador.tipo === 'clinica'
                        ? 'text-blue-600'
                        : 'text-purple-600'
                    }`}
                  />
                </div>
                <div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      tomador.tipo === 'clinica'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {tomador.tipo === 'clinica' ? 'CLÍNICA' : 'ENTIDADE'}
                  </span>
                </div>
              </div>

              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  tomador.ativo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tomador.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {/* Nome e CNPJ */}
            <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2">
              {tomador.nome}
            </h3>
            <p className="text-sm text-gray-600 mb-4">CNPJ: {tomador.cnpj}</p>

            {/* Informações de Contato */}
            <div className="space-y-2 mb-4 text-sm">
              {tomador.cidade && tomador.estado && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {tomador.cidade}/{tomador.estado}
                  </span>
                </div>
              )}
              {tomador.telefone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{tomador.telefone}</span>
                </div>
              )}
              {tomador.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{tomador.email}</span>
                </div>
              )}
            </div>

            {/* Gestor */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500 font-medium">Gestor:</span>
              </div>
              {tomador.gestor ? (
                <div className="mt-2 text-sm">
                  <p className="font-semibold text-gray-900">
                    {tomador.gestor.nome}
                  </p>
                  <p className="text-gray-600">{tomador.gestor.email}</p>
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                      tomador.gestor.perfil === 'rh'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {tomador.gestor.perfil === 'rh' ? 'RH' : 'Gestor Entidade'}
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
      {tomadorSelecionado && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setTomadorSelecionado(null)}
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
                      tomadorSelecionado.tipo === 'clinica'
                        ? 'bg-blue-100'
                        : 'bg-purple-100'
                    }`}
                  >
                    <Building2
                      className={`h-8 w-8 ${
                        tomadorSelecionado.tipo === 'clinica'
                          ? 'text-blue-600'
                          : 'text-purple-600'
                      }`}
                    />
                  </div>
                  <div>
                    <span
                      className={`text-sm font-semibold px-3 py-1 rounded ${
                        tomadorSelecionado.tipo === 'clinica'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {tomadorSelecionado.tipo === 'clinica'
                        ? 'CLÍNICA'
                        : 'ENTIDADE'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setTomadorSelecionado(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Dados do tomador */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {tomadorSelecionado.nome}
                  </h2>
                  <p className="text-gray-600">
                    CNPJ: {tomadorSelecionado.cnpj}
                  </p>
                </div>

                {/* Endereço Completo */}
                {tomadorSelecionado.endereco && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      Endereço
                    </h3>
                    <p className="text-gray-700">
                      {tomadorSelecionado.endereco}
                    </p>
                    <p className="text-gray-700">
                      {tomadorSelecionado.cidade}/{tomadorSelecionado.estado}
                    </p>
                  </div>
                )}

                {/* Contato */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Contato</h3>
                  <div className="space-y-2">
                    {tomadorSelecionado.telefone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="h-5 w-5 text-gray-600" />
                        <span>{tomadorSelecionado.telefone}</span>
                      </div>
                    )}
                    {tomadorSelecionado.email && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="h-5 w-5 text-gray-600" />
                        <span>{tomadorSelecionado.email}</span>
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
                  {tomadorSelecionado.gestor ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">
                        {tomadorSelecionado.gestor.nome}
                      </p>
                      <p className="text-gray-700">
                        CPF: {tomadorSelecionado.gestor.cpf}
                      </p>
                      <p className="text-gray-700">
                        Email: {tomadorSelecionado.gestor.email}
                      </p>
                      <span
                        className={`inline-block text-sm px-3 py-1 rounded ${
                          tomadorSelecionado.gestor.perfil === 'rh'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {tomadorSelecionado.gestor.perfil === 'rh'
                          ? 'RH'
                          : 'Gestor Entidade'}
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

                {/* Data de Cadastro */}
                <div className="text-sm text-gray-600">
                  Cadastrado em:{' '}
                  {new Date(tomadorSelecionado.created_at).toLocaleDateString(
                    'pt-BR'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem quando não há tomadors */}
      {tomadoresFiltrados.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {filtro === 'todos'
              ? 'Nenhum tomador cadastrado'
              : `Nenhuma ${filtro} cadastrada`}
          </p>
        </div>
      )}
    </div>
  );
}
