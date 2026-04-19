'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SuporteSidebar from '@/components/suporte/SuporteSidebar';
import type { SuporteSection } from '@/components/suporte/SuporteSidebar';
import { TomadoresContent } from '@/components/admin/TomadoresContent';
import { default as PagamentosContent } from '@/components/admin/PagamentosContent';
import { RepresentantesContent } from '@/components/suporte/RepresentantesContent';
import { ComissoesIndividuaisContent } from '@/components/suporte/ComissoesIndividuaisContent';
import { PreCadastroContent } from '@/components/suporte/PreCadastroContent';
import { SuporteLeadsComissoesContent } from '@/components/suporte/SuporteLeadsComissoesContent';
import { ContratosTable } from '@/components/shared/ContratosTable';

interface Session {
  cpf: string;
  nome: string;
  perfil: string;
}

export default function SuportePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] =
    useState<SuporteSection>('tomadores');
  const [activeSubSection, setActiveSubSection] = useState<string>('clinicas');

  const [clinicasCount, setClinicasCount] = useState(0);
  const [entidadesCount, setEntidadesCount] = useState(0);
  const [representantesPendentesCount, setRepresentantesPendentesCount] =
    useState(0);
  const [preCadastroCount, setPreCadastroCount] = useState(0);

  const router = useRouter();

  const fetchCounts = useCallback(async () => {
    try {
      const tomadoresRes = await fetch('/api/admin/entidades');
      if (tomadoresRes.ok) {
        const data = await tomadoresRes.json();
        const lista: { tipo: string }[] = data.entidades || [];
        setClinicasCount(lista.filter((t) => t.tipo === 'clinica').length);
        setEntidadesCount(lista.filter((t) => t.tipo === 'entidade').length);
      }

      const repsRes = await fetch('/api/admin/representantes-leads?limit=1');
      if (repsRes.ok) {
        const data = await repsRes.json();
        setRepresentantesPendentesCount(data.pendentes || 0);
      }

      const preCadRes = await fetch('/api/suporte/pre-cadastro');
      if (preCadRes.ok) {
        const data = (await preCadRes.json()) as { total?: number };
        setPreCadastroCount(data.total ?? 0);
      }
    } catch (error) {
      console.error('Erro ao buscar contadores:', error);
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

      if (sessionData.perfil !== 'suporte') {
        router.push('/login');
        return;
      }

      setSession(sessionData);
      await fetchCounts();
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, fetchCounts]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleSectionChange = (
    section: SuporteSection,
    subSection?: string
  ) => {
    setActiveSection(section);
    setActiveSubSection(subSection || '');
  };

  const renderContent = () => {
    if (activeSection === 'tomadores') {
      if (activeSubSection === 'pre-cadastro') {
        return <PreCadastroContent />;
      }
      if (activeSubSection === 'contratos') {
        return (
          <ContratosTable
            endpoint="/api/suporte/contratos"
            allowGerarContrato
          />
        );
      }
      return <TomadoresContent activeSubSection={activeSubSection} />;
    }

    if (activeSection === 'financeiro') {
      if (activeSubSection === 'pagamentos') {
        return <PagamentosContent />;
      }
      if (activeSubSection === 'individuais') {
        return <ComissoesIndividuaisContent />;
      }
    }

    if (activeSection === 'representantes') {
      return (
        <RepresentantesContent activeSubSection={activeSubSection || 'lista'} />
      );
    }

    if (activeSection === 'leads') {
      if (activeSubSection === 'comissoes') {
        return <SuporteLeadsComissoesContent />;
      }
    }

    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Selecione uma opção no menu</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex flex-col h-screen">
        <SuporteSidebar
          activeSection={activeSection}
          activeSubSection={activeSubSection}
          onSectionChange={handleSectionChange}
          userName={session.nome}
          roleLabel="Suporte"
          counts={{
            clinicas: clinicasCount,
            entidades: entidadesCount,
            representantesPendentes: representantesPendentesCount,
            preCadastro: preCadastroCount,
          }}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="qw-content-area p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Painel de Suporte
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Bem-vindo, <span className="font-medium">{session.nome}</span>
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
