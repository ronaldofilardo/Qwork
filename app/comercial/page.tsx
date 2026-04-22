'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  DollarSign,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Building2,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import ComercialSidebar from '@/components/comercial/ComercialSidebar';
import type { ComercialSection } from '@/components/comercial/ComercialSidebar';
import { useComercial } from './comercial-context';
import { ComercialComissoesAbas } from '@/components/comercial/ComercialComissoesAbas';
import ComercialLeadsAprovacaoPage from './leads/page';
import type { Lead } from '@/app/admin/representantes/types';
import { useLeads } from '@/app/admin/representantes/hooks/useLeads';
import { useCachedDocs } from '@/app/admin/representantes/hooks/useCachedDocs';
import { useRepActions } from '@/app/admin/representantes/hooks/useRepActions';
import { LeadsTab } from '@/app/admin/representantes/components/LeadsTab';
import type {
  TomadorRow,
  TomadorEmpresa,
} from '@/app/api/comercial/tomadores/route';
import { ContratosTable } from '@/components/shared/ContratosTable';

interface Session {
  cpf: string;
  nome: string;
  perfil: string;
}

function CandidatosContent() {
  const ld = useLeads('candidatos', 'pendente_verificacao');
  const docs = useCachedDocs();
  const actions = useRepActions();

  const handleAprovarLead = useCallback(
    (lead: Lead) =>
      actions.aprovarLead(lead, {
        onSuccess: () => {},
        carregarLeads: ld.carregarLeads,
      }),
    [actions, ld.carregarLeads]
  );

  const handleRejeitarLead = useCallback(
    (lead: Lead, motivo: string) =>
      actions.rejeitarLead(lead, motivo, {
        onSuccess: () => {},
        carregarLeads: ld.carregarLeads,
      }),
    [actions, ld.carregarLeads]
  );

  const handleConverterLead = useCallback(
    (lead: Lead) =>
      actions.converterLead(lead, {
        onSuccess: () => {},
        carregarLeads: ld.carregarLeads,
        carregar: async () => {},
      }),
    [actions, ld.carregarLeads]
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Candidatos a Representante
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Candidatos aguardando verificação e aprovação comercial.
        </p>
      </div>

      {/* Feedback de erro/sucesso */}
      {actions.erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {actions.erro}
        </div>
      )}
      {actions.sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          {actions.sucesso}
        </div>
      )}

      {/* Link de acesso gerado após conversão */}
      {actions.conviteLinkCopiavel && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-amber-800">
              🔗 Link de acesso do representante — copie e envie ao candidato
            </p>
            <button
              onClick={() => actions.setConviteLinkCopiavel(null)}
              className="text-amber-500 hover:text-amber-700 text-lg leading-none"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-amber-700">
            O representante deve usar este link para acessar a plataforma,
            definir sua senha e aceitar o contrato e os termos de uso.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-amber-200 rounded px-2 py-1.5 text-amber-900 overflow-x-auto whitespace-nowrap">
              {actions.conviteLinkCopiavel}
            </code>
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(actions.conviteLinkCopiavel!)
                  .catch(() => {});
                actions.setSucesso('Link copiado!');
                setTimeout(() => actions.setSucesso(''), 2000);
              }}
              className="shrink-0 text-sm font-medium bg-amber-600 text-white rounded px-3 py-1.5 hover:bg-amber-700 transition-colors"
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      <LeadsTab
        leads={ld.leads}
        leadsTotal={ld.leadsTotal}
        leadsPage={ld.leadsPage}
        setLeadsPage={ld.setLeadsPage}
        leadsStatusFiltro={ld.leadsStatusFiltro}
        setLeadsStatusFiltro={ld.setLeadsStatusFiltro}
        leadsBusca={ld.leadsBusca}
        setLeadsBusca={ld.setLeadsBusca}
        leadsLoading={ld.leadsLoading}
        leadActionLoading={actions.leadActionLoading}
        leadDocsLoading={docs.leadDocsLoading}
        openLeadDoc={docs.openLeadDoc}
        onAprovarLead={handleAprovarLead}
        onRejeitarLead={handleRejeitarLead}
        onConverterLead={handleConverterLead}
      />
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
  aceite_contrato_em: string | null;
  vendedores_count: number;
  modelo_comissionamento: 'percentual' | 'custo_fixo' | null;
  percentual_comissao: number | null;
  percentual_comissao_comercial: number | null;
  valor_custo_fixo_entidade: number | null;
  valor_custo_fixo_clinica: number | null;
}

