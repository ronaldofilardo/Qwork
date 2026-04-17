'use client';

import { useEffect, useState } from 'react';
import {
  UserCheck,
  KeyRound,
  FileText,
  Shield,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Wallet,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { ModalResetarSenha } from '@/components/admin/ModalResetarSenha';

interface Usuario {
  id: number;
  cpf: string;
  nome: string;
  email: string;
  ativo: boolean;
  perfil: 'emissor' | 'suporte' | 'comercial' | 'rh' | 'gestor' | 'admin';
  total_laudos_emitidos: number;
  crp?: string | null;
  titulo_profissional?: string | null;
  asaas_wallet_id?: string | null;
}

const perfilLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-gray-900 text-white' },
  emissor: { label: 'Emissor de Laudos', color: 'bg-blue-100 text-blue-800' },
  suporte: { label: 'Suporte', color: 'bg-purple-100 text-purple-800' },
  comercial: { label: 'Comercial', color: 'bg-green-100 text-green-800' },
  rh: { label: 'RH', color: 'bg-yellow-100 text-yellow-800' },
  gestor: { label: 'Gestor', color: 'bg-indigo-100 text-indigo-800' },
};

export function EmissoresContent() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalResetOpen, setModalResetOpen] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [erroToggle, setErroToggle] = useState<string | null>(null);
  // wallet edit state
  const [editingWallet, setEditingWallet] = useState<number | null>(null);
  const [walletDraft, setWalletDraft] = useState('');
  const [savingWallet, setSavingWallet] = useState<number | null>(null);
  const [erroWallet, setErroWallet] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/emissores');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsuarios(data.emissores || []);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAtivo = async (usuario: Usuario) => {
    setToggling(usuario.id);
    setErroToggle(null);
    try {
      const res = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !usuario.ativo }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Erro ao atualizar');
      }
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, ativo: !usuario.ativo } : u
        )
      );
    } catch (e: unknown) {
      setErroToggle(
        e instanceof Error ? e.message : 'Erro ao atualizar usuário'
      );
    } finally {
      setToggling(null);
    }
  };

  const saveWallet = async (usuario: Usuario) => {
    const wallet = walletDraft.trim();
    if (!wallet) {
      setErroWallet('Wallet ID não pode ser vazio');
      return;
    }
    setSavingWallet(usuario.id);
    setErroWallet(null);
    try {
      const res = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asaas_wallet_id: wallet }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Erro ao salvar wallet');
      }
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, asaas_wallet_id: wallet } : u
        )
      );
      setEditingWallet(null);
      setWalletDraft('');
    } catch (e: unknown) {
      setErroWallet(e instanceof Error ? e.message : 'Erro ao salvar wallet');
    } finally {
      setSavingWallet(null);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Agrupar por perfil
  const usuariosPorPerfil: Record<string, Usuario[]> = {};
  for (const u of usuarios) {
    if (!usuariosPorPerfil[u.perfil]) usuariosPorPerfil[u.perfil] = [];
    usuariosPorPerfil[u.perfil].push(u);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Perfis Especiais
        </h2>
        <button
          onClick={() => setModalResetOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
          Resetar Senha
        </button>
      </div>

      {erroToggle && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {erroToggle}
        </div>
      )}

      {erroWallet && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {erroWallet}
        </div>
      )}

      {usuarios.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Nenhum usuario com perfil especial cadastrado
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(usuariosPorPerfil).map(([perfil, usuariosGrupo]) => {
            if (usuariosGrupo.length === 0) return null;

            const perfilConfig = perfilLabels[perfil] ?? {
              label: perfil,
              color: 'bg-gray-100 text-gray-800',
            };

            return (
              <div key={perfil}>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {perfilConfig.label}
                  </h3>
                  <span className="text-sm text-gray-600">
                    ({usuariosGrupo.length})
                  </span>
                </div>

                <div className="grid gap-4">
                  {usuariosGrupo.map((usuario) => {
                    const mostraWallet =
                      usuario.perfil === 'admin' ||
                      usuario.perfil === 'comercial';
                    const isEditingWallet = editingWallet === usuario.id;

                    return (
                      <div
                        key={usuario.cpf}
                        className={`border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white ${!usuario.ativo ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-4">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {usuario.nome}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              CPF: {usuario.cpf}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {usuario.email}
                            </p>

                            {/* Wallet Asaas — apenas admin e comercial */}
                            {mostraWallet && (
                              <div className="mt-2">
                                {isEditingWallet ? (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Wallet className="w-4 h-4 text-gray-400 shrink-0" />
                                    <input
                                      autoFocus
                                      type="text"
                                      value={walletDraft}
                                      onChange={(e) => {
                                        setWalletDraft(e.target.value);
                                        setErroWallet(null);
                                      }}
                                      placeholder="Wallet ID Asaas"
                                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <button
                                      onClick={() => void saveWallet(usuario)}
                                      disabled={savingWallet === usuario.id}
                                      title="Salvar"
                                      className="p-1 rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 disabled:opacity-50 cursor-pointer"
                                    >
                                      {savingWallet === usuario.id ? (
                                        <Loader2
                                          size={14}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <Check size={14} />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingWallet(null);
                                        setWalletDraft('');
                                        setErroWallet(null);
                                      }}
                                      title="Cancelar"
                                      className="p-1 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200 cursor-pointer"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Wallet className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="text-sm text-gray-500 font-mono">
                                      {usuario.asaas_wallet_id ?? (
                                        <span className="text-gray-400 italic">
                                          sem wallet
                                        </span>
                                      )}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditingWallet(usuario.id);
                                        setWalletDraft(
                                          usuario.asaas_wallet_id ?? ''
                                        );
                                        setErroWallet(null);
                                      }}
                                      title="Editar Wallet ID"
                                      className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {usuario.perfil === 'emissor' && (
                              <div className="flex flex-col gap-1 mt-2">
                                {usuario.titulo_profissional && (
                                  <p className="text-sm text-gray-600">
                                    {usuario.titulo_profissional}
                                    {usuario.crp ? ` — CRP ${usuario.crp}` : ''}
                                  </p>
                                )}
                                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    {usuario.total_laudos_emitidos} laudos
                                    emitidos
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${perfilConfig.color}`}
                            >
                              {perfilConfig.label}
                            </span>
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${
                                usuario.ativo
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {usuario.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                            {/* Admin não pode ser inativado pela UI */}
                            {usuario.perfil !== 'admin' && (
                              <button
                                onClick={() => void toggleAtivo(usuario)}
                                disabled={toggling === usuario.id}
                                title={
                                  usuario.ativo
                                    ? 'Inativar usuário'
                                    : 'Ativar usuário'
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                                  usuario.ativo
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                }`}
                              >
                                {toggling === usuario.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : usuario.ativo ? (
                                  <ToggleRight size={14} />
                                ) : (
                                  <ToggleLeft size={14} />
                                )}
                                {toggling === usuario.id
                                  ? 'Aguarde...'
                                  : usuario.ativo
                                    ? 'Inativar'
                                    : 'Ativar'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ModalResetarSenha
        isOpen={modalResetOpen}
        onClose={() => setModalResetOpen(false)}
      />
    </div>
  );
}
