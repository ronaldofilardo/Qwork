'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRepresentante } from '../rep-context';

/* ------------------------------------------------------------------
   Tipos
   ------------------------------------------------------------------ */

interface DadosRep {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  tipo_pessoa: string;
  cpf: string | null;
  cnpj: string | null;
  status: string;
  criado_em: string;
  // Bancários
  banco_codigo: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: string | null;
  titular_conta: string | null;
  pix_chave: string | null;
  pix_tipo: string | null;
  dados_bancarios_status: string | null;
  dados_bancarios_solicitado_em: string | null;
  dados_bancarios_confirmado_em: string | null;
}

type CampoEditavel =
  | 'nome'
  | 'email'
  | 'telefone'
  | 'banco_codigo'
  | 'agencia'
  | 'conta'
  | 'tipo_conta'
  | 'titular_conta'
  | 'pix_chave'
  | 'pix_tipo';

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-blue-100 text-blue-700',
  apto: 'bg-green-100 text-green-700',
  apto_pendente: 'bg-yellow-100 text-yellow-700',
  apto_bloqueado: 'bg-orange-100 text-orange-700',
  suspenso: 'bg-red-100 text-red-700',
  desativado: 'bg-gray-100 text-gray-600',
};

const TOOLTIP: Partial<Record<CampoEditavel, string>> = {
  tipo_conta:
    'Corrente: conta de movimentação diária. Poupança: conta que rende juros.',
  pix_tipo:
    'Escolha o tipo de chave PIX que você cadastrou no seu banco (CPF, CNPJ, e-mail, telefone ou chave aleatória).',
};

const fmtData = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—';

/* ------------------------------------------------------------------
   Componente inline-edit por campo
   ------------------------------------------------------------------ */

