'use client';

import { useState } from 'react';
import type { Lead } from '../types';

interface UseRepActionsReturn {
  actionLoading: number | null;
  leadActionLoading: string | null;
  reenviarConviteLoading: number | null;
  solicitarDadosLoading: number | null;
  erro: string;
  setErro: (v: string) => void;
  sucesso: string;
  setSucesso: (v: string) => void;
  conviteLinkCopiavel: string | null;
  setConviteLinkCopiavel: (v: string | null) => void;
  executarAcao: (
    acaoPendente: { id: number; novoStatus: string },
    motivoAcao: string,
    callbacks: { onSuccess: () => void; carregar: () => Promise<void> }
  ) => Promise<void>;
  aprovarLead: (
    lead: Lead,
    callbacks: { onSuccess: () => void; carregarLeads: () => Promise<void> }
  ) => Promise<void>;
  rejeitarLead: (
    lead: Lead,
    motivo: string,
    callbacks: { onSuccess: () => void; carregarLeads: () => Promise<void> }
  ) => Promise<void>;
  converterLead: (
    lead: Lead,
    callbacks: {
      onSuccess: () => void;
      carregarLeads: () => Promise<void>;
      carregar: () => Promise<void>;
    }
  ) => Promise<void>;
  solicitarDadosBancarios: (
    representanteId: number,
    callbacks: { onSuccess: () => void; carregar: () => Promise<void> }
  ) => Promise<void>;
  reenviarConvite: (
    representanteId: number,
    callbacks: { onSuccess: () => void; carregar: () => Promise<void> }
  ) => Promise<void>;
}

export function useRepActions(): UseRepActionsReturn {
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [leadActionLoading, setLeadActionLoading] = useState<string | null>(
    null
  );
  const [reenviarConviteLoading, setReenviarConviteLoading] = useState<
    number | null
  >(null);
  const [solicitarDadosLoading, setSolicitarDadosLoading] = useState<
    number | null
  >(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [conviteLinkCopiavel, setConviteLinkCopiavel] = useState<string | null>(
    null
  );

  const executarAcao = async (
    acaoPendente: { id: number; novoStatus: string },
    motivoAcao: string,
    callbacks: { onSuccess: () => void; carregar: () => Promise<void> }
  ) => {
    setActionLoading(acaoPendente.id);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/representantes/${acaoPendente.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            novo_status: acaoPendente.novoStatus,
            motivo: motivoAcao,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao atualizar');
        return;
      }
      setSucesso(`Status atualizado para ${acaoPendente.novoStatus}`);
      setTimeout(() => setSucesso(''), 3000);
      callbacks.onSuccess();
      await callbacks.carregar();
    } finally {
      setActionLoading(null);
    }
  };

  const aprovarLead = async (
    lead: Lead,
    callbacks: { onSuccess: () => void; carregarLeads: () => Promise<void> }
  ) => {
    setLeadActionLoading(lead.id);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/representantes-leads/${lead.id}/aprovar`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao aprovar');
        return;
      }
      setSucesso(`Lead "${lead.nome}" verificado com sucesso`);
      setTimeout(() => setSucesso(''), 3000);
      callbacks.onSuccess();
      await callbacks.carregarLeads();
    } finally {
      setLeadActionLoading(null);
    }
  };

  const rejeitarLead = async (
    lead: Lead,
    motivo: string,
    callbacks: { onSuccess: () => void; carregarLeads: () => Promise<void> }
  ) => {
    if (motivo.trim().length < 5) {
      setErro('Motivo deve ter pelo menos 5 caracteres');
      return;
    }
    setLeadActionLoading(lead.id);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/representantes-leads/${lead.id}/rejeitar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo: motivo.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao rejeitar');
        return;
      }
      setSucesso(`Lead "${lead.nome}" rejeitado`);
      setTimeout(() => setSucesso(''), 3000);
      callbacks.onSuccess();
      await callbacks.carregarLeads();
    } finally {
      setLeadActionLoading(null);
    }
  };

  const converterLead = async (
    lead: Lead,
    callbacks: {
      onSuccess: () => void;
      carregarLeads: () => Promise<void>;
      carregar: () => Promise<void>;
    }
  ) => {
    setLeadActionLoading(lead.id);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/representantes-leads/${lead.id}/converter`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao converter');
        return;
      }
      const linkMsg = data.convite_link
        ? ` | Link de convite: ${data.convite_link}`
        : '';
      setSucesso(
        `Representante criado: ${data.nome} — Código ${data.codigo}${linkMsg}`
      );
      if (data.convite_link) setConviteLinkCopiavel(data.convite_link);
      setTimeout(() => setSucesso(''), 10000);
      callbacks.onSuccess();
      await callbacks.carregarLeads();
      await callbacks.carregar();
    } finally {
      setLeadActionLoading(null);
    }
  };

  const solicitarDadosBancarios = async (
    representanteId: number,
    callbacks: { onSuccess: () => void; carregar: () => Promise<void> }
  ) => {
    setSolicitarDadosLoading(representanteId);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/representantes/${representanteId}/solicitar-dados-bancarios`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao solicitar dados bancários');
        return;
      }
      setSucesso('Solicitação de dados bancários enviada ao representante.');
      setTimeout(() => setSucesso(''), 4000);
      callbacks.onSuccess();
      await callbacks.carregar();
    } finally {
      setSolicitarDadosLoading(null);
    }
  };

  const reenviarConvite = async (
    representanteId: number,
    callbacks: { onSuccess: () => void; carregar: () => Promise<void> }
  ) => {
    setReenviarConviteLoading(representanteId);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/representantes/${representanteId}/reenviar-convite`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao reenviar convite');
        return;
      }
      setConviteLinkCopiavel(data.convite_link ?? null);
      setSucesso(
        `Convite reenviado para ${data.email}. Link válido por 7 dias.`
      );
      setTimeout(() => setSucesso(''), 10000);
      callbacks.onSuccess();
      await callbacks.carregar();
    } finally {
      setReenviarConviteLoading(null);
    }
  };

  return {
    actionLoading,
    leadActionLoading,
    reenviarConviteLoading,
    solicitarDadosLoading,
    erro,
    setErro,
    sucesso,
    setSucesso,
    conviteLinkCopiavel,
    setConviteLinkCopiavel,
    executarAcao,
    aprovarLead,
    rejeitarLead,
    converterLead,
    solicitarDadosBancarios,
    reenviarConvite,
  };
}
