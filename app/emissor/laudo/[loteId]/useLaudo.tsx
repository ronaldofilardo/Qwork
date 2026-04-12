'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import type { LaudoPadronizado } from '@/lib/laudo-tipos';

type LaudoStatus =
  | 'rascunho'
  | 'pdf_gerado'
  | 'aguardando_assinatura'
  | 'assinado_processando'
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
  const [assinandoLaudo, setAssinandoLaudo] = useState(false);
  const [modalUploadOpen, setModalUploadOpen] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Gerenciar polling com base no laudoStatus
  useEffect(() => {
    if (laudoStatus === 'aguardando_assinatura') {
      if (pollingRef.current) return;
      pollingRef.current = setInterval(async () => {
        try {
          // Usar endpoint leve /status-assinatura em vez do endpoint completo
          const res = await fetch(
            `/api/emissor/laudos/${loteId}/status-assinatura`
          );
          const data = await res.json();
          if (
            data.success &&
            data.laudo?.status &&
            data.laudo.status !== 'aguardando_assinatura' &&
            data.laudo.status !== 'assinado_processando'
          ) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setLaudoStatus(data.laudo.status as LaudoStatus);
            if (data.laudo.status === 'enviado') {
              toast.success('Laudo assinado e enviado com sucesso!');
              fetchLaudo().catch(() => null);
            }
          }
        } catch {
          // silencioso
        }
      }, 10000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [laudoStatus, loteId, fetchLaudo]);

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
        if (data.pdf_gerado) {
          toast.success(
            'PDF gerado! Clique em "Assinar Digitalmente" para prosseguir.'
          );
        } else {
          toast.success('Laudo gerado com sucesso!');
        }
        await fetchLaudo();
      } else {
        toast.dismiss('gerar-laudo');
        toast.error(data.error || 'Erro ao gerar laudo');
      }
    } catch {
      toast.dismiss('gerar-laudo');
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setGerandoLaudo(false);
    }
  };

  const handleAssinarDigitalmente = async () => {
    if (!lote) return;
    try {
      setAssinandoLaudo(true);
      toast.loading('Enviando para assinatura...', { id: 'assinar-laudo' });
      const response = await fetch(`/api/emissor/laudos/${loteId}/assinar`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        toast.dismiss('assinar-laudo');
        if (data.sign_url) {
          toast.success(
            (t) => (
              <span>
                Laudo enviado para assinatura!{' '}
                <a
                  href={data.sign_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold"
                  onClick={() => toast.dismiss(t.id)}
                >
                  Clique aqui para assinar
                </a>
              </span>
            ),
            { duration: 30000 }
          );
        } else {
          toast.success(
            'Laudo enviado para assinatura digital! Verifique seu email.'
          );
        }
        await fetchLaudo();
      } else {
        toast.dismiss('assinar-laudo');
        toast.error(data.error || 'Erro ao enviar para assinatura');
      }
    } catch {
      toast.dismiss('assinar-laudo');
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setAssinandoLaudo(false);
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
    assinandoLaudo,
    modalUploadOpen,
    setModalUploadOpen,
    handleGerarLaudo,
    handleAssinarDigitalmente,
    handleDownloadLaudo,
    handleUploadSuccess,
    router,
  };
}
