'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { UserCheck, TrendingUp, DollarSign, Target } from 'lucide-react';

interface Resumo {
  representantes_ativos: number;
  emissoes_mes: number;
  comissoes_pendentes: number;
  comissoes_pagas_valor: number;
  representante: { id: number; nome: string } | null;
}

export default function VendedorDashboard() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);

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

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <TrendingUp size={18} className="text-amber-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">
              Comissões Pendentes
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {resumo?.comissoes_pendentes ?? 0}
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-green-50">
              <DollarSign size={18} className="text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">
              Total Recebido
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {fmtBRL(resumo?.comissoes_pagas_valor ?? 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            href: '/vendedor/comissoes',
            label: 'Comissões',
            desc: 'Pipeline de pagamentos e histórico',
            icon: '💸',
          },
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