function CampoInline({
  label,
  campo,
  valor,
  campoEditando,
  onEditar,
  onCancelar,
  onSalvar,
  salvando,
  children,
}: {
  label: string;
  campo: CampoEditavel;
  valor: string | null;
  campoEditando: CampoEditavel | null;
  onEditar: (campo: CampoEditavel) => void;
  onCancelar: () => void;
  onSalvar: (campo: CampoEditavel, novoValor: string) => void;
  salvando: boolean;
  children: (value: string, onChange: (v: string) => void) => React.ReactNode;
}) {
  const [valorLocal, setValorLocal] = useState(valor ?? '');
  const editando = campoEditando === campo;
  const tooltip = TOOLTIP[campo];

  useEffect(() => {
    if (editando) setValorLocal(valor ?? '');
  }, [editando, valor]);

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b last:border-0">
      <div className="flex items-center gap-1.5 min-w-[140px]">
        <span className="text-sm text-gray-500">{label}</span>
        {tooltip && (
          <span
            title={tooltip}
            className="text-gray-400 hover:text-gray-600 cursor-help text-xs"
          >
            ℹ️
          </span>
        )}
      </div>

      {editando ? (
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <div className="flex-1 max-w-xs">
            {children(valorLocal, setValorLocal)}
          </div>
          <button
            onClick={() => onSalvar(campo, valorLocal)}
            disabled={salvando}
            className="p-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-xs"
            title="Salvar"
            aria-label="Salvar"
          >
            {salvando ? (
              <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              '✓'
            )}
          </button>
          <button
            onClick={onCancelar}
            disabled={salvando}
            className="p-1.5 rounded-md border hover:bg-gray-50 disabled:opacity-50 text-xs text-gray-600"
            title="Cancelar"
            aria-label="Cancelar"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm text-gray-900 text-right">
            {valor || (
              <span className="text-gray-400 italic">não informado</span>
            )}
          </span>
          <button
            onClick={() => onEditar(campo)}
            className="text-gray-400 hover:text-blue-600 transition-colors text-xs flex-shrink-0"
            title={`Editar ${label}`}
            aria-label={`Editar ${label}`}
          >
            ✏️
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Página Principal
   ------------------------------------------------------------------ */

export default function DadosRepresentante() {
  const router = useRouter();
  const { session } = useRepresentante();

  const [dados, setDados] = useState<DadosRep | null>(null);
  const [loading, setLoading] = useState(true);
  const [campoEditando, setCampoEditando] = useState<CampoEditavel | null>(
    null
  );
  const [salvando, setSalvando] = useState(false);
  const [toastMsg, setToastMsg] = useState<{
    tipo: 'sucesso' | 'erro';
    texto: string;
  } | null>(null);

  /* Representante desativado: redirecionar */
  useEffect(() => {
    if (session?.status === 'desativado') {
      router.replace('/representante/dashboard');
    }
  }, [session, router]);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/representante/me', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setDados(data.representante as DadosRep);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const mostrarToast = (tipo: 'sucesso' | 'erro', texto: string) => {
    setToastMsg({ tipo, texto });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleEditar = (campo: CampoEditavel) => {
    if (campoEditando && campoEditando !== campo) {
      if (!window.confirm(`Descartar alteração em "${campoEditando}"?`)) {
        return;
      }
    }
    setCampoEditando(campo);
  };

  const handleCancelar = () => {
    setCampoEditando(null);
  };

  const handleSalvar = async (campo: CampoEditavel, novoValor: string) => {
    setSalvando(true);
    try {
      const res = await fetch('/api/representante/dados-bancarios', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campo]: novoValor === '' ? null : novoValor }),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        mostrarToast('erro', data.error ?? 'Erro ao salvar. Tente novamente.');
        return;
      }

      // Atualizar estado local com os dados retornados
      setDados((prev) => (prev ? { ...prev, ...data.representante } : prev));
      setCampoEditando(null);
      mostrarToast('sucesso', `${campo} atualizado ✅`);
    } catch {
      mostrarToast('erro', 'Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!dados) return null;

  const dbStatus = dados.dados_bancarios_status;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toastMsg.tipo === 'sucesso'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toastMsg.texto}
        </div>
      )}

      {/* Banner de aviso (dados bancários) */}
      {dbStatus && dbStatus !== 'confirmado' && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            dbStatus === 'pendente_confirmacao'
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : dbStatus === 'rejeitado'
                ? 'bg-red-50 border-red-300 text-red-800'
                : 'bg-blue-50 border-blue-300 text-blue-800'
          }`}
        >
          {dbStatus === 'nao_informado' && (
            <p>⚠️ Preencha seus dados bancários para receber comissões.</p>
          )}
          {dbStatus === 'pendente_confirmacao' && (
            <p>
              🔴 Confirmação de dados bancários solicitada
              {dados.dados_bancarios_solicitado_em
                ? ` em ${fmtData(dados.dados_bancarios_solicitado_em)}`
                : ''}
              . Por favor, revise e salve seus dados abaixo.
            </p>
          )}
          {dbStatus === 'rejeitado' && (
            <p>
              ❌ Seus dados bancários foram rejeitados. Por favor corrija os
              campos abaixo e salve novamente.
            </p>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Seção: Dados Cadastrais                                    */}
      {/* ---------------------------------------------------------- */}
      <section className="bg-white rounded-xl border p-5 space-y-1">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Dados Cadastrais
        </h2>

        {/* Nome */}
        <CampoInline
          label="Nome"
          campo="nome"
          valor={dados.nome}
          campoEditando={campoEditando}
          onEditar={handleEditar}
          onCancelar={handleCancelar}
          onSalvar={handleSalvar}
          salvando={salvando}
        >
          {(v, onChange) => (
            <input
              type="text"
              value={v}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          )}
        </CampoInline>

        {/* E-mail */}
        <CampoInline
          label="E-mail"
          campo="email"
          valor={dados.email}
          campoEditando={campoEditando}
          onEditar={handleEditar}
          onCancelar={handleCancelar}
          onSalvar={handleSalvar}
          salvando={salvando}
        >
          {(v, onChange) => (
            <input
              type="email"
              value={v}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          )}
        </CampoInline>

        {/* Telefone */}
        <CampoInline
          label="Telefone"
          campo="telefone"
          valor={dados.telefone}
          campoEditando={campoEditando}
          onEditar={handleEditar}
          onCancelar={handleCancelar}
          onSalvar={handleSalvar}
          salvando={salvando}
        >
          {(v, onChange) => (
            <input
              type="tel"
              value={v}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          )}
        </CampoInline>

        {/* CPF / CNPJ: read-only */}
        {dados.tipo_pessoa === 'pf' ? (
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              CPF
              <span
                title="Não pode ser alterado"
                className="text-gray-400 cursor-help"
              >
                🔒
              </span>
            </span>
            <span className="text-sm text-gray-900">{dados.cpf ?? '—'}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              CNPJ
              <span
                title="Não pode ser alterado"
                className="text-gray-400 cursor-help"
              >
                🔒
              </span>
            </span>
            <span className="text-sm text-gray-900">{dados.cnpj ?? '—'}</span>
          </div>
        )}

        {/* Tipo Pessoa: read-only */}
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-sm text-gray-500 flex items-center gap-1">
            Tipo
            <span
              title="Não pode ser alterado"
              className="text-gray-400 cursor-help"
            >
              🔒
            </span>
          </span>
          <span className="text-sm text-gray-900">
            {dados.tipo_pessoa === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
          </span>
        </div>

        {/* Status: read-only */}
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-sm text-gray-500">Status</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[dados.status] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {dados.status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        {/* Data Cadastro: read-only */}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-gray-500">Cadastrado em</span>
          <span className="text-sm text-gray-900">
            {fmtData(dados.criado_em)}
          </span>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Seção: Dados Bancários                                     */}
      {/* ---------------------------------------------------------- */}
      <section className="bg-white rounded-xl border p-5 space-y-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Dados Bancários
          </h2>
          {dbStatus && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                dbStatus === 'confirmado'
                  ? 'bg-green-100 text-green-700'
                  : dbStatus === 'pendente_confirmacao'
                    ? 'bg-amber-100 text-amber-700'
                    : dbStatus === 'rejeitado'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
              }`}
            >
              {dbStatus === 'confirmado'
                ? '✅ Confirmado'
                : dbStatus === 'pendente_confirmacao'
                  ? '🔴 Pendente'
                  : dbStatus === 'rejeitado'
                    ? '❌ Rejeitado'
                    : 'Não informado'}
            </span>
          )}
        </div>

        {/* Banco */}
        <CampoInline
          label="Banco (código)"
          campo="banco_codigo"
          valor={dados.banco_codigo}
          campoEditando={campoEditando}
          onEditar={handleEditar}
          onCancelar={handleCancelar}
          onSalvar={handleSalvar}
          salvando={salvando}
        >
          {(v, onChange) => (
            <input
              type="text"
              value={v}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ex: 001"
              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          )}
        </CampoInline>

        {/* Agência */}
        <CampoInline
          label="Agência"
          campo="agencia"
          valor={dados.agencia}
          campoEditando={campoEditando}
          onEditar={handleEditar}
          onCancelar={handleCancelar}
          onSalvar={handleSalvar}
          salvando={salvando}
        >
          {(v, onChange) => (
            <input
              type="text"
              value={v}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          )}
        </CampoInline>

        {/* Conta */}
        <CampoInline
          label="Conta"
          campo="conta"
          valor={dados.conta}
          campoEditando={campoEditando}
          onEditar={handleEditar}
          onCancelar={handleCancelar}
          onSalvar={handleSalvar}
          salvando={salvando}
        >
          {(v, onChange) => (
            <input
              type="text"
              value={v}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          )}
        </CampoInline>

        {/* Tipo Conta */}
        <CampoInline
          label="Tipo de Conta"
          campo="tipo_conta"
          valor={dados.tipo_conta}
          campoEditando={campoEditando}
          onEditar={handleEditar}
          onCancelar={handleCancelar}
          onSalvar={handleSalvar}
          salvando={salvando}
        >
          {(v, onChange) => (
            <select
              value={v}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            >
              <option value="">Selecione...</option>
              <option value="corrente">Corrente</option>
              <option value="poupanca">Poupança</option>
            </select>
          )}
        </CampoInline>

        {/* Titular */}
        <CampoInline
          label="Titular da Conta"
          campo="titular_conta"
          valor={dados.titular_conta}
          campoEditando={campoEditando}
          onEditar={handleEditar}
          onCancelar={handleCancelar}
          onSalvar={handleSalvar}
          salvando={salvando}
        >
          {(v, onChange) => (
            <input
              type="text"
              value={v}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          )}
        </CampoInline>

        {/* PIX Chave */}
        <CampoInline
          label="PIX — Chave"
          campo="pix_chave"
          valor={dados.pix_chave}
          campoEditando={campoEditando}
          onEditar={handleEditar}
          onCancelar={handleCancelar}
          onSalvar={handleSalvar}
          salvando={salvando}
        >
          {(v, onChange) => (
            <input
              type="text"
              value={v}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          )}
        </CampoInline>

        {/* PIX Tipo */}
        <CampoInline
          label="PIX — Tipo"
          campo="pix_tipo"
          valor={dados.pix_tipo}
          campoEditando={campoEditando}
          onEditar={handleEditar}
          onCancelar={handleCancelar}
          onSalvar={handleSalvar}
          salvando={salvando}
        >
          {(v, onChange) => (
            <select
              value={v}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            >
              <option value="">Selecione...</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="aleatoria">Chave Aleatória</option>
            </select>
          )}
        </CampoInline>

        {/* Dica */}
        <p className="text-xs text-gray-400 pt-2">
          ℹ️ Preencha pelo menos BANCO ou PIX para poder receber comissões.
        </p>
      </section>
    </div>
  );
}
