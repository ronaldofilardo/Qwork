'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Users2, TrendingUp, Target, Link2 } from 'lucide-react';
import { useRepresentante } from '../rep-context';

interface Resumo {
  total_vendedores: number;
  leads_ativos: number;
  leads_mes: number;
  vinculos_ativos: number;
}

interface Vendedor {
  vinculo_id: number;
  vendedor_id: number;
  vendedor_nome: string;
  vendedor_email: string;
  leads_ativos: number;
  vinculado_em: string;
}

export default function DashboardRepresentante() {
  const { session } = useRepresentante();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [resumoRes, vendedoresRes] = await Promise.all([
        fetch('/api/representante/equipe/resumo'),
        fetch('/api/representante/equipe/vendedores?page=1'),
      ]);
      if (resumoRes.ok) setResumo(await resumoRes.json());
      if (vendedoresRes.ok) {
        const d = await vendedoresRes.json();
        setVendedores(d.vendedores ?? []);
      }
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
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Boas-vindas */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Olá, {session?.nome?.split(' ')[0]}!
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Aqui está um resumo da sua equipe de vendedores.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Users2 size={20} className="text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Vendedores na Equipe
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {resumo?.total_vendedores ?? 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Ativos e vinculados</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-50">
              <Target size={20} className="text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Leads Ativos
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {resumo?.leads_ativos ?? 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Em aberto pela equipe</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Link2 size={20} className="text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Vínculos Ativos
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {resumo?.vinculos_ativos ?? 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Contratos vig entes</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Leads Este Mês
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {resumo?.leads_mes ?? 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Cadastrados no mês atual</p>
        </div>
      </div>

      {/* Ação rápida */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Ações Rápidas
        </h3>
        <Link
          href="/representante/equipe"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Users2 size={16} />
          Gerenciar Equipe
        </Link>
      </div>

      {/* Preview dos vendedores */}
      {vendedores.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Equipe</h2>
            <Link
              href="/representante/equipe"
              className="text-sm text-blue-600 hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Vendedor</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-right">Leads Ativos</th>
                  <th className="px-4 py-3 text-right">Vinculado em</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vendedores.map((v) => (
                  <tr key={v.vinculo_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {v.vendedor_nome}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {v.vendedor_email ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">
                      {v.leads_ativos}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      {new Date(v.vinculado_em).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="bg-gray-50 border border-dashed rounded-xl p-8 text-center">
          <Users2 size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            Nenhum vendedor na equipe ainda.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Acesse{' '}
            <Link
              href="/representante/equipe"
              className="text-blue-600 hover:underline"
            >
              Minha Equipe
            </Link>{' '}
            para adicionar vendedores.
          </p>
        </div>
      )}
    </div>
  );
}
