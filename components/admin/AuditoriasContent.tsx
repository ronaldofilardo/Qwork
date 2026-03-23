'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { AuditoriaSubNav } from './auditorias/AuditoriaSubNav';
import {
  TabelaAcessosGestor,
  TabelaAcessosRH,
  TabelaAvaliacoes,
  TabelaLotes,
  TabelaLaudos,
  TabelaAcessosSuporte,
  TabelaAcessosComercial,
  TabelaAcessosRepresentante,
  TabelaAcessosVendedor,
} from './auditorias/AuditoriaTables';
import { LaudoDetalheDrawer } from './auditorias/LaudoDetalheDrawer';
import type {
  AuditoriaSubTab,
  AcessoGestor,
  AcessoRH,
  AcessoSuporte,
  AcessoComercial,
  AcessoRepresentante,
  AcessoVendedor,
  AuditoriaAvaliacao,
  AuditoriaLote,
  AuditoriaLaudo,
} from './auditorias/types';

const ENDPOINTS: Record<AuditoriaSubTab, string> = {
  'acesso-gestor': '/api/admin/auditorias/acesso-gestor',
  'acesso-rh': '/api/admin/auditorias/acessos-rh',
  avaliacoes: '/api/admin/auditorias/avaliacoes',
  lotes: '/api/admin/auditorias/lotes',
  laudos: '/api/admin/auditorias/laudos',
  'acesso-suporte': '/api/admin/auditorias/acesso-suporte',
  'acesso-comercial': '/api/admin/auditorias/acesso-comercial',
  'acesso-representante': '/api/admin/auditorias/acesso-representante',
  'acesso-vendedor': '/api/admin/auditorias/acesso-vendedor',
};

export function AuditoriasContent() {
  const [activeTab, setActiveTab] = useState<AuditoriaSubTab>('acesso-gestor');
  const [loading, setLoading] = useState(false);
  const [laudoDetalheId, setLaudoDetalheId] = useState<number | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [acessosGestor, setAcessosGestor] = useState<AcessoGestor[]>([]);
  const [acessosRH, setAcessosRH] = useState<AcessoRH[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AuditoriaAvaliacao[]>([]);
  const [lotes, setLotes] = useState<AuditoriaLote[]>([]);
  const [laudos, setLaudos] = useState<AuditoriaLaudo[]>([]);
  const [acessosSuporte, setAcessosSuporte] = useState<AcessoSuporte[]>([]);
  const [acessosComercial, setAcessosComercial] = useState<AcessoComercial[]>(
    []
  );
  const [acessosRepresentante, setAcessosRepresentante] = useState<
    AcessoRepresentante[]
  >([]);
  const [acessosVendedor, setAcessosVendedor] = useState<AcessoVendedor[]>([]);

  const fetchTab = useCallback(async (tab: AuditoriaSubTab) => {
    setLoading(true);
    setTabError(null);
    try {
      const res = await fetch(ENDPOINTS[tab], { cache: 'no-store' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? `Erro ${res.status}`);
      }
      const json = await res.json();
      switch (tab) {
        case 'acesso-gestor':
          setAcessosGestor(json.acessos ?? []);
          break;
        case 'acesso-rh':
          setAcessosRH(json.acessos ?? []);
          break;
        case 'avaliacoes':
          setAvaliacoes(json.avaliacoes ?? []);
          break;
        case 'lotes':
          setLotes(json.lotes ?? []);
          break;
        case 'laudos':
          setLaudos(json.laudos ?? []);
          break;
        case 'acesso-suporte':
          setAcessosSuporte(json.acessos ?? []);
          break;
        case 'acesso-comercial':
          setAcessosComercial(json.acessos ?? []);
          break;
        case 'acesso-representante':
          setAcessosRepresentante(json.acessos ?? []);
          break;
        case 'acesso-vendedor':
          setAcessosVendedor(json.acessos ?? []);
          break;
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[AuditoriasContent] Erro ao buscar aba:', tab, err);
      setTabError(
        err instanceof Error ? err.message : 'Erro ao carregar dados'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Auditorias</h2>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              Atualizado às {lastUpdated.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
        <button
          onClick={() => fetchTab(activeTab)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <AuditoriaSubNav
        auditoriaSubTab={activeTab}
        setAuditoriaSubTab={setActiveTab}
      />

      {tabError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ⚠️ Erro ao carregar dados: {tabError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          {activeTab === 'acesso-gestor' && (
            <TabelaAcessosGestor data={acessosGestor} />
          )}
          {activeTab === 'acesso-rh' && <TabelaAcessosRH data={acessosRH} />}
          {activeTab === 'avaliacoes' && <TabelaAvaliacoes data={avaliacoes} />}
          {activeTab === 'lotes' && <TabelaLotes data={lotes} />}
          {activeTab === 'laudos' && (
            <TabelaLaudos data={laudos} onVerDetalhe={setLaudoDetalheId} />
          )}
          {activeTab === 'acesso-suporte' && (
            <TabelaAcessosSuporte data={acessosSuporte} />
          )}
          {activeTab === 'acesso-comercial' && (
            <TabelaAcessosComercial data={acessosComercial} />
          )}
          {activeTab === 'acesso-representante' && (
            <TabelaAcessosRepresentante data={acessosRepresentante} />
          )}
          {activeTab === 'acesso-vendedor' && (
            <TabelaAcessosVendedor data={acessosVendedor} />
          )}
        </>
      )}

      <LaudoDetalheDrawer
        laudoId={laudoDetalheId}
        onClose={() => setLaudoDetalheId(null)}
      />
    </div>
  );
}
