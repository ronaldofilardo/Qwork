'use client';

import { useState, useEffect } from 'react';
import { Bell, X, FileText, Clock } from 'lucide-react';
interface Notificacao {
  id: number;
  // codigo: removido
  titulo: string;
  empresa_nome: string;
  clinica_nome: string;
  liberado_em: string;
  total_avaliacoes: number;
  tipo: 'novo_lote' | 'processado';
  mensagem: string;
}

interface NotificationCenterProps {
  onNavigateToLote?: (loteId: number) => void;
}

export default function NotificationCenter({
  onNavigateToLote,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);

  const fetchNotificacoes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/emissor/notificacoes');
      const data = await response.json();

      if (data?.success) {
        setNotificacoes(data.notificacoes || []);
        setTotalNaoLidas(data.totalNaoLidas || 0);
      }
    } catch (error: unknown) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificacoes();
    // Atualizar notificações a cada 2 minutos
    const interval = setInterval(fetchNotificacoes, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificacaoClick = (loteId: number) => {
    if (onNavigateToLote) {
      onNavigateToLote(loteId);
    }
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <>
      {/* Botão de Notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
        title="Central de Notificações"
      >
        <Bell size={22} className={totalNaoLidas > 0 ? 'animate-pulse' : ''} />
        {totalNaoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg ring-2 ring-gray-900 animate-bounce">
            {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
          </span>
        )}
      </button>

      {/* Painel de Notificações */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Painel */}
          <div className="fixed top-20 right-6 w-[420px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-top-5 duration-300">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Notificações</h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    {totalNaoLidas > 0
                      ? `${totalNaoLidas} ${
                          totalNaoLidas === 1 ? 'nova' : 'novas'
                        }`
                      : 'Tudo em dia'}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
                  aria-label="close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Lista de Notificações */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-600 mx-auto"></div>
                  <p className="mt-3 text-sm text-gray-500 font-medium">
                    Carregando...
                  </p>
                </div>
              ) : notificacoes.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={32} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    Nenhuma notificação
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Você está em dia com tudo!
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {notificacoes.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificacaoClick(notif.id)}
                      className="mb-2 p-4 bg-white hover:bg-blue-50 cursor-pointer transition-all duration-200 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md group"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 p-2.5 rounded-xl shadow-sm transition-all group-hover:scale-110 ${
                            notif.tipo === 'novo_lote'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                              : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                          }`}
                        >
                          {notif.tipo === 'novo_lote' ? (
                            <FileText size={18} strokeWidth={2.5} />
                          ) : (
                            <Clock size={18} strokeWidth={2.5} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 mb-1.5 leading-tight">
                            {notif.mensagem}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="font-medium truncate max-w-[180px]">
                              {notif.empresa_nome}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500 whitespace-nowrap">
                              {formatDate(notif.liberado_em)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notificacoes.length > 0 && (
              <div className="px-4 py-3 bg-white border-t border-gray-100">
                <button
                  onClick={fetchNotificacoes}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold py-2.5 rounded-lg transition-all duration-200"
                >
                  🔄 Atualizar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
