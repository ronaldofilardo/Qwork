'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ModalEmergencia } from '@/components/emissor/ModalEmergencia';
import { useReprocessarLaudo } from '@/hooks/useReprocessarLaudo';
interface Lote {
  id: number;
  codigo: string;
  titulo: string;
  tipo: string;
  status: string;
  empresa_nome: string;
  clinica_nome: string;
  liberado_em: string;
  total_avaliacoes: number;
  emissao_automatica?: boolean;
  modo_emergencia?: boolean;
  solicitado_por?: string | null;
  solicitado_em?: string | null;
  tipo_solicitante?: string | null;
  previsao_emissao?: {
    data: string;
    formatada: string;
  } | null;
  laudo: {
    id: number;
    observacoes: string;
    status: string;
    emitido_em: string | null;
    enviado_em: string | null;
    hash_pdf: string | null;
    _emitido?: boolean;
    emissor_nome?: string;
  } | null;
  notificacoes?: NotificacaoLote[];
}

interface NotificacaoLote {
  id: string;
  tipo: 'lote_liberado' | 'lote_finalizado';
  mensagem: string;
  data_evento: string;
  visualizada: boolean;
}

interface LoteComNotificacao extends Lote {
  modo_emergencia?: boolean;
}

export default function EmissorDashboard() {
  const [lotes, setLotes] = useState<LoteComNotificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'laudo-para-emitir' | 'laudo-emitido' | 'cancelados'
  >('laudo-para-emitir');
  const router = useRouter();
  const { mutate: reprocessarLaudo, isPending: isReprocessando } =
    useReprocessarLaudo();

  const fetchLotes = useCallback(
    async (page: number, reset: boolean = false) => {
      try {
        if (reset) {
          setError(null);
          setLotes([]);
          setCurrentPage(1);
          setHasMore(true);
        } else {
          setLoadingMore(true);
        }

        const response = await fetch(`/api/emissor/lotes?page=${page}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          // Processar lotes - sem dias_pendente
          const newLotesComInfo: LoteComNotificacao[] = data.lotes.map(
            (lote: Lote) => {
              // Simular notificações para o lote
              const notificacoes: NotificacaoLote[] = [];

              // Notificação de lote liberado (sempre presente)
              notificacoes.push({
                id: `lote_liberado_${lote.id}`,
                tipo: 'lote_liberado',
                mensagem: `Lote "${lote.titulo}" foi liberado pela clínica`,
                data_evento: lote.liberado_em,
                visualizada: false,
              });

              // Notificação de lote finalizado (se aplicável)
              if (lote.laudo?.status === 'enviado') {
                notificacoes.push({
                  id: `lote_finalizado_${lote.id}`,
                  tipo: 'lote_finalizado',
                  mensagem: `Lote "${lote.titulo}" foi finalizado e laudo enviado`,
                  data_evento: lote.laudo.enviado_em || lote.liberado_em,
                  visualizada: false,
                });
              }

              return {
                ...lote,
                notificacoes,
              };
            }
          );

          if (reset) {
            setLotes(newLotesComInfo);
          } else {
            setLotes((prev) => prev.concat(newLotesComInfo));
          }

          setCurrentPage(page);
          if (data.lotes.length < data.limit) {
            setHasMore(false);
          }
        } else {
          const errorMsg = data.error || 'Erro ao carregar lotes';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Erro ao conectar com o servidor';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [] // Removido calcularDiasPendente das dependências
  );

  useEffect(() => {
    void fetchLotes(1, true);
  }, [fetchLotes]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !loadingMore) {
        void fetchLotes(currentPage, false);
      }
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [currentPage, loading, loadingMore, fetchLotes]);

  const getStatusColor = (lote: LoteComNotificacao) => {
    // Se o lote está concluído mas o laudo foi enviado, tratar como finalizado
    const effectiveStatus =
      lote.status === 'concluido' && lote.laudo?.status === 'enviado'
        ? 'finalizado'
        : lote.status;

    switch (effectiveStatus) {
      case 'rascunho':
        return 'border-gray-500 bg-gray-50';
      case 'ativo':
        return 'border-orange-500 bg-orange-50';
      case 'concluido':
        return 'border-blue-500 bg-blue-50';
      case 'finalizado':
        return 'border-green-500 bg-green-50';
      case 'cancelado':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const _getStatusIcon = (lote: LoteComNotificacao) => {
    // Se o lote está concluído mas o laudo foi enviado, tratar como finalizado
    const effectiveStatus =
      lote.status === 'concluido' && lote.laudo?.status === 'enviado'
        ? 'finalizado'
        : lote.status;

    switch (effectiveStatus) {
      case 'rascunho':
        return '⏳';
      case 'ativo':
        return '📝';
      case 'concluido':
        return '📋';
      case 'finalizado':
        return '✅';
      case 'cancelado':
        return '❌';
      default:
        return '📝';
    }
  };

  // Filtrar lotes por aba ativa
  const filteredLotes = lotes.filter((lote) => {
    switch (activeTab) {
      case 'laudo-para-emitir':
        // Apenas lotes CONCLUÍDOS que ainda NÃO têm laudo emitido
        // Laudo é considerado emitido quando tem hash_pdf OU status='enviado'
        return (
          lote.status === 'concluido' && (!lote.laudo || !lote.laudo._emitido)
        );
      case 'laudo-emitido':
        // Lotes finalizados OU lotes concluídos com laudo emitido (hash ou status enviado)
        return (
          lote.status === 'finalizado' ||
          (lote.status === 'concluido' && lote.laudo?._emitido)
        );
      case 'cancelados':
        return lote.status === 'cancelado';
      default:
        return true;
    }
  });

  const handleEmitirLaudo = (loteId: number) => {
    // Se já existe laudo, apenas visualizar
    const lote = lotes.find((l) => l.id === loteId);
    if (lote?.laudo) {
      router.push(`/emissor/laudo/${loteId}`);
      return;
    }

    // Navegar para a página de preview do laudo
    // O emissor verá o preview e poderá clicar em "Gerar Laudo" manualmente
    router.push(`/emissor/laudo/${loteId}`);
  };

  // Helper function para geração client-side de PDF
  const gerarPDFClientSide = async (
    htmlContent: string,
    filename: string,
    loteId: number
  ) => {
    try {
      // Importar dependências dinamicamente
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      console.log(`[PDF] Iniciando geração client-side para lote ${loteId}...`);

      // Criar iframe temporário para renderizar HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm'; // A4 width
      iframe.style.height = '297mm'; // A4 height
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Não foi possível criar documento temporário');
      }

      doc.open();
      doc.write(htmlContent);
      doc.close();

      console.log('[PDF] HTML renderizado no iframe');

      // Aguardar renderização completa
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Garantir que imagens base64 foram carregadas
      const images = doc.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) {
                resolve(true);
              } else {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
              }
            })
        )
      );

      console.log('[PDF] Imagens carregadas');

      // Capturar canvas do HTML renderizado
      const canvas = await html2canvas(doc.body, {
        scale: 2, // Alta qualidade
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 794, // A4 width em pixels (210mm @ 96dpi)
        windowHeight: 1123, // A4 height em pixels (297mm @ 96dpi)
      });

      console.log('[PDF] Canvas capturado');

      // Configurar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calcular dimensões mantendo aspect ratio
      const imgWidth = 210; // A4 width em mm
      const pageHeight = 297; // A4 height em mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;
      const imgData = canvas.toDataURL('image/png');

      // Adicionar imagem ao PDF (com paginação se necessário)
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      console.log('[PDF] PDF gerado, iniciando download...');

      // Download do PDF
      pdf.save(`${filename}.pdf`);

      // Cleanup
      document.body.removeChild(iframe);

      console.log(`[SUCCESS] PDF gerado e baixado: ${filename}.pdf`);
    } catch (pdfError) {
      console.error('[PDF-ERROR] Erro ao gerar PDF client-side:', pdfError);
      throw pdfError;
    }
  };

  const handleDownloadLaudo = async (lote: Lote) => {
    if (!lote.laudo?.id) {
      alert('Erro: ID do laudo inválido');
      return;
    }

    try {
      // 1. Tentar download direto (se PDF existe no servidor)
      const response = await fetch(`/api/emissor/laudos/${lote.id}/download`);
      const contentType = response.headers.get('content-type');

      // 2. Verificar se recebeu PDF ou instrução para usar client-side
      if (contentType?.includes('application/pdf')) {
        // PDF disponível - fazer download direto
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laudo-${lote.codigo || lote.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      }

      if (contentType?.includes('application/json')) {
        // Resposta JSON - verificar se deve usar client-side
        const data = await response.json();

        if (data.useClientSide && data.htmlEndpoint) {
          // 3. Usar geração client-side
          console.log(
            '[INFO] PDF não disponível no servidor. Usando geração client-side...'
          );

          // Buscar HTML do laudo
          const htmlResponse = await fetch(data.htmlEndpoint);

          if (!htmlResponse.ok) {
            throw new Error('Erro ao buscar HTML do laudo');
          }

          const htmlContent = await htmlResponse.text();

          // 4. Gerar PDF no navegador usando jsPDF + html2canvas
          await gerarPDFClientSide(
            htmlContent,
            `laudo-${lote.codigo || lote.id}`,
            lote.id
          );

          return;
        }

        // Erro genérico da API
        alert(`Erro: ${data.error || 'Laudo não disponível'}`);
        return;
      }

      // Resposta inesperada
      throw new Error('Resposta inesperada do servidor');
    } catch (downloadError) {
      console.error('Erro ao fazer download:', downloadError);
      const errorMessage =
        downloadError instanceof Error
          ? downloadError.message
          : 'Erro desconhecido';
      alert(`Erro ao fazer download do laudo: ${errorMessage}`);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    void fetchLotes(1, true);
  };

  const handleLoadMore = () => {
    void fetchLotes(currentPage + 1, false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando lotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com botão de sair */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard do Emissor
              </h1>
              <p className="mt-2 text-gray-600">
                Histórico completo dos lotes processados para emissão de laudos
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/login');
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('laudo-para-emitir')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'laudo-para-emitir'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📝 Laudo para Emitir
              </button>
              <button
                onClick={() => setActiveTab('laudo-emitido')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'laudo-emitido'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ✅ Laudo Emitido
              </button>
              <button
                onClick={() => setActiveTab('cancelados')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cancelados'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ❌ Cancelados
              </button>
            </nav>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Tentar Novamente
            </button>
          </div>
        ) : filteredLotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">
              Nenhum ciclo encontrado para esta categoria.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="grid gap-4">
                {filteredLotes.map((lote) => (
                  <div
                    key={lote.id}
                    className={`border-l-4 rounded-r-lg p-4 ${getStatusColor(
                      lote
                    )}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {lote.titulo} - Lote: {lote.codigo}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lote.status === 'concluido' &&
                            lote.laudo?.status === 'enviado'
                              ? 'bg-green-100 text-green-800'
                              : lote.status === 'finalizado'
                                ? 'bg-green-100 text-green-800'
                                : lote.status === 'concluido'
                                  ? 'bg-blue-100 text-blue-800'
                                  : lote.status === 'ativo'
                                    ? 'bg-orange-100 text-orange-800'
                                    : lote.status === 'cancelado'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {lote.status === 'concluido' &&
                          lote.laudo?.status === 'enviado'
                            ? 'Finalizado'
                            : lote.status === 'finalizado'
                              ? 'Finalizado'
                              : lote.status === 'concluido'
                                ? 'Concluído'
                                : lote.status === 'ativo'
                                  ? 'Ativo'
                                  : lote.status === 'cancelado'
                                    ? 'Cancelado'
                                    : 'Rascunho'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Empresa Cliente
                        </p>
                        <p className="text-sm text-gray-900">
                          {lote.empresa_nome}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Clínica Origem
                        </p>
                        <p className="text-sm text-gray-900">
                          {lote.clinica_nome}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <div className="text-sm text-gray-500">
                        Recebido em{' '}
                        {new Date(lote.liberado_em).toLocaleDateString('pt-BR')}{' '}
                        às{' '}
                        {new Date(lote.liberado_em).toLocaleTimeString(
                          'pt-BR',
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </div>

                      {lote.solicitado_em && lote.solicitado_por && (
                        <div className="text-sm text-blue-600 font-medium">
                          🚀 Emissão solicitada por {lote.solicitado_por} em{' '}
                          {new Date(lote.solicitado_em).toLocaleDateString(
                            'pt-BR'
                          )}{' '}
                          às{' '}
                          {new Date(lote.solicitado_em).toLocaleTimeString(
                            'pt-BR',
                            { hour: '2-digit', minute: '2-digit' }
                          )}
                        </div>
                      )}

                      {lote.previsao_emissao && (
                        <div className="text-sm text-gray-500">
                          Previsão de emissão: {lote.previsao_emissao.formatada}
                        </div>
                      )}

                      {lote.laudo?.emitido_em && (
                        <div className="text-sm text-gray-500">
                          Laudo emitido em{' '}
                          {new Date(lote.laudo.emitido_em).toLocaleDateString(
                            'pt-BR'
                          )}{' '}
                          às{' '}
                          {new Date(lote.laudo.emitido_em).toLocaleTimeString(
                            'pt-BR',
                            { hour: '2-digit', minute: '2-digit' }
                          )}
                        </div>
                      )}

                      {lote.laudo?.emissor_nome && (
                        <div className="text-sm text-blue-700 font-medium">
                          Emissor: {lote.laudo.emissor_nome}
                        </div>
                      )}

                      {lote.laudo?.enviado_em && (
                        <div className="text-sm text-gray-500">
                          Enviado em{' '}
                          {new Date(lote.laudo.enviado_em).toLocaleDateString(
                            'pt-BR'
                          )}{' '}
                          às{' '}
                          {new Date(lote.laudo.enviado_em).toLocaleTimeString(
                            'pt-BR',
                            { hour: '2-digit', minute: '2-digit' }
                          )}
                        </div>
                      )}
                    </div>

                    {/* Hash do Laudo - Seção destacada */}
                    {lote.laudo && lote.laudo._emitido && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-blue-800 uppercase">
                            🔒 Hash de Integridade (SHA-256)
                          </span>
                          {lote.laudo.hash_pdf && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const h = lote.laudo!.hash_pdf as string;
                                navigator.clipboard
                                  .writeText(h)
                                  .then(() => toast.success('Hash copiado!'))
                                  .catch(() => {
                                    const ta =
                                      document.createElement('textarea');
                                    ta.value = h;
                                    document.body.appendChild(ta);
                                    ta.select();
                                    try {
                                      document.execCommand('copy');
                                      toast.success('Hash copiado!');
                                    } catch {
                                      toast.error(
                                        'Não foi possível copiar o hash'
                                      );
                                    }
                                    document.body.removeChild(ta);
                                  });
                              }}
                              aria-label={`Copiar hash do laudo ${lote.codigo}`}
                              title="Copiar hash completo para área de transferência"
                              className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              📋 Copiar Hash
                            </button>
                          )}
                        </div>
                        <div className="bg-white p-2 rounded border border-blue-100">
                          {lote.laudo.hash_pdf ? (
                            <code className="text-xs font-mono text-gray-800 break-all block">
                              {lote.laudo.hash_pdf}
                            </code>
                          ) : (
                            <div className="text-xs text-gray-500 italic">
                              Hash não disponível para este laudo
                            </div>
                          )}
                        </div>
                        {lote.laudo.hash_pdf ? (
                          <p className="text-xs text-blue-600 mt-2">
                            Use este hash para verificar a integridade do PDF do
                            laudo
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-2">
                            Este laudo foi gerado antes da implementação do
                            hash. Regenere o laudo para obter o hash.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Notificações do Lote */}
                    {lote.notificacoes && lote.notificacoes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Notificações
                        </h4>
                        <div className="space-y-2">
                          {lote.notificacoes.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3 rounded-lg border ${
                                notif.visualizada
                                  ? 'bg-gray-50 border-gray-200'
                                  : 'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                    notif.tipo === 'lote_liberado'
                                      ? 'bg-green-500'
                                      : 'bg-purple-500'
                                  }`}
                                ></div>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-800">
                                    {notif.mensagem}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(
                                      notif.data_evento
                                    ).toLocaleDateString('pt-BR')}{' '}
                                    às{' '}
                                    {new Date(
                                      notif.data_evento
                                    ).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                {!notif.visualizada && (
                                  <div className="flex-shrink-0">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Badge de modo emergência */}
                    {lote.modo_emergencia && (
                      <div className="mb-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          <span>⚠️</span>
                          Emissão de Emergência
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      {/* Botão reprocessar - apenas para lotes concluídos sem laudo EMITIDO */}
                      {lote.status === 'concluido' &&
                        (!lote.laudo || !lote.laudo._emitido) && (
                          <button
                            onClick={() =>
                              reprocessarLaudo({ loteId: lote.id })
                            }
                            disabled={isReprocessando}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                          >
                            {isReprocessando ? 'Processando...' : 'Reprocessar'}
                          </button>
                        )}

                      {/* Botão emergência - apenas para emissores/admins, lotes concluídos sem laudo EMITIDO */}
                      {lote.status === 'concluido' &&
                        (!lote.laudo || !lote.laudo._emitido) && (
                          <ModalEmergencia
                            loteId={lote.id}
                            loteCodigo={lote.codigo}
                            onSuccess={() => fetchLotes(currentPage, false)}
                          />
                        )}

                      {/* Botão principal do lote */}
                      {(() => {
                        const laudoDisponivelParaDownload = Boolean(
                          lote.laudo &&
                          (lote.laudo._emitido ||
                            lote.laudo.status === 'enviado' ||
                            lote.laudo.hash_pdf)
                        );

                        const laudoFoiEmitido = Boolean(
                          lote.laudo && lote.laudo._emitido
                        );

                        const label = laudoDisponivelParaDownload
                          ? 'Laudo Psicossocial'
                          : lote.emissao_automatica
                            ? !laudoFoiEmitido
                              ? 'Pré-visualização'
                              : lote.laudo.status === 'enviado'
                                ? 'Ver Laudo/Baixar PDF'
                                : 'Ver Prévia (edição bloqueada)'
                            : !laudoFoiEmitido
                              ? 'Iniciar Laudo'
                              : lote.laudo.status === 'enviado'
                                ? 'Ver Laudo/Baixar PDF'
                                : 'Abrir Laudo Biopsicossocial';

                        return (
                          <button
                            onClick={() => {
                              if (laudoDisponivelParaDownload) {
                                handleDownloadLaudo(lote);
                              } else {
                                handleEmitirLaudo(lote.id);
                              }
                            }}
                            className={`px-4 py-2 ${
                              lote.emissao_automatica
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            } text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 ${
                              lote.emissao_automatica
                                ? 'focus:ring-orange-500'
                                : 'focus:ring-blue-500'
                            } focus:ring-offset-2 transition-colors flex items-center gap-2`}
                          >
                            {label}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? 'Carregando...' : 'Carregar Mais'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
