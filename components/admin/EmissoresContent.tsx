'use client';

import { useEffect, useState } from 'react';
import { UserCheck, KeyRound, FileText, Shield } from 'lucide-react';
import { ModalResetarSenha } from '@/components/admin/ModalResetarSenha';

interface Usuario {
  cpf: string;
  nome: string;
  email: string;
  ativo: boolean;
  perfil: 'emissor' | 'suporte' | 'comercial' | 'rh' | 'gestor';
  total_laudos_emitidos: number;
}

const perfilLabels: Record<string, { label: string; color: string }> = {
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
        >
          <KeyRound className="w-4 h-4" />
          Resetar Senha
        </button>
      </div>

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
                  {usuariosGrupo.map((usuario) => (
                    <div
                      key={usuario.cpf}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {usuario.nome}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            CPF: {usuario.cpf}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {usuario.email}
                          </p>
                          {usuario.perfil === 'emissor' && (
                            <div className="flex gap-4 mt-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {usuario.total_laudos_emitidos} laudos emitidos
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
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
                        </div>
                      </div>
                    </div>
                  ))}
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