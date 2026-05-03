'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Link2,
  DollarSign,
  ChevronRight,
  Percent,
} from 'lucide-react';

interface ResumoMinhasVendas {
  total_leads: number;
  leads_ativos: number;
  vinculos_ativos: number;
  valor_pendente: string;
  valor_pago_total: string;
  modelo_comissionamento?: 'percentual' | 'custo_fixo' | null;
  percentual_comissao?: number | null;
}

function fmt(v: string | number) {
  return parseFloat(String(v) || '0').toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function MinhasVendasPage() {
  const [resumo, setResumo] = useState<ResumoMinhasVendas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const opts: RequestInit = {
          credentials: 'same-origin',
          cache: 'no-store',
        };
        const [leadsRes, vinculosRes, comissoesRes, meRes] = await Promise.all([
          fetch('/api/representante/minhas-vendas/leads?page=1', opts),
          fetch('/api/representante/minhas-vendas/vinculos?page=1', opts),
          fetch('/api/representante/minhas-vendas/comissoes?page=1', opts),
          fetch('/api/representante/me', opts),
        ]);

        const [leadsData, vinculosData, comissoesData, meData] =
          await Promise.all([
            leadsRes.ok
              ? (leadsRes.json() as Promise<{
                  total: number;
                  contagens: Record<string, number>;
                }>)
              : Promise.resolve({
                  total: 0,
                  contagens: {} as Record<string, number>,
                }),
            vinculosRes.ok
              ? (vinculosRes.json() as Promise<{ total: number }>)
              : Promise.resolve({ total: 0 }),
            comissoesRes.ok
              ? (comissoesRes.json() as Promise<{
                  resumo: { valor_pendente: string; valor_pago_total: string };
                }>)
              : Promise.resolve({
                  resumo: { valor_pendente: '0', valor_pago_total: '0' },
                }),
            meRes.ok
              ? (meRes.json() as Promise<{
                  representante?: {
                    modelo_comissionamento?: 'percentual' | 'custo_fixo' | null;
                    percentual_comissao?: number | null;
                  };
                }>)
              : Promise.resolve({
                  representante: {
                    modelo_comissionamento: null,
                    percentual_comissao: null,
                  },
                }),
          ]);

        setResumo({
          total_leads: leadsData.total,
          leads_ativos: leadsData.contagens?.pendente ?? 0,
          vinculos_ativos: vinculosData.total,
          valor_pendente: comissoesData.resumo?.valor_pendente ?? '0',
          valor_pago_total: comissoesData.resumo?.valor_pago_total ?? '0',
          modelo_comissionamento:
            meData.representante?.modelo_comissionamento ?? null,
          percentual_comissao:
            meData.representante?.percentual_comissao ?? null,
        });
      } finally {
        setLoading(false);
      }
    };
    void carregar();
  }, []);

  const atalhos = [
    {
      href: '/representante/minhas-vendas/leads',
      icon: TrendingUp,
      titulo: 'Meus Leads',
      descricao: 'Leads criados diretamente por você',
      cor: 'text-green-700',
      bg: 'bg-green-50',
      borderCor: 'border-green-200',
      valor: resumo ? String(resumo.total_leads) : '—',
      unidade: 'leads',
    },
    {
      href: '/representante/minhas-vendas/vinculos',
      icon: Link2,
      titulo: 'Vínculos',
      descricao: 'Clientes convertidos dos seus leads diretos',
      cor: 'text-blue-700',
      bg: 'bg-blue-50',
      borderCor: 'border-blue-200',
      valor: resumo ? String(resumo.vinculos_ativos) : '—',
      unidade: 'vínculos ativos',
    },
    {
      href: '/representante/minhas-vendas/comissoes',
      icon: DollarSign,
      titulo: 'Comissões',
      descricao: 'Pagamentos das suas vendas diretas',
      cor: 'text-purple-700',
      bg: 'bg-purple-50',
      borderCor: 'border-purple-200',
      valor: resumo ? fmt(resumo.valor_pendente) : '—',
      unidade: 'a receber',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Minhas Vendas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Leads e comissões criados diretamente por você, sem intermediação de
          vendedores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {atalhos.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`${a.bg} ${a.borderCor} rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-all group flex flex-col gap-3`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`w-10 h-10 rounded-xl ${a.bg} border ${a.borderCor} flex items-center justify-center`}
              >
                <a.icon size={20} className={a.cor} />
              </div>
              <ChevronRight
                size={16}
                className="text-gray-400 group-hover:text-gray-600 transition-colors mt-1"
              />
            </div>
            <div>
              <p className={`text-2xl font-bold ${a.cor}`}>{a.valor}</p>
              <p className="text-xs text-gray-500 mt-0.5">{a.unidade}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{a.titulo}</p>
              <p className="text-xs text-gray-500 mt-0.5">{a.descricao}</p>
            </div>
          </Link>
        ))}
      </div>

      {resumo && (
        <div className="space-y-4">
          {/* Modelo de Comissionamento */}
          {resumo.modelo_comissionamento && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Percent size={16} className="text-blue-600" />
                Tipo de Comissionamento
              </h2>
              <div className="flex items-center gap-3">
                {resumo.modelo_comissionamento === 'percentual' ? (
                  <>
                    <p className="text-sm font-semibold text-blue-700">
                      Percentual
                    </p>
                    {resumo.percentual_comissao != null && (
                      <p className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-lg">
                        {typeof resumo.percentual_comissao === 'number'
                          ? resumo.percentual_comissao.toFixed(2)
                          : parseFloat(
                              String(resumo.percentual_comissao)
                            ).toFixed(2)}
                        %
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-semibold text-green-700">
                    Custo Fixo
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Resumo Financeiro */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Resumo Financeiro
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                  Total Recebido
                </p>
                <p className="text-xl font-bold text-green-700">
                  {fmt(resumo.valor_pago_total)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                  A Receber
                </p>
                <p className="text-xl font-bold text-blue-700">
                  {fmt(resumo.valor_pendente)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
