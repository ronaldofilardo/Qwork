'use client';

import { useState, useCallback } from 'react';
import type { TabAtiva, Lead } from './types';
import { useRepresentantes } from './hooks/useRepresentantes';
import { useLeads } from './hooks/useLeads';
import { useCachedDocs } from './hooks/useCachedDocs';
import { useRepActions } from './hooks/useRepActions';
import { RepresentantesTab } from './components/RepresentantesTab';
import { LeadsTab } from './components/LeadsTab';

export default function RepresentantesPage() {
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>('representantes');

  /* ---------- Hooks ---------- */
  const rep = useRepresentantes();
  const ld = useLeads(tabAtiva);
  const docs = useCachedDocs();
  const actions = useRepActions();

  /* ---------- Wrappers para coordenar hooks ---------- */
  const handleExecutarAcao = useCallback(
    (acaoPendente: { id: number; novoStatus: string }, motivoAcao: string) =>
      actions.executarAcao(acaoPendente, motivoAcao, {
        onSuccess: () => {},
        carregar: rep.carregar,
      }),
    [actions, rep.carregar]
  );

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
        carregar: rep.carregar,
      }),
    [actions, ld.carregarLeads, rep.carregar]
  );

  const handleSolicitarDados = useCallback(
    (representanteId: number) =>
      actions.solicitarDadosBancarios(representanteId, {
        onSuccess: () => {},
        carregar: rep.carregar,
      }),
    [actions, rep.carregar]
  );

  const handleReenviarConvite = useCallback(
    (representanteId: number) =>
      actions.reenviarConvite(representanteId, {
        onSuccess: () => {},
        carregar: rep.carregar,
      }),
    [actions, rep.carregar]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header + Tabs */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Representantes Comerciais
        </h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTabAtiva('representantes')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tabAtiva === 'representantes'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Representantes
            <span className="ml-1.5 text-xs text-gray-400">({rep.total})</span>
          </button>
          <button
            onClick={() => setTabAtiva('candidatos')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tabAtiva === 'candidatos'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Candidatos
            {ld.leadsPendentes > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-white bg-amber-500 rounded-full">
                {ld.leadsPendentes}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Feedback global */}
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

      {/* Link de convite copiável */}
      {actions.conviteLinkCopiavel && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">
              Link de convite gerado (dev — copie para testar)
            </p>
            <button
              onClick={() => actions.setConviteLinkCopiavel(null)}
              className="text-amber-500 hover:text-amber-700 text-lg leading-none"
            >
              ✕
            </button>
          </div>
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
              className="shrink-0 text-xs bg-amber-600 text-white rounded px-3 py-1.5 hover:bg-amber-700"
            >
              Copiar
            </button>
          </div>
          <p className="text-xs text-amber-600">
            Este link será substituído por e-mail real quando o provedor for
            configurado.
          </p>
        </div>
      )}

      {/* TAB: REPRESENTANTES */}
      {tabAtiva === 'representantes' && (
        <RepresentantesTab
          reps={rep.reps}
          total={rep.total}
          page={rep.page}
          setPage={rep.setPage}
          statusFiltro={rep.statusFiltro}
          setStatusFiltro={rep.setStatusFiltro}
          busca={rep.busca}
          setBusca={rep.setBusca}
          loading={rep.loading}
          actionLoading={actions.actionLoading}
          reenviarConviteLoading={actions.reenviarConviteLoading}
          solicitarDadosLoading={actions.solicitarDadosLoading}
          repDocsLoading={docs.repDocsLoading}
          openRepDoc={docs.openRepDoc}
          onExecutarAcao={handleExecutarAcao}
          onSolicitarDadosBancarios={handleSolicitarDados}
          onReenviarConvite={handleReenviarConvite}
        />
      )}

      {/* TAB: CANDIDATOS */}
      {tabAtiva === 'candidatos' && (
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
      )}
    </div>
  );
}