export default function ComercialPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { activeSection, setActiveSection } = useComercial();
  const [repsMetrica, setRepsMetrica] = useState<RepMetrica[]>([]);
  const [loadingReps, setLoadingReps] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (
        (localStorage.getItem('comercial-view-mode') as 'card' | 'list') ??
        'card'
      );
    }
    return 'card';
  });

  const handleViewMode = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('comercial-view-mode', mode);
  };
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

  // ──────────────────────────────────────────────────────────────────────────
  // TomadoresContent — inline component to avoid separate file for single use
  // ──────────────────────────────────────────────────────────────────────────
  function TomadoresContent() {
    const [tomadores, setTomadores] = useState<TomadorRow[]>([]);
    const [loadingT, setLoadingT] = useState(true);
    const [erroT, setErroT] = useState<string | null>(null);
    const [expandedClinicas, setExpandedClinicas] = useState<
      Record<number, boolean>
    >({});
    const [busca, setBusca] = useState('');

    useEffect(() => {
      setLoadingT(true);
      fetch('/api/comercial/tomadores')
        .then((r) => r.json())
        .then((d: { tomadores?: TomadorRow[]; error?: string }) => {
          if (d.error) {
            setErroT(d.error);
            return;
          }
          setTomadores(d.tomadores ?? []);
        })
        .catch(() => setErroT('Erro ao carregar tomadores'))
        .finally(() => setLoadingT(false));
    }, []);

    const fmtDate = (d: string | null | undefined) => {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('pt-BR');
    };

    const semRep = tomadores.filter((t) => !t.rep_nome);
    const comRep = tomadores.filter((t) => t.rep_nome);

    const filtrar = (lista: TomadorRow[]) =>
      busca.trim()
        ? lista.filter(
            (t) =>
              t.tomador_nome.toLowerCase().includes(busca.toLowerCase()) ||
              t.tomador_cnpj.includes(busca.replace(/\D/g, '')) ||
              (t.rep_nome ?? '').toLowerCase().includes(busca.toLowerCase())
          )
        : lista;

    const toggleClinica = (id: number) =>
      setExpandedClinicas((prev) => ({ ...prev, [id]: !prev[id] }));

    const TomadorRow = ({ t }: { t: TomadorRow }) => {
      const isExpanded = !!expandedClinicas[t.tomador_id];
      const isClinica = t.tipo === 'clinica';

      return (
        <>
          <div
            className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 ${
              isClinica ? 'cursor-pointer hover:bg-gray-50' : ''
            } transition-colors`}
            onClick={isClinica ? () => toggleClinica(t.tomador_id) : undefined}
          >
            {/* Tipo badge */}
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isClinica
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {isClinica ? 'Clínica' : 'Entidade'}
            </span>

            {/* Nome + CNPJ */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {t.tomador_nome}
              </p>
              <p className="text-xs text-gray-400 font-mono">
                {t.tomador_cnpj.replace(
                  /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                  '$1.$2.$3/$4-$5'
                )}
              </p>
            </div>

            {/* Representante */}
            <div className="hidden sm:block text-right shrink-0 min-w-[120px] max-w-[160px]">
              {t.rep_nome ? (
                <>
                  <p className="text-xs font-semibold text-gray-700 truncate">
                    {t.rep_nome}
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-400 italic">Sem rep</p>
              )}
            </div>

            {/* Cadastro */}
            <div className="hidden md:block text-right shrink-0 w-[80px]">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Cadastro
              </p>
              <p className="text-xs text-gray-700">{fmtDate(t.cadastro_em)}</p>
            </div>

            {/* Status vínculo */}
            {t.vinculo_status && (
              <span
                className={`shrink-0 hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  t.vinculo_status === 'ativo'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {t.vinculo_status}
              </span>
            )}

            {/* Chevron para clínica */}
            {isClinica ? (
              <span className="shrink-0 text-gray-400">
                {isExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </span>
            ) : (
              <span className="w-4 shrink-0" />
            )}
          </div>

          {/* Empresas colapsáveis */}
          {isClinica && isExpanded && (
            <div className="border-b bg-gray-50 px-6 py-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Empresas vinculadas
                {t.empresas.length > 0 && ` (${t.empresas.length})`}
              </p>
              {t.empresas.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  Nenhuma empresa vinculada
                </p>
              ) : (
                <div className="divide-y">
                  {t.empresas.map((emp: TomadorEmpresa) => (
                    <div
                      key={emp.empresa_id}
                      className="py-2 flex flex-wrap items-start gap-x-4 gap-y-1"
                    >
                      <div className="flex items-center gap-2 min-w-[180px]">
                        <Building2
                          size={12}
                          className="text-gray-400 shrink-0"
                        />
                        <span className="text-sm font-semibold text-gray-800">
                          {emp.empresa_nome}
                        </span>
                      </div>
                      {emp.empresa_cnpj && (
                        <span className="text-gray-400 font-mono text-xs">
                          {emp.empresa_cnpj.replace(
                            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                            '$1.$2.$3/$4-$5'
                          )}
                        </span>
                      )}
                      {emp.empresa_responsavel && (
                        <span className="text-xs text-gray-600">
                          <span className="text-gray-400">Resp.: </span>
                          {emp.empresa_responsavel}
                        </span>
                      )}
                      {(emp.empresa_contato_fone ||
                        emp.empresa_contato_email) && (
                        <span className="text-xs text-gray-500">
                          {emp.empresa_contato_fone && (
                            <span>{emp.empresa_contato_fone}</span>
                          )}
                          {emp.empresa_contato_fone &&
                            emp.empresa_contato_email && (
                              <span className="mx-1 text-gray-300">·</span>
                            )}
                          {emp.empresa_contato_email && (
                            <span>{emp.empresa_contato_email}</span>
                          )}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      );
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tomadores</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Entidades e clínicas cadastradas, com dados de representante, lead e
            negociação
          </p>
        </div>

        {/* Busca */}
        <input
          type="text"
          placeholder="Buscar por nome, CNPJ ou representante..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full max-w-sm px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/30"
        />

        {loadingT ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
          </div>
        ) : erroT ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {erroT}
          </div>
        ) : tomadores.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum tomador encontrado.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Sem representante — topo */}
            {filtrar(semRep).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Sem representante ({filtrar(semRep).length})
                  </span>
                </div>
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  {filtrar(semRep).map((t) => (
                    <TomadorRow key={`${t.tipo}-${t.tomador_id}`} t={t} />
                  ))}
                </div>
              </div>
            )}

            {/* Com representante */}
            {filtrar(comRep).length > 0 && (
              <div>
                {filtrar(semRep).length > 0 && (
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Com representante ({filtrar(comRep).length})
                  </p>
                )}
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  {filtrar(comRep).map((t) => (
                    <TomadorRow key={`${t.tipo}-${t.tomador_id}`} t={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const renderContent = () => {
    if (activeSection === 'tomadores') {
      return <TomadoresContent />;
    }

    if (activeSection === 'contratos') {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Contratos</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Contratos de todos os representantes e tomadores
            </p>
          </div>
          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
            <div className="p-4">
              <ContratosTable
                endpoint="/api/comercial/contratos"
                comercial
                allowExpandClinicaEmpresas
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'comissoes') {
      return <ComercialComissoesAbas />;
    }

    if (activeSection === 'leads') {
      return (
        <div className="space-y-8">
          <ComercialLeadsAprovacaoPage />
          <div className="border-t pt-6">
            <CandidatosContent />
          </div>
        </div>
      );
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
              onClick={() => setActiveSection('contratos')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <FileText size={16} />
              Contratos
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
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => handleViewMode('card')}
                  title="Visualização em cards"
                  className={`p-2 transition-colors ${
                    viewMode === 'card'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-white text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => handleViewMode('list')}
                  title="Visualização em lista"
                  className={`p-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-white text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <LayoutList size={16} />
                </button>
              </div>
              <button
                onClick={() => router.push('/comercial/representantes')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium shadow-sm active:scale-95"
              >
                Ver todos <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>
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
          ) : viewMode === 'card' ? (
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
                        #{r.id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
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

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-50/50 rounded-xl p-3 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-colors">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider text-center">
                        Vendedores
                      </p>
                      <p className="text-lg font-black text-gray-800 text-center">
                        {r.vendedores_count}
                      </p>
                    </div>
                    <div className="bg-gray-50/50 rounded-xl p-3 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-colors">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider text-center">
                        Aceite
                      </p>
                      <p className="text-[11px] font-bold text-gray-700 text-center">
                        {r.aceite_contrato_em ? (
                          new Date(r.aceite_contrato_em).toLocaleDateString(
                            'pt-BR'
                          )
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
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
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div
                className="overflow-x-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style>{`
                  .kw-scrollbar-hide::-webkit-scrollbar { display: none; }
                `}</style>
                <table className="w-full text-sm kw-scrollbar-hide">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Representante
                      </th>
                      <th className="text-center px-3 py-3 font-semibold text-gray-600">
                        Tipo
                      </th>
                      <th className="text-center px-3 py-3 font-semibold text-gray-600" />
                      <th className="text-center px-3 py-3 font-semibold text-gray-600">
                        Valor/%
                      </th>
                      <th className="text-center px-3 py-3 font-semibold text-gray-600">
                        Com. Com.
                      </th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {repsMetrica.map((r, idx) => (
                      <tr
                        key={r.id}
                        onClick={() =>
                          router.push(`/comercial/representantes/${r.id}`)
                        }
                        className={`cursor-pointer hover:bg-green-50/50 transition-colors ${
                          idx < repsMetrica.length - 1
                            ? 'border-b border-gray-50'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                r.status === 'apto'
                                  ? 'bg-green-500'
                                  : r.status === 'apto_pendente'
                                    ? 'bg-amber-500'
                                    : 'bg-gray-300'
                              }`}
                            />
                            <div>
                              <p className="font-semibold text-gray-900">
                                {r.nome}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                                {r.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center px-3 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {r.modelo_comissionamento === 'percentual'
                              ? '%'
                              : r.modelo_comissionamento === 'custo_fixo'
                                ? 'Fixo'
                                : '—'}
                          </span>
                        </td>
                        {/* sub-tipo */}
                        <td className="text-center px-3 py-3 text-xs text-gray-500">
                          {r.modelo_comissionamento === 'custo_fixo' ? (
                            <div className="space-y-1">
                              <p>Ent.</p>
                              <p>Cli.</p>
                            </div>
                          ) : null}
                        </td>
                        {/* valor/% */}
                        <td className="text-center px-3 py-3 text-xs">
                          {r.modelo_comissionamento === 'percentual' ? (
                            <span className="font-semibold text-gray-900">
                              {r.percentual_comissao?.toFixed(1) ?? '—'}%
                            </span>
                          ) : r.modelo_comissionamento === 'custo_fixo' ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-900">
                                {r.valor_custo_fixo_entidade != null
                                  ? `R$ ${r.valor_custo_fixo_entidade.toFixed(2)}`
                                  : '—'}
                              </p>
                              <p className="text-gray-600">
                                {r.valor_custo_fixo_clinica != null
                                  ? `R$ ${r.valor_custo_fixo_clinica.toFixed(2)}`
                                  : '—'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        {/* com. com. */}
                        <td className="text-center px-3 py-3 text-xs">
                          {r.percentual_comissao_comercial != null ? (
                            <span className="font-semibold text-gray-900">
                              {r.percentual_comissao_comercial.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <ChevronRight size={16} className="text-gray-300" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="qw-content-area p-4 md:p-6">
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
