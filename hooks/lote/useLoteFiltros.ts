'use client';

import { useState, useCallback, useMemo } from 'react';
import type React from 'react';
import type { FiltrosColuna, Funcionario } from '@/lib/lote/types';
import { FILTROS_COLUNA_VAZIO } from '@/lib/lote/types';
import { normalizeString, getClassificacaoLabel } from '@/lib/lote/utils';

interface UseLoteFiltrosInput {
  funcionarios: Funcionario[];
}

interface UseLoteFiltrosReturn {
  busca: string;
  setBusca: (v: string) => void;
  buscaDebouncedValue: string;
  filtroStatus: 'todos' | 'concluido' | 'pendente';
  setFiltroStatus: (v: 'todos' | 'concluido' | 'pendente') => void;
  filtrosColuna: FiltrosColuna;
  setFiltrosColuna: React.Dispatch<React.SetStateAction<FiltrosColuna>>;
  funcionariosFiltrados: Funcionario[];
  setores: string[];
  getValoresUnicos: (coluna: keyof FiltrosColuna) => string[];
  toggleFiltroColuna: (coluna: keyof FiltrosColuna, valor: string) => void;
  limparFiltrosColuna: () => void;
  limparFiltroColuna: (coluna: keyof FiltrosColuna) => void;
}

export function useLoteFiltros({
  funcionarios,
}: UseLoteFiltrosInput): UseLoteFiltrosReturn {
  const [busca, setBusca] = useState('');
  const [buscaDebouncedValue, setBuscaDebouncedValue] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'concluido' | 'pendente'
  >('todos');
  const [filtrosColuna, setFiltrosColuna] =
    useState<FiltrosColuna>(FILTROS_COLUNA_VAZIO);

  // Debounce da busca
  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSetBusca = useCallback(
    (value: string) => {
      setBusca(value);
      if (debounceRef[0]) clearTimeout(debounceRef[0]);
      debounceRef[0] = setTimeout(() => {
        setBuscaDebouncedValue(value);
      }, 300);
    },
    [debounceRef]
  );

  const getValoresUnicos = useCallback(
    (coluna: keyof FiltrosColuna) => {
      if (coluna.startsWith('g')) {
        return ['Excelente', 'Monitorar', 'Atenção'];
      }

      const valores = funcionarios
        .map((func) => {
          switch (coluna) {
            case 'nome':
              return func.nome;
            case 'cpf':
              return func.cpf;
            case 'nivel_cargo':
              return func.nivel_cargo === 'operacional'
                ? 'Operacional'
                : func.nivel_cargo === 'gestao'
                  ? 'Gestão'
                  : '';
            case 'status':
              return func.avaliacao.status;
            default:
              return '';
          }
        })
        .filter((valor, index, arr) => valor && arr.indexOf(valor) === index);
      return valores.sort();
    },
    [funcionarios]
  );

  const toggleFiltroColuna = useCallback(
    (coluna: keyof FiltrosColuna, valor: string) => {
      setFiltrosColuna((prev) => ({
        ...prev,
        [coluna]: prev[coluna].includes(valor)
          ? prev[coluna].filter((v) => v !== valor)
          : [...prev[coluna], valor],
      }));
    },
    []
  );

  const limparFiltrosColuna = useCallback(() => {
    setFiltrosColuna(FILTROS_COLUNA_VAZIO);
  }, []);

  const limparFiltroColuna = useCallback((coluna: keyof FiltrosColuna) => {
    setFiltrosColuna((prev) => ({ ...prev, [coluna]: [] }));
  }, []);

  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter((func) => {
      // Filtro de status
      if (
        filtroStatus === 'concluido' &&
        func.avaliacao.status !== 'concluida' &&
        func.avaliacao.status !== 'concluido'
      ) {
        return false;
      }
      if (
        filtroStatus === 'pendente' &&
        func.avaliacao.status !== 'concluida' &&
        func.avaliacao.status !== 'concluido' &&
        func.avaliacao.status !== 'inativada'
      ) {
        // "pendente" means not concluida and not inativada
      } else if (filtroStatus === 'pendente') {
        return false;
      }

      // Filtro de busca
      if (buscaDebouncedValue.trim()) {
        const termo = normalizeString(buscaDebouncedValue);
        const matchBusca =
          normalizeString(func.nome || '').includes(termo) ||
          normalizeString(func.cpf || '').includes(termo) ||
          normalizeString(func.setor || '').includes(termo) ||
          normalizeString(func.funcao || '').includes(termo) ||
          (func.matricula && normalizeString(func.matricula).includes(termo));
        if (!matchBusca) return false;
      }

      // Filtros por coluna
      if (
        filtrosColuna.nome.length > 0 &&
        !filtrosColuna.nome.includes(func.nome)
      )
        return false;
      if (filtrosColuna.cpf.length > 0 && !filtrosColuna.cpf.includes(func.cpf))
        return false;

      if (filtrosColuna.nivel_cargo.length > 0) {
        const nivelDisplay =
          func.nivel_cargo === 'operacional'
            ? 'Operacional'
            : func.nivel_cargo === 'gestao'
              ? 'Gestão'
              : '';
        if (!filtrosColuna.nivel_cargo.includes(nivelDisplay)) return false;
      }

      if (
        filtrosColuna.status.length > 0 &&
        !filtrosColuna.status.includes(func.avaliacao.status)
      )
        return false;

      // Filtros por grupos G1-G10
      for (let i = 1; i <= 10; i++) {
        const grupoKey = `g${i}` as keyof FiltrosColuna;
        if (filtrosColuna[grupoKey].length > 0) {
          const media = func.grupos?.[`g${i}` as keyof typeof func.grupos];
          const classificacao = getClassificacaoLabel(media, i);
          if (!filtrosColuna[grupoKey].includes(classificacao)) return false;
        }
      }

      return true;
    });
  }, [funcionarios, filtroStatus, buscaDebouncedValue, filtrosColuna]);

  const setores = useMemo(() => {
    return [
      ...new Set(
        funcionarios
          .filter(
            (f) =>
              f.avaliacao.status === 'concluida' ||
              f.avaliacao.status === 'concluido'
          )
          .map((f) => f.setor)
          .filter(Boolean)
      ),
    ].sort();
  }, [funcionarios]);

  return {
    busca,
    setBusca: handleSetBusca,
    buscaDebouncedValue,
    filtroStatus,
    setFiltroStatus,
    filtrosColuna,
    setFiltrosColuna,
    funcionariosFiltrados,
    setores,
    getValoresUnicos,
    toggleFiltroColuna,
    limparFiltrosColuna,
    limparFiltroColuna,
  };
}
