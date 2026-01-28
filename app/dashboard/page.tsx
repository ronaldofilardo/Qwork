'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Avaliacao {
  id: number;
  status: string;
  inicio: string;
  fim?: string;
}

interface AvaliacaoAPI {
  id: number;
  status: string;
  inicio: string;
  envio: string | null;
  grupo_atual: number | null;
  criado_em: string;
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
        // Mantém o status original para distinguir entre 'iniciada' e 'em_andamento'
        status: a.status,
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

      setAvaliacoes(todas);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

  const avaliacoesDisponiveis = avaliacoes.filter(
    (a) => a.status !== 'concluida'
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bem-vindo, {nome}!</h1>
            <p className="text-gray-600">
              Sistema de avaliação psicossocial Qwork (COPSOQ III).
              <br />A avaliação leva cerca de 15-20 minutos.
            </p>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Sair
          </button>
        </div>

        {avaliacoesDisponiveis.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-blue-400">
            <h2 className="text-2xl font-bold text-blue-600 mb-6">
              Avaliações Disponíveis
            </h2>
            <div className="space-y-4">
              {avaliacoesDisponiveis.map((a) => (
                <div
                  key={a.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-bold">Avaliação #{a.id}</p>
                    <p className="text-sm text-gray-600">
                      Liberada em {a.inicio}
                    </p>
                  </div>
                  <Link
                    href={`/avaliacao?id=${a.id}`}
                    className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    {a.status === 'em_andamento' ? 'Continuar' : 'Iniciar'}{' '}
                    Avaliação
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold mt-12 mb-6">Histórico</h2>
        {avaliacoes.filter((a) => a.status === 'concluida').length === 0 ? (
          <p className="text-gray-500">Nenhuma avaliação concluída.</p>
        ) : (
          <div className="space-y-4">
            {avaliacoes
              .filter((a) => a.status === 'concluida')
              .map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-xl shadow p-6 flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold">Avaliação #{a.id}</p>
                    <p className="text-sm text-gray-600">
                      Concluída em {a.fim || 'data não registrada'}
                    </p>
                  </div>
                  <Link
                    href={`/avaliacao/concluida?avaliacao_id=${a.id}`}
                    className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Ver comprovante
                  </Link>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
