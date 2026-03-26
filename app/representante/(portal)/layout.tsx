'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RepContext, type RepresentanteSession } from './rep-context';
import ModalTermosRepresentante from '@/components/modals/ModalTermosRepresentante';

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-blue-100 text-blue-700',
  apto: 'bg-green-100 text-green-700',
  apto_pendente: 'bg-yellow-100 text-yellow-700',
  apto_bloqueado: 'bg-orange-100 text-orange-700',
  suspenso: 'bg-red-100 text-red-700',
  desativado: 'bg-gray-100 text-gray-600',
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<RepresentanteSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [showBoasVindas, setShowBoasVindas] = useState(false);

  const carregarSessao = useCallback(async () => {
    try {
      const res = await fetch('/api/representante/me');
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
    await fetch('/api/representante/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleVoltar = () => {
    // Tenta navegar para a página anterior;
    // se não houver histórico, cai no dashboard
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/representante/dashboard');
    }
  };

  const handleCopiarCodigo = async () => {
    if (!session?.codigo) return;
    try {
      await navigator.clipboard.writeText(session.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Fallback para navegadores antigos
      const input = document.createElement('input');
      input.value = session.codigo;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const NAV_ITEMS = [
    { href: '/representante/dashboard', label: 'Dashboard', badge: false },
    { href: '/representante/metricas', label: 'Métricas', badge: false },
    { href: '/representante/equipe', label: 'Minha Equipe', badge: false },
    {
      href: '/representante/equipe/leads',
      label: 'Leads da Equipe',
      badge: false,
    },
    {
      href: '/representante/minhas-vendas',
      label: 'Minhas Vendas',
      badge: false,
    },
    { href: '/representante/dados', label: 'Dados', badge: false },
  ];

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

  // Gate de primeiro acesso: exibe modal bloqueante até todos os aceites serem concluídos
  if (
    session &&
    !session.aceite_politica_privacidade &&
    pathname !== '/representante/trocar-senha'
  ) {
    return (
      <ModalTermosRepresentante
        onConcluir={() => {
          // Recarrega a sessão para que o layout perceba que os aceites foram concluídos
          carregarSessao();
        }}
      />
    );
  }

  return (
    <RepContext.Provider value={{ session }}>
      <div className="min-h-screen bg-gray-50">
        {/* Top navigation */}
        <header className="bg-white border-b shadow-sm sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
            {/* Botão Voltar + nav links */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleVoltar}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors shrink-0"
                aria-label="Voltar"
              >
                <span className="text-base leading-none">←</span>
                <span className="hidden sm:inline">Voltar</span>
              </button>
              <nav className="hidden sm:flex items-center gap-0.5">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                      {item.badge && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Rep info + logout */}
            <div className="flex items-center gap-3">
              {session && (
                <>
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-gray-900 leading-tight">
                      {session.nome}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <p className="text-xs text-gray-400 font-mono leading-tight">
                        {session.codigo}
                      </p>
                      <button
                        onClick={handleCopiarCodigo}
                        title="Copiar código"
                        className="ml-1 p-1 text-xs rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                      >
                        {copiado ? '✅' : '📋'}
                      </button>
                    </div>
                  </div>
                  <span
                    className={`hidden sm:inline px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[session.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {session.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          <div className="sm:hidden border-t flex overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex-1 flex flex-col items-center py-2.5 text-xs font-medium transition-colors min-w-0 ${
                    isActive
                      ? 'text-blue-700 border-b-2 border-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <span className="absolute top-1.5 right-1/4 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </Link>
              );
            })}
          </div>
        </header>

        {/* Page content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
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
    </RepContext.Provider>
  );
}
