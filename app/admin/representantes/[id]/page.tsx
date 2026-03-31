'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ACAO_LABEL, KPICard, n } from './constants';
import { useRepProfile } from './hooks/useRepProfile';
import { useProfileLeads } from './hooks/useProfileLeads';
import { useProfileVinculos } from './hooks/useProfileVinculos';
import { RepHeader } from './components/RepHeader';
import { RepFinanceiros } from './components/RepFinanceiros';
import { ProfileLeadsTab } from './components/ProfileLeadsTab';
import { ProfileVinculosTab } from './components/ProfileVinculosTab';

export default function RepresentantePerfilPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    rep,
    loadingRep,
    erroRep,
    actionLoading,
    erro,
    setErro,
    sucesso,
    editandoComissao,
    setEditandoComissao,
    percentualInput,
    setPercentualInput,
    salvandoPercentual,
    salvarPercentual,
    executarAcao,
  } = useRepProfile(id);

  const {
    leads,
    totalLeads,
    pageLeads,
    setPageLeads,
    statusLeadFiltro,
    setStatusLeadFiltro,
    buscaLead,
    setBuscaLead,
    loadingLeads,
    contagensLeads,
  } = useProfileLeads(id);

  const {
    vinculos,
    totalVinculos,
    pageVinculos,
    setPageVinculos,
    statusVinculoFiltro,
    setStatusVinculoFiltro,
    loadingVinculos,
    contagensVinculos,
  } = useProfileVinculos(id);

  const [aba, setAba] = useState<'leads' | 'vinculos'>('leads');
  const [acaoPendente, setAcaoPendente] = useState<{
    novoStatus: string;
  } | null>(null);
  const [motivoAcao, setMotivoAcao] = useState('');

  /* ── Loading/Erro ── */
  if (loadingRep) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (erroRep || !rep) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="mb-4">{erroRep || 'Representante não encontrado.'}</p>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  const taxa =
    n(rep.total_leads) > 0
      ? Math.round((n(rep.leads_convertidos) / n(rep.total_leads)) * 100)
      : 0;

  const handleExecutarAcao = async () => {
    if (!acaoPendente) return;
    await executarAcao(acaoPendente.novoStatus, motivoAcao);
    setAcaoPendente(null);
    setMotivoAcao('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de confirmação */}
      {acaoPendente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">
              Confirmar:{' '}
              {ACAO_LABEL[acaoPendente.novoStatus] ?? acaoPendente.novoStatus}
            </h2>
            <p className="text-sm text-gray-600">
              Alterar status de <strong>{rep.nome}</strong> para{' '}
              <strong>{acaoPendente.novoStatus.replace(/_/g, ' ')}</strong>?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo (opcional)
              </label>
              <textarea
                value={motivoAcao}
                onChange={(e) => setMotivoAcao(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                rows={2}
                placeholder="Ex.: Documentação aprovada, Violação de contrato..."
              />
            </div>
            {erro && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {erro}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAcaoPendente(null);
                  setMotivoAcao('');
                  setErro('');
                }}
                className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecutarAcao}
                disabled={actionLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <RepHeader
          rep={rep}
          sucesso={sucesso}
          onSetAcaoPendente={setAcaoPendente}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="Total de Leads"
            value={n(rep.total_leads)}
            sub={`${n(rep.leads_pendentes)} pendentes · ${n(rep.leads_expirados)} expirados`}
          />
          <KPICard
            label="Leads Convertidos"
            value={n(rep.leads_convertidos)}
            highlight={n(rep.leads_convertidos) > 0}
          />
          <KPICard
            label="Taxa de Conversão"
            value={`${taxa}%`}
            highlight={taxa >= 30}
          />
          <KPICard
            label="Vínculos Ativos"
            value={n(rep.vinculos_ativos)}
            sub={`${n(rep.total_vinculos)} total`}
          />
        </div>

        {/* Alertas */}
        {(n(rep.leads_a_vencer_30d) > 0 ||
          n(rep.vinculos_a_vencer_30d) > 0) && (
          <div className="flex flex-wrap gap-3">
            {n(rep.leads_a_vencer_30d) > 0 && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-4 py-2.5 text-sm">
                ⚠️{' '}
                <strong>
                  {n(rep.leads_a_vencer_30d)} lead
                  {n(rep.leads_a_vencer_30d) > 1 ? 's' : ''}
                </strong>{' '}
                expira{n(rep.leads_a_vencer_30d) === 1 ? '' : 'm'} nos próximos
                30 dias
              </div>
            )}
            {n(rep.vinculos_a_vencer_30d) > 0 && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-4 py-2.5 text-sm">
                ⚠️{' '}
                <strong>
                  {n(rep.vinculos_a_vencer_30d)} vínculo
                  {n(rep.vinculos_a_vencer_30d) > 1 ? 's' : ''}
                </strong>{' '}
                vence{n(rep.vinculos_a_vencer_30d) === 1 ? '' : 'm'} nos
                próximos 30 dias
              </div>
            )}
          </div>
        )}

        <RepFinanceiros
          rep={rep}
          editandoComissao={editandoComissao}
          setEditandoComissao={setEditandoComissao}
          percentualInput={percentualInput}
          setPercentualInput={setPercentualInput}
          salvandoPercentual={salvandoPercentual}
          onSalvarPercentual={salvarPercentual}
        />

        {/* Abas */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setAba('leads')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                aba === 'leads'
                  ? 'border-b-2 border-blue-600 text-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Leads / Indicações
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">
                {n(rep.total_leads)}
              </span>
            </button>
            <button
              onClick={() => setAba('vinculos')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                aba === 'vinculos'
                  ? 'border-b-2 border-blue-600 text-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Vínculos de Comissão
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">
                {n(rep.total_vinculos)}
              </span>
            </button>
          </div>

          {aba === 'leads' && (
            <ProfileLeadsTab
              rep={rep}
              leads={leads}
              totalLeads={totalLeads}
              pageLeads={pageLeads}
              setPageLeads={setPageLeads}
              statusLeadFiltro={statusLeadFiltro}
              setStatusLeadFiltro={setStatusLeadFiltro}
              buscaLead={buscaLead}
              setBuscaLead={setBuscaLead}
              loadingLeads={loadingLeads}
              contagensLeads={contagensLeads}
            />
          )}

          {aba === 'vinculos' && (
            <ProfileVinculosTab
              rep={rep}
              vinculos={vinculos}
              totalVinculos={totalVinculos}
              pageVinculos={pageVinculos}
              setPageVinculos={setPageVinculos}
              statusVinculoFiltro={statusVinculoFiltro}
              setStatusVinculoFiltro={setStatusVinculoFiltro}
              loadingVinculos={loadingVinculos}
              contagensVinculos={contagensVinculos}
            />
          )}
        </div>
      </div>
    </div>
  );
}
