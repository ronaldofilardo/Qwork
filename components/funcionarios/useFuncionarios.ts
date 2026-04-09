'use client';

/**
 * components/funcionarios/useFuncionarios.ts
 *
 * Hook customizado para gerenciamento de estado e lógica de negócio
 * do módulo de funcionários. Extraído de FuncionariosSection.tsx.
 */

import { useState, useEffect, useMemo } from 'react';
import type { Funcionario, FuncionariosStats } from './types';

interface UseFuncionariosOptions {
  contexto: 'entidade' | 'clinica';
  tomadorId?: number;
  empresaId?: number;
  defaultStatusFilter?: 'todos' | 'ativos' | 'inativos';
  onRefresh?: () => void;
}

export function useFuncionarios({
  contexto,
  tomadorId,
  empresaId,
  defaultStatusFilter = 'todos',
  onRefresh,
}: UseFuncionariosOptions) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'todos' | 'ativos' | 'inativos'
  >(defaultStatusFilter);
  const [setorFilter, setSetorFilter] = useState('todos');
  const [nivelFilter, setNivelFilter] = useState('todos');

  // Stats derivadas
  const stats: FuncionariosStats = useMemo(() => {
    const ativos = funcionarios.filter((f) => f.ativo).length;
    return {
      total: funcionarios.length,
      ativos,
      inativos: funcionarios.length - ativos,
    };
  }, [funcionarios]);

  // Funcionários filtrados
  const filteredFuncionarios = useMemo(() => {
    let filtered = [...funcionarios];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.nome.toLowerCase().includes(term) ||
          f.cpf.includes(term) ||
          f.email.toLowerCase().includes(term) ||
          f.setor.toLowerCase().includes(term) ||
          f.funcao.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter((f) =>
        statusFilter === 'ativos' ? f.ativo : !f.ativo
      );
    }

    if (setorFilter !== 'todos') {
      filtered = filtered.filter((f) => f.setor === setorFilter);
    }

    if (nivelFilter !== 'todos') {
      filtered = filtered.filter((f) => f.nivel_cargo === nivelFilter);
    }

    return filtered;
  }, [funcionarios, searchTerm, statusFilter, setorFilter, nivelFilter]);

  // Setores únicos (para filtro dropdown)
  const setoresUnicos = useMemo(
    () => Array.from(new Set(funcionarios.map((f) => f.setor))).sort(),
    [funcionarios]
  );

  // Carregar funcionários
  const loadFuncionarios = async () => {
    setLoading(true);
    try {
      let url = '';
      if (contexto === 'entidade') {
        url = '/api/entidade/funcionarios';
      } else {
        if (!empresaId) {
          console.error('empresaId é obrigatório para clínica');
          return;
        }
        url = `/api/rh/funcionarios?empresa_id=${empresaId}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const lista = data.funcionarios || data || [];
        setFuncionarios(lista);
      } else {
        console.error('Erro ao carregar funcionários:', await res.text());
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFuncionarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contexto, empresaId, tomadorId]);

  // Toggle status
  const handleToggleStatus = async (cpf: string, currentStatus: boolean) => {
    const action = currentStatus ? 'inativar' : 'ativar';
    if (!confirm(`Deseja ${action} este funcionário?`)) {
      return;
    }

    try {
      const url =
        contexto === 'entidade'
          ? '/api/entidade/funcionarios/status'
          : '/api/rh/funcionarios/status';

      const body: { cpf: string; ativo: boolean; empresa_id?: number } = {
        cpf,
        ativo: !currentStatus,
      };

      if (contexto === 'clinica' && empresaId) {
        body.empresa_id = empresaId;
      }

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFuncionarios((prev) =>
          prev.map((f) => (f.cpf === cpf ? { ...f, ativo: !currentStatus } : f))
        );
        if (onRefresh) onRefresh();
      } else {
        const error = await res.json();
        alert(`Erro ao ${action}: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do funcionário');
    }
  };

  // Success callback
  const handleSuccess = () => {
    loadFuncionarios();
    if (onRefresh) onRefresh();
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setSetorFilter('todos');
    setNivelFilter('todos');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'todos' ||
    setorFilter !== 'todos' ||
    nivelFilter !== 'todos';

  return {
    // Data
    funcionarios: filteredFuncionarios,
    allFuncionarios: funcionarios,
    stats,
    loading,
    setoresUnicos,

    // Filtros
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    setorFilter,
    setSetorFilter,
    nivelFilter,
    setNivelFilter,
    hasActiveFilters,
    clearFilters,

    // Ações
    handleToggleStatus,
    handleSuccess,
    reload: loadFuncionarios,
  };
}
