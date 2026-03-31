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
  total_comissoes: string;
  valor_total_pago: string;
  valor_pendente: string;
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

export default function VinculosRepresentante() {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [renovando, setRenovando] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFiltro) params.set('status', statusFiltro);
      const res = await fetch(`/api/representante/vinculos?${params}`);
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

  const renovar = async (vinculoId: number) => {
    setRenovando(vinculoId);
    setErro('');
    try {
      const res = await fetch(
        `/api/representante/vinculos/${vinculoId}/renovar`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao renovar');
        return;
      }
      setSucesso(data.mensagem ?? 'Vínculo renovado com sucesso!');
      setTimeout(() => setSucesso(''), 4000);
      await carregar();
    } finally {
      setRenovando(null);
    }
  };

  const fmt = (v: string | number) =>
    `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Meus Vínculos</h1>
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

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        {['', 'ativo', 'inativo', 'suspenso', 'encerrado'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFiltro(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${statusFiltro === s ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
          >
            {s === '' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : vinculos.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">🤝</div>
          <p className="text-lg font-medium">Nenhum vínculo encontrado</p>
          <p className="text-sm mt-1">
            Vínculos são criados automaticamente quando um lead é convertido
            (cliente indicado se cadastra).
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
                      {v.ultimo_laudo_em && (
                        <span>
                          Último laudo:{' '}
                          {new Date(v.ultimo_laudo_em).toLocaleDateString(
                            'pt-BR'
                          )}
                        </span>
                      )}
                    </div>

                    {/* Dados do lead de origem */}
                    {(v.lead_contato_nome ||
                      v.lead_contato_email ||
                      v.lead_valor_negociado ||
                      v.lead_criado_em) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 flex-wrap text-xs text-gray-500">
                        {v.lead_contato_nome && (
                          <span>
                            👤 {v.lead_contato_nome}
                            {v.lead_contato_email
                              ? ` · ${v.lead_contato_email}`
                              : ''}
                          </span>
                        )}
                        {v.lead_valor_negociado &&
                          Number(v.lead_valor_negociado) > 0 && (
                            <span className="text-emerald-600 font-medium">
                              💰 {fmt(v.lead_valor_negociado)}
                            </span>
                          )}
                        {v.lead_criado_em && (
                          <span>
                            📅 Lead criado:{' '}
                            {new Date(v.lead_criado_em).toLocaleDateString(
                              'pt-BR'
                            )}
                          </span>
                        )}
                        {v.lead_data_conversao && (
                          <span className="text-green-600">
                            ✅ Convertido:{' '}
                            {new Date(v.lead_data_conversao).toLocaleDateString(
                              'pt-BR'
                            )}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-6 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500">Comissões: </span>
                        <span className="font-medium text-gray-700">
                          {v.total_comissoes}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Pendente: </span>
                        <span className="font-medium text-yellow-700">
                          {fmt(v.valor_pendente)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Pago: </span>
                        <span className="font-medium text-green-700">
                          {fmt(v.valor_total_pago)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {['ativo', 'inativo'].includes(v.status) &&
                      diasExp <= 60 && (
                        <button
                          onClick={() => renovar(v.id)}
                          disabled={renovando === v.id}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {renovando === v.id
                            ? 'Renovando...'
                            : '🔄 Renovar (+1 ano)'}
                        </button>
                      )}
                    {diasExp < 30 && diasExp >= 0 && v.status === 'ativo' && (
                      <span className="text-xs text-red-600 font-medium">
                        ⚠ Vencimento próximo!
                      </span>
                    )}
                    {v.status === 'encerrado' && (
                      <span className="text-xs text-gray-400 italic">
                        Vínculo encerrado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Pág. {page} de {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
