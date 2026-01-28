import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface EmergenciaLaudoParams {
  loteId: number;
  motivo: string;
}

interface EmergenciaLaudoResponse {
  laudo_id: number;
  lote_id: number;
}

export function useEmergenciaLaudo() {
  const queryClient = useQueryClient();

  return useMutation<EmergenciaLaudoResponse, Error, EmergenciaLaudoParams>({
    mutationFn: async ({ loteId, motivo }: EmergenciaLaudoParams) => {
      // Validação client-side
      // Validação: mínimo 20 caracteres para justificativa de emergência
      if (!motivo || motivo.trim().length < 20) {
        throw new Error('Justificativa deve ter no mínimo 20 caracteres');
      }

      const response = await fetch(`/api/emissor/laudos/${loteId}/emergencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo: motivo.trim() }),
      });

      if (!response.ok) {
        const errorData: { error?: string } = await response.json();
        throw new Error(
          errorData.error || 'Erro ao forçar emissão de emergência'
        );
      }

      const data: EmergenciaLaudoResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `Laudo ${data.laudo_id} emitido em modo emergência! A emissão foi registrada no sistema de auditoria.`
      );

      // Invalidar queries relacionadas para atualizar UI
      void queryClient.invalidateQueries({ queryKey: ['lotes'] });
      void queryClient.invalidateQueries({ queryKey: ['lote', data.lote_id] });
      void queryClient.invalidateQueries({ queryKey: ['laudos'] });
      void queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro na emissão de emergência: ${error.message}`);
    },
  });
}
