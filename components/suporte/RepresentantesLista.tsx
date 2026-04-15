'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  User,
  Search,
  RefreshCw,
  X,
  ChevronRight,
  Building2,
  Wallet,
  Pencil,
  Check,
  Loader2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Vendedor {
  vendedor_id: number;
  nome: string;
  email: string | null;
  cpf: string | null;
  codigo: string | null;
  vinculo_id: number;
  vinculado_em: string;
}

interface Representante {
  id: number;
  nome: string;
  email: string | null;
  codigo: string | null;
  status: string;
  tipo_pessoa: string | null;
  cpf: string | null;
  cnpj: string | null;
  percentual_comissao: number | null;
  modelo_comissionamento: 'percentual' | 'custo_fixo' | null;
  asaas_wallet_id: string | null;
  telefone: string | null;
  criado_em: string;
  total_vendedores: number;
  vendedores: Vendedor[];
}

interface DadosBancarios {
  banco_codigo: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: string | null;
  titular_conta: string | null;
  pix_chave: string | null;
  pix_tipo: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  apto: { label: 'Ativo', cls: 'bg-green-100 text-green-700' },
  ativo: { label: 'Em Cadastro', cls: 'bg-blue-100 text-blue-700' },
  apto_pendente: {
    label: 'Aguard. Aprovacao',
    cls: 'bg-amber-100 text-amber-700',
  },
  apto_bloqueado: { label: 'Bloqueado', cls: 'bg-orange-100 text-orange-700' },
  suspenso: { label: 'Suspenso', cls: 'bg-red-100 text-red-700' },
  desativado: { label: 'Desativado', cls: 'bg-gray-100 text-gray-500' },
  rejeitado: { label: 'Rejeitado', cls: 'bg-red-100 text-red-700' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'apto', label: 'Ativo' },
  { value: 'ativo', label: 'Em Cadastro' },
  { value: 'apto_pendente', label: 'Aguard. Aprovacao' },
  { value: 'apto_bloqueado', label: 'Bloqueado' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'desativado', label: 'Desativado' },
  { value: 'rejeitado', label: 'Rejeitado' },
];

function fmtCPF(v: string | null) {
  if (!v) return '-';
  const d = v.replace(/\D/g, '');
  if (d.length === 11)
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return v;
}

function fmtCNPJ(v: string | null) {
  if (!v) return '-';
  const d = v.replace(/\D/g, '');
  if (d.length === 14)
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return v;
}

// ---------------------------------------------------------------------------
// Card do Representante
// ---------------------------------------------------------------------------

