'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  ChevronRight,
  DollarSign,
  Activity,
  Search,
  UserX,
  UserPlus,
  Percent,
  ToggleLeft,
  ToggleRight,
  Loader2,
  UserCheck,
  Clock,
  LayoutGrid,
  List,
} from 'lucide-react';
import CadastrarRepresentanteModal from './CadastrarRepresentanteModal';

interface RepMetrica {
  id: number;
  nome: string;
  email: string;
  status: string;
  ativo: boolean;
  criado_em: string;
  leads_ativos: number;
  leads_mes: number;
  vinculos_ativos: number;
  comissoes_pendentes: number;
  valor_pendente: number;
  modelo_comissionamento?: 'percentual' | 'custo_fixo' | null;
  percentual_comissao?: number | null;
  asaas_wallet_id?: string | null;
}

interface RepSemGestor {
  id: number;
  nome: string;
  email: string;
  status: string;
  tipo_pessoa: string;
  criado_em: string;
  leads_ativos: number;
  vinculos_ativos: number;
}

type Aba = 'ativos' | 'inativos' | 'sem_gestor';
type Visualizacao = 'cards' | 'lista';

export default function ComercialRepresentantesPage() {
  const router = useRouter();
  const [ativos, setAtivos] = useState<RepMetrica[]>([]);
  const [inativos, setInativos] = useState<RepMetrica[]>([]);
  const [semGestor, setSemGestor] = useState<RepSemGestor[]>([]);
  const [aba, setAba] = useState<Aba>('ativos');
  const [visualizacao, setVisualizacao] = useState<Visualizacao>('cards');
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [showCadastrar, setShowCadastrar] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [erroToggle, setErroToggle] = useState<string | null>(null);
  const [assumindoId, setAssumindoId] = useState<number | null>(null);
  const [erroAssumir, setErroAssumir] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [resAtivos, resInativos, resSemGestor] = await Promise.all([
        fetch('/api/comercial/representantes/metricas'),
        fetch('/api/comercial/representantes/metricas?status=desativado'),
        fetch('/api/comercial/representantes/sem-gestor'),
      ]);
      if (resAtivos.ok) {
        const d = await resAtivos.json();
        setAtivos(d.representantes ?? []);
      }
      if (resInativos.ok) {
        const d = await resInativos.json();
        setInativos(d.representantes ?? []);
      }
      if (resSemGestor.ok) {
        const d = await resSemGestor.json();
        setSemGestor(d.representantes ?? []);
      }
    } catch (e) {
      console.error('Erro ao buscar representantes:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const fmtBRL = (v: number) =>
    (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const toggleAtivo = async (r: RepMetrica, event: React.MouseEvent) => {
    event.stopPropagation();
    setTogglingId(r.id);
    setErroToggle(null);
    try {
      const res = await fetch(
        `/api/comercial/representantes/${r.id}/toggle-ativo`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ativo: !r.ativo }),
        }
      );
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Erro ao alterar status');
      }
      await carregar();
    } catch (error: unknown) {
      setErroToggle(
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    } finally {
      setTogglingId(null);
    }
  };

  const assumir = async (r: RepSemGestor, event: React.MouseEvent) => {
    event.stopPropagation();
    setAssumindoId(r.id);
    setErroAssumir(null);
    try {
      const res = await fetch(`/api/comercial/representantes/${r.id}/assumir`, {
        method: 'POST',
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Erro ao assumir representante');
      }
      await carregar();
      setAba('ativos');
    } catch (error: unknown) {
      setErroAssumir(
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    } finally {
      setAssumindoId(null);
    }
  };

  const lista = aba === 'ativos' ? ativos : aba === 'inativos' ? inativos : [];

  const filtradosSemGestor = semGestor.filter((r) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      r.nome.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  });

  const filtrados = lista.filter((r) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      r.nome.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {showCadastrar && (
        <CadastrarRepresentanteModal
          onClose={() => setShowCadastrar(false)}
          onSuccess={() => {
            setShowCadastrar(false);
            void carregar();
          }}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Representantes</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {lista.length} representante{lista.length !== 1 ? 's' : ''}{' '}
            {aba === 'ativos' ? 'na rede' : 'inativos'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCadastrar(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors cursor-pointer"
          >
            <UserPlus size={15} />
            Cadastrar Representante
          </button>
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar por nome, email ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => {
            setAba('ativos');
            setBusca('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            aba === 'ativos'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={14} />
          Ativos
          {ativos.length > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                aba === 'ativos'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {ativos.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setAba('inativos');
            setBusca('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            aba === 'inativos'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserX size={14} />
          Inativos
          {inativos.length > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                aba === 'inativos'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {inativos.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setAba('sem_gestor');
            setBusca('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            aba === 'sem_gestor'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck size={14} />
          Sem Gestor
          {semGestor.length > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                aba === 'sem_gestor'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {semGestor.length}
            </span>
          )}
        </button>
      </div>

      {/* Botões de Visualização */}
      {aba !== 'sem_gestor' && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisualizacao('cards')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              visualizacao === 'cards'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            <LayoutGrid size={14} />
            Cards
          </button>
          <button
            onClick={() => setVisualizacao('lista')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              visualizacao === 'lista'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            <List size={14} />
            Lista
          </button>
        </div>
      )}

      {erroToggle && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <span className="font-medium">Erro:</span> {erroToggle}
          <button
            onClick={() => setErroToggle(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {erroAssumir && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <span className="font-medium">Erro:</span> {erroAssumir}
          <button
            onClick={() => setErroAssumir(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse"
            />
          ))}
        </div>
      ) : aba === 'sem_gestor' ? (
        filtradosSemGestor.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <UserCheck size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400 font-medium">
              {busca
                ? 'Nenhum resultado para a busca.'
                : 'Todos os representantes já possuem gestor atribuído.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtradosSemGestor.map((r) => (
              <div
                key={r.id}
                className="group bg-white rounded-2xl border border-amber-100 p-5 transition-all flex flex-col h-full hover:border-amber-300 hover:shadow-xl hover:shadow-amber-900/[0.04]"
              >
                <div className="absolute top-0 right-0 hidden">
                  {/* badge não necessário aqui */}
                </div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate text-base mb-0.5">
                      {r.nome}
                    </h4>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                      #{r.id}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {r.email}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ml-2 ${
                      r.status === 'ativo'
                        ? 'bg-green-500'
                        : r.status === 'aguardando_senha'
                          ? 'bg-blue-400'
                          : 'bg-gray-300'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-amber-50/50 rounded-xl p-3 border border-transparent">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider text-center">
                      Leads Ativos
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <Activity size={12} className="text-purple-400" />
                      <p className="text-lg font-black text-gray-800">
                        {r.leads_ativos}
                      </p>
                    </div>
                  </div>
                  <div className="bg-amber-50/50 rounded-xl p-3 border border-transparent">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider text-center">
                      Vínculos
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <Users size={12} className="text-blue-400" />
                      <p className="text-lg font-black text-gray-800">
                        {r.vinculos_ativos}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                  <Clock size={11} />
                  <span>
                    Cadastro:{' '}
                    {new Date(r.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <button
                  onClick={(e) => void assumir(r, e)}
                  disabled={assumindoId === r.id}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]"
                >
                  {assumindoId === r.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserCheck size={14} />
                  )}
                  {assumindoId === r.id ? 'Assumindo...' : 'Gerenciar'}
                </button>
              </div>
            ))}
          </div>
        )
      ) : filtrados.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <Users size={32} className="text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">
            {busca
              ? 'Nenhum resultado para a busca.'
              : aba === 'inativos'
                ? 'Nenhum representante inativo.'
                : 'Nenhum representante encontrado.'}
          </p>
        </div>
      ) : visualizacao === 'lista' ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Leads Ativos
                </th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Vínculos
                </th>
                <th className="text-center px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r, idx) => (
                <tr
                  key={r.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                  onClick={() =>
                    router.push(`/comercial/representantes/${r.id}`)
                  }
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {r.nome}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(r.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-purple-600">
                    {r.leads_ativos}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600">
                    {r.vinculos_ativos}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => void toggleAtivo(r, e)}
                      disabled={togglingId === r.id}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-60"
                      title={r.ativo ? 'Inativar' : 'Ativar'}
                    >
                      {togglingId === r.id ? (
                        <Loader2 size={12} className="animate-spin inline" />
                      ) : r.ativo ? (
                        <ToggleRight
                          size={14}
                          className="inline text-red-500"
                        />
                      ) : (
                        <ToggleLeft
                          size={14}
                          className="inline text-green-600"
                        />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtrados.map((r) => (
            <div
              key={r.id}
              onClick={() => router.push(`/comercial/representantes/${r.id}`)}
              className={`group bg-white rounded-2xl border p-5 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full active:scale-[0.98] ${
                aba === 'inativos'
                  ? 'border-gray-100 opacity-75 hover:opacity-100 hover:border-red-200 hover:shadow-xl hover:shadow-red-900/[0.03]'
                  : 'border-gray-100 hover:border-green-200 hover:shadow-xl hover:shadow-green-900/[0.03]'
              }`}
            >
              {aba === 'inativos' && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gray-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
                    <UserX size={10} />
                    Inativo
                  </div>
                </div>
              )}
              {aba === 'ativos' &&
                r.modelo_comissionamento &&
                !r.asaas_wallet_id && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm animate-pulse flex items-center gap-1.5 uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      Wallet Pendente
                    </div>
                  </div>
                )}
              {aba === 'ativos' && r.status === 'apto_pendente' && (
                <div className="absolute top-0 right-0">
                  <div className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm animate-pulse flex items-center gap-1.5 uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    Aguardando Aprovação
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-5">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors truncate text-base">
                      {r.nome}
                    </h4>
                    <span
                      className={`flex-shrink-0 w-2 h-2 rounded-full ${
                        r.status === 'desativado'
                          ? 'bg-red-400'
                          : r.status === 'ativo'
                            ? 'bg-green-500'
                            : r.status === 'apto_pendente'
                              ? 'bg-amber-500'
                              : r.status === 'aprovacao_comercial'
                                ? 'bg-amber-500'
                                : r.status === 'apto' &&
                                    !r.modelo_comissionamento
                                  ? 'bg-orange-400'
                                  : 'bg-gray-300'
                      }`}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                    #{r.id}
                  </p>
                  {/* Badge do modelo de comissionamento */}
                  {r.modelo_comissionamento ? (
                    <div className="mt-1.5 flex items-center gap-1">
                      {r.modelo_comissionamento === 'percentual' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                          <Percent size={9} />
                          {r.percentual_comissao != null
                            ? `${r.percentual_comissao}%`
                            : 'Percentual'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                          <DollarSign size={9} />
                          Custo Fixo
                        </span>
                      )}
                    </div>
                  ) : aba === 'ativos' &&
                    (r.status === 'apto' || r.status === 'apto_pendente') ? (
                    <div className="mt-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold">
                        Sem modelo
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50/50 rounded-xl p-3 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-colors">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider text-center">
                    Leads Ativos
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <Activity size={12} className="text-purple-400" />
                    <p className="text-lg font-black text-gray-800">
                      {r.leads_ativos}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-3 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-colors">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider text-center">
                    Vínculos
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <Users size={12} className="text-blue-400" />
                    <p className="text-lg font-black text-gray-800">
                      {r.vinculos_ativos}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                <div>
                  {r.modelo_comissionamento ? (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                        Modelo Configurado
                      </p>
                      <div className="flex items-center gap-1">
                        {r.modelo_comissionamento === 'percentual' ? (
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-green-700">
                            <Percent size={12} />
                            {r.percentual_comissao != null
                              ? `${r.percentual_comissao}%`
                              : 'Percentual'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-700">
                            <DollarSign size={12} />
                            Custo Fixo
                          </span>
                        )}
                      </div>
                    </div>
                  ) : aba === 'ativos' &&
                    (r.status === 'apto' || r.status === 'apto_pendente') ? (
                    <div>
                      <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">
                        Sem Comissionamento
                      </p>
                      <p className="text-xs font-semibold text-orange-500">
                        Definir modelo
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                        Comissão Pendente
                      </p>
                      <div className="flex items-center gap-1">
                        <DollarSign
                          size={12}
                          className={
                            r.valor_pendente > 0
                              ? 'text-amber-500'
                              : 'text-gray-200'
                          }
                        />
                        <p
                          className={`font-black text-sm ${
                            r.valor_pendente > 0
                              ? 'text-amber-600'
                              : 'text-gray-300'
                          }`}
                        >
                          {r.valor_pendente > 0
                            ? fmtBRL(r.valor_pendente)
                            : '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div
                  className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-colors ${
                    aba === 'inativos'
                      ? 'group-hover:bg-red-50'
                      : 'group-hover:bg-green-50'
                  }`}
                >
                  <ChevronRight
                    size={18}
                    className={`text-gray-300 transition-colors ${
                      aba === 'inativos'
                        ? 'group-hover:text-red-400'
                        : 'group-hover:text-green-600'
                    }`}
                  />
                </div>
              </div>

              {/* Data de Cadastro */}
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                <Clock size={11} />
                <span>
                  Cadastro: {new Date(r.criado_em).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Botão Ativar/Inativar */}
              <div className="pt-3 border-t border-gray-50">
                <button
                  onClick={(e) => void toggleAtivo(r, e)}
                  disabled={togglingId === r.id}
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    r.ativo
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100'
                  }`}
                >
                  {togglingId === r.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : r.ativo ? (
                    <ToggleRight size={13} />
                  ) : (
                    <ToggleLeft size={13} />
                  )}
                  {togglingId === r.id
                    ? 'Aguarde...'
                    : r.ativo
                      ? 'Inativar acesso'
                      : 'Ativar acesso'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
