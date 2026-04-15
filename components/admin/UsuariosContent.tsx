'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface UsuarioSistema {
  id: number;
  cpf: string;
  nome: string;
  email: string | null;
  tipo_usuario: string;
  ativo: boolean;
  criado_em: string;
}

const TIPO_LABEL: Record<string, { label: string; color: string }> = {
  suporte: { label: 'Suporte', color: 'bg-purple-100 text-purple-800' },
  comercial: { label: 'Comercial', color: 'bg-green-100 text-green-800' },
};

function fmtCPF(v: string | null) {
  if (!v) return '-';
  const d = v.replace(/\D/g, '');
  if (d.length === 11)
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return v;
}

export function UsuariosContent() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const carregar = async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch('/api/admin/usuarios');
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Erro ao buscar usuários');
      }
      const data = (await res.json()) as { usuarios: UsuarioSistema[] };
      setUsuarios(data.usuarios ?? []);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  const toggleAtivo = async (usuario: UsuarioSistema) => {
    setToggling(usuario.id);
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
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar usuário');
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-orange-500" />
            Usuários do Sistema
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Gerenciar acesso de usuários Suporte e Comercial
          </p>
        </div>
        <button
          onClick={() => void carregar()}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Atualizar
        </button>
      </div>

      {erro && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={14} className="shrink-0" />
          {erro}
        </div>
      )}

      {usuarios.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Users size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  CPF
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Perfil
                </th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usuarios.map((u) => {
                const label = TIPO_LABEL[u.tipo_usuario] ?? {
                  label: u.tipo_usuario,
                  color: 'bg-gray-100 text-gray-600',
                };
                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-gray-50 transition-colors ${!u.ativo ? 'opacity-60' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-gray-900">{u.nome}</p>
                        {u.email && (
                          <p className="text-xs text-gray-400">{u.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-gray-600 text-xs">
                      {fmtCPF(u.cpf)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${label.color}`}
                      >
                        {label.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          u.ativo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => void toggleAtivo(u)}
                        disabled={toggling === u.id}
                        title={u.ativo ? 'Inativar usuário' : 'Ativar usuário'}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                          u.ativo
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        }`}
                      >
                        {toggling === u.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : u.ativo ? (
                          <ToggleRight size={14} />
                        ) : (
                          <ToggleLeft size={14} />
                        )}
                        {toggling === u.id
                          ? 'Aguarde...'
                          : u.ativo
                            ? 'Inativar'
                            : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
