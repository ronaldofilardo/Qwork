'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EntidadeSidebar from '@/components/entidade/EntidadeSidebar';

interface Session {
  cpf: string;
  nome: string;
  perfil: string;
  contratante_id: number;
}

export default function EntidadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificacoesCount, setNotificacoesCount] = useState<number>(0);
  const [laudosCount, setLaudosCount] = useState<number>(0);
  const [lotesCount, setLotesCount] = useState<number>(0);
  const [funcionariosCount, setFuncionariosCount] = useState<number>(0);
  const router = useRouter();

  const loadCounts = useCallback(async () => {
    try {
      const [notifRes, laudosRes, lotesRes, funcRes] = await Promise.all([
        fetch('/api/entidade/notificacoes'),
        fetch('/api/entidade/laudos'),
        fetch('/api/entidade/lotes'),
        fetch('/api/entidade/funcionarios'),
      ]);

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotificacoesCount(data.totalNaoLidas || 0);
      }

      if (laudosRes.ok) {
        const data = await laudosRes.json();
        setLaudosCount(data.laudos?.length || 0);
      }

      if (lotesRes.ok) {
        const data = await lotesRes.json();
        setLotesCount(data.lotes?.length || 0);
      }

      if (funcRes.ok) {
        const data = await funcRes.json();
        setFuncionariosCount(data.funcionarios?.length || 0);
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

        if (sessionData.perfil !== 'gestor_entidade') {
          router.push('/login');
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
      <EntidadeSidebar
        counts={{
          funcionarios: funcionariosCount,
          notificacoes: notificacoesCount,
          laudos: laudosCount,
          lotes: lotesCount,
        }}
        userName={session?.nome}
      />
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
