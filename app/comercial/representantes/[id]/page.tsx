'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Users, TrendingUp, Pencil } from 'lucide-react';
import EditRepresentanteModal from './EditRepresentanteModal';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  apto: { label: 'Ativo', cls: 'bg-green-100 text-green-700' },
  ativo: { label: 'Em Cadastro', cls: 'bg-blue-100 text-blue-700' },
  apto_pendente: {
    label: 'Aguardando Aprovação',
    cls: 'bg-amber-100 text-amber-700',
  },
  apto_bloqueado: { label: 'Bloqueado', cls: 'bg-orange-100 text-orange-700' },
  suspenso: { label: 'Suspenso', cls: 'bg-red-100 text-red-700' },
  desativado: { label: 'Desativado', cls: 'bg-gray-100 text-gray-500' },
  rejeitado: { label: 'Rejeitado', cls: 'bg-red-100 text-red-700' },
};

const KPICard = ({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) => (
  <div className="bg-white rounded-3xl p-6 border shadow-sm transition-all hover:border-green-200 hover:shadow-lg hover:shadow-green-900/[0.03] flex flex-col justify-center h-40">
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
      {label}
    </span>
    <div className="flex items-baseline gap-2">
      <span
        className={`text-4xl font-black tracking-tighter ${
          highlight ? 'text-green-600' : 'text-gray-900'
        }`}
      >
        {value}
      </span>
    </div>
    {sub && (
      <p className="text-xs font-medium text-gray-400 mt-2 uppercase tracking-wide">
        {sub}
      </p>
    )}
  </div>
);

interface RepMetrica {
  id: number;
  nome: string;
  email?: string;
  codigo?: string;
  status: string;
  leads_ativos: number;
  vinculos_ativos: number;
  comissoes_pendentes: number;
  valor_pendente: number;
  leads_mes: number;
}

interface VendedorEquipe {
  vinculo_id: number;
  nome: string;
  email: string | null;
  cpf: string | null;
  codigo_vendedor: string | null;
  leads_ativos: number;
  vinculos_ativos: number;
}

export default function ComercialRepresentanteDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [rep, setRep] = useState<RepMetrica | null>(null);
  const [repFull, setRepFull] = useState<{
    id: number;
    nome: string;
    email: string;
    tipo_pessoa: 'pf' | 'pj';
    status: string;
    telefone?: string | null;
    cpf?: string | null;
    cnpj?: string | null;
    percentual_comissao?: number | null;
    banco_codigo?: string | null;
    agencia?: string | null;
    conta?: string | null;
    tipo_conta?: string | null;
    titular_conta?: string | null;
    pix_chave?: string | null;
    pix_tipo?: string | null;
  } | null>(null);
  const [vendedores, setVendedores] = useState<VendedorEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVend, setLoadingVend] = useState(false);
  const [erro, setErro] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comercial/representantes/metricas`);
      if (!res.ok) throw new Error('Falha ao carregar métricas');
      const data = (await res.json()) as { representantes?: RepMetrica[] };
      const encontrado = data.representantes?.find(
        (r) => r.id === parseInt(id, 10)
      );
      if (encontrado) {
        setRep(encontrado);
      } else {
        setErro('Representante não encontrado.');
      }
    } catch {
      setErro('Erro ao carregar dados do representante.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const carregarRepFull = useCallback(async () => {
    try {
      const res = await fetch(`/api/comercial/representantes/${id}`);
      if (res.ok) {
        const data = (await res.json()) as {
          representante?: {
            id: number;
            nome: string;
            email: string;
            tipo_pessoa: 'pf' | 'pj';
            status: string;
            telefone?: string | null;
            cpf?: string | null;
            cnpj?: string | null;
            percentual_comissao?: number | null;
            banco_codigo?: string | null;
            agencia?: string | null;
            conta?: string | null;
            tipo_conta?: string | null;
            titular_conta?: string | null;
            pix_chave?: string | null;
            pix_tipo?: string | null;
          } | null;
        };
        setRepFull(data.representante ?? null);
      }
    } catch {
      // silently ignore — representante info is supplementary
    }
  }, [id]);

  const carregarVendedores = useCallback(async () => {
    setLoadingVend(true);
    try {
      const res = await fetch(
        `/api/comercial/representantes/${id}/vendedores?limit=50`
      );
      if (res.ok) {
        const data = (await res.json()) as { vendedores?: VendedorEquipe[] };
        setVendedores(data.vendedores ?? []);
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingVend(false);
    }
  }, [id]);

  useEffect(() => {
    carregarDados();
    carregarVendedores();
    carregarRepFull();
  }, [carregarDados, carregarVendedores, carregarRepFull]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (erro || !rep) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 min-h-screen">
        <p className="mb-4">{erro || 'Representante não encontrado.'}</p>
        <button
          onClick={() => router.back()}
          className="text-green-600 hover:underline"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_LABEL[rep.status] ?? {
    label: rep.status,
    cls: 'bg-gray-100 text-gray-500',
  };
  const fmtBRL = (v: number) =>
    (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDoc = (v: string | undefined) => {
    if (!v) return null;
    const d = v.replace(/\D/g, '');
    if (d.length === 14)
      return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    if (d.length === 11)
      return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    return v;
  };
  const n = (v: number | undefined) => (v ?? 0).toLocaleString('pt-BR');

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/comercial/representantes')}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
            Voltar à Lista
          </button>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${statusInfo.cls}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {rep.nome}
              </h1>
              {rep.codigo && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[11px] font-bold rounded-full uppercase tracking-widest">
                  {rep.codigo}
                </span>
              )}
            </div>
            {repFull && (repFull.cnpj || repFull.cpf) && (
              <p className="text-gray-500 text-sm font-medium mt-1">
                {fmtDoc(repFull.cnpj || repFull.cpf)}
              </p>
            )}
            {rep.email && (
              <p className="text-gray-400 text-sm mt-1">{rep.email}</p>
            )}
          </div>
          <button
            onClick={() => setShowEdit(true)}
            disabled={!repFull}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <Pencil size={15} />
            Editar Dados
          </button>
          <div className="bg-white border rounded-2xl px-6 py-3 shadow-sm flex items-center gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Comissão Pendente
              </p>
              <p className="text-lg font-black text-amber-600 tracking-tight">
                {fmtBRL(rep.valor_pendente)}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Equipe
              </p>
              <p className="text-lg font-black text-gray-800 tracking-tight">
                {vendedores.length} Vendedor
                {vendedores.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Leads Ativos"
            value={n(rep.leads_ativos)}
            sub="Leads ativos agora"
          />
          <KPICard
            label="Vínculos"
            value={n(rep.vinculos_ativos)}
            sub="Comissão ativa"
          />
          <KPICard
            label="Pendências"
            value={n(rep.comissoes_pendentes)}
            highlight={rep.comissoes_pendentes > 0}
            sub="Comissões em aberto"
          />
          <div className="bg-green-600 rounded-2xl p-6 text-white shadow-lg shadow-green-900/10 flex flex-col justify-center h-40">
            <span className="text-[11px] uppercase font-bold tracking-widest opacity-80 mb-2">
              Este Mês
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-black">{rep.leads_mes || 0}</span>
              <span className="text-xs font-bold opacity-80 uppercase tracking-tight">
                novos leads
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-green-600" />
              <h2 className="text-base font-bold text-gray-900">
                Equipe de Vendedores
              </h2>
            </div>
            <span className="bg-gray-100 text-gray-500 text-[11px] font-bold rounded-full px-3 py-1">
              {vendedores.length}
            </span>
          </div>

          {loadingVend ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
            </div>
          ) : vendedores.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum vendedor vinculado</p>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendedores.map((v) => (
                <div
                  key={v.vinculo_id}
                  className="bg-gray-50 rounded-xl border p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                      {v.nome[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {v.nome}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {v.email ?? v.cpf ?? '—'}
                      </p>
                    </div>
                  </div>
                  {v.codigo_vendedor && (
                    <code className="block text-[10px] font-mono bg-white border px-2 py-1 rounded text-gray-600">
                      {v.codigo_vendedor}
                    </code>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={11} /> {v.leads_ativos} leads
                    </span>
                    <span>
                      {v.vinculos_ativos} vínculo
                      {v.vinculos_ativos !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEdit && repFull && (
        <EditRepresentanteModal
          representante={repFull}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false);
            carregarDados();
            carregarRepFull();
          }}
        />
      )}
    </div>
  );
}
