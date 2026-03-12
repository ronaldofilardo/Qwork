'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { TomadoresContent } from '@/components/admin/TomadoresContent';
import { EmissoresContent } from '@/components/admin/EmissoresContent';
import { default as PagamentosContent } from '@/components/admin/PagamentosContent';
import { PlanosContent } from '@/components/admin/PlanosContent';
import { VolumeContent } from '@/components/admin/VolumeContent';
import { ContagemContent } from '@/components/admin/ContagemContent';

interface Session {
  cpf: string;
  nome: string;
  perfil: 'funcionario' | 'rh' | 'admin' | 'emissor';
}

type MainSection = 'tomadores' | 'financeiro' | 'geral' | 'volume';
type _TomadoresSubSection = 'clinicas' | 'entidades';
type _FinanceiroSubSection = 'contagem' | 'pagamentos' | 'planos';
type _GeralSubSection = 'emissores' | 'representantes';
type _VolumeSubSection = 'entidade' | 'rh';

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<MainSection>('tomadores');
  const [activeSubSection, setActiveSubSection] = useState<string>('clinicas');

  // Contadores para badges do sidebar
  const [clinicasCount, setClinicasCount] = useState(0);
  const [entidadesCount, setEntidadesCount] = useState(0);
  const [pagamentosPendentes, setPagamentosPendentes] = useState(0);
  const [planosAtivos, setPlanosAtivos] = useState(0);
  const [emissoresAtivos, setEmissoresAtivos] = useState(0);
  const [representantesAtivos, setRepresentantesAtivos] = useState(0);

  const router = useRouter();

  const fetchCounts = useCallback(async () => {
    try {
      // Usar a mesma fonte do TomadoresContent (UNION ALL) para os badges ficarem consistentes
      const tomadoresRes = await fetch('/api/admin/entidades');
      if (tomadoresRes.ok) {
        const data = await tomadoresRes.json();
        const lista: { tipo: string }[] = data.entidades || [];
        setClinicasCount(lista.filter((t) => t.tipo === 'clinica').length);
        setEntidadesCount(lista.filter((t) => t.tipo === 'entidade').length);
      }

      setPagamentosPendentes(0);

      const planosRes = await fetch('/api/admin/planos');
      if (planosRes.ok) {
        const data = await planosRes.json();
        if (data.success) {
          setPlanosAtivos(
            data.planos?.filter((p: { ativo: boolean }) => p.ativo).length || 0
          );
        }
      }

      const emissoresRes = await fetch('/api/admin/emissores');
      if (emissoresRes.ok) {
        const data = await emissoresRes.json();
        if (data.success) {
          setEmissoresAtivos(
            data.emissores?.filter((e: { ativo: boolean }) => e.ativo).length ||
              0
          );
        }
      }

      const representantesRes = await fetch(
        '/api/admin/representantes?status=ativo&limit=1'
      );
      if (representantesRes.ok) {
        const data = await representantesRes.json();
        setRepresentantesAtivos(data.total || 0);
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

      if (sessionData.perfil !== 'admin') {
        router.push('/dashboard');
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

  const handleSectionChange = (section: MainSection, subSection?: string) => {
    setActiveSection(section);
    setActiveSubSection(subSection || '');
  };

  const renderContent = () => {
    if (activeSection === 'tomadores') {
      return <TomadoresContent activeSubSection={activeSubSection} />;
    }

    if (activeSection === 'volume') {
      return <VolumeContent activeSubSection={activeSubSection} />;
    }

    if (activeSection === 'financeiro') {
      if (activeSubSection === 'contagem') {
        return <ContagemContent />;
      }
      if (activeSubSection === 'planos') {
        return <PlanosContent />;
      }
      if (activeSubSection === 'pagamentos') {
        return <PagamentosContent />;
      }
    }

    if (activeSection === 'geral') {
      if (activeSubSection === 'emissores') {
        return <EmissoresContent />;
      }
      if (activeSubSection === 'representantes') {
        router.push('/admin/representantes');
        return null;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
      {/* Sidebar */}
      <div className="w-64 flex flex-col h-screen">
        <AdminSidebar
          activeSection={activeSection}
          activeSubSection={activeSubSection}
          onSectionChange={handleSectionChange}
          counts={{
            clinicas: clinicasCount,
            entidades: entidadesCount,
            pagamentos: pagamentosPendentes,
            planos: planosAtivos,
            emissores: emissoresAtivos,
            representantes: representantesAtivos,
          }}
        />

        {/* Conteúdo principal */}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Painel Administrativo
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Bem-vindo, <span className="font-medium">{session.nome}</span>
            </p>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow-sm">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
