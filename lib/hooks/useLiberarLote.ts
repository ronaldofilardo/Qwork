import { useState, useCallback } from 'react';

export interface FuncionarioElegivel {
  funcionario_cpf: string;
  funcionario_nome: string;
  motivo_inclusao: string;
  indice_atual: number;
  dias_sem_avaliacao: number | null;
  prioridade: 'CRÍTICA' | 'ALTA' | 'MÉDIA' | 'NORMAL';
}

export interface ResumoInclusao {
  funcionarios_novos: number;
  indices_atrasados: number;
  mais_de_1_ano_sem_avaliacao: number;
  renovacoes_regulares: number;
  prioridade_critica: number;
  prioridade_alta: number;
  mensagem: string;
}

export interface LoteResponse {
  success: boolean;
  message?: string;
  error?: string;
  error_code?: string;
  hint?: string;
  lote?: {
    id: number;
    // codigo: removido
    numero_ordem: number;
    tipo: string;
    liberado_em: string;
  };
  estatisticas?: {
    avaliacoesCreated: number;
    totalFuncionarios: number;
    empresa: string;
  };
  resumoInclusao?: ResumoInclusao;
  detalhes?: FuncionarioElegivel[];
}

export interface LiberarLoteParams {
  empresaId: number;
  descricao?: string;
  tipo?: 'completo' | 'operacional' | 'gestao';
  dataFiltro?: string;
  loteReferenciaId?: number;
}

export function useLiberarLote() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [result, setResult] = useState<LoteResponse | null>(null);

  const liberarLote = useCallback(async (params: LiberarLoteParams) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/rh/liberar-lote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data: LoteResponse = (await response.json()) as LoteResponse;

      if (!response.ok) {
        setError(data.error || 'Erro ao liberar lote');
        setErrorCode(data.error_code || null);
        setErrorHint(data.hint || null);
        setResult(null);
        return data;
      }

      setResult(data);
      setErrorCode(null);
      setErrorHint(null);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      setErrorCode(null);
      setErrorHint(null);
      setResult(null);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setErrorCode(null);
    setErrorHint(null);
    setResult(null);
  }, []);

  return {
    liberarLote,
    loading,
    error,
    errorCode,
    errorHint,
    result,
    reset,
  };
}
