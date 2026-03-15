'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  UserCheck,
  Link2,
} from 'lucide-react';
import ModalReativarTomador from './ModalReativarTomador';

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
  const [ativando, setAtivando] = useState(false);
  const [showReativarModal, setShowReativarModal] = useState(false);
  const [tomadorParaReativar, setTomadorParaReativar] =
    useState<Tomador | null>(null);

  // Estado para vincular representante
  const [codigoRepInput, setCodigoRepInput] = useState('');
  const [valorNegociadoInput, setValorNegociadoInput] = useState('');
  const [vinculando, setVinculando] = useState(false);

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

  const toggleAtivo = async (tomador: Tomador) => {
    // Se está reativando (inativo → ativo), abrir modal com opção de trocar gestor
    if (!tomador.ativo) {
      setTomadorParaReativar(tomador);
      setShowReativarModal(true);
      return;
    }

    // Desativação direta
    setAtivando(true);
    try {
      const endpoint =
        tomador.tipo === 'clinica'
          ? `/api/admin/clinicas/${tomador.id}`
          : `/api/admin/entidades/${tomador.id}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa: false }),
      });
      if (res.ok) {
        setTomadores((prev) =>
          prev.map((t) => (t.id === tomador.id ? { ...t, ativo: false } : t))
        );
        if (tomadorSelecionado?.id === tomador.id) {
          setTomadorSelecionado((prev) =>
            prev ? { ...prev, ativo: false } : null
          );
        }
      } else {
        alert('Erro ao atualizar status da clínica/entidade');
      }
    } catch {
      alert('Erro ao atualizar status');
    } finally {
      setAtivando(false);
    }
  };

  const handleConfirmarReativar = async (trocarGestor?: {
    cpf: string;
    nome: string;
    email: string;
  }) => {
    if (!tomadorParaReativar) return null;

    const endpoint =
      tomadorParaReativar.tipo === 'clinica'
        ? `/api/admin/clinicas/${tomadorParaReativar.id}`
        : `/api/admin/entidades/${tomadorParaReativar.id}`;

    const body: Record<string, unknown> = { ativa: true };
    if (trocarGestor) {
      body.trocar_gestor = trocarGestor;
    }

    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'Erro ao reativar tomador');
    }

    const data = await res.json();

    // Atualizar lista local
    const gestorAtualizado = trocarGestor
      ? {
          nome: trocarGestor.nome,
          cpf: trocarGestor.cpf,
          email: trocarGestor.email,
          perfil:
            tomadorParaReativar.tipo === 'clinica'
              ? ('rh' as const)
              : ('gestor' as const),
        }
      : tomadorParaReativar.gestor;

    setTomadores((prev) =>
      prev.map((t) =>
        t.id === tomadorParaReativar.id
          ? { ...t, ativo: true, gestor: gestorAtualizado }
          : t
      )
    );
    if (tomadorSelecionado?.id === tomadorParaReativar.id) {
      setTomadorSelecionado((prev) =>
        prev ? { ...prev, ativo: true, gestor: gestorAtualizado } : null
      );
    }

    // Se não trocou gestor, fechar tudo
    if (!trocarGestor) {
      setShowReativarModal(false);
      setTomadorParaReativar(null);
      return null;
    }

    // Retornar credenciais do novo gestor para o modal exibir
    return data.novo_gestor || null;
  };

  useEffect(() => {
    setFiltro(
      activeSubSection === 'clinicas'
        ? 'clinica'
        : activeSubSection === 'entidades'
          ? 'entidade'
          : 'todos'
    );
  }, [activeSubSection]);

  const handleVincularRepresentante = async () => {
    if (!tomadorSelecionado || !codigoRepInput.trim()) return;
    setVinculando(true);
    try {
      const body: Record<string, unknown> = {
        codigo: codigoRepInput.trim(),
        cnpj: tomadorSelecionado.cnpj,
      };
      if (tomadorSelecionado.tipo === 'clinica') {
        body.clinica_id = Number(tomadorSelecionado.id);
      } else {
        body.entidade_id = Number(tomadorSelecionado.id);
      }
      if (valorNegociadoInput) {
        const numVal = parseFloat(
          valorNegociadoInput.replace(/\./g, '').replace(',', '.')
        );
        if (!isNaN(numVal) && numVal > 0) body.valor_negociado = numVal;
      }
      const res = await fetch('/api/admin/comissoes/vincular-representante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erro ao vincular representante');
        return;
      }
      // Atualizar representante no estado local
      const rep: RepresentanteVinculo = {
        vinculo_id: data.vinculo_id,
        representante_id: data.representante_id,
        nome: data.representante_nome,
        codigo: codigoRepInput.trim().toUpperCase(),
        valor_negociado: body.valor_negociado
          ? (body.valor_negociado as number)
          : null,
      };
      setTomadores((prev) =>
        prev.map((t) =>
          t.id === tomadorSelecionado.id ? { ...t, representante: rep } : t
        )
      );
      setTomadorSelecionado((prev) =>
        prev ? { ...prev, representante: rep } : null
      );
      setCodigoRepInput('');
      setValorNegociadoInput('');
    } catch {
      alert('Erro ao vincular representante');
    } finally {
      setVinculando(false);
    }
  };

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
            <button
              onClick={fetchTomadores}
              title="Atualizar lista"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
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

            {/* Representante vinculado */}
            {tomador.representante && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-gray-500 font-medium">
                    Representante:
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  {tomador.representante.nome}
                </p>
                <p className="text-xs text-purple-600">
                  {tomador.representante.codigo}
                </p>
              </div>
            )}
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

                {/* Representante Vinculado */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                    Representante
                  </h3>
                  {tomadorSelecionado.representante ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">
                        {tomadorSelecionado.representante.nome}
                      </p>
                      <p className="text-sm text-purple-700">
                        Código: {tomadorSelecionado.representante.codigo}
                      </p>
                      {tomadorSelecionado.representante.valor_negociado !=
                        null && (
                        <p className="text-sm text-gray-700">
                          Valor negociado:{' '}
                          <strong>
                            R${' '}
                            {tomadorSelecionado.representante.valor_negociado.toLocaleString(
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
                          onChange={(e) =>
                            setValorNegociadoInput(e.target.value)
                          }
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          disabled={vinculando}
                        />
                        <button
                          onClick={handleVincularRepresentante}
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
                  {new Date(tomadorSelecionado.created_at).toLocaleDateString(
                    'pt-BR'
                  )}
                </div>

                {/* Ação: Ativar / Desativar */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => toggleAtivo(tomadorSelecionado)}
                    disabled={ativando}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      tomadorSelecionado.ativo
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50`}
                  >
                    {tomadorSelecionado.ativo ? (
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
      )}

      {/* Modal de Reativação */}
      {showReativarModal && tomadorParaReativar && (
        <ModalReativarTomador
          tomador={tomadorParaReativar}
          onCancel={() => {
            setShowReativarModal(false);
            setTomadorParaReativar(null);
          }}
          onConfirm={handleConfirmarReativar}
        />
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
