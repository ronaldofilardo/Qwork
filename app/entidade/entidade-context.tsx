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

export interface EntidadeCounts {
  funcionarios: number;
  lotes: number;
  pagamentos: number;
}

interface EntidadeContextValue {
  session: Session | null;
  counts: EntidadeCounts;
  isLoading: boolean;
  reloadCounts: () => Promise<void>;
}

const defaultCounts: EntidadeCounts = {
  funcionarios: 0,
  lotes: 0,
  pagamentos: 0,
};

export const EntidadeContext = createContext<EntidadeContextValue>({
  session: null,
  counts: defaultCounts,
  isLoading: true,
  reloadCounts: async () => {},
});

export const useEntidade = (): EntidadeContextValue =>
  useContext(EntidadeContext);

export function EntidadeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [counts, setCounts] = useState<EntidadeCounts>(defaultCounts);
  const [isLoading, setIsLoading] = useState(true);

  const loadCounts = useCallback(async () => {
    try {
      const [lotesRes, funcRes, pagamentosRes] = await Promise.all([
        fetch('/api/entidade/lotes'),
        fetch('/api/entidade/funcionarios'),
        fetch('/api/entidade/pagamentos-em-aberto/count'),
      ]);

      const next: EntidadeCounts = { ...defaultCounts };

      if (lotesRes.ok) {
        const data = await lotesRes.json();
        next.lotes = data.lotes?.length || 0;
      }
      if (funcRes.ok) {
        const data = await funcRes.json();
        next.funcionarios = data.funcionarios?.length || 0;
      }
      if (pagamentosRes.ok) {
        const data = await pagamentosRes.json();
        next.pagamentos = data.count || 0;
      }

      setCounts(next);
    } catch (err) {
      console.error('[EntidadeProvider] Erro ao carregar contadores:', err);
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

        if (sessionData.perfil !== 'gestor') {
          router.push('/login');
          return;
        }

        setSession(sessionData);

        // Verificar termos aceitos para gestor
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
                '[EntidadeProvider] Termos não aceitos — redirecionando para login'
              );
              router.push('/login?motivo=termos_pendentes');
              return;
            }
          }
        } catch (err) {
          console.error('[EntidadeProvider] Erro ao verificar termos:', err);
        }

        await loadCounts();
      } catch (err: unknown) {
        console.error(
          '[EntidadeProvider] Erro ao verificar autenticação:',
          err
        );
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
    <EntidadeContext.Provider
      value={{ session, counts, isLoading, reloadCounts: loadCounts }}
    >
      {children}
    </EntidadeContext.Provider>
  );
}
