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
    tabAtiva === 'candidatos' ? 'candidatos' : 'representantes'
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
