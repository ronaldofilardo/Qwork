'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { UserCheck, Target, Copy, Check } from 'lucide-react';
import { useVendedor } from '../vendedor-context';

interface Resumo {
  representantes_ativos: number;
  emissoes_mes: number;
  representante: { id: number; nome: string } | null;
}

export default function VendedorDashboard() {
  const { session } = useVendedor();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const handleCopiarCodigo = async (): Promise<void> => {
    const codigo = session?.codigo ?? '';
    try {
      await navigator.clipboard.writeText(codigo);
    } catch {
      const el = document.createElement('textarea');
      el.value = codigo;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/vendedor/dashboard/resumo');
      if (res.ok) setResumo(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Resumo da sua performance
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <UserCheck size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-500">
              Seu código no sistema
            </p>
            <p className="font-mono font-bold text-green-700 text-lg leading-tight">
              {session?.codigo ?? '—'}
            </p>
          </div>
        </div>
        <button
          onClick={handleCopiarCodigo}
          aria-label="Copiar código"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-green-600 hover:bg-green-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          {copiado ? (
            <>
              <Check size={15} />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy size={15} />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <UserCheck size={18} className="text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">
              Meu Representante
            </span>
          </div>
          <p
            className="text-base font-bold text-gray-900 leading-tight truncate"
            title={resumo?.representante?.nome ?? ''}
          >
            {resumo?.representante?.nome ?? (
              <span className="text-gray-400 font-normal text-sm">
                Não vinculado
              </span>
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Target size={18} className="text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">
              Emissões no Mês
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {resumo?.emissoes_mes ?? 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            href: '/vendedor/dados',
            label: 'Meus Dados',
            desc: 'Atualize seus dados pessoais',
            icon: '👤',
          },
        ].map((nav) => (
          <Link
            key={nav.href}
            href={nav.href}
            className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow group"
          >
            <div className="text-3xl mb-3">{nav.icon}</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-green-600">
              {nav.label}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{nav.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
