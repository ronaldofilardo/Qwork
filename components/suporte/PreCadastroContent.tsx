'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Stethoscope,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  FileText,
  Clock,
  Filter,
} from 'lucide-react';
import type { PreCadastroItem } from '@/app/api/suporte/pre-cadastro/route';

type TipoFiltro = 'todos' | 'clinica' | 'entidade';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatarCNPJ(cnpj: string): string {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  aguardando_aceite_contrato: {
    label: 'Aguardando aceite',
    color: 'bg-amber-100 text-amber-800',
  },
  aguardando_aceite: {
    label: 'Aguardando aceite',
    color: 'bg-amber-100 text-amber-800',
  },
  pendente: {
    label: 'Pendente',
    color: 'bg-gray-100 text-gray-700',
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_LABELS[status] ?? {
    label: status,
    color: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}
    >
      <Clock size={10} />
      {cfg.label}
    </span>
  );
}

interface CopyButtonProps {
  url: string;
}

function CopyButton({ url }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback para browsers sem suporte a clipboard API
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copiado!' : 'Copiar link de aceite'}
      aria-label={copied ? 'Link copiado' : 'Copiar link de aceite do contrato'}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer
        ${
          copied
            ? 'bg-green-100 text-green-700 focus:ring-green-400'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'
        }`}
    >
      {copied ? (
        <>
          <Check size={14} />
          Copiado!
        </>
      ) : (
        <>
          <Copy size={14} />
          Gerar Link
        </>
      )}
    </button>
  );
}

function buildAceiteUrl(tomadorId: number, contratoId: number): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/sucesso-cadastro?id=${tomadorId}&contrato_id=${contratoId}`;
}

interface PreCadastroRowProps {
  item: PreCadastroItem;
}

function PreCadastroRow({ item }: PreCadastroRowProps) {
  const url = buildAceiteUrl(item.id, item.contrato_id);
  const isClinique = item.tipo === 'clinica';

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
      {/* Tipo */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isClinique ? (
            <Stethoscope size={16} className="text-blue-500 shrink-0" />
          ) : (
            <Building2 size={16} className="text-purple-500 shrink-0" />
          )}
          <span className="text-xs text-gray-500 capitalize">
            {isClinique ? 'Clínica' : 'Entidade'}
          </span>
        </div>
      </td>

      {/* Nome */}
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900 text-sm">{item.nome}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatarCNPJ(item.cnpj)}
        </p>
      </td>

      {/* Email */}
      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
        {item.email}
      </td>

      {/* Responsável */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <p className="text-sm text-gray-900">{item.responsavel_nome ?? '—'}</p>
        <p className="text-xs text-gray-400">{item.responsavel_cargo ?? ''}</p>
      </td>

      {/* Telefone Responsável */}
      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell whitespace-nowrap">
        {item.responsavel_celular ?? '—'}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={item.status} />
      </td>

      {/* Data cadastro */}
      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell whitespace-nowrap">
        {formatarData(item.criado_em)}
      </td>

      {/* Ação */}
      <td className="px-4 py-3 text-right">
        <CopyButton url={url} />
      </td>
    </tr>
  );
}

export function PreCadastroContent() {
  const [items, setItems] = useState<PreCadastroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState<TipoFiltro>('todos');

  const fetchPreCadastros = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams();
      if (filtro !== 'todos') params.set('tipo', filtro);
      const res = await fetch(
        `/api/suporte/pre-cadastro${params.toString() ? `?${params}` : ''}`
      );
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Erro ao carregar pré-cadastros');
      }
      const data = (await res.json()) as { pre_cadastros: PreCadastroItem[] };
      setItems(data.pre_cadastros ?? []);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    void fetchPreCadastros();
  }, [fetchPreCadastros]);

  return (
    <div className="p-6 space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Pré-cadastros com Contrato Pendente
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Entidades e clínicas que ainda não aceitaram o contrato. Gere o link
            abaixo e envie por fora da plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Filtro de tipo */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
            <Filter size={14} className="text-gray-400 ml-1" />
            {(['todos', 'clinica', 'entidade'] as TipoFiltro[]).map((t) => (
              <button
                key={t}
                onClick={() => setFiltro(t)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400
                  ${
                    filtro === t
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {t === 'todos'
                  ? 'Todos'
                  : t === 'clinica'
                    ? 'Clínicas'
                    : 'Entidades'}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => void fetchPreCadastros()}
            disabled={loading}
            aria-label="Atualizar lista"
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={16} className="shrink-0" />
          {erro}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          aria-busy="true"
          className="flex items-center justify-center py-16 text-gray-400"
        >
          <RefreshCw size={24} className="animate-spin mr-2" />
          <span className="text-sm">Carregando pré-cadastros...</span>
        </div>
      )}

      {/* Lista */}
      {!loading && !erro && (
        <>
          {items.length === 0 ? (
            <div
              data-testid="empty-state"
              className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3"
            >
              <Check size={40} className="text-green-400" />
              <p className="text-base font-medium text-gray-500">
                Nenhum pré-cadastro pendente de aceite
              </p>
              <p className="text-sm">
                Todos os contratos gerados já foram aceitos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Nome / CNPJ
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                      Email
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                      Responsável
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                      Telefone
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                      Cadastrado em
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                      Link de Aceite
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <PreCadastroRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {items.length > 0 && (
            <p className="text-xs text-gray-400 text-right">
              {items.length}{' '}
              {items.length === 1
                ? 'pré-cadastro encontrado'
                : 'pré-cadastros encontrados'}
            </p>
          )}
        </>
      )}
    </div>
  );
}
