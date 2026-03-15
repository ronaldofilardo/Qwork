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
} from './auditorias/AuditoriaTables';
import { LaudoDetalheDrawer } from './auditorias/LaudoDetalheDrawer';
import type {
  AuditoriaSubTab,
  AcessoGestor,
  AcessoRH,
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
};

export function AuditoriasContent() {
  const [activeTab, setActiveTab] = useState<AuditoriaSubTab>('acesso-gestor');
  const [loading, setLoading] = useState(false);
  const [laudoDetalheId, setLaudoDetalheId] = useState<number | null>(null);

  const [acessosGestor, setAcessosGestor] = useState<AcessoGestor[]>([]);
  const [acessosRH, setAcessosRH] = useState<AcessoRH[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AuditoriaAvaliacao[]>([]);
  const [lotes, setLotes] = useState<AuditoriaLote[]>([]);
  const [laudos, setLaudos] = useState<AuditoriaLaudo[]>([]);

  const fetchTab = useCallback(async (tab: AuditoriaSubTab) => {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS[tab]);
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
      }
    } catch (err) {
      console.error('[AuditoriasContent] Erro ao buscar aba:', tab, err);
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
        <h2 className="text-xl font-bold text-gray-800">Auditorias</h2>
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
        </>
      )}

      <LaudoDetalheDrawer
        laudoId={laudoDetalheId}
        onClose={() => setLaudoDetalheId(null)}
      />
    </div>
  );
}
