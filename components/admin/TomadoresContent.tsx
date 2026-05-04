'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Filter,
  RefreshCw,
  UserCheck,
  LayoutGrid,
  List,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';
import ModalReativarTomador from './ModalReativarTomador';
import TomadorDetailModal from './TomadorDetailModal';

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

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const [codigoRepInput, setCodigoRepInput] = useState('');
  const [vinculando, setVinculando] = useState(false);

  // Auto-preenchimento do valor/% quando nome do rep é digitado
  interface RepAutoFill {
    id: number;
    nome: string;
    modelo: 'percentual' | 'custo_fixo';
    percRep: number | null;
  }
  const [repAutoFill, setRepAutoFill] = useState<RepAutoFill | null>(null);
  const [buscandoRep, setBuscandoRep] = useState(false);

  useEffect(() => {
    setRepAutoFill(null);

    if (!tomadorSelecionado || codigoRepInput.trim().length < 1) {
      setBuscandoRep(false);
      return;
    }

    // Ativa spinner imediatamente, antes do debounce
    setBuscandoRep(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/representantes/busca?q=${encodeURIComponent(codigoRepInput.trim())}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        const reps: Array<{
          id: number;
          nome: string;
          modelo_comissionamento: 'percentual' | 'custo_fixo' | null;
          percentual_comissao: string | null;
          valor_custo_fixo_entidade: string | null;
          valor_custo_fixo_clinica: string | null;
        }> = data.representantes ?? [];
        const rep = reps.length > 0 ? reps[0] : null;
        if (rep && rep.modelo_comissionamento) {
          setRepAutoFill({
            nome: rep.nome,
            id: rep.id,
            modelo: rep.modelo_comissionamento,
            percRep:
              rep.percentual_comissao != null
                ? Number(rep.percentual_comissao)
                : null,
          });
        }
      } catch {
        // silencioso
      } finally {
        setBuscandoRep(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [codigoRepInput, tomadorSelecionado]);

  type DocsData = {
    cartao_cnpj: string | null;
    contrato_social: string | null;
    doc_identificacao: string | null;
  };
  const [docsMap, setDocsMap] = useState<Record<string, DocsData | 'loading'>>(
    {}
  );
  const [expandedDocsId, setExpandedDocsId] = useState<string | null>(null);

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

    if (!trocarGestor) {
      setShowReativarModal(false);
      setTomadorParaReativar(null);
      return null;
    }
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
    if (!tomadorSelecionado || !repAutoFill) return;
    setVinculando(true);
    try {
      const body: Record<string, unknown> = {
        representante_id: repAutoFill.id,
        cnpj: tomadorSelecionado.cnpj,
      };
      if (tomadorSelecionado.tipo === 'clinica') {
        body.clinica_id = Number(tomadorSelecionado.id);
      } else {
        body.entidade_id = Number(tomadorSelecionado.id);
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
      const rep: RepresentanteVinculo = {
        vinculo_id: data.vinculo_id,
        representante_id: data.representante_id,
        nome: data.representante_nome,
        codigo: String(repAutoFill.id),
        valor_negociado: null,
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
      setRepAutoFill(null);
    } catch {
      alert('Erro ao vincular representante');
    } finally {
      setVinculando(false);
    }
  };

  const loadDocs = async (tomador: Tomador) => {
    const id = tomador.id;
    if (docsMap[id] !== undefined) return;
    setDocsMap((prev) => ({ ...prev, [id]: 'loading' }));
    try {
      const res = await fetch(
        `/api/admin/tomadores/${id}/documentos?tipo=${tomador.tipo}`
      );
      const data = await res.json();
      setDocsMap((prev) => ({
        ...prev,
        [id]: data.success
          ? (data.documentos as DocsData)
          : {
              cartao_cnpj: null,
              contrato_social: null,
              doc_identificacao: null,
            },
      }));
    } catch {
      setDocsMap((prev) => ({
        ...prev,
        [id]: {
          cartao_cnpj: null,
          contrato_social: null,
          doc_identificacao: null,
        },
      }));
    }
  };

  const toggleDocs = (e: React.MouseEvent, tomador: Tomador) => {
    e.stopPropagation();
    if (expandedDocsId === tomador.id) {
      setExpandedDocsId(null);
      return;
    }
    setExpandedDocsId(tomador.id);
    void loadDocs(tomador);
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
            {/* Toggle card / lista */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                title="Visualização em cards"
                className={`p-1.5 rounded ${
                  viewMode === 'card'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="Visualização em lista"
                className={`p-1.5 rounded ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
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

      {/* Vista de Cards */}
      {viewMode === 'card' && (
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
                      tomador.tipo === 'clinica'
                        ? 'bg-blue-100'
                        : 'bg-purple-100'
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
                      {tomador.gestor.perfil === 'rh'
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

              {/* Data de cadastro */}
              <div className="pt-2 mt-1 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Cadastrado em:{' '}
                  {new Date(tomador.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista de Lista */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nome / CNPJ</th>
                <th className="px-4 py-3 text-left">Cidade/UF</th>
                <th className="px-4 py-3 text-left">Gestor</th>
                <th className="px-4 py-3 text-left">Representante</th>
                <th className="px-4 py-3 text-left">Cadastrado em</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Documentos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tomadoresFiltrados.map((tomador) => (
                <React.Fragment key={tomador.id}>
                  <tr
                    onClick={() => setTomadorSelecionado(tomador)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                            tomador.tipo === 'clinica'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {tomador.tipo === 'clinica' ? 'CL' : 'EN'}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {tomador.nome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tomador.cnpj}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {tomador.cidade && tomador.estado
                        ? `${tomador.cidade}/${tomador.estado}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {tomador.gestor ? (
                        <div>
                          <p className="font-medium text-gray-900">
                            {tomador.gestor.nome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tomador.gestor.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-amber-600 text-xs">
                          ⚠️ Sem gestor
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {tomador.representante ? (
                        <div>
                          <p className="text-sm">
                            {tomador.representante.nome}
                          </p>
                          <p className="text-xs text-purple-600">
                            {tomador.representante.codigo}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(tomador.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            tomador.ativo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tomador.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void toggleAtivo(tomador);
                          }}
                          disabled={ativando}
                          className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                            tomador.ativo
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {tomador.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => toggleDocs(e, tomador)}
                        className={`flex items-center gap-1 text-xs font-medium mx-auto px-2 py-1 rounded transition-colors ${
                          expandedDocsId === tomador.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {expandedDocsId === tomador.id ? 'Fechar' : 'Ver docs'}
                      </button>
                    </td>
                  </tr>
                  {expandedDocsId === tomador.id && (
                    <tr
                      className="bg-blue-50 border-b border-blue-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <td colSpan={7} className="px-6 py-3">
                        {docsMap[tomador.id] === 'loading' ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando documentos...
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-6">
                            {(
                              [
                                { chave: 'cartao_cnpj', label: 'Cartão CNPJ' },
                                {
                                  chave: 'contrato_social',
                                  label: 'Contrato Social',
                                },
                                {
                                  chave: 'doc_identificacao',
                                  label: 'Doc. Identificação',
                                },
                              ] as const
                            ).map(({ chave, label }) => {
                              const docs = docsMap[tomador.id];
                              const url =
                                docs && docs !== 'loading' ? docs[chave] : null;
                              return (
                                <div
                                  key={chave}
                                  className="flex items-center gap-1.5 text-sm"
                                >
                                  <span className="text-gray-600 font-medium">
                                    {label}:
                                  </span>
                                  {url ? (
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      Baixar
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 text-xs">
                                      Não enviado
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalhes */}
      {tomadorSelecionado && (
        <TomadorDetailModal
          tomador={tomadorSelecionado}
          onClose={() => {
            setTomadorSelecionado(null);
            setCodigoRepInput('');
            setRepAutoFill(null);
          }}
          codigoRepInput={codigoRepInput}
          setCodigoRepInput={setCodigoRepInput}
          vinculando={vinculando}
          ativando={ativando}
          onVincular={handleVincularRepresentante}
          onToggleAtivo={toggleAtivo}
          repAutoFill={repAutoFill}
          buscandoRep={buscandoRep}
        />
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
