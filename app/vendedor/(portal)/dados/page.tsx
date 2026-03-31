'use client';

import { useEffect, useState, useCallback } from 'react';

interface Usuario {
  id: number;
  cpf: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  criado_em: string;
}

export default function VendedorDadosPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [saving, setSaving] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/vendedor/dados');
      if (res.ok) {
        const d = await res.json();
        setUsuario(d.usuario);
        setEmail(d.usuario.email ?? '');
        setTelefone(d.usuario.telefone ?? '');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setErro(null);
    setSucesso(null);
    try {
      const body: Record<string, string> = {};
      if (email.trim()) body.email = email.trim();
      if (telefone.trim()) body.telefone = telefone.trim();

      const res = await fetch('/api/vendedor/dados', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSucesso('Dados atualizados com sucesso!');
        load();
      } else {
        setErro(data.error ?? 'Erro ao salvar.');
      }
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Meus Dados</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Atualize seu email e telefone de contato
        </p>
      </div>

      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          {sucesso}
        </div>
      )}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
            {usuario?.nome}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CPF
          </label>
          <p className="text-sm font-mono text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
            {usuario?.cpf}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl border p-4 text-xs text-gray-500 space-y-1">
        <p>
          <span className="font-medium">Cadastrado em:</span>{' '}
          {usuario?.criado_em
            ? new Date(usuario.criado_em).toLocaleDateString('pt-BR')
            : '—'}
        </p>
        <p>
          <span className="font-medium">ID:</span> {usuario?.id}
        </p>
      </div>
    </div>
  );
}
