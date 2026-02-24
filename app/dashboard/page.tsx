'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Avaliacao {
  id: number;
  lote_id?: number;
  status: string;
  inicio: string;
  fim?: string;
  total_respostas?: number;
}

interface AvaliacaoAPI {
  id: number;
  lote_id?: number;
  status: string;
  inicio: string;
  envio: string | null;
  grupo_atual: number | null;
  criado_em: string;
  total_respostas: number;
}

export default function Dashboard() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/auth/session');
      if (!res.ok) {
        window.location.href = '/login';
        return;
      }
      const user = await res.json();
      setNome(user.nome || 'Funcionário');

      const avalRes = await fetch('/api/avaliacao/todas');
      const data = await avalRes.json();

      // Processa todas as avaliações
      const todas: Avaliacao[] = data.avaliacoes.map((a: AvaliacaoAPI) => ({
        id: a.id,
        lote_id: a.lote_id,
        // Mantém o status original para distinguir entre 'iniciada' e 'em_andamento'
        status: a.status,
        total_respostas: a.total_respostas || 0,
        inicio: a.criado_em
          ? new Date(a.criado_em).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'data não registrada',
        fim: a.envio
          ? new Date(a.envio).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : null,
      }));

      console.log('[Dashboard] Avaliações carregadas:', {
        total: todas.length,
        concluidas: todas.filter(
          (a) => a.status === 'concluida' || a.status === 'concluido'
        ).length,
        disponiveis: todas.filter(
          (a) => a.status === 'iniciada' || a.status === 'em_andamento'
        ).length,
        comRespostas: todas.filter((a) => (a.total_respostas || 0) > 0).length,
      });

      setAvaliacoes(todas);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-primary mx-auto mb-3"></div>
        <p className="text-sm text-gray-600">Carregando...</p>
      </div>
    </div>
  );

  // Filtra avaliações disponíveis (não concluídas e não inativadas)
  const avaliacoesDisponiveis = avaliacoes.filter(
    (a) => a.status === 'iniciada' || a.status === 'em_andamento'
  );

  console.log('[Dashboard] Avaliações disponíveis para iniciar:', {
    total: avaliacoesDisponiveis.length,
    ids: avaliacoesDisponiveis.map((a) => `#${a.id} (${a.status})`),
  });

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-6 sm:py-8" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6 sm:mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold mb-1 leading-tight">Bem-vindo, {nome}!</h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Sistema de avaliação psicossocial Qwork (COPSOQ III).
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>A avaliação leva cerca de 15–20 minutos.
            </p>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition-colors touch-target"
          >
            Sair
          </button>
        </div>

        {avaliacoesDisponiveis.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-6 sm:mb-8 border-4 border-blue-400">
            <h2 className="text-lg sm:text-2xl font-bold text-blue-600 mb-4 sm:mb-6">
              Avaliações Disponíveis
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {avaliacoesDisponiveis.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-bold text-sm sm:text-base">Avaliação #{a.id}</p>
                    {a.lote_id && (
                      <p className="text-xs text-gray-500">Lote #{a.lote_id}</p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-600">
                      Liberada em {a.inicio}
                    </p>
                  </div>
                  <Link
                    href={`/avaliacao?id=${a.id}`}
                    className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 sm:px-6 rounded-lg font-semibold text-sm sm:text-base touch-target transition-colors"
                  >
                    {(a.total_respostas || 0) > 0 ? 'Continuar' : 'Iniciar'}{' '}
                    Avaliação
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg sm:text-2xl font-bold mt-8 sm:mt-12 mb-4 sm:mb-6">Histórico</h2>
        {avaliacoes.filter(
          (a) => a.status === 'concluida' || a.status === 'concluido'
        ).length === 0 ? (
          <p className="text-gray-500">Nenhuma avaliação concluída.</p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {avaliacoes
              .filter(
                (a) => a.status === 'concluida' || a.status === 'concluido'
              )
              .map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-xl shadow p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                >
                  <div>
                    <p className="font-bold text-sm sm:text-base text-green-600">
                      ✓ Avaliação #{a.id} Concluída
                    </p>
                    {a.lote_id && (
                      <p className="text-xs text-gray-500">Lote #{a.lote_id}</p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-600">
                      Finalizada em {a.fim || 'processando...'}
                    </p>
                  </div>
                  <Link
                    href={`/avaliacao/concluida?avaliacao_id=${a.id}`}
                    className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-4 py-3 sm:px-6 rounded-lg font-semibold text-sm sm:text-base touch-target transition-colors"
                  >
                    Ver Comprovante
                  </Link>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
