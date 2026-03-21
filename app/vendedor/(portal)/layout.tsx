'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface VendedorSession {
  id: number;
  nome: string;
  cpf: string;
  email: string | null;
  perfil: string;
}

export default function VendedorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<VendedorSession | null>(null);
  const [loading, setLoading] = useState(true);

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
        setSession(d.usuario ?? data);
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const NAV_ITEMS = [
    { href: '/vendedor/dashboard', label: 'Dashboard' },
    { href: '/vendedor/leads', label: 'Leads' },
    { href: '/vendedor/vinculos', label: 'Vínculos' },
    { href: '/vendedor/comissoes', label: 'Comissões' },
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
              <p className="text-xs text-gray-400 leading-tight">Vendedor</p>
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

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
