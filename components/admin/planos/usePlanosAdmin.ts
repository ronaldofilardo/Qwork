'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Plano, PlanoFormData } from './types';
import { EMPTY_FORM, caracteristicasToArray } from './types';

export function usePlanosAdmin() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PlanoFormData>({ ...EMPTY_FORM });

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Plano | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMotivo, setDeleteMotivo] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadPlanos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/planos');
      if (response.ok) {
        const data = await response.json();
        setPlanos(data.planos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const caracteristicasArray = formData.caracteristicas
          .split('\n')
          .filter((c) => c.trim());

        const payload = {
          nome: formData.nome,
          tipo: formData.tipo,
          descricao: formData.descricao,
          ...(formData.tipo === 'fixo' && {
            preco: parseFloat(formData.preco),
          }),
          caracteristicas: caracteristicasArray,
          ativo: formData.ativo,
        };

        const url = editingId
          ? `/api/admin/planos/${editingId}`
          : '/api/admin/planos';
        const method = editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          await loadPlanos();
          closeModal();
        } else {
          const error = await response.json();
          alert(error.error || 'Erro ao salvar plano');
        }
      } catch (error) {
        console.error('Erro ao salvar plano:', error);
        alert('Erro ao salvar plano');
      }
    },
    [formData, editingId, loadPlanos, closeModal]
  );

  const handleEdit = useCallback((plano: Plano) => {
    setEditingId(plano.id);
    setFormData({
      nome: plano.nome,
      tipo: plano.tipo,
      descricao: plano.descricao || '',
      preco: plano.preco.toString(),
      caracteristicas:
        caracteristicasToArray(plano.caracteristicas).join('\n') || '',
      ativo: plano.ativo,
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      const p = planos.find((x) => x.id === id) || null;
      setDeleteTarget(p);
      setDeletePassword('');
      setDeleteMotivo('');
      setDeleteError(null);
      setShowDeleteModal(true);
    },
    [planos]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    if (!deletePassword || deletePassword.trim().length === 0) {
      setDeleteError('Senha do admin é obrigatória');
      return;
    }
    if (!deleteMotivo || deleteMotivo.trim().length === 0) {
      setDeleteError('Motivo é obrigatório');
      return;
    }

    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/planos/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_password: deletePassword,
          motivo: deleteMotivo,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setDeleteError(payload?.error || 'Falha ao excluir plano');
        setDeleteLoading(false);
        return;
      }

      setShowDeleteModal(false);
      setDeleteTarget(null);
      await loadPlanos();
    } catch (err) {
      console.error('Erro ao deletar plano (client):', err);
      setDeleteError('Erro de rede ao excluir plano');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, deletePassword, deleteMotivo, loadPlanos]);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }, []);

  useEffect(() => {
    loadPlanos();
  }, [loadPlanos]);

  return {
    planos,
    loading,

    // Create/Edit modal
    showModal,
    setShowModal,
    editingId,
    formData,
    setFormData,
    closeModal,
    handleSubmit,
    handleEdit,

    // Delete modal
    showDeleteModal,
    deleteTarget,
    deletePassword,
    setDeletePassword,
    deleteMotivo,
    setDeleteMotivo,
    deleteLoading,
    deleteError,
    handleDelete,
    confirmDelete,
    closeDeleteModal,
  };
}
