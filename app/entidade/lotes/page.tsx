'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket } from 'lucide-react';
import { LiberarLoteModal } from '@/components/modals/LiberarLoteModal';
import { LotesGrid } from '@/components/rh';
import toast from 'react-hot-toast';

interface LoteAvaliacao {
  id: number;
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
  // Informações de solicitação de emissão
  solicitado_por?: string;
  solicitado_em?: string;
  tipo_solicitante?: string;
}

interface Laudo {
  id: number;
  lote_id: number;
  emissor_nome: string;
  enviado_em: string;
  emitido_em?: string;
  hash: string;
  status?: string;
}

export default function LotesPage() {
  const router = useRouter();
  const [lotes, setLotes] = useState<LoteAvaliacao[]>([]);
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLiberarModal, setShowLiberarModal] = useState(false);
  const [downloadingLaudo, setDownloadingLaudo] = useState<number | null>(null);

  // Referência para o intervalo de polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadLotes = useCallback(async () => {
    try {
      const timestamp = new Date().getTime();
      const lotesRes = await fetch(`/api/entidade/lotes?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      if (lotesRes.ok) {
        const lotesData = await lotesRes.json();
        setLotes(lotesData.lotes || []);

        // Converter lotes para formato de laudos para compatibilidade com LotesGrid
        const laudosFromLotes: Laudo[] = (lotesData.lotes || [])
          .filter((lote: LoteAvaliacao) => lote.laudo_id)
          .map((lote: LoteAvaliacao) => ({
            id: lote.laudo_id!,
            lote_id: lote.id,
            emissor_nome: lote.emissor_nome || 'N/A',
            enviado_em: lote.laudo_enviado_em || '',
            emitido_em: lote.laudo_emitido_em || '',
            hash: lote.laudo_hash || '',
            status: lote.laudo_status || 'emitido',
          }));
        setLaudos(laudosFromLotes);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar lotes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregamento inicial
  useEffect(() => {
    loadLotes();
  }, [loadLotes]);

  // Polling: atualizar a cada 30 segundos para verificar mudanças de status
  useEffect(() => {
    // Limpar intervalo anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Configurar novo intervalo de polling
    pollingIntervalRef.current = setInterval(() => {
      loadLotes();
    }, 30000); // 30 segundos

    // Cleanup: limpar intervalo quando componente desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loadLotes]);

  const handleLoteClick = useCallback(
    (loteId: number) => {
      router.push(`/entidade/lote/${loteId}`);
    },
    [router]
  );

  const handleDownloadLaudo = useCallback(async (laudo: Laudo) => {
    if (!laudo.id) {
      toast.error('Laudo não disponível');
      return;
    }

    setDownloadingLaudo(laudo.id);

    try {
      // Passo 1: Verificar integridade do hash
      toast.loading('Verificando integridade do laudo...', {
        id: `laudo-verify-${laudo.id}`,
      });

      const verifyResponse = await fetch(
        `/api/entidade/laudos/${laudo.id}/verify-hash`
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Erro ao verificar laudo');
      }

      const verifyData = await verifyResponse.json();

      if (!verifyData.hash_valido) {
        toast.error(
          '⚠️ ATENÇÃO: O hash do laudo não corresponde ao original! O arquivo pode ter sido modificado.',
          { id: `laudo-verify-${laudo.id}`, duration: 8000 }
        );
        console.error('[HASH INVÁLIDO]', {
          laudo_id: laudo.id,
          hash_armazenado: verifyData.hash_armazenado,
          hash_calculado: verifyData.hash_calculado,
        });
        return;
      }

      // Passo 2: Hash válido - confirmar ao usuário
      toast.success(
        '✅ Integridade verificada! O laudo é autêntico e não foi modificado.',
        {
          id: `laudo-verify-${laudo.id}`,
          duration: 3000,
        }
      );

      // Pequeno delay para o usuário ver a mensagem de verificação
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Passo 3: Fazer o download
      toast.loading('Baixando laudo...', { id: `laudo-download-${laudo.id}` });

      const response = await fetch(`/api/entidade/laudos/${laudo.id}/download`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao baixar laudo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo-${laudo.lote_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Laudo baixado com sucesso!', {
        id: `laudo-download-${laudo.id}`,
      });
    } catch (error: any) {
      console.error('Erro ao baixar laudo:', error);
      toast.error(error.message || 'Erro ao baixar laudo', {
        id: `laudo-verify-${laudo.id}`,
      });
    } finally {
      setDownloadingLaudo(null);
    }
  }, []);

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

      {/* Grid de Lotes - Usando componente reutilizável */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <LotesGrid
          lotes={lotes}
          laudos={laudos}
          downloadingLaudo={downloadingLaudo}
          onLoteClick={handleLoteClick}
          onDownloadLaudo={handleDownloadLaudo}
          onRefresh={loadLotes}
        />
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
