'use client';

import { useEffect, useState, useCallback } from 'react';
import type {
  Clinica,
  Gestor,
  Empresa,
  ContratoPersonalizadoData,
} from './types';

export function useClinicasAdmin() {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClinica, setExpandedClinica] = useState<number | null>(null);
  const [gestoresPorClinica, setGestoresPorClinica] = useState<
    Record<number, Gestor[]>
  >({});
  const [empresasPorClinica, setEmpresasPorClinica] = useState<
    Record<number, Empresa[]>
  >({});
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>(
    {}
  );
  const [deletingClinica, setDeletingClinica] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [clinicasPersonalizado, setClinicasPersonalizado] = useState<Clinica[]>(
    []
  );
  const [showLinkContratoModal, setShowLinkContratoModal] = useState(false);
  const [contratoPersonalizadoData, setContratoPersonalizadoData] =
    useState<ContratoPersonalizadoData | null>(null);
  const [showCadastroModal, setShowCadastroModal] = useState(false);

  const fetchClinicas = useCallback(async () => {
    setLoading(true);
    try {
      const resAprovadas = await fetch('/api/admin/tomadores?tipo=clinica');
      if (resAprovadas.ok) {
        const dataAprovadas = await resAprovadas.json();
        setClinicas(dataAprovadas.tomadores || []);
      }

      const resPersonalizado = await fetch(
        '/api/admin/tomadores?tipo=clinica&plano_personalizado_pendente=true'
      );
      if (resPersonalizado.ok) {
        const dataPersonalizado = await resPersonalizado.json();
        setClinicasPersonalizado(dataPersonalizado.tomadores || []);
      }
    } catch (error) {
      console.error('Erro ao buscar clínicas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteClinica = useCallback(
    async (
      clinicaId: number,
      payload?: { admin_password: string; motivo?: string }
    ) => {
      if (!payload) {
        alert('Senha do administrador é obrigatória');
        return;
      }

      setDeletingClinica(clinicaId);
      try {
        const res = await fetch('/api/admin/clinicas/delete-secure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: payload.admin_password,
            clinicaId: clinicaId,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          const totais = data.totaisExcluidos;
          alert(
            `Clínica deletada com sucesso!\n\n` +
              `Totais excluídos:\n` +
              `- ${totais.gestores} gestor(es)\n` +
              `- ${totais.empresas} empresa(s)\n` +
              `- ${totais.funcionarios} funcionário(s)\n` +
              `- ${totais.avaliacoes} avaliação(ões)\n\n` +
              `A operação foi registrada no log de auditoria.`
          );
          await fetchClinicas();
        } else {
          alert(data.error || 'Erro ao deletar clínica');
        }
      } catch (error) {
        console.error('Erro ao deletar clínica:', error);
        alert('Erro ao deletar clínica');
      } finally {
        setDeletingClinica(null);
      }
    },
    [fetchClinicas]
  );

  const fetchGestores = useCallback(async (clinicaId: number) => {
    setLoadingDetails((prev) => ({ ...prev, [clinicaId]: true }));
    try {
      const res = await fetch(`/api/admin/clinicas/${clinicaId}/gestores`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGestoresPorClinica((prev) => ({
            ...prev,
            [clinicaId]: data.gestores || [],
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar gestores:', error);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [clinicaId]: false }));
    }
  }, []);

  const fetchEmpresas = useCallback(async (clinicaId: number) => {
    setLoadingDetails((prev) => ({ ...prev, [clinicaId]: true }));
    try {
      const res = await fetch(`/api/admin/clinicas/${clinicaId}/empresas`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEmpresasPorClinica((prev) => ({
            ...prev,
            [clinicaId]: data.empresas || [],
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [clinicaId]: false }));
    }
  }, []);

  const toggleExpand = useCallback(
    async (clinicaId: number) => {
      if (expandedClinica === clinicaId) {
        setExpandedClinica(null);
        return;
      }

      setExpandedClinica(clinicaId);

      if (!gestoresPorClinica[clinicaId]) {
        await fetchGestores(clinicaId);
      }
      if (!empresasPorClinica[clinicaId]) {
        await fetchEmpresas(clinicaId);
      }
    },
    [
      expandedClinica,
      gestoresPorClinica,
      empresasPorClinica,
      fetchGestores,
      fetchEmpresas,
    ]
  );

  useEffect(() => {
    fetchClinicas();
  }, [fetchClinicas]);

  return {
    // Data
    clinicas,
    loading,
    clinicasPersonalizado,
    expandedClinica,
    gestoresPorClinica,
    empresasPorClinica,
    loadingDetails,
    deletingClinica,

    // Delete modal
    showDeleteModal,
    setShowDeleteModal,
    deleteTargetId,
    setDeleteTargetId,
    deleteClinica,

    // Link contrato modal
    showLinkContratoModal,
    setShowLinkContratoModal,
    contratoPersonalizadoData,
    setContratoPersonalizadoData,

    // Cadastro modal
    showCadastroModal,
    setShowCadastroModal,

    // Actions
    fetchClinicas,
    toggleExpand,
  };
}
