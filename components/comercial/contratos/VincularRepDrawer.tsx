'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Search,
  UserPlus,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface RepResultado {
  id: number;
  nome: string;
  cpf: string | null;
  modelo_comissionamento: 'percentual' | 'custo_fixo' | null;
  percentual_comissao: string | null;
  status: string;
}

interface VincularRepDrawerProps {
  /** ID do vínculo existente. NULL quando o tomador ainda não tem nenhum vínculo. */
  vinculoId: number | null;
  /** ID do tomador (clinica.id ou entidade.id) — obrigatório quando vinculoId é null */
  contratanteId: number | null;
  /** Tipo do tomador — obrigatório quando vinculoId é null */
  contratanteTipo: 'clinica' | 'entidade' | null;
  contratanteNome: string;
  onClose: () => void;
  onSaved: () => void;
}

function fmtCpf(cpf: string | null): string {
  if (!cpf) return '—';
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function VincularRepDrawer({
  vinculoId,
  contratanteId,
  contratanteTipo,
  contratanteNome,
  onClose,
  onSaved,
}: VincularRepDrawerProps) {
  // Drawer está aberto se tem vínculo existente OU tem tomador válido para criar novo
  const isOpen =
    vinculoId !== null || (contratanteId !== null && contratanteTipo !== null);

  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<RepResultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [repSelecionado, setRepSelecionado] = useState<RepResultado | null>(
    null
  );
  const [valorNegociado, setValorNegociado] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setBusca('');
      setResultados([]);
      setRepSelecionado(null);
      setValorNegociado('');
      setErro(null);
      setSucesso(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (busca.trim().length < 2) {
      setResultados([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(
          `/api/comercial/representantes/busca?q=${encodeURIComponent(busca.trim())}`,
          { cache: 'no-store' }
        );
        const j = await res.json();
        setResultados(j.representantes ?? []);
      } catch {
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [busca]);

  const handleSelecionar = useCallback((rep: RepResultado) => {
    setRepSelecionado(rep);
    setResultados([]);
    setBusca('');
    setValorNegociado('');
    setErro(null);
  }, []);

  const handleVincular = useCallback(async () => {
    if (!repSelecionado) return;
    if (
      vinculoId === null &&
      (contratanteId === null || contratanteTipo === null)
    )
      return;

    const precisaValor = repSelecionado.modelo_comissionamento === 'custo_fixo';
    const vlNeg = parseFloat(valorNegociado.replace(',', '.'));

    if (
      precisaValor &&
      (valorNegociado.trim() === '' || isNaN(vlNeg) || vlNeg < 0)
    ) {
      setErro('Informe o valor negociado com o tomador (≥ R$ 0,00).');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      let res: Response;

      if (vinculoId !== null) {
        // Modo PATCH — vínculo já existe, apenas atribui o rep
        const body: Record<string, unknown> = {
          representante_id: repSelecionado.id,
        };
        if (precisaValor && !isNaN(vlNeg)) body.valor_negociado = vlNeg;

        res = await fetch(`/api/comercial/vinculos/${vinculoId}/atribuir-rep`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        // Modo POST — cria vínculo novo com rep já atribuído
        const body: Record<string, unknown> = {
          representante_id: repSelecionado.id,
          [`${contratanteTipo}_id`]: contratanteId,
        };
        if (precisaValor && !isNaN(vlNeg)) body.valor_negociado = vlNeg;

        res = await fetch('/api/comercial/vinculos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      const j = await res.json();

      if (!res.ok) {
        setErro(j.error ?? `Erro ${res.status}`);
        return;
      }

      setSucesso(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 800);
    } catch {
      setErro('Falha de comunicação. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }, [
    vinculoId,
    contratanteId,
    contratanteTipo,
    repSelecionado,
    valorNegociado,
    onSaved,
    onClose,
  ]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !salvando) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, salvando, onClose]);

  if (!isOpen) return null;

  const precisaValor = repSelecionado?.modelo_comissionamento === 'custo_fixo';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={() => {
          if (!salvando) onClose();
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Vincular representante"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
              <UserPlus size={16} className="text-green-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                Vincular Representante
              </p>
              <p className="text-xs text-gray-400 leading-tight mt-0.5 max-w-[220px] truncate">
                {contratanteNome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={salvando}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Representante selecionado */}
          {repSelecionado && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        repSelecionado.modelo_comissionamento === 'percentual'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {repSelecionado.modelo_comissionamento === 'percentual'
                        ? `% — ${repSelecionado.percentual_comissao ?? '?'}%`
                        : 'Custo Fixo'}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mt-1 leading-tight">
                    {repSelecionado.nome}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {fmtCpf(repSelecionado.cpf)}
                  </p>
                </div>
                <button
                  onClick={() => setRepSelecionado(null)}
                  className="shrink-0 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                  aria-label="Remover seleção"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Campo valor negociado — só para custo_fixo */}
              {precisaValor && (
                <div className="pt-2 border-t border-green-200">
                  <label
                    htmlFor="valor-negociado"
                    className="block text-xs font-semibold text-gray-700 mb-1"
                  >
                    Valor negociado com o tomador *
                    <span className="font-normal text-gray-400 ml-1">
                      (R$ por avaliação)
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">
                      R$
                    </span>
                    <input
                      id="valor-negociado"
                      type="number"
                      min={0}
                      step="0.01"
                      value={valorNegociado}
                      onChange={(e) => {
                        setValorNegociado(e.target.value);
                        setErro(null);
                      }}
                      placeholder="0,00"
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Campo de busca */}
          {!repSelecionado && (
            <div className="space-y-2">
              <label
                htmlFor="busca-rep"
                className="block text-xs font-semibold text-gray-700"
              >
                Buscar representante
                <span className="font-normal text-gray-400 ml-1">
                  (nome)
                </span>
              </label>
              <div className="relative">
                {buscando ? (
                  <Loader2
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
                  />
                ) : (
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                )}
                <input
                  id="busca-rep"
                  ref={inputRef}
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite o nome do representante…"
                  autoComplete="off"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>

              {/* Resultados */}
              {resultados.length > 0 && (
                <ul className="mt-1 border border-gray-100 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-50">
                  {resultados.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => handleSelecionar(r)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              r.modelo_comissionamento === 'percentual'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {r.modelo_comissionamento === 'percentual'
                              ? `${r.percentual_comissao ?? '?'}%`
                              : 'Custo Fixo'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-900 mt-0.5 leading-tight">
                          {r.nome}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono">
                          {fmtCpf(r.cpf)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {busca.trim().length >= 2 &&
                !buscando &&
                resultados.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">
                    Nenhum representante encontrado para &ldquo;{busca}&rdquo;.
                  </p>
                )}

              {busca.trim().length < 2 && busca.trim().length > 0 && (
                <p className="text-xs text-gray-400 py-1">
                  Digite ao menos 2 caracteres para buscar.
                </p>
              )}
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="shrink-0 text-red-500 mt-0.5" />
              <p className="text-xs text-red-700">{erro}</p>
            </div>
          )}

          {/* Sucesso */}
          {sucesso && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={14} className="text-green-600" />
              <p className="text-xs text-green-700 font-medium">
                Representante vinculado com sucesso!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={salvando}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={() => void handleVincular()}
            disabled={
              !repSelecionado ||
              salvando ||
              sucesso ||
              (vinculoId === null &&
                (contratanteId === null || contratanteTipo === null))
            }
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
          >
            {salvando ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Vinculando…
              </>
            ) : (
              <>
                <UserPlus size={14} />
                Vincular
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
