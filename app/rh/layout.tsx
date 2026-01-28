'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ClinicaSidebar from '@/components/clinica/ClinicaSidebar';

interface Session {
  cpf: string;
  nome: string;
  perfil: 'funcionario' | 'rh' | 'admin';
}

export default function RhLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificacoesCount, setNotificacoesCount] = useState<number>(0);
  const [empresasCount, setEmpresasCount] = useState<number>(0);
  const [laudosCount, setLaudosCount] = useState<number>(0);
  const router = useRouter();

  const loadCounts = useCallback(async () => {
    try {
      const [empresasRes, laudosRes, notifRes] = await Promise.all([
        fetch('/api/rh/empresas'),
        fetch('/api/rh/laudos'),
        fetch('/api/rh/notificacoes'),
      ]);

      if (empresasRes.ok) {
        const empresasData = await empresasRes.json();
        setEmpresasCount(empresasData.length || 0);
      }

      if (laudosRes.ok) {
        const laudosData = await laudosRes.json();
        setLaudosCount(laudosData.laudos?.length || 0);
      }

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotificacoesCount(
          notifData.totalNaoLidas || notifData.notificacoes?.length || 0
        );
      }
    } catch (err) {
      console.error('Erro ao carregar contadores:', err);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session', {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!sessionRes.ok) {
          router.push('/login');
          return;
        }
        const sessionData = await sessionRes.json();

        if (sessionData.perfil !== 'rh' && sessionData.perfil !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setSession(sessionData);
        await loadCounts();
      } catch (err: unknown) {
        console.error('Erro ao verificar autenticação:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, loadCounts]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ClinicaSidebar
        counts={{
          empresas: empresasCount,
          notificacoes: notificacoesCount,
          laudos: laudosCount,
        }}
        userName={session?.nome}
      />
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
