'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AcaoPendente,
  CicloEnriquecido,
  ComissaoProvisionada,
  COMPROVANTE_MAX_SIZE,
  COMPROVANTE_MIMES,
  ResumoCiclosLegadas,
  ResumoCiclosMes,
  StatusCiclo,
} from './types';

const LIMIT = 20;

export interface CiclosState {
  selectedAno: number;
  selectedMes: number;
  statusFiltro: StatusCiclo | '';
  ciclos: CicloEnriquecido[];
  resumo: ResumoCiclosMes | null;
  total: number;
  page: number;
  loading: boolean;
  actionLoading: number | null;
  erro: string;
  sucesso: string;
  acaoPendente: AcaoPendente | null;
  motivoRejeicao: string;
  comprovanteFile: File | null;
  comprovanteErro: string;
  comprovanteInputRef: React.RefObject<HTMLInputElement>;
  provisionadas: ComissaoProvisionada[];
  provisionadasLoading: boolean;
  provisionadasExpanded: boolean;
  legadas: ResumoCiclosLegadas | null;
  legadasExpanded: boolean;
}

export interface CiclosHandlers {
  setSelectedAno: (ano: number) => void;
  setSelectedMes: (mes: number) => void;
  setStatusFiltro: (filtro: StatusCiclo | '') => void;
  setPage: (page: number | ((prev: number) => number)) => void;
  setAcaoPendente: (acao: AcaoPendente | null) => void;
  setMotivoRejeicao: (motivo: string) => void;
  setComprovanteFile: (file: File | null) => void;
  setComprovanteErro: (erro: string) => void;
  setLegadasExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  setProvisionadasExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleComprovanteFile: (f: File | null) => void;
  fecharModal: () => void;
  executarAcao: () => Promise<void>;
  carregar: () => Promise<void>;
}

// eslint-disable-next-line max-lines-per-function
export function useCiclosComissoes(): { state: CiclosState; handlers: CiclosHandlers } {
  const now = new Date();
  const [selectedAno, setSelectedAno] = useState(now.getFullYear());
  const [selectedMes, setSelectedMes] = useState(now.getMonth() + 1);
  const [statusFiltro, setStatusFiltro] = useState<StatusCiclo | ''>('');
  const [ciclos, setCiclos] = useState<CicloEnriquecido[]>([]);
  const [resumo, setResumo] = useState<ResumoCiclosMes | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [acaoPendente, setAcaoPendente] = useState<AcaoPendente | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [comprovanteErro, setComprovanteErro] = useState('');
  const comprovanteInputRef = useRef<HTMLInputElement>(null);
  const [provisionadas, setProvisionadas] = useState<ComissaoProvisionada[]>([]);
  const [provisionadasLoading, setProvisionadasLoading] = useState(false);
  const [provisionadasExpanded, setProvisionadasExpanded] = useState(true);
  const [legadas, setLegadas] = useState<ResumoCiclosLegadas | null>(null);
  const [legadasExpanded, setLegadasExpanded] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(LIMIT),
        ano: String(selectedAno), mes: String(selectedMes), com_resumo: '1',
      });
      if (statusFiltro) params.set('status', statusFiltro);
      const res = await fetch(`/api/suporte/ciclos?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        setErro(`Erro ao carregar ciclos (${res.status}): ${errData.error ?? res.statusText}`);
        return;
      }
      const data = await res.json() as {
        ciclos?: CicloEnriquecido[];
        total?: number;
        resumo?: ResumoCiclosMes;
        legadas?: ResumoCiclosLegadas;
      };
      setCiclos(data.ciclos ?? []);
      setTotal(data.total ?? 0);
      setResumo(data.resumo ?? null);
      setLegadas(data.legadas ?? null);
    } catch (e) {
      setErro(`Falha de rede: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [page, selectedAno, selectedMes, statusFiltro]);

  const carregarProvisionadas = useCallback(async () => {
    setProvisionadasLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'retida', provisionadas: '1', limit: '100',
        ano: String(selectedAno), mes: String(selectedMes),
      });
      const res = await fetch(`/api/admin/comissoes?${params}`);
      if (res.ok) {
        const data = await res.json() as { comissoes?: ComissaoProvisionada[] };
        setProvisionadas(data.comissoes ?? []);
      }
    } catch { /* non-critical */ } finally {
      setProvisionadasLoading(false);
    }
  }, [selectedAno, selectedMes]);

  useEffect(() => { void carregar(); }, [carregar]);
  useEffect(() => { void carregarProvisionadas(); }, [carregarProvisionadas]);

  const handleComprovanteFile = (f: File | null) => {
    setComprovanteErro('');
    setComprovanteFile(null);
    if (!f) return;
    if (f.size > COMPROVANTE_MAX_SIZE) {
      setComprovanteErro(`Arquivo excede 5MB (${(f.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }
    if (!COMPROVANTE_MIMES.includes(f.type)) {
      setComprovanteErro('Tipo não aceito. Use PDF, PNG, JPG ou WEBP.');
      return;
    }
    setComprovanteFile(f);
  };

  const fecharModal = () => {
    setAcaoPendente(null);
    setMotivoRejeicao('');
    setComprovanteFile(null);
    setComprovanteErro('');
    if (comprovanteInputRef.current) comprovanteInputRef.current.value = '';
  };

  const executarAcao = async () => {
    if (!acaoPendente) return;
    const { ciclo, acao } = acaoPendente;
    setActionLoading(ciclo.id);
    setErro('');
    try {
      if (acao === 'pagar' && comprovanteFile) {
        const formData = new FormData();
        formData.append('comprovante', comprovanteFile);
        const pagarRes = await fetch(`/api/suporte/ciclos/${ciclo.id}/pagar`, { method: 'POST', body: formData });
        const pagarData = await pagarRes.json().catch(() => ({})) as { error?: string };
        if (!pagarRes.ok) { setErro(pagarData.error ?? 'Erro ao registrar pagamento'); return; }
      } else {
        const body: Record<string, string> = { acao };
        if (acao === 'rejeitar_nf') body.motivo = motivoRejeicao;
        const res = await fetch(`/api/comissionamento/ciclos/${ciclo.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        const data = await res.json() as { error?: string };
        if (!res.ok) { setErro(data.error ?? 'Erro ao executar ação'); return; }
      }
      setSucesso(`${acao} executado com sucesso`);
      setTimeout(() => setSucesso(''), 3500);
      fecharModal();
      await carregar();
    } finally {
      setActionLoading(null);
    }
  };

  return {
    state: {
      selectedAno, selectedMes, statusFiltro, ciclos, resumo, total, page, loading,
      actionLoading, erro, sucesso, acaoPendente, motivoRejeicao, comprovanteFile,
      comprovanteErro, comprovanteInputRef, provisionadas, provisionadasLoading,
      provisionadasExpanded, legadas, legadasExpanded,
    },
    handlers: {
      setSelectedAno, setSelectedMes, setStatusFiltro, setPage, setAcaoPendente,
      setMotivoRejeicao, setComprovanteFile, setComprovanteErro, setLegadasExpanded,
      setProvisionadasExpanded, handleComprovanteFile, fecharModal, executarAcao, carregar,
    },
  };
}
