'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ModalTermosRepresentante from '@/components/modals/ModalTermosRepresentante';
import RepresentanteSidebar from '@/components/representante/RepresentanteSidebar';

export interface RepresentanteSession {
  id: number;
  nome: string;
  email: string;
  codigo: string;
  status: string;
  tipo_pessoa: string;
  cpf?: string | null;
  cnpj?: string | null;
  telefone: string | null;
  aceite_termos: boolean;
  aceite_disclaimer_nv: boolean;
  aceite_politica_privacidade: boolean;
  criado_em: string;
  aprovado_em: string | null;
  // Dados bancários
  banco_codigo?: string | null;
  agencia?: string | null;
  conta?: string | null;
  tipo_conta?: string | null;
  titular_conta?: string | null;
  pix_chave?: string | null;
  pix_tipo?: string | null;
  dados_bancarios_status?: string | null;
  dados_bancarios_solicitado_em?: string | null;
  dados_bancarios_confirmado_em?: string | null;
  precisa_trocar_senha?: boolean;
}

interface RepContextValue {
  session: RepresentanteSession | null;
  recarregarSessao: () => Promise<void>;
}

export const RepContext = createContext<RepContextValue>({
  session: null,
  recarregarSessao: async () => {},
});

export const useRepresentante = () => useContext(RepContext);

// --- Provider ---------------------------------------------------------

export function RepresentanteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<RepresentanteSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBoasVindas, setShowBoasVindas] = useState(false);

  const carregarSessao = useCallback(async () => {
    try {
      const res = await fetch('/api/representante/me', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setSession(data.representante);
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
    await fetch('/api/representante/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // Gate de troca de senha obrigatória (primeiro acesso)
  if (
    session &&
    session.precisa_trocar_senha &&
    pathname !== '/representante/trocar-senha'
  ) {
    router.push('/representante/trocar-senha');
    return null;
  }

  // Gate de aceite de política de privacidade
  if (
    session &&
    !session.aceite_politica_privacidade &&
    pathname !== '/representante/trocar-senha'
  ) {
    return (
      <ModalTermosRepresentante
        onConcluir={() => {
          carregarSessao();
        }}
      />
    );
  }

  return (
    <RepContext.Provider value={{ session, recarregarSessao: carregarSessao }}>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar de navegação */}
        <RepresentanteSidebar session={session} onLogout={handleLogout} />

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto">
          <main className="max-w-6xl mx-auto px-4 py-6">
            {showBoasVindas && session?.codigo && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">&#127881;</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Bem-vindo(a) à QWORK!
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Seu código:{' '}
                      <span className="font-mono font-bold text-blue-900">
                        {session.codigo}
                      </span>{' '}
                      &mdash; Guarde-o, ele identifica você na plataforma.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBoasVindas(false)}
                  className="text-blue-400 hover:text-blue-700 transition-colors text-lg leading-none cursor-pointer"
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
    </RepContext.Provider>
  );
}
