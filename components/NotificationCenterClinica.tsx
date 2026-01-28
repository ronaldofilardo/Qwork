'use client'

import { useState, useEffect } from 'react'
import { Bell, X, FileText, Package, Send, CheckCircle } from 'lucide-react'
interface NotificacaoClinica {
  id: string
  tipo: 'lote_concluido' | 'laudo_enviado' | 'avaliacao_concluida'
  lote_id: number
  codigo: string
  titulo: string
  empresa_nome: string
  data_evento: string
  mensagem: string
}

interface SSEMessage {
  type: 'connected' | 'notifications' | 'heartbeat'
  timestamp?: string
  total?: number
  data?: NotificacaoClinica[]
}

interface NotificationCenterClinicaProps {
  onNavigateToLote?: (loteId: number) => void
}

export default function NotificationCenterClinica({ onNavigateToLote }: NotificationCenterClinicaProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notificacoes, setNotificacoes] = useState<NotificacaoClinica[]>([])
  const [loading, setLoading] = useState(false)
  const [totalNaoLidas, setTotalNaoLidas] = useState(0)
  const [visualizadas, setVisualizadas] = useState<Set<string>>(new Set())
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')

  useEffect(() => {
    // Carregar notificações visualizadas do localStorage
    const visualizadasStorage = localStorage.getItem('notificacoes_visualizadas_clinica')
    if (visualizadasStorage) {
      setVisualizadas(new Set(JSON.parse(visualizadasStorage)))
    }

    // Iniciar conexão SSE
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connectSSE = () => {
      try {
        console.log('[SSE] Conectando ao servidor de notificações...')
        eventSource = new EventSource('/api/rh/notificacoes/stream')

        eventSource.onopen = () => {
          console.log('[SSE] Conexão estabelecida')
          setConnectionStatus('connected')
          setLoading(false)
        }

        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data ?? '{}') as unknown
            if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
              const data = parsed as SSEMessage

              if (data.type === 'connected') {
                console.log('[SSE] Servidor confirmou conexão:', data.timestamp)
              } else if (data.type === 'notifications') {
                console.log('[SSE] Notificações recebidas:', data.total)
                // Filtrar notificações não visualizadas
                const naoVisualizadas = (data.data || []).filter((notif: NotificacaoClinica) => !visualizadas.has(notif.id))
                setNotificacoes(naoVisualizadas)
                setTotalNaoLidas(naoVisualizadas.length)
              } else if (data.type === 'heartbeat') {
                // Heartbeat recebido
                console.log('[SSE] Heartbeat:', data.timestamp)
              }
            }
          } catch (err: unknown) {
            console.error('[SSE] Erro ao processar mensagem:', err)
          }
        }

        eventSource.onerror = (err) => {
          console.error('[SSE] Erro na conexão:', err)
          setConnectionStatus('error')
          
          // Fechar conexão
          if (eventSource) {
            eventSource.close()
            eventSource = null
          }

          // Tentar reconectar após 5 segundos
          reconnectTimeout = setTimeout(() => {
            console.log('[SSE] Tentando reconectar...')
            connectSSE()
          }, 5000)
        }
      } catch (err: unknown) {
        console.error('[SSE] Erro ao criar EventSource:', err)
        setConnectionStatus('error')
      }
    }

    // Conectar ao SSE
    setLoading(true)
    connectSSE()

    // Cleanup na desmontagem
    return () => {
      console.log('[SSE] Desconectando...')
      if (eventSource) {
        eventSource.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [visualizadas])

  // Marcar todas as notificações como visualizadas ao navegar
  useEffect(() => {
    const handleRouteChange = () => {
      if (notificacoes.length > 0) {
        const novasVisualizadas = new Set(visualizadas)
        notificacoes.forEach(notif => novasVisualizadas.add(notif.id))
        setVisualizadas(novasVisualizadas)
        localStorage.setItem('notificacoes_visualizadas_clinica', JSON.stringify([...novasVisualizadas]))
        setTotalNaoLidas(0)
      }
    }

    // Escutar mudanças de rota usando o evento popstate
    window.addEventListener('popstate', handleRouteChange)

    // Usar um intervalo para detectar mudanças no pathname
    let currentPath = window.location.pathname
    const checkPathChange = () => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname
        handleRouteChange()
      }
    }

    const interval = setInterval(checkPathChange, 100)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      clearInterval(interval)
    }
  }, [notificacoes, visualizadas])

  const handleNotificacaoClick = (loteId: number) => {
    if (onNavigateToLote) {
      onNavigateToLote(loteId)
    }
    setIsOpen(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    return date.toLocaleDateString('pt-BR')
  }

  const getIconForTipo = (tipo: string) => {
    switch (tipo) {
      case 'lote_concluido':
        return <Package size={20} />
      case 'laudo_enviado':
        return <Send size={20} />
      case 'avaliacao_concluida':
        return <CheckCircle size={20} />
      default:
        return <FileText size={20} />
    }
  }

  const getColorForTipo = (tipo: string) => {
    switch (tipo) {
      case 'lote_concluido':
        return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
      case 'laudo_enviado':
        return 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
      case 'avaliacao_concluida':
        return 'bg-gradient-to-br from-green-500 to-green-600 text-white'
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
    }
  }

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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      Notificações
                    </h3>
                    {/* Indicador de conexão */}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        connectionStatus === 'connected' 
                          ? 'bg-green-400 animate-pulse' 
                          : connectionStatus === 'error'
                          ? 'bg-red-400'
                          : 'bg-yellow-400 animate-pulse'
                      }`}></div>
                      <span className="text-[10px] text-white/80 uppercase tracking-wider">
                        {connectionStatus === 'connected' ? 'Tempo Real' : connectionStatus === 'error' ? 'Reconectando' : 'Conectando'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-100 mt-0.5">
                    {totalNaoLidas > 0 ? `${totalNaoLidas} ${totalNaoLidas === 1 ? 'nova' : 'novas'}` : 'Tudo em dia'}
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
                  <p className="mt-3 text-sm text-gray-500 font-medium">Carregando...</p>
                </div>
              ) : notificacoes.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={32} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Nenhuma notificação</p>
                  <p className="text-xs text-gray-500 mt-1">Você está em dia com tudo!</p>
                </div>
              ) : (
                <div className="p-2">
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {notificacoes.map((notif) => (
                          <tr
                            key={notif.id}
                            onClick={() => handleNotificacaoClick(notif.lote_id)}
                            className="hover:bg-blue-50 cursor-pointer transition-all duration-200"
                          >
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`flex-shrink-0 p-1.5 rounded-md shadow-sm ${getColorForTipo(notif.tipo)}`}>
                                  <div className="[&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:stroke-[2.5]">
                                    {getIconForTipo(notif.tipo)}
                                  </div>
                                </div>
                                <span className="ml-2 text-xs font-medium text-gray-900">
                                  {notif.tipo === 'lote_concluido' ? 'Lote Enviado' : 
                                   notif.tipo === 'avaliacao_concluida' ? 'Nova avaliação concluída' : 
                                   'Laudo Recebido'}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 font-mono">
                              {notif.codigo}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="text-xs text-gray-900 max-w-[120px] truncate" title={notif.titulo}>
                                {notif.titulo}
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 max-w-[120px] truncate" title={notif.empresa_nome}>
                              {notif.empresa_nome}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                              {formatDate(notif.data_evento)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {notificacoes.length > 0 && (
              <div className="px-4 py-3 bg-white border-t border-gray-100">
                <div className="text-xs text-gray-500 text-center">
                  Notificações atualizadas em tempo real
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}