import { useState, useCallback } from 'react';

interface AvaliacaoFuncionario {
  id: number;
  inicio: string;
  envio: string | null;
  status: string;
  lote_id?: number;
  lote_codigo?: string;
}

export interface Funcionario {
  cpf: string;
  nome: string;
  setor: string;
  funcao: string;
  email: string;
  matricula: string | null;
  nivel_cargo: 'operacional' | 'gestao' | null;
  turno: string | null;
  escala: string | null;
  empresa_nome: string;
  ativo: boolean;
  data_inclusao: string | null;
  criado_em: string;
  atualizado_em: string;
  avaliacoes?: AvaliacaoFuncionario[];
  indice_avaliacao?: number;
  data_ultimo_lote?: string | null;
}

/**
 * Hook para gerenciar funcionários de uma empresa
 * @param empresaId ID da empresa
 * @param perfil Perfil do usuário ('rh' ou 'admin')
 * @returns Estado e funções para manipular funcionários
 */
export function useFuncionarios(empresaId?: string, perfil?: string) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFuncionarios = useCallback(async () => {
    if (!empresaId || !perfil) return;

    try {
      setLoading(true);
      setError(null);

      let funcionariosUrl = '';
      if (perfil === 'rh') {
        funcionariosUrl = `/api/rh/funcionarios?empresa_id=${empresaId}`;
      } else {
        funcionariosUrl = `/api/admin/funcionarios?empresa_id=${empresaId}`;
      }

      const funcionariosRes = await fetch(funcionariosUrl);

      if (!funcionariosRes.ok) {
        throw new Error('Erro ao carregar funcionários');
      }

      const funcionariosData = await funcionariosRes.json();

      // Suporta tanto array direto quanto objeto com .funcionarios
      const lista = funcionariosData.funcionarios || funcionariosData || [];
      setFuncionarios(lista);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao carregar funcionários:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [empresaId, perfil]);

  const atualizarStatusFuncionario = useCallback(
    async (cpf: string, novoStatus: boolean) => {
      try {
        const confirmacao = novoStatus
          ? 'Tem certeza que deseja reativar este funcionário? Ele voltará a receber novos lotes de avaliação.'
          : 'Tem certeza que deseja desativar este funcionário? Ele não receberá novos lotes de avaliação.';

        if (!confirm(confirmacao)) return false;

        const response = await fetch(`/api/rh/funcionarios/${cpf}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ativo: novoStatus }),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar status');
        }

        // Atualizar lista local
        setFuncionarios((prev) =>
          prev.map((f) => (f.cpf === cpf ? { ...f, ativo: novoStatus } : f))
        );

        return true;
      } catch (err) {
        console.error('Erro ao atualizar status:', err);
        alert('Erro ao atualizar status do funcionário');
        return false;
      }
    },
    []
  );

  return {
    funcionarios,
    loading,
    error,
    fetchFuncionarios,
    atualizarStatusFuncionario,
    setFuncionarios,
  };
}
