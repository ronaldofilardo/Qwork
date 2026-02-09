'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { NovoscadastrosContent } from '@/components/admin/NovoscadastrosContent';
import { TomadoresContent } from '@/components/admin/TomadoresContent';
import { EmissoresContent } from '@/components/admin/EmissoresContent';
import { CobrancaContent } from '@/components/admin/CobrancaContent';
import { default as PagamentosContent } from '@/components/admin/PagamentosContent';
import { PlanosContent } from '@/components/admin/PlanosContent';

interface Session {
  cpf: string;
  nome: string;
  perfil: 'funcionario' | 'rh' | 'admin' | 'emissor';
}

type MainSection = 'novos-cadastros' | 'tomadores' | 'financeiro' | 'geral';
type _tomadoresSubSection = 'clinicas' | 'entidades';
type _FinanceiroSubSection = 'cobranca' | 'pagamentos' | 'planos';
type _GeralSubSection = 'emissores';

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] =
    useState<MainSection>('novos-cadastros');
  const [activeSubSection, setActiveSubSection] = useState<string>('');

  // Contadores para badges do sidebar
  const [pendingCount, setPendingCount] = useState(0);
  const [clinicasCount, setClinicasCount] = useState(0);
  const [entidadesCount, setEntidadesCount] = useState(0);
  const [cobrancaPendente, setCobrancaPendente] = useState(0);
  const [pagamentosPendentes, setPagamentosPendentes] = useState(0);
  const [planosAtivos, setPlanosAtivos] = useState(0);
  const [emissoresAtivos, setEmissoresAtivos] = useState(0);

  const router = useRouter();

  const fetchCounts = useCallback(async () => {
    try {
      // Buscar contadores de pendências
      const pendingRes = await fetch(
        '/api/admin/novos-cadastros?status=pendente'
      );
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingCount(data.total || 0);
      }

      // Buscar contadores de clínicas e entidades
      const clinicasRes = await fetch('/api/admin/entidades?tipo=clinica');
      if (clinicasRes.ok) {
        const data = await clinicasRes.json();
        setClinicasCount(data.total || 0);
      }

      const entidadesRes = await fetch('/api/admin/entidades?tipo=entidade');
      if (entidadesRes.ok) {
        const data = await entidadesRes.json();
        setEntidadesCount(data.total || 0);
      }

      // Buscar contadores financeiros (placeholder - implementar depois)
      setCobrancaPendente(0);
      setPagamentosPendentes(0);

      // Buscar planos ativos
      const planosRes = await fetch('/api/admin/planos');
      if (planosRes.ok) {
        const data = await planosRes.json();
        if (data.success) {
          setPlanosAtivos(
            data.planos?.filter((p: { ativo: boolean }) => p.ativo).length || 0
          );
        }
      }

      // Buscar emissores ativos
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
    if (activeSection === 'novos-cadastros') {
      return <NovoscadastrosContent _onApproved={fetchCounts} />;
    }

    if (activeSection === 'tomadores') {
      return <TomadoresContent activeSubSection={activeSubSection} />;
    }

    if (activeSection === 'financeiro') {
      if (activeSubSection === 'planos') {
        return <PlanosContent />;
      }
      if (activeSubSection === 'cobranca') {
        return <CobrancaContent />;
      }
      if (activeSubSection === 'pagamentos') {
        return <PagamentosContent />;
      }
    }

    if (activeSection === 'geral') {
      if (activeSubSection === 'emissores') {
        return <EmissoresContent />;
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
            novosCadastros: pendingCount,
            clinicas: clinicasCount,
            entidades: entidadesCount,
            cobranca: cobrancaPendente,
            pagamentos: pagamentosPendentes,
            planos: planosAtivos,
            emissores: emissoresAtivos,
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
