'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users2,
  UserPlus,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  X,
  Pencil,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import CadastrarVendedorModal, {
  CodigoVendedorSucesso,
} from './CadastrarVendedorModal';

interface Vendedor {
  vinculo_id: number;
  vendedor_id: number;
  vendedor_nome: string;
  vendedor_email: string;
  vendedor_cpf: string;
  codigo_vendedor: string | null;
  leads_ativos: number;
  vinculado_em: string;
}

// ---------------------------------------------------------------------------
// Card do Vendedor
// ---------------------------------------------------------------------------

function VendedorCard({
  v,
  copiado,
  onCopiar,
  onClick,
}: {
  v: Vendedor;
  copiado: boolean;
  onCopiar: () => void;
  onClick: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-150 p-5 group">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base flex-shrink-0">
          {v.vendedor_nome
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {v.vendedor_nome}
            </p>
            <button
              onClick={onClick}
              className="p-1 text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0"
              title="Editar dados do vendedor"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          {v.vendedor_email && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {v.vendedor_email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
        {/* Codigo vendedor */}
        {v.codigo_vendedor ? (
          <div className="flex items-center gap-1.5">
            <code className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
              {v.codigo_vendedor}
            </code>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopiar();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Copiar codigo"
            >
              {copiado ? (
                <Check size={13} className="text-green-600" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Sem codigo</span>
        )}
        {/* Leads */}
        <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
          <TrendingUp size={12} />
          <span>
            {v.leads_ativos} lead{v.leads_ativos !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer de edicao do vendedor
// ---------------------------------------------------------------------------

interface EditarForm {
  nome: string;
  email: string;
  sexo: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
}

function EditarVendedorDrawer({
  vendedor,
  onClose,
  onUpdated,
}: {
  vendedor: Vendedor | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState<EditarForm>({
    nome: '',
    email: '',
    sexo: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!vendedor) return;
    setErro(null);
    setForm({
      nome: vendedor.vendedor_nome ?? '',
      email: vendedor.vendedor_email ?? '',
      sexo: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
    });
  }, [vendedor]);

  const salvar = async () => {
    if (!vendedor) return;
    setSalvando(true);
    setErro(null);
    try {
      const body: Record<string, string> = {};
      if (form.nome.trim()) body.nome = form.nome.trim();
      if (form.email.trim()) body.email = form.email.trim();
      if (form.sexo) body.sexo = form.sexo;
      if (form.endereco.trim()) body.endereco = form.endereco.trim();
      if (form.cidade.trim()) body.cidade = form.cidade.trim();
      if (form.estado.trim()) body.estado = form.estado.trim();
      if (form.cep.trim()) body.cep = form.cep.trim();

      const res = await fetch(
        `/api/representante/equipe/vendedores/${vendedor.vendedor_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Erro ao salvar');
      }
      onUpdated();
      onClose();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setSalvando(false);
    }
  };

  const isOpen = vendedor !== null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {vendedor?.vendedor_nome
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {vendedor?.vendedor_nome}
              </p>
              <p className="text-xs text-gray-400">Editar dados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Info imutavel */}
          <div className="bg-blue-50 rounded-lg px-4 py-3 text-xs text-blue-700">
            <p className="font-semibold mb-1">
              Dados imutaveis (apenas suporte pode alterar):
            </p>
            <p>
              CPF:{' '}
              <span className="font-mono">{vendedor?.vendedor_cpf ?? '-'}</span>
            </p>
            <p>
              Codigo:{' '}
              <span className="font-mono">
                {vendedor?.codigo_vendedor ?? '-'}
              </span>
            </p>
            <p className="mt-1 text-blue-500">
              Dados bancarios so podem ser editados pelo suporte.
            </p>
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={14} className="shrink-0" />
              {erro}
            </div>
          )}

          <div className="space-y-3">
            {[
              { key: 'nome', label: 'Nome completo', type: 'text' },
              { key: 'email', label: 'E-mail', type: 'email' },
              { key: 'endereco', label: 'Endereco', type: 'text' },
              { key: 'cidade', label: 'Cidade', type: 'text' },
              { key: 'cep', label: 'CEP', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key as keyof EditarForm]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Estado (UF)
              </label>
              <input
                type="text"
                maxLength={2}
                placeholder="SP"
                value={form.estado}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    estado: e.target.value.toUpperCase(),
                  }))
                }
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Sexo</label>
              <select
                value={form.sexo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sexo: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                <option value="">Nao informado</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t shrink-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={salvando}
            className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {salvando ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Pencil size={14} />
            )}
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Pagina principal
// ---------------------------------------------------------------------------

export default function EquipePage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [codigoGerado, setCodigoGerado] = useState<{
    codigo: string;
    nome: string;
  } | null>(null);
  const [codigoCopiadoId, setCodigoCopiadoId] = useState<number | null>(null);
  const [editarVendedor, setEditarVendedor] = useState<Vendedor | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/representante/equipe/vendedores?page=${page}`
      );
      if (res.ok) {
        const d = (await res.json()) as {
          vendedores?: Vendedor[];
          total?: number;
        };
        setVendedores(d.vendedores ?? []);
        setTotal(d.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleCadastroSucesso = (codigo: string, nomeVendedor: string) => {
    setShowModal(false);
    setCodigoGerado({ codigo, nome: nomeVendedor });
    void carregar();
  };

  const handleCopiarCodigo = async (codigo: string, vendedorId: number) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCodigoCopiadoId(vendedorId);
      setTimeout(() => setCodigoCopiadoId(null), 2000);
    } catch {
      // clipboard indisponivel
    }
  };

  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Minha Equipe</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} vendedor{total !== 1 ? 'es' : ''} vinculado
            {total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          <UserPlus size={16} />
          Cadastrar Vendedor
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
        </div>
      ) : vendedores.length === 0 ? (
        <div className="bg-gray-50 border border-dashed rounded-xl p-12 text-center">
          <Users2 size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            Nenhum vendedor na equipe ainda.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Clique em &quot;Cadastrar Vendedor&quot; para adicionar a equipe.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendedores.map((v) => (
              <VendedorCard
                key={v.vinculo_id}
                v={v}
                copiado={codigoCopiadoId === v.vendedor_id}
                onCopiar={() =>
                  v.codigo_vendedor
                    ? handleCopiarCodigo(v.codigo_vendedor, v.vendedor_id)
                    : undefined
                }
                onClick={() => setEditarVendedor(v)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
              >
                Proxima
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <CadastrarVendedorModal
          onClose={() => setShowModal(false)}
          onSuccess={handleCadastroSucesso}
        />
      )}

      {codigoGerado && (
        <CodigoVendedorSucesso
          codigo={codigoGerado.codigo}
          nomeVendedor={codigoGerado.nome}
          onClose={() => setCodigoGerado(null)}
        />
      )}

      <EditarVendedorDrawer
        vendedor={editarVendedor}
        onClose={() => setEditarVendedor(null)}
        onUpdated={() => void carregar()}
      />
    </div>
  );
}
