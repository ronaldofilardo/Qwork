'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  type FiltrosColuna,
  type FuncionarioBase,
  FILTROS_COLUNA_VAZIO,
} from '@/lib/lote/types';
import { normalizeString } from '@/lib/lote/utils';

interface UseLoteFiltrosOptions<T extends FuncionarioBase> {
  funcionarios: T[];
  /** Campos extras na busca (ex.: matricula no RH) */
  extraSearchFields?: (func: T, buscaNorm: string) => boolean;
}

export function useLoteFiltros<T extends FuncionarioBase>({
  funcionarios,
  extraSearchFields,
}: UseLoteFiltrosOptions<T>) {
  // ── Search ────────────────────────────────────────────────────
  const [busca, setBusca] = useState('');
  const [buscaDebouncedValue, setBuscaDebouncedValue] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'concluido' | 'pendente'
  >('todos');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Column filters ────────────────────────────────────────────
  const [filtrosColuna, setFiltrosColuna] =
    useState<FiltrosColuna>(FILTROS_COLUNA_VAZIO);

  // ── Debounce (300ms) ──────────────────────────────────────────
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setBuscaDebouncedValue(busca);
    }, 300);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [busca]);

  // ── Close dropdowns on outside click ──────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[id^="dropdown-"]') && !target.closest('button')) {
        document.querySelectorAll('[id^="dropdown-"]').forEach((dropdown) => {
          dropdown.classList.add('hidden');
        });
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ── Unique values for filter dropdowns ────────────────────────
  const getValoresUnicos = useCallback(
    (coluna: keyof FiltrosColuna) => {
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
                  ? 'Gest\u00e3o'
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
          ? prev[coluna].filter((v: string) => v !== valor)
          : [...prev[coluna], valor],
      }));
    },
    []
  );

  const limparFiltrosColuna = useCallback(() => {
    setFiltrosColuna({ ...FILTROS_COLUNA_VAZIO });
  }, []);

  // ── Filtered list ─────────────────────────────────────────────
  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter((func) => {
      // Text search
      const matchBusca =
        buscaDebouncedValue === '' ||
        (() => {
          const buscaNorm = normalizeString(buscaDebouncedValue);
          return (
            normalizeString(func.nome || '').includes(buscaNorm) ||
            normalizeString(func.cpf || '').includes(buscaNorm) ||
            normalizeString(func.setor || '').includes(buscaNorm) ||
            normalizeString(func.funcao || '').includes(buscaNorm) ||
            (extraSearchFields ? extraSearchFields(func, buscaNorm) : false)
          );
        })();

      // Status filter
      const matchStatus =
        filtroStatus === 'todos' ||
        (filtroStatus === 'concluido' &&
          (func.avaliacao.status === 'concluida' ||
            func.avaliacao.status === 'concluido')) ||
        (filtroStatus === 'pendente' &&
          func.avaliacao.status !== 'concluida' &&
          func.avaliacao.status !== 'concluido' &&
          func.avaliacao.status !== 'inativada');

      // Column filters
      const matchNome =
        filtrosColuna.nome.length === 0 ||
        filtrosColuna.nome.includes(func.nome);
      const matchCpf =
        filtrosColuna.cpf.length === 0 || filtrosColuna.cpf.includes(func.cpf);

      const nivelDisplay =
        func.nivel_cargo === 'operacional'
          ? 'Operacional'
          : func.nivel_cargo === 'gestao'
            ? 'Gest\u00e3o'
            : '';
      const matchNivel =
        filtrosColuna.nivel_cargo.length === 0 ||
        filtrosColuna.nivel_cargo.includes(nivelDisplay);

      const matchStatusColuna =
        filtrosColuna.status.length === 0 ||
        filtrosColuna.status.includes(func.avaliacao.status);

      return (
        matchBusca &&
        matchStatus &&
        matchNome &&
        matchCpf &&
        matchNivel &&
        matchStatusColuna
      );
    });
  }, [
    funcionarios,
    buscaDebouncedValue,
    filtroStatus,
    filtrosColuna,
    extraSearchFields,
  ]);

  return {
    busca,
    setBusca,
    buscaDebouncedValue,
    filtroStatus,
    setFiltroStatus,
    filtrosColuna,
    setFiltrosColuna,
    getValoresUnicos,
    toggleFiltroColuna,
    limparFiltrosColuna,
    funcionariosFiltrados,
  };
}
