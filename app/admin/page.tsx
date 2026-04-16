'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { EmissoresContent } from '@/components/admin/EmissoresContent';
import { VolumeContent } from '@/components/admin/VolumeContent';
import { ContagemContent } from '@/components/admin/ContagemContent';
import { AuditoriasContent } from '@/components/admin/AuditoriasContent';
import { ContratosTable } from '@/components/shared/ContratosTable';

interface Session {
  cpf: string;
  nome: string;
  perfil: string;
}

type MainSection = 'volume' | 'financeiro' | 'geral' | 'auditorias';
type _VolumeSubSection = 'entidade' | 'rh';

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<MainSection>('volume');
  const [activeSubSection, setActiveSubSection] = useState<string>('entidade');

  const router = useRouter();

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
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleSectionChange = (section: MainSection, subSection?: string) => {
    setActiveSection(section);
    setActiveSubSection(subSection || '');
  };

  const renderContent = () => {
    if (activeSection === 'volume') {
      return <VolumeContent activeSubSection={activeSubSection} />;
    }

    if (activeSection === 'financeiro') {
      if (activeSubSection === 'contratos')
        return <ContratosTable endpoint="/api/admin/contratos" showQWork />;
      return <ContagemContent />;
    }

    if (activeSection === 'geral') {
      return <EmissoresContent />;
    }

    if (activeSection === 'auditorias') {
      return <AuditoriasContent />;
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
