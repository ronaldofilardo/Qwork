import { useState, useCallback } from 'react';

export interface Laudo {
  id: number;
  lote_id: number;
  codigo: string;
  titulo: string;
  empresa_nome: string;
  clinica_nome: string;
  emissor_nome: string;
  enviado_em: string;
  hash: string;
}

/**
 * Hook para gerenciar laudos
 * @param empresaId ID da empresa
 * @returns Estado e funções para manipular laudos
 */
export function useLaudos(empresaId: string) {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingLaudo, setDownloadingLaudo] = useState<number | null>(null);

  const fetchLaudos = useCallback(async () => {
    if (!empresaId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/rh/laudos?empresa_id=${empresaId}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar laudos');
      }

      const laudosData = await response.json();
      setLaudos(laudosData.laudos || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao carregar laudos:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  const handleDownloadLaudo = useCallback(async (laudo: Laudo) => {
    if (!laudo?.id) {
      alert('Erro: ID do laudo inválido');
      return;
    }

    try {
      setDownloadingLaudo(laudo.id);
      const response = await fetch(`/api/rh/laudos/${laudo.id}/download`);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Erro desconhecido' }));
        alert(
          `Erro ao baixar laudo: ${
            errorData.error || 'Erro na resposta do servidor'
          }`
        );
        return;
      }

      // Verificar se a resposta é realmente um PDF
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/pdf')) {
        alert('Erro: O arquivo baixado não é um PDF válido');
        return;
      }

      // Criar blob e download
      const blob = await response.blob();
      if (blob.size === 0) {
        alert('Erro: O arquivo PDF está vazio');
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo-${laudo.id}.pdf`;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Erro ao fazer download:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      alert(`Erro ao fazer download do laudo: ${errorMessage}`);
    } finally {
      setDownloadingLaudo(null);
    }
  }, []);

  return {
    laudos,
    loading,
    error,
    downloadingLaudo,
    fetchLaudos,
    handleDownloadLaudo,
    setLaudos,
  };
}
