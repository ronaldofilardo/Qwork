'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket } from 'lucide-react';
import { LiberarLoteModal } from '@/components/modals/LiberarLoteModal';
import toast from 'react-hot-toast';

interface LoteAvaliacao {
  id: number;
  codigo: string;
  titulo: string;
  tipo: string;
  status: string;
  liberado_em: string;
  liberado_por_nome?: string;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
  pode_emitir_laudo?: boolean;
  motivos_bloqueio?: string[];
  taxa_conclusao?: number;
  // Informações de laudo
  laudo_id?: number;
  laudo_status?: string;
  laudo_emitido_em?: string;
  laudo_enviado_em?: string;
  laudo_hash?: string;
  emissor_nome?: string;
}

export default function LotesPage() {
  const router = useRouter();
  const [lotes, setLotes] = useState<LoteAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLiberarModal, setShowLiberarModal] = useState(false);
  const [downloadingLaudo, setDownloadingLaudo] = useState<number | null>(null);

  const loadLotes = async () => {
    try {
      const lotesRes = await fetch('/api/entidade/lotes');
      if (lotesRes.ok) {
        const lotesData = await lotesRes.json();
        setLotes(lotesData.lotes || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar lotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLotes();
  }, []);

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )}`;
  };

  const handleLoteClick = (loteId: number) => {
    router.push(`/entidade/lote/${loteId}`);
  };

  const handleDownloadLaudo = async (lote: LoteAvaliacao) => {
    if (!lote.laudo_id) {
      toast.error('Laudo não disponível');
      return;
    }

    setDownloadingLaudo(lote.laudo_id);
    toast.loading('Baixando laudo...', { id: `laudo-${lote.laudo_id}` });

    try {
      const response = await fetch(
        `/api/entidade/laudos/${lote.laudo_id}/download`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao baixar laudo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo-${lote.codigo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Laudo baixado com sucesso!', {
        id: `laudo-${lote.laudo_id}`,
      });
    } catch (error: any) {
      console.error('Erro ao baixar laudo:', error);
      toast.error(error.message || 'Erro ao baixar laudo', {
        id: `laudo-${lote.laudo_id}`,
      });
    } finally {
      setDownloadingLaudo(null);
    }
  };

  const handleRelatorioSetor = (_loteId: number) => {
    // TODO: Implementar relatório por setor para entidade
    toast('Funcionalidade em desenvolvimento');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Ciclos de Coletas Avaliativas
          </h1>
          <p className="text-gray-600">
            Acompanhe o progresso dos ciclos de coletas avaliativas
          </p>
        </div>

        <button
          onClick={() => setShowLiberarModal(true)}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium"
        >
          <Rocket size={18} />
          Iniciar Novo Ciclo
        </button>
      </div>

      {/* Grid de Lotes - Mesmo estilo da clínica */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {lotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h4 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhum ciclo encontrado
            </h4>
            <p className="text-gray-500">
              Libere um novo lote de avaliações para começar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lotes.map((lote) => {
              // Verificar se existe um laudo disponível de acordo com a máquina de estados:
              // - O lote deve estar 'concluido' ou 'finalizado'
              // - O laudo associado deve ter status 'enviado'
              const temLaudo = !!(
                lote.laudo_id &&
                lote.laudo_status === 'enviado' &&
                (lote.status === 'concluido' || lote.status === 'finalizado')
              );

              const isPronto = lote.pode_emitir_laudo || temLaudo || false;
              const isCanceled = lote.status === 'cancelado';

              return (
                <div
                  key={lote.id}
                  className={`bg-gray-50 rounded-lg p-5 border border-gray-200 ${
                    isCanceled
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:shadow-lg hover:border-primary transition-all cursor-pointer'
                  }`}
                  onClick={() => !isCanceled && handleLoteClick(lote.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver detalhes do lote ${lote.codigo}`}
                >
                  {/* Header do Card */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-semibold text-gray-800 text-base">
                        {lote.titulo}
                      </h5>
                      <div className="flex items-center gap-2">
                        {lote.avaliacoes_inativadas > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            ⚠️ {lote.avaliacoes_inativadas} inativada
                            {lote.avaliacoes_inativadas !== 1 ? 's' : ''}
                          </span>
                        )}
                        {isCanceled && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            ❌ Cancelado
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Código: {lote.codigo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(lote.liberado_em)}
                    </p>
                  </div>

                  {/* Estatísticas */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Avaliações liberadas:</span>
                      <span className="font-medium">
                        {lote.total_avaliacoes}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Concluídas:</span>
                      <span className="font-medium text-green-600">
                        {lote.avaliacoes_concluidas}
                      </span>
                    </div>
                    {lote.avaliacoes_inativadas > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <span>Inativadas:</span>
                          <span
                            className="text-xs text-gray-500"
                            title="Avaliações de funcionários inativos não contam para a prontidão"
                          >
                            ⓘ
                          </span>
                        </span>
                        <span className="font-medium text-red-600">
                          {lote.avaliacoes_inativadas}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Ativas consideradas:</span>
                      <span className="font-medium text-blue-600">
                        {lote.total_avaliacoes - lote.avaliacoes_inativadas}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status relatório:</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          isPronto
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {isPronto ? 'Pronto' : 'Pendente'}
                      </span>
                    </div>

                    {/* Taxa de conclusão (informativa) */}
                    {typeof lote.taxa_conclusao === 'number' && (
                      <div className="flex justify-between text-sm">
                        <span>Taxa de conclusão:</span>
                        <span className="font-medium text-gray-700">
                          {Number(lote.taxa_conclusao).toFixed(2)}%{' '}
                          <span className="text-xs text-gray-500">
                            (informativa)
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botão Relatório por Setor */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCanceled) handleRelatorioSetor(lote.id);
                    }}
                    disabled={!isPronto || isCanceled}
                    title={
                      !isPronto &&
                      lote.motivos_bloqueio &&
                      lote.motivos_bloqueio.length > 0
                        ? `Bloqueado: ${lote.motivos_bloqueio.join('; ')}`
                        : isPronto
                          ? 'Gerar relatório por setor'
                          : 'Aguardando conclusão das avaliações'
                    }
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
                  >
                    📋 Relatório por Setor
                  </button>

                  {/* Seção de Laudo (igual à clínica) */}
                  {temLaudo ? (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">
                          📄 Laudo disponível
                        </span>
                        <span className="text-xs text-blue-600">
                          {formatDateTime(lote.laudo_enviado_em)}
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 mb-2">
                        Emissor: {lote.emissor_nome || 'N/A'}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isCanceled) handleDownloadLaudo(lote);
                        }}
                        disabled={
                          isCanceled ||
                          !temLaudo ||
                          downloadingLaudo === lote.laudo_id
                        }
                        className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {downloadingLaudo === lote.laudo_id
                          ? 'Baixando...'
                          : 'Ver Laudo/Baixar PDF'}
                      </button>
                      <p className="text-xs text-blue-600 mt-2 text-center flex items-center justify-center gap-2">
                        <span>Hash:</span>
                        <span className="font-mono text-[11px]">
                          {lote.laudo_hash
                            ? `${lote.laudo_hash.substring(0, 8)}...${lote.laudo_hash.substring(
                                lote.laudo_hash.length - 6
                              )}`
                            : 'N/A'}
                        </span>

                        {/* Copy button (copies full hash) */}
                        {lote.laudo_hash && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard
                                .writeText(lote.laudo_hash as string)
                                .then(() => toast.success('Hash copiado'))
                                .catch(() => {
                                  // fallback
                                  const ta = document.createElement('textarea');
                                  ta.value = lote.laudo_hash as string;
                                  document.body.appendChild(ta);
                                  ta.select();
                                  try {
                                    document.execCommand('copy');
                                    toast.success('Hash copiado');
                                  } catch {
                                    toast.error(
                                      'Não foi possível copiar o hash'
                                    );
                                  }
                                  document.body.removeChild(ta);
                                });
                            }}
                            aria-label={`Copiar hash do laudo ${lote.codigo}`}
                            title="Copiar hash completo"
                            className="ml-2 inline-flex items-center gap-2 bg-white border border-blue-200 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 focus:outline-none"
                          >
                            Copiar
                          </button>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      Laudo indisponível. Aguarde a conclusão do lote.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Liberação */}
      {showLiberarModal && (
        <LiberarLoteModal
          isOpen={showLiberarModal}
          onClose={() => setShowLiberarModal(false)}
          mode="entidade"
          onSuccess={(_loteId) => {
            loadLotes();
            setShowLiberarModal(false);
          }}
        />
      )}
    </div>
  );
}
