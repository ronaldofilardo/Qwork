'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Usuario {
  id: number;
  cpf: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  criado_em: string;
}

interface DadosBancarios {
  banco_codigo: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: 'corrente' | 'poupanca' | 'pagamento' | null;
  titular_conta: string | null;
  pix_chave: string | null;
  pix_tipo: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria' | null;
  atualizado_em: string | null;
}

const TIPO_CONTA_LABEL: Record<string, string> = {
  corrente: 'Conta Corrente',
  poupanca: 'Conta Poupança',
  pagamento: 'Conta Pagamento',
};

const PIX_TIPO_LABEL: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  telefone: 'Telefone',
  aleatoria: 'Chave Aleatória',
};

export default function VendedorDadosPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [dadosBancarios, setDadosBancarios] = useState<DadosBancarios | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [saving, setSaving] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Modal de dados bancários
  const [modalAberto, setModalAberto] = useState(false);
  const [formBancario, setFormBancario] = useState<Partial<DadosBancarios>>({});
  const [salvandoBancario, setSalvandoBancario] = useState(false);
  const [erroBancario, setErroBancario] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [dadosRes, bancariosRes] = await Promise.all([
        fetch('/api/vendedor/dados'),
        fetch('/api/vendedor/dados/bancarios'),
      ]);
      if (dadosRes.ok) {
        const d = await dadosRes.json();
        setUsuario(d.usuario);
        setEmail(d.usuario.email ?? '');
        setTelefone(d.usuario.telefone ?? '');
      }
      if (bancariosRes.ok) {
        const b = await bancariosRes.json();
        setDadosBancarios(b.dados_bancarios ?? null);
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

  const handleAbrirModalBancario = () => {
    setFormBancario(dadosBancarios ? { ...dadosBancarios } : {});
    setErroBancario(null);
    setModalAberto(true);
  };

  const handleSalvarBancario = async () => {
    setSalvandoBancario(true);
    setErroBancario(null);
    try {
      // Validar que pelo menos um campo foi preenchido
      const temDados = Object.values(formBancario).some(
        (v) => v !== null && v !== undefined && v !== ''
      );
      if (!temDados) {
        setErroBancario('Preencha ao menos um campo de dados bancários.');
        setSalvandoBancario(false);
        return;
      }

      const res = await fetch('/api/vendedor/dados/bancarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formBancario),
      });
      const data = await res.json();
      if (res.ok) {
        setDadosBancarios(data.dados_bancarios);
        setModalAberto(false);
        setSucesso('Dados bancários atualizados com sucesso!');
        setTimeout(() => setSucesso(null), 3000);
      } else {
        setErroBancario(data.error ?? 'Erro ao salvar dados bancários.');
      }
    } catch (err) {
      setErroBancario('Erro de conexão.');
      console.error(err);
    } finally {
      setSalvandoBancario(false);
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

      {/* Dados Bancários */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          Dados Bancários
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Informações para pagamento de comissões.
        </p>
        <div className="bg-white rounded-xl border p-6 space-y-3">
          {dadosBancarios === null ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 italic mb-3">
                Nenhum dado bancário cadastrado.
              </p>
              <button
                onClick={handleAbrirModalBancario}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                Adicionar Dados Bancários
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    label: 'Banco (código)',
                    value: dadosBancarios.banco_codigo,
                  },
                  { label: 'Agência', value: dadosBancarios.agencia },
                  { label: 'Conta', value: dadosBancarios.conta },
                  {
                    label: 'Tipo de conta',
                    value: dadosBancarios.tipo_conta
                      ? TIPO_CONTA_LABEL[dadosBancarios.tipo_conta]
                      : null,
                  },
                  { label: 'Titular', value: dadosBancarios.titular_conta },
                  { label: 'Chave PIX', value: dadosBancarios.pix_chave },
                  {
                    label: 'Tipo de chave PIX',
                    value: dadosBancarios.pix_tipo
                      ? PIX_TIPO_LABEL[dadosBancarios.pix_tipo]
                      : null,
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
                      {value ?? <span className="text-gray-400">—</span>}
                    </p>
                  </div>
                ))}
              </div>
              {dadosBancarios?.atualizado_em && (
                <p className="text-xs text-gray-400 pt-1">
                  Atualizado em:{' '}
                  {new Date(dadosBancarios.atualizado_em).toLocaleDateString(
                    'pt-BR'
                  )}
                </p>
              )}
              <div className="pt-3 border-t">
                <button
                  onClick={handleAbrirModalBancario}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Editar Dados Bancários
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Dados Bancários */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b">
              <h2 className="text-base font-bold text-gray-900">
                Dados Bancários
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {erroBancario && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {erroBancario}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco (código)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 001"
                  value={formBancario.banco_codigo ?? ''}
                  onChange={(e) =>
                    setFormBancario({
                      ...formBancario,
                      banco_codigo: e.target.value || null,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agência
                </label>
                <input
                  type="text"
                  placeholder="Ex: 0001"
                  value={formBancario.agencia ?? ''}
                  onChange={(e) =>
                    setFormBancario({
                      ...formBancario,
                      agencia: e.target.value || null,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta
                </label>
                <input
                  type="text"
                  placeholder="Ex: 123456-7"
                  value={formBancario.conta ?? ''}
                  onChange={(e) =>
                    setFormBancario({
                      ...formBancario,
                      conta: e.target.value || null,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Conta
                </label>
                <select
                  value={formBancario.tipo_conta ?? ''}
                  onChange={(e) =>
                    setFormBancario({
                      ...formBancario,
                      tipo_conta: (e.target.value as any) || null,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecione...</option>
                  <option value="corrente">Corrente</option>
                  <option value="poupanca">Poupança</option>
                  <option value="pagamento">Pagamento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titular da Conta
                </label>
                <input
                  type="text"
                  placeholder="Nome do titular"
                  value={formBancario.titular_conta ?? ''}
                  onChange={(e) =>
                    setFormBancario({
                      ...formBancario,
                      titular_conta: e.target.value || null,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chave PIX
                </label>
                <input
                  type="text"
                  placeholder="Ex: seus@email.com ou CPF"
                  value={formBancario.pix_chave ?? ''}
                  onChange={(e) =>
                    setFormBancario({
                      ...formBancario,
                      pix_chave: e.target.value || null,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Chave PIX
                </label>
                <select
                  value={formBancario.pix_tipo ?? ''}
                  onChange={(e) =>
                    setFormBancario({
                      ...formBancario,
                      pix_tipo: (e.target.value as any) || null,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecione...</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave Aleatória</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="px-8 py-5 border-t flex gap-3 justify-end">
              <button
                onClick={() => setModalAberto(false)}
                className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarBancario}
                disabled={salvandoBancario}
                className="px-5 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {salvandoBancario && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {salvandoBancario ? 'Salvando...' : 'Salvar Dados'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
