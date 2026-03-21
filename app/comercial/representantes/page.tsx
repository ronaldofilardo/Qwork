'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  ChevronRight,
  DollarSign,
  Activity,
  Search,
} from 'lucide-react';

interface RepMetrica {
  id: number;
  nome: string;
  email: string;
  status: string;
  codigo: string;
  leads_ativos: number;
  leads_mes: number;
  vinculos_ativos: number;
  comissoes_pendentes: number;
  valor_pendente: number;
}

export default function ComercialRepresentantesPage() {
  const router = useRouter();
  const [reps, setReps] = useState<RepMetrica[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/comercial/representantes/metricas');
      if (res.ok) {
        const d = await res.json();
        setReps(d.representantes ?? []);
      }
    } catch (e) {
      console.error('Erro ao buscar representantes:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const fmtBRL = (v: number) =>
    (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filtrados = reps.filter((r) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      r.nome.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.codigo ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Representantes</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {reps.length} representante{reps.length !== 1 ? 's' : ''} na rede
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Buscar por nome, email ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse"
            />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <Users size={32} className="text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">
            {busca
              ? 'Nenhum resultado para a busca.'
              : 'Nenhum representante encontrado.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtrados.map((r) => (
            <div
              key={r.id}
              onClick={() => router.push(`/comercial/representantes/${r.id}`)}
              className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-xl hover:shadow-green-900/[0.03] transition-all cursor-pointer relative overflow-hidden flex flex-col h-full active:scale-[0.98]"
            >
              {r.status === 'apto_pendente' && (
                <div className="absolute top-0 right-0">
                  <div className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm animate-pulse flex items-center gap-1.5 uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    Aguardando Aprovação
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-5">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors truncate text-base">
                      {r.nome}
                    </h4>
                    <span
                      className={`flex-shrink-0 w-2 h-2 rounded-full ${
                        r.status === 'ativo'
                          ? 'bg-green-500'
                          : r.status === 'apto_pendente'
                            ? 'bg-amber-500'
                            : 'bg-gray-300'
                      }`}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                    {r.codigo || 'S/ COD'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50/50 rounded-xl p-3 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-colors">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider text-center">
                    Leads Ativos
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <Activity size={12} className="text-purple-400" />
                    <p className="text-lg font-black text-gray-800">
                      {r.leads_ativos}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-3 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-colors">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider text-center">
                    Vínculos
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <Users size={12} className="text-blue-400" />
                    <p className="text-lg font-black text-gray-800">
                      {r.vinculos_ativos}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                    Comissão Pendente
                  </p>
                  <div className="flex items-center gap-1">
                    <DollarSign
                      size={12}
                      className={
                        r.valor_pendente > 0
                          ? 'text-amber-500'
                          : 'text-gray-200'
                      }
                    />
                    <p
                      className={`font-black text-sm ${
                        r.valor_pendente > 0
                          ? 'text-amber-600'
                          : 'text-gray-300'
                      }`}
                    >
                      {r.valor_pendente > 0 ? fmtBRL(r.valor_pendente) : '—'}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-green-50 transition-colors">
                  <ChevronRight
                    size={18}
                    className="text-gray-300 group-hover:text-green-600 transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
