'use client';

import { useEffect, useCallback } from 'react';
import { usePlanosStore } from '@/lib/stores/planosStore';

export default function NotificacoesFinanceiras() {
  const { notificacoes, setNotificacoes, marcarComoLida, loading, setLoading } =
    usePlanosStore();

  const loadNotificacoes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/financeiro/notificacoes');
      if (!response.ok) throw new Error('Erro ao carregar notificações');
      const data = await response.json();
      setNotificacoes(data.notificacoes);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
    }
  }, [setNotificacoes, setLoading]);

  useEffect(() => {
    loadNotificacoes();
  }, [loadNotificacoes]);

  const handleMarcarLida = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/financeiro/notificacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lida: true }),
      });

      if (!response.ok) throw new Error('Erro ao marcar como lida');
      marcarComoLida(id);
    } catch (err) {
      console.error('Erro ao marcar notificação:', err);
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'critica':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'alta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'baixa':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'limite_excedido':
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.924-1.333-2.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case 'renovacao_proxima':
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case 'pagamento_vencido':
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando notificações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Notificações Financeiras
        </h2>
        <div className="text-sm text-gray-500">
          {notificacoes.filter((n) => !n.lida).length} não lidas
        </div>
      </div>

      <div className="space-y-4">
        {notificacoes.map((notificacao) => (
          <div
            key={notificacao.id}
            className={`rounded-lg border p-4 ${
              notificacao.lida ? 'bg-gray-50 opacity-75' : 'bg-white'
            } ${getPrioridadeColor(notificacao.prioridade)}`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 ${notificacao.lida ? 'opacity-50' : ''}`}
              >
                {getTipoIcon(notificacao.tipo)}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {notificacao.titulo}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {notificacao.mensagem}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notificacao.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {!notificacao.lida && (
                    <button
                      onClick={() => handleMarcarLida(notificacao.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Marcar como lida
                    </button>
                  )}
                </div>

                <div className="mt-2 flex gap-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-white bg-opacity-50">
                    {notificacao.tipo.replace('_', ' ')}
                  </span>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-white bg-opacity-50">
                    {notificacao.prioridade}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {notificacoes.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="mt-4 text-gray-500">Nenhuma notificação</p>
          </div>
        )}
      </div>
    </div>
  );
}
