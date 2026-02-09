'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  DollarSign,
  ExternalLink,
  X,
  Check,
} from 'lucide-react';

interface Notificacao {
  id: number;
  tipo: string;
  prioridade: string;
  titulo: string;
  mensagem: string;
  dados_contexto: any;
  link_acao?: string;
  botao_texto?: string;
  lida: boolean;
  criado_em: string;
}

interface CentroOperacoesProps {
  /**
   * Tipo de usuário (tomador, clinica, funcionario)
   */
  tipoUsuario: 'tomador' | 'clinica' | 'funcionario';

  /**
   * Callback ao navegar para uma ação
   */
  onNavigate?: (url: string) => void;
}

type TabDominio = 'lotes' | 'laudos';

export default function CentroOperacoes({
  tipoUsuario,
  onNavigate,
}: CentroOperacoesProps) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabAtiva, setTabAtiva] = useState<TabDominio>('lotes');
  const [expandidas, setExpandidas] = useState<Set<number>>(new Set());

  const carregarNotificacoes = useCallback(async () => {
    try {
      setLoading(true);

      // Determinar endpoint baseado no tipo de usuário
      let endpoint = '/api/notificacoes';
      if (tipoUsuario === 'tomador') {
        endpoint = '/api/rh/notificacoes'; // ou /api/entidade/notificacoes
      } else if (tipoUsuario === 'clinica') {
        endpoint = '/api/clinica/notificacoes';
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setNotificacoes(data.notificacoes || []);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [tipoUsuario]);

  useEffect(() => {
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  const resolverNotificacao = async (notificacaoId: number) => {
    try {
      const res = await fetch('/api/notificacoes/resolver', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificacao_id: notificacaoId }),
      });

      if (res.ok) {
        // Remover notificação da lista
        setNotificacoes((prev) => prev.filter((n) => n.id !== notificacaoId));
      }
    } catch (error) {
      console.error('Erro ao resolver notificação:', error);
    }
  };

  const toggleExpansao = (notificacaoId: number) => {
    setExpandidas((prev) => {
      const novas = new Set(prev);
      if (novas.has(notificacaoId)) {
        novas.delete(notificacaoId);
      } else {
        novas.add(notificacaoId);
      }
      return novas;
    });
  };

  const filtrarPorDominio = (notifs: Notificacao[]) => {
    if (tabAtiva === 'lotes') {
      return notifs.filter((n) =>
        ['lote_concluido_aguardando_laudo'].includes(n.tipo)
      );
    }

    if (tabAtiva === 'laudos') {
      return notifs.filter((n) => ['laudo_enviado'].includes(n.tipo));
    }

    return notifs;
  };

  const getIconePorTipo = (tipo: string) => {
    if (tipo.includes('parcela') || tipo.includes('quitacao')) {
      return <DollarSign size={20} />;
    }
    if (tipo.includes('lote')) {
      return <CheckCircle size={20} />;
    }
    if (tipo.includes('laudo')) {
      return <FileText size={20} />;
    }
    return <AlertCircle size={20} />;
  };

  const getCorPorPrioridade = (prioridade: string, tipo: string) => {
    // Cores baseadas no estado e prioridade
    if (tipo.includes('parcela'))
      return 'bg-orange-100 text-orange-600 border-orange-300';
    if (tipo.includes('laudo_enviado'))
      return 'bg-green-100 text-green-600 border-green-300';
    if (tipo.includes('lote_concluido'))
      return 'bg-blue-100 text-blue-600 border-blue-300';

    // Fallback por prioridade
    if (prioridade === 'critica')
      return 'bg-red-100 text-red-600 border-red-300';
    if (prioridade === 'alta')
      return 'bg-orange-100 text-orange-600 border-orange-300';
    return 'bg-gray-100 text-gray-600 border-gray-300';
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const notificacoesFiltradas = filtrarPorDominio(notificacoes);
  const contadores = {
    lotes: notificacoes.filter((n) =>
      ['lote_concluido_aguardando_laudo'].includes(n.tipo)
    ).length,
    laudos: notificacoes.filter((n) => ['laudo_enviado'].includes(n.tipo))
      .length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Centro de Operações
        </h1>
        <p className="text-gray-600">Notificações persistentes até resolução</p>
      </div>

      {/* Tabs por Domínio */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setTabAtiva('lotes')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              tabAtiva === 'lotes'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Lotes ({contadores.lotes})
          </button>
          <button
            onClick={() => setTabAtiva('laudos')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              tabAtiva === 'laudos'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Laudos ({contadores.laudos})
          </button>
        </nav>
      </div>

      {/* Lista de Notificações */}
      {notificacoesFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
          <p className="text-gray-600 text-lg font-medium">
            Nenhuma notificação pendente
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Todas as ações foram resolvidas
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notificacoesFiltradas.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 transition-all hover:shadow-md ${getCorPorPrioridade(
                notif.prioridade,
                notif.tipo
              )}`}
            >
              <div className="flex items-start gap-3">
                {/* Ícone */}
                <div className="p-2 rounded-lg flex-shrink-0">
                  {getIconePorTipo(notif.tipo)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {notif.titulo}
                      </h3>
                      <p className="text-xs text-gray-700 mb-2">
                        {notif.mensagem}
                      </p>

                      {/* Preview de contexto (ex: nomes em relatórios) */}
                      {expandidas.has(notif.id) &&
                        notif.dados_contexto?.funcionarios && (
                          <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                            <p className="font-medium mb-1">
                              Funcionários pendentes:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              {notif.dados_contexto.funcionarios
                                .slice(0, 5)
                                .map((f: any, idx: number) => (
                                  <li key={idx}>
                                    {f.nome} ({f.setor})
                                  </li>
                                ))}
                              {notif.dados_contexto.funcionarios.length > 5 && (
                                <li className="text-gray-600">
                                  +
                                  {notif.dados_contexto.funcionarios.length - 5}{' '}
                                  mais...
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                    </div>

                    {/* Botão de fechar */}
                    <button
                      onClick={() => resolverNotificacao(notif.id)}
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      title="Marcar como resolvida"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Rodapé com ações */}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-gray-500">
                      {formatarData(notif.criado_em)}
                    </span>

                    {notif.link_acao && (
                      <button
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate(notif.link_acao!);
                          } else {
                            window.location.href = notif.link_acao!;
                          }
                        }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {notif.botao_texto || 'Ver detalhes'}
                        <ExternalLink size={12} />
                      </button>
                    )}

                    {notif.dados_contexto?.funcionarios && (
                      <button
                        onClick={() => toggleExpansao(notif.id)}
                        className="text-xs font-medium text-gray-600 hover:text-gray-800"
                      >
                        {expandidas.has(notif.id) ? 'Ocultar' : 'Ver lista'}
                      </button>
                    )}

                    <button
                      onClick={() => resolverNotificacao(notif.id)}
                      className="ml-auto text-xs font-medium text-green-600 hover:text-green-800 flex items-center gap-1"
                    >
                      <Check size={14} />
                      Resolver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
