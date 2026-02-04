'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Send, RefreshCw } from 'lucide-react';
interface NotificacaoClinica {
  id: string;
  tipo: 'lote_concluido' | 'laudo_enviado';
  lote_id: number;
  // codigo: removido
  titulo: string;
  empresa_nome: string;
  data_evento: string;
  mensagem: string;
}

interface NotificationsSectionProps {
  onNavigateToLote?: (loteId: number) => void;
  refreshTrigger?: number;
  onFetched?: (totalNaoLidas: number) => void;
}

export default function NotificationsSection({
  onNavigateToLote,
  refreshTrigger,
  onFetched,
}: NotificationsSectionProps) {
  const [notificacoes, setNotificacoes] = useState<NotificacaoClinica[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchNotificacoes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rh/notificacoes');
      if (!response.ok) {
        console.error(
          'Erro ao buscar notificações: resposta não OK',
          response.status
        );
        if (response.status === 403) {
          setAccessDenied(true);
        } else {
          setAccessDenied(false);
        }
        setNotificacoes([]);
        setTotalNaoLidas(0);
        return;
      }
      const data = await response.json();

      if (!data?.success) {
        console.error('API de notificações retornou erro', data?.error);
        setNotificacoes([]);
        setTotalNaoLidas(0);
        return;
      }

      // Mostrar até 5 notificações retornadas pela API (últimos 7 dias)
      const items = (data.notificacoes || []).slice(0, 5);
      setNotificacoes(items);
      const total = data.totalNaoLidas || 0;
      setTotalNaoLidas(total);
      if (onFetched) {
        try {
          onFetched(total);
        } catch {
          // ignore
        }
      }
    } catch (error: unknown) {
      console.error('Erro ao buscar notificações:', error);
      setNotificacoes([]);
      setTotalNaoLidas(0);
      if (onFetched) {
        try {
          onFetched(0);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [onFetched]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  // When parent signals a refresh (e.g., menu clicked), refetch
  useEffect(() => {
    if (typeof refreshTrigger !== 'undefined') {
      fetchNotificacoes();
    }
  }, [refreshTrigger, fetchNotificacoes]);

  const handleNotificacaoClick = (loteId: number) => {
    if (onNavigateToLote) {
      onNavigateToLote(loteId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getIconForTipo = (tipo: string) => {
    switch (tipo) {
      case 'lote_concluido':
        return <Package size={18} />;
      case 'laudo_enviado':
        return <Send size={18} />;
      default:
        return <Package size={18} />;
    }
  };

  const getColorForTipo = (tipo: string) => {
    switch (tipo) {
      case 'lote_concluido':
        return 'bg-blue-500 text-white';
      case 'laudo_enviado':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (accessDenied) {
    return (
      <div className="mb-6 text-center py-12">
        <div className="text-4xl mb-2">⛔</div>
        <h4 className="text-lg font-semibold text-gray-600 mb-1">
          Acesso negado
        </h4>
        <p className="text-sm text-gray-500">
          Sua sessão pode ter expirado. Faça login novamente e tente novamente.
        </p>
      </div>
    );
  }

  if (notificacoes.length === 0) {
    return (
      <div className="mb-6 text-center py-12">
        <div className="text-4xl mb-2">🔔</div>
        <h4 className="text-lg font-semibold text-gray-600 mb-1">
          Nenhuma notificação
        </h4>
        <p className="text-sm text-gray-500">
          Verificamos as últimas notificações da sua clínica (últimos 7 dias) e
          não encontramos itens novos.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-gray-800">
            🔔 Notificações da Clínica
          </h3>
          {totalNaoLidas > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalNaoLidas}
            </span>
          )}
        </div>
        <button
          onClick={fetchNotificacoes}
          disabled={loading}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 disabled:opacity-50"
          title="Atualizar notificações"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lote ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notificacoes.map((notif) => (
                <tr
                  key={notif.id}
                  onClick={() => handleNotificacaoClick(notif.lote_id)}
                  className="hover:bg-blue-50 cursor-pointer transition-all duration-200"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 p-1.5 rounded-md ${getColorForTipo(
                          notif.tipo
                        )}`}
                      >
                        {getIconForTipo(notif.tipo)}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {notif.tipo === 'lote_concluido'
                          ? 'Lote Enviado'
                          : 'Laudo Recebido'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {notif.lote_id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div
                      className="text-sm text-gray-900 max-w-xs truncate"
                      title={notif.titulo}
                    >
                      {notif.titulo}
                    </div>
                  </td>
                  <td
                    className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate"
                    title={notif.empresa_nome}
                  >
                    {notif.empresa_nome}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(notif.data_evento)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
