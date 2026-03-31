'use client';

import { useEffect, useState, useCallback } from 'react';

interface Vinculo {
  id: number;
  entidade_nome: string;
  entidade_cnpj: string;
  status: string;
  data_inicio: string;
  data_expiracao: string;
  dias_para_expirar: number;
  ultimo_laudo_em: string | null;
  lead_valor_negociado: number | null;
  lead_contato_nome: string | null;
  lead_contato_email: string | null;
  lead_criado_em: string | null;
  lead_data_conversao: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-yellow-100 text-yellow-700',
  suspenso: 'bg-red-100 text-red-700',
  encerrado: 'bg-gray-100 text-gray-500',
};

export default function VinculosVendedor() {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, _setErro] = useState('');
  const [sucesso, _setSucesso] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFiltro) params.set('status', statusFiltro);
      // Redireciona para a nova API de vínculos do vendedor (a ser criada ou adaptada)
      const res = await fetch(`/api/vendedor/vinculos?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setVinculos(data.vinculos ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFiltro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const fmt = (v: string | number) =>
    `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Meus Vínculos de Clientes
        </h1>
        <span className="text-sm text-gray-500">
          {total} {total === 1 ? 'vínculo' : 'vínculos'}
        </span>
      </div>
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          {sucesso}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {['', 'ativo', 'inativo', 'suspenso', 'encerrado'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFiltro(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${statusFiltro === s ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
          >
            {s === '' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
        </div>
      ) : vinculos.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">🤝</div>
          <p className="text-lg font-medium">Nenhum vínculo encontrado</p>
          <p className="text-sm mt-1">
            Vínculos são criados automaticamente quando seus leads são
            convertidos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {vinculos.map((v) => {
            const diasExp = Number(v.dias_para_expirar);
            const corExpiracao =
              diasExp < 0
                ? 'text-gray-400'
                : diasExp < 30
                  ? 'text-red-600 font-semibold'
                  : diasExp < 60
                    ? 'text-yellow-600'
                    : 'text-gray-600';

            return (
              <div
                key={v.id}
                className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {v.entidade_nome}
                      </span>
                      <span className="font-mono text-xs text-gray-400">
                        {v.entidade_cnpj}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[v.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {v.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                      <span>
                        Início:{' '}
                        {new Date(v.data_inicio).toLocaleDateString('pt-BR')}
                      </span>
                      <span className={corExpiracao}>
                        {diasExp < 0
                          ? `Expirado há ${Math.abs(diasExp)} dias`
                          : `Expira em ${diasExp} dias (${new Date(v.data_expiracao).toLocaleDateString('pt-BR')})`}
                      </span>
                    </div>

                    {(v.lead_contato_nome ||
                      v.lead_contato_email ||
                      v.lead_valor_negociado) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 flex-wrap text-xs text-gray-500">
                        {v.lead_contato_nome && (
                          <span>👤 {v.lead_contato_nome}</span>
                        )}
                        {v.lead_valor_negociado && (
                          <span className="font-medium text-gray-600">
                            💰 {fmt(v.lead_valor_negociado)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
