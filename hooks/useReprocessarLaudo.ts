import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ReprocessarLaudoParams {
  loteId: number;
}

export function useReprocessarLaudo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ loteId }: ReprocessarLaudoParams) => {
      const response = await fetch(
        `/api/emissor/laudos/${loteId}/reprocessar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao solicitar reprocessamento');
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      toast.success('Reprocessamento solicitado com sucesso!');

      // Extrair lote id suportando duas formas de resposta
      const loteId = data?.lote_id ?? data?.lote?.id;

      // Invalidar queries relacionadas para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['lotes'] });
      if (loteId) {
        queryClient.invalidateQueries({ queryKey: ['lote', loteId] });
      }
      queryClient.invalidateQueries({ queryKey: ['fila-emissao'] });
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao solicitar reprocessamento');
    },
  });
}