function RepresentanteCard({
  rep,
  onClick,
  abrirReset,
}: {
  rep: Representante;
  onClick: () => void;
  abrirReset: (rep: Representante) => void;
}) {
  const st = STATUS_LABEL[rep.status] ?? {
    label: rep.status,
    cls: 'bg-gray-100 text-gray-500',
  };
  const initials = rep.nome
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className="w-full text-left bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-md transition-all duration-150 p-5 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500/30"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-base flex-shrink-0 group-hover:bg-green-200 transition-colors">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {rep.nome}
            </p>
            <ChevronRight
              size={15}
              className="text-gray-300 group-hover:text-green-500 flex-shrink-0 transition-colors"
            />
          </div>
          {rep.email && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{rep.email}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${st.cls}`}
            >
              {st.label}
            </span>
            {rep.codigo && (
              <span className="text-[10px] font-mono text-gray-400">
                {rep.codigo}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Users size={12} />
          <span>
            {rep.total_vendedores} vendedor
            {rep.total_vendedores !== 1 ? 'es' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wallet size={12} />
          <span>
            {rep.modelo_comissionamento === 'custo_fixo'
              ? 'Custo Fixo'
              : rep.percentual_comissao != null
                ? `${rep.percentual_comissao}% comissao`
                : 'Sem comissao'}
          </span>
          {rep.modelo_comissionamento && !rep.asaas_wallet_id && (
            <span className="ml-1 text-[9px] font-bold text-orange-600 bg-orange-100 rounded-full px-1.5 py-0.5 uppercase tracking-wide">
              Wallet
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            abrirReset(rep);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all duration-150 cursor-pointer"
        >
          <KeyRound size={12} />
          Resetar senha
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

type DrawerTab = 'dados' | 'vendedores';

function RepresentanteDrawer({
  rep,
  onClose,
  onUpdated,
}: {
  rep: Representante | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [tab, setTab] = useState<DrawerTab>('dados');
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    status: '',
    percentual_comissao: '',
  });

  const [vendedorBancario, setVendedorBancario] = useState<number | null>(null);
  const [dadosBancarios, setDadosBancarios] = useState<DadosBancarios | null>(
    null
  );
  const [loadingBancario, setLoadingBancario] = useState(false);
  const [salvandoBancario, setSalvandoBancario] = useState(false);
  const [erroBancario, setErroBancario] = useState<string | null>(null);
  const [formBancario, setFormBancario] = useState<DadosBancarios>({
    banco_codigo: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente',
    titular_conta: '',
    pix_chave: '',
    pix_tipo: null,
  });

  useEffect(() => {
    if (!rep) return;
    setTab('dados');
    setEditando(false);
    setErroSalvar(null);
    setVendedorBancario(null);
    setDadosBancarios(null);
    setForm({
      nome: rep.nome ?? '',
      email: rep.email ?? '',
      telefone: rep.telefone ?? '',
      status: rep.status ?? '',
      percentual_comissao: rep.percentual_comissao?.toString() ?? '',
    });
  }, [rep]);

  // Suppress unused dadosBancarios lint
  void dadosBancarios;

  const salvarRepresentante = async () => {
    if (!rep) return;
    setSalvando(true);
    setErroSalvar(null);
    try {
      const body: Record<string, unknown> = {};
      if (form.nome.trim()) body.nome = form.nome.trim();
      if (form.email.trim()) body.email = form.email.trim();
      if (form.telefone.trim()) body.telefone = form.telefone.trim();
      if (form.status) body.status = form.status;
      if (form.percentual_comissao)
        body.percentual_comissao = parseFloat(form.percentual_comissao);

      const res = await fetch(`/api/suporte/representantes/${rep.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Erro ao salvar');
      }
      setEditando(false);
      onUpdated();
    } catch (e: unknown) {
      setErroSalvar(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setSalvando(false);
    }
  };

  const abrirDadosBancarios = async (vendedorId: number) => {
    if (vendedorBancario === vendedorId) {
      setVendedorBancario(null);
      return;
    }
    setVendedorBancario(vendedorId);
    setLoadingBancario(true);
    setErroBancario(null);
    try {
      const res = await fetch(
        `/api/suporte/vendedores/${vendedorId}/dados-bancarios`
      );
      const d = (await res.json()) as { dados_bancarios?: DadosBancarios };
      const db: DadosBancarios = d.dados_bancarios ?? {
        banco_codigo: null,
        agencia: null,
        conta: null,
        tipo_conta: null,
        titular_conta: null,
        pix_chave: null,
        pix_tipo: null,
      };
      setDadosBancarios(db);
      setFormBancario({
        banco_codigo: db.banco_codigo ?? '',
        agencia: db.agencia ?? '',
        conta: db.conta ?? '',
        tipo_conta: db.tipo_conta ?? 'corrente',
        titular_conta: db.titular_conta ?? '',
        pix_chave: db.pix_chave ?? '',
        pix_tipo: db.pix_tipo ?? null,
      });
    } catch {
      setErroBancario('Nao foi possivel carregar os dados bancarios.');
    } finally {
      setLoadingBancario(false);
    }
  };

  const salvarDadosBancarios = async (vendedorId: number) => {
    setSalvandoBancario(true);
    setErroBancario(null);
    try {
      const res = await fetch(
        `/api/suporte/vendedores/${vendedorId}/dados-bancarios`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formBancario),
        }
      );
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Erro ao salvar');
      }
      const updated = (await res.json()) as {
        dados_bancarios?: DadosBancarios;
      };
      setDadosBancarios(updated.dados_bancarios ?? formBancario);
    } catch (e: unknown) {
      setErroBancario(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setSalvandoBancario(false);
    }
  };

  const isOpen = rep !== null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
              {rep?.nome
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">
                {rep?.nome}
              </p>
              <p className="text-xs text-gray-400 leading-tight">
                {rep?.email ?? rep?.codigo ?? '-'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b shrink-0">
          {(['dados', 'vendedores'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-green-700 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'dados' ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Building2 size={14} /> Dados
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Users size={14} /> Vendedores ({rep?.total_vendedores ?? 0})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conteudo */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'dados' && rep && (
            <div className="space-y-5">
              {(() => {
                const st = STATUS_LABEL[rep.status] ?? {
                  label: rep.status,
                  cls: 'bg-gray-100 text-gray-500',
                };
                return (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${st.cls}`}
                  >
                    {st.label}
                  </span>
                );
              })()}

              <div className="bg-gray-50 rounded-lg divide-y text-sm">
                {(
                  [
                    ['Codigo', rep.codigo ?? '-'],
                    [
                      'Documento',
                      rep.tipo_pessoa === 'pj'
                        ? fmtCNPJ(rep.cnpj)
                        : fmtCPF(rep.cpf),
                    ],
                    [
                      'Tipo',
                      rep.tipo_pessoa === 'pj'
                        ? 'Pessoa Juridica'
                        : 'Pessoa Fisica',
                    ],
                    [
                      'Cadastro',
                      new Date(rep.criado_em).toLocaleDateString('pt-BR'),
                    ],
                  ] as [string, string][]
                ).map(([label, val]) => (
                  <div key={label} className="flex justify-between px-4 py-2.5">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {val}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Editar Representante
                  </p>
                  {!editando && (
                    <button
                      onClick={() => setEditando(true)}
                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                    >
                      <Pencil size={12} /> Editar
                    </button>
                  )}
                </div>

                {erroSalvar && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    <AlertCircle size={14} className="shrink-0" />
                    {erroSalvar}
                  </div>
                )}

                <div className="space-y-2.5">
                  {[
                    { key: 'nome', label: 'Nome', type: 'text' },
                    { key: 'email', label: 'E-mail', type: 'email' },
                    { key: 'telefone', label: 'Telefone', type: 'text' },
                    {
                      key: 'percentual_comissao',
                      label: '% Comissao',
                      type: 'number',
                    },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">
                        {label}
                      </label>
                      <input
                        type={type}
                        disabled={!editando}
                        value={form[key as keyof typeof form]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [key]: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg disabled:bg-gray-50 disabled:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Status
                    </label>
                    <select
                      disabled={!editando}
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, status: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm border rounded-lg disabled:bg-gray-50 disabled:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-white"
                    >
                      {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {editando && (
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => {
                        setEditando(false);
                        setErroSalvar(null);
                      }}
                      disabled={salvando}
                      className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={salvarRepresentante}
                      disabled={salvando}
                      className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {salvando ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'vendedores' && rep && (
            <div className="space-y-3">
              {rep.vendedores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                  <User size={32} className="opacity-30" />
                  <p className="text-sm">Nenhum vendedor vinculado.</p>
                </div>
              ) : (
                rep.vendedores.map((v) => (
                  <div
                    key={v.vinculo_id}
                    className="border rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {v.nome[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">
                          {v.nome}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {fmtCPF(v.cpf)}
                        </p>
                      </div>
                      {v.codigo && (
                        <span className="text-xs font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex-shrink-0">
                          {v.codigo}
                        </span>
                      )}
                    </div>

                    <div className="px-4 py-2 border-t">
                      <button
                        onClick={() => abrirDadosBancarios(v.vendedor_id)}
                        className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
                      >
                        <Wallet size={12} />
                        {vendedorBancario === v.vendedor_id
                          ? 'Fechar dados bancarios'
                          : 'Editar dados bancarios'}
                      </button>
                    </div>

                    {vendedorBancario === v.vendedor_id && (
                      <div className="px-4 pb-4 border-t bg-gray-50/60 space-y-3 pt-3">
                        {loadingBancario ? (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Loader2 size={14} className="animate-spin" />{' '}
                            Carregando...
                          </div>
                        ) : (
                          <>
                            {erroBancario && (
                              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-xs">
                                <AlertCircle size={12} className="shrink-0" />
                                {erroBancario}
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  key: 'banco_codigo',
                                  label: 'Codigo do Banco',
                                  placeholder: '001',
                                  span: false,
                                },
                                {
                                  key: 'agencia',
                                  label: 'Agencia',
                                  placeholder: '0001',
                                  span: false,
                                },
                                {
                                  key: 'conta',
                                  label: 'Conta',
                                  placeholder: '12345-6',
                                  span: false,
                                },
                                {
                                  key: 'titular_conta',
                                  label: 'Titular',
                                  placeholder: 'Nome completo',
                                  span: true,
                                },
                                {
                                  key: 'pix_chave',
                                  label: 'Chave PIX',
                                  placeholder: 'CPF, e-mail...',
                                  span: true,
                                },
                              ].map(({ key, label, placeholder, span }) => (
                                <div
                                  key={key}
                                  className={span ? 'col-span-2' : ''}
                                >
                                  <label className="block text-[10px] text-gray-500 mb-1">
                                    {label}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={placeholder}
                                    value={
                                      formBancario[
                                        key as keyof DadosBancarios
                                      ] ?? ''
                                    }
                                    onChange={(e) =>
                                      setFormBancario((f) => ({
                                        ...f,
                                        [key]: e.target.value || null,
                                      }))
                                    }
                                    className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-400"
                                  />
                                </div>
                              ))}

                              <div>
                                <label className="block text-[10px] text-gray-500 mb-1">
                                  Tipo Conta
                                </label>
                                <select
                                  value={formBancario.tipo_conta ?? 'corrente'}
                                  onChange={(e) =>
                                    setFormBancario((f) => ({
                                      ...f,
                                      tipo_conta: e.target.value,
                                    }))
                                  }
                                  className="w-full px-2 py-1.5 text-xs border rounded bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
                                >
                                  <option value="corrente">Corrente</option>
                                  <option value="poupanca">Poupanca</option>
                                  <option value="pagamento">Pagamento</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] text-gray-500 mb-1">
                                  Tipo PIX
                                </label>
                                <select
                                  value={formBancario.pix_tipo ?? ''}
                                  onChange={(e) =>
                                    setFormBancario((f) => ({
                                      ...f,
                                      pix_tipo: e.target.value || null,
                                    }))
                                  }
                                  className="w-full px-2 py-1.5 text-xs border rounded bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
                                >
                                  <option value="">-</option>
                                  <option value="cpf">CPF</option>
                                  <option value="cnpj">CNPJ</option>
                                  <option value="email">E-mail</option>
                                  <option value="telefone">Telefone</option>
                                  <option value="aleatoria">Aleatoria</option>
                                </select>
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                salvarDadosBancarios(v.vendedor_id)
                              }
                              disabled={salvandoBancario}
                              className="w-full py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                            >
                              {salvandoBancario ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" />{' '}
                                  Salvando...
                                </>
                              ) : (
                                <>
                                  <Check size={12} /> Salvar dados bancarios
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function RepresentantesLista() {
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [drawerRep, setDrawerRep] = useState<Representante | null>(null);
  const [grupo, setGrupo] = useState<'ativos' | 'inativos'>('ativos');
  const [resetandoRep, setResetandoRep] = useState<Representante | null>(null);
  const [cpfReset, setCpfReset] = useState('');
  const [confirmCpf, setConfirmCpf] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.set('busca', busca);
      if (status) params.set('status', status);
      params.set('grupo', grupo);
      const res = await fetch(`/api/suporte/representantes?${params}`);
      if (res.ok) {
        const d = (await res.json()) as {
          representantes?: Representante[];
          total?: number;
        };
        setRepresentantes(d.representantes ?? []);
        setTotal(d.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [busca, status, grupo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Resetar filtro de status ao trocar aba
  const handleGrupo = (g: 'ativos' | 'inativos') => {
    setGrupo(g);
    setStatus('');
  };

  const handleBuscaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusca(buscaInput);
  };

  const abrirResetSenha = (rep: Representante) => {
    setResetandoRep(rep);
    setCpfReset(rep.cpf ?? '');
    setConfirmCpf('');
    setResetError(null);
    setResetSuccess(null);
  };

  const confirmarResetSenha = async () => {
    if (!resetandoRep) return;

    const cpfLimpo = cpfReset.replace(/\D/g, '');
    const confirmLimpo = confirmCpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
      setResetError('Digite um CPF válido com 11 dígitos.');
      return;
    }

    if (cpfLimpo !== confirmLimpo) {
      setResetError('O CPF digitado para confirmação não confere.');
      return;
    }

    setSubmittingReset(true);
    setResetError(null);
    try {
      const res = await fetch('/api/suporte/representantes/reset-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfLimpo }),
      });

      const d = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        throw new Error(d.error ?? 'Erro ao resetar senha');
      }

      setResetSuccess(
        d.message ??
          'Senha resetada. No próximo login, o representante deverá criar uma nova senha.'
      );
      setConfirmCpf('');
    } catch (e: unknown) {
      setResetError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setSubmittingReset(false);
    }
  };

  const STATUS_OPTIONS_ATIVOS = STATUS_OPTIONS.filter(
    (o) => !['desativado', 'rejeitado'].includes(o.value)
  );

  return (
    <div className="space-y-4">
      {/* Abas Ativos / Inativos */}
      <div className="flex border-b border-gray-200">
        {(['ativos', 'inativos'] as const).map((g) => (
          <button
            key={g}
            onClick={() => handleGrupo(g)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              grupo === g
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {g === 'ativos' ? 'Ativos' : 'Inativos'}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleBuscaSubmit} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar nome, e-mail ou codigo..."
              value={buscaInput}
              onChange={(e) => setBuscaInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-medium transition-colors"
          >
            Buscar
          </button>
        </form>
        {grupo === 'ativos' && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-white"
          >
            {STATUS_OPTIONS_ATIVOS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => carregar()}
          className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          title="Atualizar"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {!loading && representantes.length > 0 && (
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          {total} representante{total !== 1 ? 's' : ''}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
        </div>
      ) : representantes.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">
            Nenhum representante encontrado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {representantes.map((rep) => (
            <RepresentanteCard
              key={rep.id}
              rep={rep}
              onClick={() => setDrawerRep(rep)}
              abrirReset={abrirResetSenha}
            />
          ))}
        </div>
      )}

      <RepresentanteDrawer
        rep={drawerRep}
        onClose={() => setDrawerRep(null)}
        onUpdated={() => {
          void carregar();
          setDrawerRep(null);
        }}
      />

      {resetandoRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Resetar senha do representante
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {resetandoRep.nome}
                </p>
              </div>
              <button
                onClick={() => setResetandoRep(null)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                Confirme o CPF do representante para resetar a senha. No próximo
                login, ele precisará cadastrar uma nova senha.
              </div>

              {resetError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
                  {resetSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  CPF do representante
                </label>
                <input
                  type="text"
                  value={cpfReset}
                  onChange={(e) => setCpfReset(e.target.value)}
                  placeholder="Digite o CPF"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Confirmar CPF
                </label>
                <input
                  type="text"
                  value={confirmCpf}
                  onChange={(e) => setConfirmCpf(e.target.value)}
                  placeholder="Digite novamente para confirmar"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setResetandoRep(null)}
                disabled={submittingReset}
                className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void confirmarResetSenha()}
                disabled={submittingReset}
                className="flex-1 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submittingReset ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <KeyRound size={14} />
                )}
                {submittingReset ? 'Resetando...' : 'Confirmar reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
