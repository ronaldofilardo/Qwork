'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  CreditCard,
  FileText,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface Notificacao {
  id?: string;
  tipo: string;
  titulo?: string;
  mensagem: string;
  data_evento: string;
  link_acao?: string;
  lida?: boolean;
  lote_id?: number;
}

// eslint-disable-next-line max-lines-per-function
export default function NotificationCenterGestor() {
  const [isOpen, setIsOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [visualizadas, setVisualizadas] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('notificacoes_visualizadas_gestor');
    if (stored) {
      setVisualizadas(new Set(JSON.parse(stored)));
    }
  }, []);

  const fetchNotificacoes = async () => {
    try {
      const res = await fetch('/api/entidade/notificacoes');
      if (!res.ok) return;
      const data = await res.json();
      setNotificacoes(data.notificacoes || []);
      setTotalNaoLidas(data.totalNaoLidas || 0);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchNotificacoes();
    const interval = setInterval(fetchNotificacoes, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Mark all current as visualized
      const newVisualizadas = new Set(visualizadas);
      notificacoes.forEach((n) => {
        const key = n.id || `${n.tipo}_${n.data_evento}`;
        newVisualizadas.add(key);
      });
      setVisualizadas(newVisualizadas);
      localStorage.setItem(
        'notificacoes_visualizadas_gestor',
        JSON.stringify(Array.from(newVisualizadas))
      );
    }
  };

  const unreadCount =
    totalNaoLidas -
    notificacoes.filter((n) => {
      const key = n.id || `${n.tipo}_${n.data_evento}`;
      return visualizadas.has(key);
    }).length;

  const displayCount = Math.max(0, unreadCount);

  const getIcon = (tipo: string) => {
    if (tipo === 'pagamento_pendente') return CreditCard;
    if (tipo === 'laudo_enviado') return FileText;
    if (tipo === 'lote_concluido') return CheckCircle;
    return Bell;
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notificações"
      >
        <Bell size={20} />
        {displayCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
            {displayCount > 9 ? '9+' : displayCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-full top-0 ml-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[70vh] overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <h4 className="font-semibold text-gray-900 text-sm">
              Notificações
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
            {notificacoes.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Nenhuma notificação recente
              </div>
            ) : (
              notificacoes.slice(0, 15).map((n, i) => {
                const IconComponent = getIcon(n.tipo);
                const key = n.id || `${n.tipo}_${n.data_evento}_${i}`;
                const isRead = visualizadas.has(
                  n.id || `${n.tipo}_${n.data_evento}`
                );

                return (
                  <div
                    key={key}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!isRead ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex gap-2.5">
                      <div
                        className={`mt-0.5 ${n.tipo === 'pagamento_pendente' ? 'text-orange-500' : 'text-blue-500'}`}
                      >
                        <IconComponent size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {n.titulo && (
                          <p className="text-xs font-semibold text-gray-900">
                            {n.titulo}
                          </p>
                        )}
                        <p className="text-xs text-gray-700 line-clamp-2">
                          {n.mensagem}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-gray-400">
                            {formatTimeAgo(n.data_evento)}
                          </span>
                          {n.link_acao && (
                            <a
                              href={n.link_acao}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              <ExternalLink size={10} />
                              Ver
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
