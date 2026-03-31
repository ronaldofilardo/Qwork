'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRepresentante } from '../rep-context';

interface Resumo {
  pendentes: string;
  liberadas: string;
  pagas: string;
  valor_pendente: string;
  valor_liberado: string;
  valor_pago_total: string;
}

interface Vinculo {
  id: number;
  entidade_nome: string;
  status: string;
  data_inicio: string;
  data_expiracao: string;
  dias_para_expirar: number;
  valor_total_pago: string;
  valor_pendente: string;
}

interface Lead {
  id: number;
  cnpj: string;
  razao_social: string | null;
  status: string;
  criado_em: string;
  data_expiracao: string;
}

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-blue-100 text-blue-700',
  apto: 'bg-green-100 text-green-700',
  apto_pendente: 'bg-yellow-100 text-yellow-700',
  suspenso: 'bg-red-100 text-red-700',
  desativado: 'bg-gray-100 text-gray-600',
};

export default function DashboardRepresentante() {
  const { session } = useRepresentante();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      // Carregar dados em paralelo
      const [comRes, vincRes, leadRes] = await Promise.all([
        fetch('/api/representante/comissoes?limit=5'),
        fetch('/api/representante/vinculos?limit=5'),
        fetch('/api/representante/leads?status=pendente&limit=5'),
      ]);

      if (comRes.ok) {
        const d = await comRes.json();
        setResumo(d.resumo);
      }
      if (vincRes.ok) {
        const d = await vincRes.json();
        setVinculos(d.vinculos ?? []);
      }
      if (leadRes.ok) {
        const d = await leadRes.json();
        setLeads(d.leads ?? []);
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

  const diasExpira =
    vinculos.length > 0
      ? Math.min(...vinculos.map((v) => v.dias_para_expirar))
      : null;

  return (
    <div className="space-y-8">
      {/* Alertas de vínculo próximo do vencimento */}
      {diasExpira !== null && diasExpira < 60 && (
        <div
          className={`rounded-lg p-4 flex items-center justify-between ${diasExpira < 30 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{diasExpira < 30 ? '🔴' : '🟡'}</span>
            <span
              className={`font-medium ${diasExpira < 30 ? 'text-red-700' : 'text-yellow-700'}`}
            >
              Um ou mais vínculos vencem em <strong>{diasExpira} dias</strong>!
            </span>
          </div>
          <Link
            href="/representante/vinculos"
            className={`text-sm font-semibold underline ${diasExpira < 30 ? 'text-red-700' : 'text-yellow-700'}`}
          >
            Renovar agora →
          </Link>
        </div>
      )}

      {/* Aviso rep não-apto — exibido enquanto não tiver status 'apto' */}
      {(session?.status === 'ativo' || session?.status === 'apto_pendente') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">📋</span>
          <div>
            <p className="text-blue-800 font-medium text-sm">
              Comissões em análise
            </p>
            <p className="text-blue-700 text-sm mt-0.5">
              Você já pode cadastrar indicações! As comissões geradas ficam
              retidas até que o time QWork aprove seu cadastro como{' '}
              <strong>Apto</strong>. Isso é feito uma única vez.
            </p>
          </div>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Leads Ativos',
            value: leads.length,
            icon: '🎯',
            color: 'blue',
          },
          {
            label: 'Vínculos Ativos',
            value: vinculos.filter((v) => v.status === 'ativo').length,
            icon: '🤝',
            color: 'green',
          },
          {
            label: 'A Receber',
            value: resumo
              ? `R$ ${parseFloat(resumo.valor_pendente || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : '—',
            icon: '💰',
            color: 'yellow',
          },
          {
            label: 'Total Recebido',
            value: resumo
              ? `R$ ${parseFloat(resumo.valor_pago_total || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : '—',
            icon: '✅',
            color: 'purple',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Navegação rápida */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            href: '/representante/leads',
            label: 'Gerenciar Leads',
            desc: 'Registre indicações e gere links de convite',
            icon: '🎯',
          },
          {
            href: '/representante/vinculos',
            label: 'Meus Vínculos',
            desc: 'Acompanhe clientes que vêm rendendo comissão',
            icon: '🤝',
          },
          {
            href: '/representante/comissoes',
            label: 'Minhas Comissões',
            desc: 'Pipeline de pagamentos e histórico',
            icon: '💸',
          },
        ].map((nav) => (
          <Link
            key={nav.href}
            href={nav.href}
            className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow group"
          >
            <div className="text-3xl mb-3">{nav.icon}</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
              {nav.label}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{nav.desc}</p>
          </Link>
        ))}
      </div>

      {/* Vínculos recentes */}
      {vinculos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Vínculos Recentes
            </h2>
            <Link
              href="/representante/vinculos"
              className="text-sm text-blue-600 hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Vence em</th>
                  <th className="px-4 py-3 text-right">A Receber</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vinculos.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {v.entidade_nome}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[v.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 ${v.dias_para_expirar < 30 ? 'text-red-600 font-semibold' : v.dias_para_expirar < 60 ? 'text-yellow-600' : 'text-gray-600'}`}
                    >
                      {v.dias_para_expirar} dias
                    </td>
                    <td className="px-4 py-3 text-right text-green-700 font-semibold">
                      R${' '}
                      {parseFloat(v.valor_pendente || '0').toLocaleString(
                        'pt-BR',
                        { minimumFractionDigits: 2 }
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Leads recentes */}
      {leads.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Leads Pendentes
            </h2>
            <Link
              href="/representante/leads"
              className="text-sm text-blue-600 hover:underline"
            >
              Gerenciar →
            </Link>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">CNPJ / Empresa</th>
                  <th className="px-4 py-3 text-left">Criado em</th>
                  <th className="px-4 py-3 text-left">Expira em</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-gray-500">
                        {l.cnpj}
                      </div>
                      {l.razao_social && (
                        <div className="font-medium text-gray-900">
                          {l.razao_social}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(l.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(l.data_expiracao).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
