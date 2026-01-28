/**
 * NotificationHub - Central de Notificações
 * Componente para exibir e gerenciar notificações em tempo real
 */

'use client';

import { useState, useEffect } from 'react';
import type {
  Notificacao,
  ContagemNotificacoes,
} from '@/lib/notification-service';

interface NotificationHubProps {
  usuarioCpf: string;
  usuarioTipo: 'admin' | 'gestor_entidade';
}

export default function NotificationHub({
  usuarioCpf: _usuarioCpf,
  usuarioTipo: _usuarioTipo,
}: NotificationHubProps) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [contagem, setContagem] = useState<ContagemNotificacoes | null>(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Carregar contagem de não lidas
  const carregarContagem = async () => {
    try {
      const res = await fetch('/api/notificacoes/contagem');
      if (res.ok) {
        const data = await res.json();
        setContagem(data);
      }
    } catch (erro) {
      console.error('[NotificationHub] Erro ao carregar contagem:', erro);
    }
  };

  // Carregar notificações
  const carregarNotificacoes = async (apenasnaoLidas = true) => {
    setCarregando(true);
    try {
      const res = await fetch(
        `/api/notificacoes?apenasnaoLidas=${apenasnaoLidas}&limite=20`
      );
      if (res.ok) {
        const data = await res.json();
        setNotificacoes(data);
      }
    } catch (erro) {
      console.error('[NotificationHub] Erro ao carregar notificações:', erro);
    } finally {
      setCarregando(false);
    }
  };

  // Marcar como lida
  const marcarComoLida = async (notificacaoId: number) => {
    try {
      const res = await fetch('/api/notificacoes/marcar-lida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificacao_ids: [notificacaoId] }),
      });

      if (res.ok) {
        // Atualizar estado local
        setNotificacoes((prev) =>
          prev.map((n) => (n.id === notificacaoId ? { ...n, lida: true } : n))
        );
        await carregarContagem();
      }
    } catch (erro) {
      console.error('[NotificationHub] Erro ao marcar como lida:', erro);
    }
  };

  // Marcar todas como lidas
  const marcarTodasComoLidas = async () => {
    try {
      const res = await fetch('/api/notificacoes/marcar-todas-lidas', {
        method: 'POST',
      });

      if (res.ok) {
        await carregarNotificacoes(false);
        await carregarContagem();
      }
    } catch (erro) {
      console.error('[NotificationHub] Erro ao marcar todas como lidas:', erro);
    }
  };

  // Polling para atualizações (a cada 30 segundos)
  useEffect(() => {
    carregarContagem();
    const intervalo = setInterval(carregarContagem, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // Carregar notificações ao abrir dropdown
  useEffect(() => {
    if (mostrarDropdown) {
      carregarNotificacoes();
    }
  }, [mostrarDropdown]);

  // Cores por prioridade
  const corPorPrioridade = (prioridade: string) => {
    switch (prioridade) {
      case 'critica':
        return 'bg-red-500';
      case 'alta':
        return 'bg-orange-500';
      case 'media':
        return 'bg-blue-500';
      case 'baixa':
        return 'bg-gray-400';
      default:
        return 'bg-gray-300';
    }
  };

  // Ícone por tipo
  const iconePorTipo = (tipo: string) => {
    switch (tipo) {
      case 'pre_cadastro_criado':
        return '📋';
      case 'valor_definido':
        return '💰';
      case 'contrato_aceito':
        return '✅';
      case 'pagamento_confirmado':
        return '💳';
      case 'contratacao_ativa':
        return '🎉';
      case 'rejeicao_admin':
        return '❌';
      case 'cancelamento_gestor':
        return '🚫';
      case 'sla_excedido':
        return '🚨';
      default:
        return '🔔';
    }
  };

  const totalNaoLidas = contagem?.total_nao_lidas || 0;

  return (
    <div className="relative">
      {/* Botão sino com badge */}
      <button
        onClick={() => setMostrarDropdown(!mostrarDropdown)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notificações"
      >
        <span className="text-2xl">🔔</span>
        {totalNaoLidas > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {mostrarDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificações
              </h3>
              {totalNaoLidas > 0 && (
                <button
                  onClick={marcarTodasComoLidas}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            {contagem && (
              <div className="flex gap-3 mt-2 text-xs">
                {contagem.criticas > 0 && (
                  <span className="text-red-600 font-semibold">
                    {contagem.criticas} Críticas
                  </span>
                )}
                {contagem.altas > 0 && (
                  <span className="text-orange-600 font-semibold">
                    {contagem.altas} Alta Prioridade
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Lista de notificações */}
          <div className="overflow-y-auto flex-1">
            {carregando ? (
              <div className="p-8 text-center text-gray-500">Carregando...</div>
            ) : notificacoes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <ul>
                {notificacoes.map((notif) => (
                  <li
                    key={notif.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notif.lida ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Ícone */}
                      <div className="flex-shrink-0 text-2xl">
                        {iconePorTipo(notif.tipo)}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {notif.titulo}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs text-white flex-shrink-0 ${corPorPrioridade(
                              notif.prioridade
                            )}`}
                          >
                            {notif.prioridade}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notif.mensagem}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date(notif.criado_em).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <div className="flex gap-2">
                            {notif.link_acao && (
                              <a
                                href={notif.link_acao}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                onClick={() => {
                                  marcarComoLida(notif.id);
                                  setMostrarDropdown(false);
                                }}
                              >
                                {notif.botao_texto || 'Ver'}
                              </a>
                            )}
                            {!notif.lida && (
                              <button
                                onClick={() => marcarComoLida(notif.id)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Marcar lida
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notificacoes.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <a
                href="/notificacoes"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => setMostrarDropdown(false)}
              >
                Ver todas as notificações
              </a>
            </div>
          )}
        </div>
      )}

      {/* Overlay para fechar dropdown */}
      {mostrarDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMostrarDropdown(false)}
        />
      )}
    </div>
  );
}
