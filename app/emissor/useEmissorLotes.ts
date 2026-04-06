'use client';

/**
 * app/emissor/useEmissorLotes.ts
 *
 * Custom hook encapsulating all state, data-fetching, side-effects
 * and action handlers for the Emissor dashboard.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useReprocessarLaudo } from '@/hooks/useReprocessarLaudo';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import type { Lote, NotificacaoLote, ActiveTab } from './types';

export function useEmissorLotes() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('laudo-para-emitir');
  const router = useRouter();
  const { mutate: reprocessarLaudo, isPending: isReprocessando } =
    useReprocessarLaudo();
  const { canInstall, handleInstallClick } = usePWAInstall();

  // ---- Data fetching ----
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
          const newLotesComInfo: Lote[] = data.lotes.map((lote: Lote) => {
            const notificacoes: NotificacaoLote[] = [];

            notificacoes.push({
              id: `lote_liberado_${lote.id}`,
              tipo: 'lote_liberado',
              mensagem: `Lote ID ${lote.id} foi liberado pela clínica`,
              data_evento: lote.liberado_em,
              visualizada: false,
            });

            if (lote.laudo?.status === 'enviado') {
              notificacoes.push({
                id: `lote_finalizado_${lote.id}`,
                tipo: 'lote_finalizado',
                mensagem: `Lote ID ${lote.id} foi finalizado e laudo enviado`,
                data_evento: lote.laudo.enviado_em || lote.liberado_em,
                visualizada: false,
              });
            }

            return { ...lote, notificacoes };
          });

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
    []
  );

  // ---- Effects ----
  useEffect(() => {
    void fetchLotes(1, true);
  }, [fetchLotes]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !loadingMore) {
        void fetchLotes(currentPage, false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentPage, loading, loadingMore, fetchLotes]);

  // ---- Derived state ----
  const filteredLotes = lotes.filter((lote) => {
    switch (activeTab) {
      case 'laudo-para-emitir':
        return !lote.laudo || !lote.laudo._emitido;
      case 'laudo-emitido':
        return lote.laudo?._emitido === true && !lote.laudo?.enviado_em;
      case 'laudos-enviados':
        return !!(lote.laudo?.enviado_em || lote.laudo?.status === 'enviado');
      default:
        return true;
    }
  });

  const counts: Record<
    'laudo-para-emitir' | 'laudo-emitido' | 'laudos-enviados',
    number
  > = {
    'laudo-para-emitir': lotes.filter((l) => !l.laudo || !l.laudo._emitido)
      .length,
    'laudo-emitido': lotes.filter(
      (l) => l.laudo?._emitido === true && !l.laudo?.enviado_em
    ).length,
    'laudos-enviados': lotes.filter(
      (l) => !!(l.laudo?.enviado_em || l.laudo?.status === 'enviado')
    ).length,
  };

  // ---- Action handlers ----
  const handleEmitirLaudo = (loteId: number) => {
    const lote = lotes.find((l) => l.id === loteId);
    if (lote?.laudo) {
      router.push(`/emissor/laudo/${loteId}`);
      return;
    }
    router.push(`/emissor/laudo/${loteId}`);
  };

  const gerarPDFClientSide = async (
    htmlContent: string,
    filename: string,
    loteId: number
  ) => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      console.log(`[PDF] Iniciando geração client-side para lote ${loteId}...`);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Não foi possível criar documento temporário');
      }

      doc.open();
      doc.write(htmlContent);
      doc.close();

      console.log('[PDF] HTML renderizado no iframe');

      await new Promise((resolve) => setTimeout(resolve, 1000));

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

      const canvas = await html2canvas(doc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 794,
        windowHeight: 1123,
      });

      console.log('[PDF] Canvas capturado');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      console.log('[PDF] PDF gerado, iniciando download...');

      pdf.save(`${filename}.pdf`);

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
      const response = await fetch(`/api/emissor/laudos/${lote.id}/download`);
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/pdf')) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laudo-${lote.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      }

      if (contentType?.includes('application/json')) {
        const data = await response.json();

        if (data.useClientSide && data.htmlEndpoint) {
          console.log(
            '[INFO] PDF não disponível no servidor. Usando geração client-side...'
          );

          const htmlResponse = await fetch(data.htmlEndpoint);

          if (!htmlResponse.ok) {
            throw new Error('Erro ao buscar HTML do laudo');
          }

          const htmlContent = await htmlResponse.text();

          await gerarPDFClientSide(htmlContent, `laudo-${lote.id}`, lote.id);

          return;
        }

        alert(`Erro: ${data.error || 'Laudo não disponível'}`);
        return;
      }

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

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }, [router]);

  return {
    // State
    loading,
    loadingMore,
    error,
    activeTab,
    setActiveTab,
    hasMore,
    filteredLotes,
    counts,
    // Actions
    handleEmitirLaudo,
    handleDownloadLaudo,
    handleRefresh,
    handleLoadMore,
    handleLogout,
    // Reprocessar
    reprocessarLaudo,
    isReprocessando,
    // PWA
    canInstall,
    handleInstallClick,
    // For child callbacks
    currentPage,
    fetchLotes,
  };
}
