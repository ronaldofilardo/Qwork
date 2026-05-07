'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import type { LaudoPadronizado } from '@/lib/laudo-tipos';

type LaudoStatus =
  | 'rascunho'
  | 'pdf_gerado'
  | 'emitido'
  | 'enviado'
  | null;

interface Lote {
  id: number;
  empresa_nome: string;
  clinica_nome: string;
  numero_ordem?: number | null;
}

export function useLaudo() {
  const params = useParams();
  const loteId = parseInt(params.loteId as string);
  const router = useRouter();

  const [lote, setLote] = useState<Lote | null>(null);
  const [laudoPadronizado, setLaudoPadronizado] =
    useState<LaudoPadronizado | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [isPrevia, setIsPrevia] = useState(false);
  const [laudoStatus, setLaudoStatus] = useState<LaudoStatus>(null);
  const [gerandoLaudo, setGerandoLaudo] = useState(false);
  const [modalUploadOpen, setModalUploadOpen] = useState(false);

  const fetchLaudo = useCallback(async () => {
    try {
      const response = await fetch(`/api/emissor/laudos/${loteId}`);
      const data = await response.json();
      if (data.success) {
        setLote(data.lote);
        setLaudoPadronizado(data.laudoPadronizado);
        setIsPrevia(Boolean(data.previa));
        setMensagem(data.mensagem || null);
        setLaudoStatus((data.laudo_status ?? null) as LaudoStatus);
      } else {
        toast.error(data.error || 'Erro ao carregar laudo');
        router.push('/emissor');
      }
    } catch {
      toast.error('Erro ao conectar com o servidor');
      router.push('/emissor');
    } finally {
      setLoading(false);
    }
  }, [loteId, router]);

  useEffect(() => {
    fetchLaudo();
  }, [fetchLaudo]);

  const handleGerarLaudo = async () => {
    if (!lote) return;
    try {
      setGerandoLaudo(true);
      toast.loading('Gerando laudo...', { id: 'gerar-laudo' });
      const response = await fetch(`/api/emissor/laudos/${loteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        toast.dismiss('gerar-laudo');
        toast.success('PDF gerado! Acesse "Laudo emitido" para baixar e enviar ao bucket.');
        router.push('/emissor');
      } else {
        toast.dismiss('gerar-laudo');
        const errorMsg = data.detalhes ? `${data.error}: ${data.detalhes}` : (data.error || 'Erro ao gerar laudo');
        console.error('[useLaudo] Erro da API:', errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      toast.dismiss('gerar-laudo');
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setGerandoLaudo(false);
    }
  };

  const handleDownloadLaudo = async () => {
    if (!lote) return;
    try {
      toast.loading('Baixando laudo...', { id: 'download-laudo' });
      const response = await fetch(`/api/emissor/laudos/${loteId}/download`);
      if (!response.ok) {
        const errorData = await response.json();
        toast.dismiss('download-laudo');
        toast.error(`Erro ao baixar laudo: ${errorData.error}`);
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo-${lote.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.dismiss('download-laudo');
      toast.success('Laudo baixado com sucesso');
    } catch {
      toast.dismiss('download-laudo');
      toast.error('Erro ao fazer download do laudo');
    }
  };

  const handleUploadSuccess = async (laudoId: number) => {
    setModalUploadOpen(false);
    toast.success(`Laudo ${laudoId} emitido com sucesso!`);
    await fetchLaudo();
  };

  return {
    loteId,
    lote,
    laudoPadronizado,
    loading,
    mensagem,
    isPrevia,
    laudoStatus,
    gerandoLaudo,
    modalUploadOpen,
    setModalUploadOpen,
    handleGerarLaudo,
    handleDownloadLaudo,
    handleUploadSuccess,
    router,
  };
}
