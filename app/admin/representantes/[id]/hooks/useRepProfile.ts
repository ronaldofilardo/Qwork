'use client';

import { useState, useCallback, useEffect } from 'react';
import type { RepProfile } from '../types';

interface UseRepProfileReturn {
  rep: RepProfile | null;
  loadingRep: boolean;
  erroRep: string;
  actionLoading: boolean;
  erro: string;
  setErro: (v: string) => void;
  sucesso: string;
  setSucesso: (v: string) => void;
  editandoComissao: boolean;
  setEditandoComissao: (v: boolean) => void;
  percentualInput: string;
  setPercentualInput: (v: string) => void;
  salvandoPercentual: boolean;
  carregarRep: () => Promise<void>;
  executarAcao: (novoStatus: string, motivo: string) => Promise<void>;
  salvarPercentual: () => Promise<void>;
}

export function useRepProfile(id: string): UseRepProfileReturn {
  const [rep, setRep] = useState<RepProfile | null>(null);
  const [loadingRep, setLoadingRep] = useState(true);
  const [erroRep, setErroRep] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [editandoComissao, setEditandoComissao] = useState(false);
  const [percentualInput, setPercentualInput] = useState('');
  const [salvandoPercentual, setSalvandoPercentual] = useState(false);

  const carregarRep = useCallback(async () => {
    setLoadingRep(true);
    setErroRep('');
    try {
      const res = await fetch(`/api/admin/representantes/${id}`);
      if (!res.ok) {
        setErroRep('Representante não encontrado.');
        return;
      }
      const data = await res.json();
      setRep(data.representante);
    } catch {
      setErroRep('Erro ao carregar dados.');
    } finally {
      setLoadingRep(false);
    }
  }, [id]);

  useEffect(() => {
    carregarRep();
  }, [carregarRep]);

  const executarAcao = useCallback(
    async (novoStatus: string, motivo: string) => {
      if (!rep) return;
      setActionLoading(true);
      setErro('');
      try {
        const res = await fetch(`/api/admin/representantes/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ novo_status: novoStatus, motivo }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErro(data.error ?? 'Erro ao atualizar status');
          return;
        }
        setSucesso(`Status alterado para "${novoStatus}" com sucesso.`);
        setTimeout(() => setSucesso(''), 4000);
        await carregarRep();
      } finally {
        setActionLoading(false);
      }
    },
    [id, rep, carregarRep]
  );

  const salvarPercentual = useCallback(async () => {
    const val = parseFloat(percentualInput);
    if (isNaN(val) || val < 0 || val > 100) {
      setErro('Percentual inválido (0-100)');
      return;
    }
    setSalvandoPercentual(true);
    setErro('');
    try {
      const res = await fetch(`/api/admin/representantes/${id}/comissao`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentual: val }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao salvar');
        return;
      }
      setSucesso('Percentual atualizado!');
      setTimeout(() => setSucesso(''), 3000);
      setEditandoComissao(false);
      await carregarRep();
    } catch {
      setErro('Erro ao salvar percentual');
    } finally {
      setSalvandoPercentual(false);
    }
  }, [id, percentualInput, carregarRep]);

  return {
    rep,
    loadingRep,
    erroRep,
    actionLoading,
    erro,
    setErro,
    sucesso,
    setSucesso,
    editandoComissao,
    setEditandoComissao,
    percentualInput,
    setPercentualInput,
    salvandoPercentual,
    carregarRep,
    executarAcao,
    salvarPercentual,
  };
}
