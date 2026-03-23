'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  ChevronRight,
  DollarSign,
  Activity,
  Search,
  UserX,
  UserPlus,
} from 'lucide-react';
import CadastrarRepresentanteModal from './CadastrarRepresentanteModal';

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

type Aba = 'ativos' | 'inativos';

export default function ComercialRepresentantesPage() {
  const router = useRouter();
  const [ativos, setAtivos] = useState<RepMetrica[]>([]);
  const [inativos, setInativos] = useState<RepMetrica[]>([]);
  const [aba, setAba] = useState<Aba>('ativos');
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [showCadastrar, setShowCadastrar] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [resAtivos, resInativos] = await Promise.all([
        fetch('/api/comercial/representantes/metricas'),
        fetch('/api/comercial/representantes/metricas?status=desativado'),
      ]);
      if (resAtivos.ok) {
        const d = await resAtivos.json();
        setAtivos(d.representantes ?? []);
      }
      if (resInativos.ok) {
        const d = await resInativos.json();
        setInativos(d.representantes ?? []);
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

  const lista = aba === 'ativos' ? ativos : inativos;

  const filtrados = lista.filter((r) => {
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
      {showCadastrar && (
        <CadastrarRepresentanteModal
          onClose={() => setShowCadastrar(false)}
          onSuccess={() => {
            setShowCadastrar(false);
            void carregar();
          }}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Representantes</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {lista.length} representante{lista.length !== 1 ? 's' : ''}{' '}
            {aba === 'ativos' ? 'na rede' : 'inativos'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCadastrar(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors cursor-pointer"
          >
            <UserPlus size={15} />
            Cadastrar Representante
          </button>
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
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => {
            setAba('ativos');
            setBusca('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            aba === 'ativos'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={14} />
          Ativos
          {ativos.length > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                aba === 'ativos'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {ativos.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setAba('inativos');
            setBusca('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            aba === 'inativos'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserX size={14} />
          Inativos
          {inativos.length > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                aba === 'inativos'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {inativos.length}
            </span>
          )}
        </button>
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
              : aba === 'inativos'
                ? 'Nenhum representante inativo.'
                : 'Nenhum representante encontrado.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtrados.map((r) => (
            <div
              key={r.id}
              onClick={() => router.push(`/comercial/representantes/${r.id}`)}
              className={`group bg-white rounded-2xl border p-5 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full active:scale-[0.98] ${
                aba === 'inativos'
                  ? 'border-gray-100 opacity-75 hover:opacity-100 hover:border-red-200 hover:shadow-xl hover:shadow-red-900/[0.03]'
                  : 'border-gray-100 hover:border-green-200 hover:shadow-xl hover:shadow-green-900/[0.03]'
              }`}
            >
              {aba === 'inativos' && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gray-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
                    <UserX size={10} />
                    Inativo
                  </div>
                </div>
              )}
              {aba === 'ativos' && r.status === 'apto_pendente' && (
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
                        r.status === 'desativado'
                          ? 'bg-red-400'
                          : r.status === 'ativo'
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
                <div
                  className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-colors ${
                    aba === 'inativos'
                      ? 'group-hover:bg-red-50'
                      : 'group-hover:bg-green-50'
                  }`}
                >
                  <ChevronRight
                    size={18}
                    className={`text-gray-300 transition-colors ${
                      aba === 'inativos'
                        ? 'group-hover:text-red-400'
                        : 'group-hover:text-green-600'
                    }`}
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
