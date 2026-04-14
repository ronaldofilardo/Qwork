'use client';

import { useState, useCallback } from 'react';
import { AuditoriaSubNav } from './auditorias/AuditoriaSubNav';
import {
  TabelaGestores,
  TabelaAvaliacoes,
  TabelaLotes,
  TabelaLaudos,
  TabelaOperacionais,
  TabelaAceites,
  TabelaAcessosComercial,
  TabelaAcessosRepresentante,
  TabelaAcessosVendedor,
} from './auditorias/AuditoriaTables';
import { LaudoDetalheDrawer } from './auditorias/LaudoDetalheDrawer';
import { DelecaoTomadorContent } from './auditorias/DelecaoTomadorContent';
import type {
  AuditoriaSubTab,
  AcessoGestorUnificado,
  AcessoOperacional,
  AuditoriaAvaliacao,
  AuditoriaLote,
  AuditoriaLaudo,
  AceiteUsuario,
  AcessoComercial,
  AcessoRepresentante,
  AcessoVendedor,
} from './auditorias/types';

const ENDPOINTS: Partial<Record<AuditoriaSubTab, string>> = {
  gestores: '/api/admin/auditorias/gestores',
  avaliacoes: '/api/admin/auditorias/avaliacoes',
  lotes: '/api/admin/auditorias/lotes',
  laudos: '/api/admin/auditorias/laudos',
  operacionais: '/api/admin/auditorias/operacionais',
  aceites: '/api/admin/auditorias/aceites',
  'acesso-comercial': '/api/admin/auditorias/acesso-comercial',
  'acesso-representante': '/api/admin/auditorias/acesso-representante',
  'acesso-vendedor': '/api/admin/auditorias/acesso-vendedor',
};

export function AuditoriasContent() {
  const [activeTab, setActiveTab] = useState<AuditoriaSubTab>('gestores');
  const [loading, setLoading] = useState(false);
  const [laudoDetalheId, setLaudoDetalheId] = useState<number | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [gestores, setGestores] = useState<AcessoGestorUnificado[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AuditoriaAvaliacao[]>([]);
  const [lotes, setLotes] = useState<AuditoriaLote[]>([]);
  const [laudos, setLaudos] = useState<AuditoriaLaudo[]>([]);
  const [operacionais, setOperacionais] = useState<AcessoOperacional[]>([]);
  const [aceites, setAceites] = useState<AceiteUsuario[]>([]);
  const [acessosComercial, setAcessosComercial] = useState<AcessoComercial[]>([]);
  const [acessosRepresentante, setAcessosRepresentante] = useState<AcessoRepresentante[]>([]);
  const [acessosVendedor, setAcessosVendedor] = useState<AcessoVendedor[]>([]);

  const fetchTab = useCallback(async (tab: AuditoriaSubTab) => {
    if (tab === 'delecao') return;
    const endpoint = ENDPOINTS[tab];
    if (!endpoint) return;

    setLoading(true);
    setTabError(null);
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? `Erro ${res.status}`);
      }
      const json = await res.json();
      switch (tab) {
        case 'gestores':
          setGestores(json.gestores ?? []);
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
        case 'operacionais':
          setOperacionais(json.operacionais ?? []);
          break;
        case 'aceites':
          setAceites(json.aceites ?? []);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Auditorias</h2>
        {lastUpdated && (
          <span className="text-xs text-gray-400">
            Atualizado às {lastUpdated.toLocaleTimeString('pt-BR')}
          </span>
        )}
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

      {activeTab === 'gestores' && (
        <TabelaGestores
          data={gestores}
          onAtualizar={() => fetchTab('gestores')}
          loading={loading && activeTab === 'gestores'}
        />
      )}
      {activeTab === 'avaliacoes' && (
        <TabelaAvaliacoes
          data={avaliacoes}
          onAtualizar={() => fetchTab('avaliacoes')}
          loading={loading && activeTab === 'avaliacoes'}
        />
      )}
      {activeTab === 'lotes' && (
        <TabelaLotes
          data={lotes}
          onAtualizar={() => fetchTab('lotes')}
          loading={loading && activeTab === 'lotes'}
        />
      )}
      {activeTab === 'laudos' && (
        <TabelaLaudos
          data={laudos}
          onVerDetalhe={setLaudoDetalheId}
          onAtualizar={() => fetchTab('laudos')}
          loading={loading && activeTab === 'laudos'}
        />
      )}
      {activeTab === 'operacionais' && (
        <TabelaOperacionais
          data={operacionais}
          onAtualizar={() => fetchTab('operacionais')}
          loading={loading && activeTab === 'operacionais'}
        />
      )}
      {activeTab === 'aceites' && (
        <TabelaAceites
          data={aceites}
          onAtualizar={() => fetchTab('aceites')}
          loading={loading && activeTab === 'aceites'}
        />
      )}
      {activeTab === 'acesso-comercial' && (
        <TabelaAcessosComercial
          data={acessosComercial}
          onAtualizar={() => fetchTab('acesso-comercial')}
          loading={loading && activeTab === 'acesso-comercial'}
        />
      )}
      {activeTab === 'acesso-representante' && (
        <TabelaAcessosRepresentante
          data={acessosRepresentante}
          onAtualizar={() => fetchTab('acesso-representante')}
          loading={loading && activeTab === 'acesso-representante'}
        />
      )}
      {activeTab === 'acesso-vendedor' && (
        <TabelaAcessosVendedor
          data={acessosVendedor}
          onAtualizar={() => fetchTab('acesso-vendedor')}
          loading={loading && activeTab === 'acesso-vendedor'}
        />
      )}
      {activeTab === 'delecao' && <DelecaoTomadorContent />}

      <LaudoDetalheDrawer
        laudoId={laudoDetalheId}
        onClose={() => setLaudoDetalheId(null)}
      />
    </div>
  );
}
