'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ModalTermosVendedor from '@/components/modals/ModalTermosVendedor';
import VendedorPortalSidebar from '@/components/vendedor/VendedorPortalSidebar';

export interface VendedorSession {
  id: number;
  nome: string;
  cpf: string;
  codigo?: string | null;
  email: string | null;
  perfil: string;
  primeira_senha_alterada?: boolean;
  aceite_politica_privacidade?: boolean;
}

interface VendedorContextValue {
  session: VendedorSession | null;
  recarregarSessao: () => Promise<void>;
}

export const VendedorContext = createContext<VendedorContextValue>({
  session: null,
  recarregarSessao: async () => {},
});

export const useVendedor = (): VendedorContextValue =>
  useContext(VendedorContext);

// --- Provider ---------------------------------------------------------

export function VendedorProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<VendedorSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBoasVindas, setShowBoasVindas] = useState(false);

  const carregarSessao = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.perfil !== 'vendedor') {
        router.push('/login');
        return;
      }
      // Enrich with personal data
      const dadosRes = await fetch('/api/vendedor/dados');
      if (dadosRes.ok) {
        const d = await dadosRes.json();
        setSession({ ...(d.usuario ?? data), perfil: 'vendedor' });
      } else {
        setSession(data);
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    carregarSessao();
  }, [carregarSessao]);

  useEffect(() => {
    if (searchParams.get('primeiro_acesso') === '1') {
      setShowBoasVindas(true);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  // Gate de troca de senha obrigatória (primeiro acesso)
  if (
    session.primeira_senha_alterada === false &&
    pathname !== '/vendedor/trocar-senha'
  ) {
    router.push('/vendedor/trocar-senha');
    return null;
  }

  // Gate de aceite de termos
  if (
    session.aceite_politica_privacidade === false &&
    pathname !== '/vendedor/trocar-senha'
  ) {
    return <ModalTermosVendedor onConcluir={() => carregarSessao()} />;
  }

  return (
    <VendedorContext.Provider
      value={{ session, recarregarSessao: carregarSessao }}
    >
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar de navegação */}
        <VendedorPortalSidebar session={session} onLogout={handleLogout} />

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto">
          <main className="qw-content-area max-w-6xl mx-auto px-4 py-6">
            {showBoasVindas && session?.codigo && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">&#127881;</span>
                  <div>
                    <p className="text-sm font-semibold text-green-900">
                      Bem-vindo(a) à QWORK!
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Seu código:{' '}
                      <span className="font-mono font-bold text-green-900">
                        {session.codigo}
                      </span>{' '}
                      &mdash; Guarde-o, ele identifica você na plataforma.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBoasVindas(false)}
                  className="text-green-400 hover:text-green-700 transition-colors text-lg leading-none cursor-pointer"
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </VendedorContext.Provider>
  );
}
