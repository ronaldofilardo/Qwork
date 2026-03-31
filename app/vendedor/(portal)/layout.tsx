'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ModalTermosVendedor from '@/components/modals/ModalTermosVendedor';

interface VendedorSession {
  id: number;
  nome: string;
  cpf: string;
  codigo?: string | null;
  email: string | null;
  perfil: string;
  primeira_senha_alterada?: boolean;
  aceite_politica_privacidade?: boolean;
}

export default function VendedorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const handleCopiarCodigo = async () => {
    if (!session?.codigo) return;
    try {
      await navigator.clipboard.writeText(session.codigo);
      // Visual feedback
      const originalText = 'Copiado!';
      const btn = document.getElementById('copy-codigo-btn');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = originalText;
        setTimeout(() => {
          if (btn) btn.textContent = original;
        }, 2000);
      }
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = session.codigo;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
  };

  const NAV_ITEMS = [
    { href: '/vendedor/dashboard', label: 'Dashboard' },
    { href: '/vendedor/leads', label: 'Leads' },
    { href: '/vendedor/vinculos', label: 'Vínculos' },
    { href: '/vendedor/dados', label: 'Dados' },
  ];

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <nav className="flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {session.nome}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <p className="text-xs text-gray-400 font-mono leading-tight">
                  {session.codigo}
                </p>
                <button
                  id="copy-codigo-btn"
                  onClick={handleCopiarCodigo}
                  title="Copiar código"
                  className="ml-1 p-1 text-xs rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  📋
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
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
  );
}
