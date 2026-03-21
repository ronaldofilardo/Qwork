'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  Users2,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  AlertCircle,
} from 'lucide-react';
import ComercialSidebar from '@/components/comercial/ComercialSidebar';
import type { ComercialSection } from '@/components/comercial/ComercialSidebar';
import { ComissoesContent } from '@/components/admin/ComissoesContent';

interface Session {
  cpf: string;
  nome: string;
  perfil: string;
}

interface Candidato {
  id: string;
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  email: string;
  cpf: string | null;
  cnpj: string | null;
  razao_social: string | null;
  status: string;
  motivo_rejeicao: string | null;
  criado_em: string;
  verificado_em: string | null;
}

const CAND_STATUS: Record<
  string,
  { label: string; cls: string; icon: React.ElementType }
> = {
  pendente_verificacao: {
    label: 'Pendente',
    cls: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  verificado: {
    label: 'Verificado',
    cls: 'bg-blue-100 text-blue-700',
    icon: CheckCircle,
  },
  convertido: {
    label: 'Convertido',
    cls: 'bg-green-100 text-green-700',
    icon: CheckCircle,
  },
  rejeitado: {
    label: 'Rejeitado',
    cls: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
};

function CandidatosContent() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [acao, setAcao] = useState<{
    id: string;
    tipo: 'aprovar' | 'rejeitar';
  } | null>(null);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroAcao, setErroAcao] = useState('');

  const carregar = useCallback(async (p: number, s: string, b: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (s) params.set('status', s);
      if (b.trim()) params.set('busca', b.trim());
      const res = await fetch(
        `/api/admin/representantes-leads?${params.toString()}`
      );
      if (res.ok) {
        const d = (await res.json()) as { leads?: Candidato[]; total?: number };
        setCandidatos(d.leads ?? []);
        setTotal(d.total ?? 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar(page, statusFiltro, busca);
  }, [carregar, page, statusFiltro, busca]);

  const executarAcao = async () => {
    if (!acao) return;
    if (acao.tipo === 'rejeitar' && !motivo.trim()) {
      setErroAcao('Informe o motivo da rejeição.');
      return;
    }
    setSalvando(true);
    setErroAcao('');
    try {
      const endpoint =
        acao.tipo === 'aprovar'
          ? `/api/admin/representantes-leads/${acao.id}/aprovar`
          : `/api/admin/representantes-leads/${acao.id}/rejeitar`;
      const body = acao.tipo === 'rejeitar' ? { motivo: motivo.trim() } : {};
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = (await res.json()) as { error?: string };
        throw new Error(e.error ?? 'Erro ao executar ação');
      }
      setAcao(null);
      setMotivo('');
      void carregar(page, statusFiltro, busca);
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setSalvando(false);
    }
  };

  const totalPages = Math.ceil(total / 30);
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Candidatos a Representante
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} candidato{total !== 1 ? 's' : ''} no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar nome / e-mail / CPF…"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 text-sm border rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>
          <select
            value={statusFiltro}
            onChange={(e) => {
              setStatusFiltro(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
          >
            <option value="">Todos os status</option>
            <option value="pendente_verificacao">Pendentes</option>
            <option value="verificado">Verificados</option>
            <option value="convertido">Convertidos</option>
            <option value="rejeitado">Rejeitados</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : candidatos.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center text-gray-400">
          <UserPlus size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum candidato encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Candidato</th>
                <th className="px-4 py-3 text-center font-medium">Tipo</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">
                  Enviado em
                </th>
                <th className="px-4 py-3 text-center font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {candidatos.map((c) => {
                const st = CAND_STATUS[c.status] ?? {
                  label: c.status,
                  cls: 'bg-gray-100 text-gray-500',
                  icon: AlertCircle,
                };
                const Icon = st.icon;
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{c.nome}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                      {c.razao_social && (
                        <p className="text-xs text-gray-400">
                          {c.razao_social}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full uppercase">
                        {c.tipo_pessoa === 'pf' ? 'PF' : 'PJ'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${st.cls}`}
                      >
                        <Icon size={11} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {fmtDate(c.criado_em)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.status === 'pendente_verificacao' && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setAcao({ id: c.id, tipo: 'aprovar' });
                              setMotivo('');
                              setErroAcao('');
                            }}
                            className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => {
                              setAcao({ id: c.id, tipo: 'rejeitar' });
                              setMotivo('');
                              setErroAcao('');
                            }}
                            className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                      {c.status === 'verificado' && (
                        <span className="text-xs text-gray-400">
                          Verificado em {fmtDate(c.verificado_em)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal de confirmação de ação */}
      {acao && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900">
              {acao.tipo === 'aprovar'
                ? '✅ Aprovar Candidato'
                : '❌ Rejeitar Candidato'}
            </h3>
            <p className="text-sm text-gray-600">
              {acao.tipo === 'aprovar'
                ? 'O candidato será marcado como verificado e poderá ser convertido em representante.'
                : 'O candidato será rejeitado e não poderá prosseguir no processo.'}
            </p>
            {acao.tipo === 'rejeitar' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Motivo da rejeição <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Descreva o motivo…"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400/30 resize-none"
                />
              </div>
            )}
            {erroAcao && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                {erroAcao}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  setAcao(null);
                  setMotivo('');
                  setErroAcao('');
                }}
                disabled={salvando}
                className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void executarAcao()}
                disabled={salvando}
                className={`flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-60 ${
                  acao.tipo === 'aprovar'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {salvando
                  ? 'Aguarde…'
                  : acao.tipo === 'aprovar'
                    ? 'Confirmar Aprovação'
                    : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface KPIs {
  representantesAtivos: number;
  representantesPendentes: number;
  vendedoresAtivos: number;
  leadsTotal: number;
  leadsPendentes: number;
  comissoesAbertas: number;
  valorAReceber: number;
  valorPagoMes: number;
}

interface RepMetrica {
  id: number;
  nome: string;
  email: string;
  status: string;
  codigo: string;
  leads_ativos: number;
  leads_mes: number;
  vinculos_ativos: number;
  comissoes_pendentes: number;
  valor_pendente: number;
}

export default function ComercialPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] =
    useState<ComercialSection>('representantes');
  const [repsMetrica, setRepsMetrica] = useState<RepMetrica[]>([]);
  const [loadingReps, setLoadingReps] = useState(false);
  const [kpis, setKpis] = useState<KPIs>({
    representantesAtivos: 0,
    representantesPendentes: 0,
    vendedoresAtivos: 0,
    leadsTotal: 0,
    leadsPendentes: 0,
    comissoesAbertas: 0,
    valorAReceber: 0,
    valorPagoMes: 0,
  });

  const router = useRouter();

  const fetchRepsMetrica = useCallback(async () => {
    setLoadingReps(true);
    try {
      const res = await fetch('/api/comercial/representantes/metricas');
      if (res.ok) {
        const d = await res.json();
        setRepsMetrica(d.representantes ?? []);
      }
    } catch (e) {
      console.error('Erro ao buscar métricas de representantes:', e);
    } finally {
      setLoadingReps(false);
    }
  }, []);

  const fetchKPIs = useCallback(async () => {
    try {
      const [repsRes, repsAtivosRes, leadsRes, comissoesRes, vendedoresRes] =
        await Promise.allSettled([
          fetch('/api/admin/representantes?status=ativo&limit=1'),
          fetch('/api/admin/representantes?status=apto&limit=1'),
          fetch('/api/admin/representantes-leads?limit=1'),
          fetch('/api/admin/comissoes?limit=1'),
          fetch('/api/comercial/vendedores?limit=1'),
        ]);

      const update: Partial<KPIs> = {};

      if (repsRes.status === 'fulfilled' && repsRes.value.ok) {
        const d = await repsRes.value.json();
        update.representantesPendentes = d.total || 0;
      }
      if (repsAtivosRes.status === 'fulfilled' && repsAtivosRes.value.ok) {
        const d = await repsAtivosRes.value.json();
        update.representantesAtivos = d.total || 0;
      }
      if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) {
        const d = await leadsRes.value.json();
        update.leadsTotal = d.total || 0;
        update.leadsPendentes = d.pendentes || 0;
      }
      if (comissoesRes.status === 'fulfilled' && comissoesRes.value.ok) {
        const d = await comissoesRes.value.json();
        update.comissoesAbertas = d.total || 0;
        update.valorAReceber = parseFloat(d.resumo?.valor_a_pagar ?? '0');
        update.valorPagoMes = parseFloat(d.resumo?.valor_pago_total ?? '0');
      }
      if (vendedoresRes.status === 'fulfilled' && vendedoresRes.value.ok) {
        const d = await vendedoresRes.value.json();
        update.vendedoresAtivos = d.total || 0;
      }

      setKpis((prev) => ({ ...prev, ...update }));
    } catch (error) {
      console.error('Erro ao buscar KPIs:', error);
    }
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      if (!sessionRes.ok) {
        router.push('/login');
        return;
      }
      const sessionData = await sessionRes.json();

      if (sessionData.perfil !== 'comercial') {
        router.push('/login');
        return;
      }

      setSession(sessionData);
      await Promise.all([fetchKPIs(), fetchRepsMetrica()]);
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, fetchKPIs, fetchRepsMetrica]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleSectionChange = (section: ComercialSection) => {
    setActiveSection(section);
  };

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderContent = () => {
    if (activeSection === 'comissoes') {
      return <ComissoesContent />;
    }

    if (activeSection === 'leads') {
      return <CandidatosContent />;
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Visão Geral — Departamento Comercial
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Métricas consolidadas de toda a operação comercial
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-50">
                <Users size={20} className="text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Representantes Aptos
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {kpis.representantesAtivos}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-amber-600 font-medium">
                {kpis.representantesPendentes}
              </span>{' '}
              aguardando aprovação
            </p>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Users2 size={20} className="text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Vendedores Ativos
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {kpis.vendedoresAtivos}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Vinculados a representantes
            </p>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <UserPlus size={20} className="text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Leads / Candidatos
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {kpis.leadsTotal}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-orange-600 font-medium">
                {kpis.leadsPendentes}
              </span>{' '}
              pendentes de verificação
            </p>
          </div>

          <div
            className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveSection('comissoes')}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <DollarSign size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Comissões Abertas
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {kpis.comissoesAbertas}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total em aberto</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">
                A Pagar (em aberto)
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-900">
              {fmtBRL(kpis.valorAReceber)}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Comissões NF + liberadas + análise
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                Total Pago (histórico)
              </span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {fmtBRL(kpis.valorPagoMes)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Comissões pagas acumuladas
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Ações Rápidas
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/comercial/representantes')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
            >
              <Users size={16} />
              Gerenciar Representantes
            </button>
            <button
              onClick={() => setActiveSection('comissoes')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <DollarSign size={16} />
              Ver Comissões
            </button>
            <button
              onClick={() => {
                void fetchKPIs();
                void fetchRepsMetrica();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Atualizar
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Performance por Representante
              </h3>
              <p className="text-sm text-gray-500">
                Gestão de leads, vínculos e comissões da rede
              </p>
            </div>
            <button
              onClick={() => router.push('/comercial/representantes')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium shadow-sm active:scale-95"
            >
              Ver todos <ChevronRight size={16} className="text-gray-400" />
            </button>
          </div>

          {loadingReps ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin h-8 w-8 rounded-full border-3 border-green-500 border-t-transparent shadow-sm" />
                <p className="text-sm text-gray-400 font-medium">
                  Carregando representantes...
                </p>
              </div>
            </div>
          ) : repsMetrica.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="flex flex-col items-center gap-2">
                <Users size={32} className="text-gray-200" />
                <p className="text-sm text-gray-400 font-medium">
                  Nenhum representante ativo encontrado.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {repsMetrica.map((r) => (
                <div
                  key={r.id}
                  onClick={() =>
                    router.push(`/comercial/representantes/${r.id}`)
                  }
                  className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-xl hover:shadow-green-900/[0.03] transition-all cursor-pointer relative overflow-hidden flex flex-col h-full active:scale-[0.98]"
                >
                  {r.status === 'apto_pendente' && (
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
                            r.status === 'apto'
                              ? 'bg-green-500'
                              : r.status === 'apto_pendente'
                                ? 'bg-amber-500'
                                : 'bg-gray-300'
                          }`}
                        />
                      </div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                        {r.codigo || 'S/ COD'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-50/50 rounded-xl p-3 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-colors">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider text-center">
                        Leads Totais
                      </p>
                      <p className="text-lg font-black text-gray-800 text-center">
                        {r.leads_ativos + r.leads_mes}
                      </p>
                    </div>
                    <div className="bg-gray-50/50 rounded-xl p-3 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-colors">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider text-center">
                        Vínculos
                      </p>
                      <p className="text-lg font-black text-gray-800 text-center">
                        {r.vinculos_ativos}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Pendente
                      </p>
                      <p
                        className={`font-black tracking-tight ${r.valor_pendente > 0 ? 'text-amber-600' : 'text-gray-300'}`}
                      >
                        {r.valor_pendente > 0 ? fmtBRL(r.valor_pendente) : '—'}
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-green-50 transition-colors">
                      <ChevronRight
                        size={18}
                        className="text-gray-300 group-hover:text-green-600 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0 flex flex-col h-screen">
        <ComercialSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          counts={{
            representantes: kpis.representantesAtivos,
            leads: kpis.leadsPendentes,
            comissoes: kpis.comissoesAbertas,
          }}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Painel Comercial
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Bem-vindo, <span className="font-medium">{session.nome}</span>
            </p>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
