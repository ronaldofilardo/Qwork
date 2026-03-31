'use client';

import { useCallback } from 'react';
import type { Lead } from '@/app/admin/representantes/types';
import { useLeads } from '@/app/admin/representantes/hooks/useLeads';
import { useCachedDocs } from '@/app/admin/representantes/hooks/useCachedDocs';
import { useRepActions } from '@/app/admin/representantes/hooks/useRepActions';
import { LeadsTab } from '@/app/admin/representantes/components/LeadsTab';
import { RepresentantesLista } from './RepresentantesLista';

interface RepresentantesContentProps {
  activeSubSection: string;
}

export function RepresentantesContent({
  activeSubSection,
}: RepresentantesContentProps) {
  const tabAtiva =
    activeSubSection === 'aprovacao' ? 'candidatos' : 'representantes';

  const ld = useLeads(
    tabAtiva === 'candidatos' ? 'candidatos' : 'representantes',
    tabAtiva === 'candidatos' ? 'pendente_verificacao' : ''
  );
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

  if (tabAtiva === 'representantes') {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Representantes Comerciais
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Lista de todos os representantes e seus vendedores vinculados.
          </p>
        </div>
        <RepresentantesLista />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Pendentes de Aprovação
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Candidatos aguardando verificação e aprovação para se tornarem
          representantes.
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
