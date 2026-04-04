'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from '@/lib/session';

export interface RHCounts {
  empresas: number;
  notificacoes: number;
  laudos: number;
  pagamentos: number;
}

interface RHContextValue {
  session: Session | null;
  counts: RHCounts;
  isLoading: boolean;
  reloadCounts: () => Promise<void>;
}

const defaultCounts: RHCounts = {
  empresas: 0,
  notificacoes: 0,
  laudos: 0,
  pagamentos: 0,
};

export const RHContext = createContext<RHContextValue>({
  session: null,
  counts: defaultCounts,
  isLoading: true,
  reloadCounts: async () => {},
});

export const useRH = (): RHContextValue => useContext(RHContext);

export function RHProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [counts, setCounts] = useState<RHCounts>(defaultCounts);
  const [isLoading, setIsLoading] = useState(true);

  const loadCounts = useCallback(async () => {
    try {
      const [empresasRes, laudosRes, notifRes, pagamentosRes] =
        await Promise.all([
          fetch('/api/rh/empresas'),
          fetch('/api/rh/laudos'),
          fetch('/api/rh/notificacoes'),
          fetch('/api/rh/pagamentos-em-aberto/count'),
        ]);

      const next: RHCounts = { ...defaultCounts };

      if (empresasRes.ok) {
        const data = await empresasRes.json();
        next.empresas = data.length || 0;
      }
      if (laudosRes.ok) {
        const data = await laudosRes.json();
        next.laudos = data.laudos?.length || 0;
      }
      if (notifRes.ok) {
        const data = await notifRes.json();
        next.notificacoes =
          data.totalNaoLidas || data.notificacoes?.length || 0;
      }
      if (pagamentosRes.ok) {
        const data = await pagamentosRes.json();
        next.pagamentos = data.count || 0;
      }

      setCounts(next);
    } catch (err) {
      console.error('[RHProvider] Erro ao carregar contadores:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session', {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!sessionRes.ok) {
          router.push('/login');
          return;
        }
        const sessionData: Session = await sessionRes.json();

        if (sessionData.perfil !== 'rh' && sessionData.perfil !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setSession(sessionData);

        // Verificar termos apenas para rh
        if (sessionData.perfil === 'rh') {
          try {
            const termosRes = await fetch('/api/termos/verificar', {
              credentials: 'same-origin',
            });
            if (termosRes.ok) {
              const termos = await termosRes.json();
              if (
                !termos.termos_uso_aceito ||
                !termos.politica_privacidade_aceito
              ) {
                console.log(
                  '[RHProvider] Termos não aceitos — redirecionando para login'
                );
                router.push('/login?motivo=termos_pendentes');
                return;
              }
            }
          } catch (err) {
            console.error('[RHProvider] Erro ao verificar termos:', err);
          }
        }

        await loadCounts();
      } catch (err: unknown) {
        console.error('[RHProvider] Erro ao verificar autenticação:', err);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router, loadCounts]);

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <RHContext.Provider
      value={{ session, counts, isLoading, reloadCounts: loadCounts }}
    >
      {children}
    </RHContext.Provider>
  );
}
