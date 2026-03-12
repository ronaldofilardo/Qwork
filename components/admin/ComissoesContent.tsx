'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface Comissao {
  id: number;
  representante_nome: string;
  representante_codigo: string;
  representante_email: string;
  representante_tipo_pessoa: string;
  entidade_nome: string;
  numero_laudo: string | null;
  valor_laudo: string;
  valor_comissao: string;
  percentual_comissao: string;
  status: string;
  motivo_congelamento: string | null;
  mes_emissao: string;
  mes_pagamento: string;
  data_emissao_laudo: string;
  data_aprovacao: string | null;
  data_liberacao: string | null;
  data_pagamento: string | null;
  nf_path: string | null;
  nf_nome_arquivo: string | null;
  nf_rpa_enviada_em: string | null;
  nf_rpa_aprovada_em: string | null;
  comprovante_pagamento_path: string | null;
}

const COMPROVANTE_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const COMPROVANTE_MIMES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

interface Resumo {
  total_comissoes: string;
  pendentes_nf: string;
  em_analise: string;
  liberadas: string;
  pagas: string;
  congeladas: string;
  valor_a_pagar: string;
  valor_pago_total: string;
}

const STATUS_BADGE: Record<string, { label: string; cor: string }> = {
  retida: { label: 'Retida', cor: 'bg-gray-100 text-gray-600' },
  pendente_nf: { label: 'Aguardando NF', cor: 'bg-blue-100 text-blue-700' },
  nf_em_analise: {
    label: 'NF em Análise',
    cor: 'bg-indigo-100 text-indigo-700',
  },
  congelada_rep_suspenso: {
    label: 'Congelada (Suspensão)',
    cor: 'bg-orange-100 text-orange-700',
  },
  congelada_aguardando_admin: {
    label: 'Aguardando Admin',
    cor: 'bg-yellow-100 text-yellow-700',
  },
  liberada: { label: 'Liberada', cor: 'bg-purple-100 text-purple-700' },
  paga: { label: 'Paga', cor: 'bg-green-100 text-green-700' },
  cancelada: { label: 'Cancelada', cor: 'bg-red-100 text-red-600' },
};

const ACOES_POR_STATUS: Record<string, string[]> = {
  pendente_nf: ['congelar', 'cancelar'],
  nf_em_analise: ['liberar', 'congelar', 'cancelar'],
  liberada: ['pagar', 'congelar', 'cancelar'],
  congelada_aguardando_admin: ['descongelar', 'cancelar'],
  congelada_rep_suspenso: ['descongelar', 'cancelar'],
  retida: ['cancelar'],
};

const ACAO_LABEL: Record<string, string> = {
  liberar: '✅ Liberar (aprovar NF)',
  pagar: '💰 Marcar como Paga',
  congelar: '❄ Congelar',
  cancelar: '❌ Cancelar',
  descongelar: '🔓 Descongelar',
};

export function ComissoesContent() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [acaoPendente, setAcaoPendente] = useState<{
    comissao: Comissao;
    acao: string;
  } | null>(null);
  const [motivoAcao, setMotivoAcao] = useState('');
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [comprovanteErro, setComprovanteErro] = useState('');
  const comprovanteInputRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (statusFiltro) params.set('status', statusFiltro);
      const res = await fetch(`/api/admin/comissoes?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErro(
          `Erro ao carregar comissões (${res.status}): ${errData.error ?? res.statusText}`
        );
        return;
      }
      const data = await res.json();
      setComissoes(data.comissoes ?? []);
      setResumo(data.resumo ?? null);
      setTotal(data.total ?? 0);
    } catch (e) {
      setErro(
        `Falha de rede ao carregar comissões: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFiltro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleComprovanteFile = (f: File | null) => {
    setComprovanteErro('');
    setComprovanteFile(null);
    if (!f) return;
    if (f.size > COMPROVANTE_MAX_SIZE) {
      setComprovanteErro(
        `Arquivo excede 5MB (${(f.size / 1024 / 1024).toFixed(1)}MB)`
      );
      return;
    }
    if (!COMPROVANTE_MIMES.includes(f.type)) {
      setComprovanteErro('Tipo não aceito. Use PDF, PNG, JPG ou WEBP.');
      return;
    }
    setComprovanteFile(f);
  };

  const executarAcao = async () => {
    if (!acaoPendente) return;
    setActionLoading(acaoPendente.comissao.id);
    setErro('');
    try {
      // Ação 'pagar' com arquivo: usa rota de upload dedicada
      if (acaoPendente.acao === 'pagar' && comprovanteFile) {
        const formData = new FormData();
        formData.append('comprovante', comprovanteFile);
        const res = await fetch(
          `/api/admin/comissoes/${acaoPendente.comissao.id}/comprovante`,
          { method: 'POST', body: formData }
        );
        const data = await res.json();
        if (!res.ok) {
          setErro(data.error ?? 'Erro ao enviar comprovante');
          return;
        }
        setSucesso('Comissão marcada como paga com comprovante');
      } else {
        // Demais ações (ou 'pagar' sem arquivo)
        const res = await fetch(
          `/api/admin/comissoes/${acaoPendente.comissao.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              acao: acaoPendente.acao,
              motivo: motivoAcao || null,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          setErro(data.error ?? 'Erro ao executar ação');
          return;
        }
        setSucesso(`Ação '${acaoPendente.acao}' executada com sucesso`);
      }
      setTimeout(() => setSucesso(''), 3000);
      setAcaoPendente(null);
      setMotivoAcao('');
      setComprovanteFile(null);
      setComprovanteErro('');
      await carregar();
    } finally {
      setActionLoading(null);
    }
  };

  const fmt = (v: string | number) =>
    `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Comissões — Painel Admin
        </h2>
        <div className="text-sm text-gray-500">{total} comissões</div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          {sucesso}
        </div>
      )}

      {/* Modal de ação */}
      {acaoPendente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">
              {ACAO_LABEL[acaoPendente.acao]} — Comissão #
              {acaoPendente.comissao.id}
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Representante:</strong>{' '}
                {acaoPendente.comissao.representante_nome}
              </p>
              <p>
                <strong>Cliente:</strong> {acaoPendente.comissao.entidade_nome}
              </p>
              <p>
                <strong>Valor:</strong>{' '}
                {fmt(acaoPendente.comissao.valor_comissao)}
              </p>
            </div>
            {['congelar', 'cancelar'].includes(acaoPendente.acao) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo{' '}
                  {acaoPendente.acao === 'congelar'
                    ? '(obrigatório)'
                    : '(opcional)'}
                </label>
                <textarea
                  value={motivoAcao}
                  onChange={(e) => setMotivoAcao(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  rows={2}
                  required={acaoPendente.acao === 'congelar'}
                />
              </div>
            )}
            {acaoPendente.acao === 'pagar' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comprovante de pagamento
                  <span className="ml-1 text-gray-400 font-normal">
                    (opcional)
                  </span>
                </label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => comprovanteInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleComprovanteFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                >
                  <input
                    ref={comprovanteInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) =>
                      handleComprovanteFile(e.target.files?.[0] ?? null)
                    }
                  />
                  {comprovanteFile ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-gray-700 truncate">
                        📎 {comprovanteFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setComprovanteFile(null);
                          setComprovanteErro('');
                          if (comprovanteInputRef.current)
                            comprovanteInputRef.current.value = '';
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        aria-label="Remover arquivo"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Clique ou arraste — PDF, PNG, JPG, WEBP · máx. 5 MB
                    </p>
                  )}
                </div>
                {comprovanteErro && (
                  <p className="text-xs text-red-600 mt-1">{comprovanteErro}</p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAcaoPendente(null);
                  setMotivoAcao('');
                  setComprovanteFile(null);
                  setComprovanteErro('');
                  if (comprovanteInputRef.current)
                    comprovanteInputRef.current.value = '';
                }}
                className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executarAcao}
                disabled={
                  actionLoading !== null ||
                  (acaoPendente.acao === 'congelar' && !motivoAcao.trim()) ||
                  !!comprovanteErro
                }
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {actionLoading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'A Pagar',
              value: fmt(resumo.valor_a_pagar),
              icon: '💳',
              cor: 'text-blue-700',
            },
            {
              label: 'Total Pago',
              value: fmt(resumo.valor_pago_total),
              icon: '✅',
              cor: 'text-green-700',
            },
            {
              label: 'Aguardando NF',
              value: resumo.pendentes_nf,
              icon: '📄',
              cor: 'text-blue-700',
            },
            {
              label: 'NF em Análise',
              value: resumo.em_analise,
              icon: '🔍',
              cor: 'text-indigo-700',
            },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border p-4">
              <span className="text-2xl">{c.icon}</span>
              <div className={`text-xl font-bold mt-2 ${c.cor}`}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros de status */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setStatusFiltro('');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFiltro === '' ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
        >
          Todos
        </button>
        {Object.entries(STATUS_BADGE).map(([s, { label, cor }]) => (
          <button
            key={s}
            onClick={() => {
              setStatusFiltro(statusFiltro === s ? '' : s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${cor} ${statusFiltro === s ? 'ring-2 ring-offset-1 ring-blue-400' : 'opacity-70 hover:opacity-100'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : comissoes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          Nenhuma comissão encontrada.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-3 py-3 text-left">Representante</th>
                <th className="px-3 py-3 text-left">Cliente</th>
                <th className="px-3 py-3 text-left">Laudo</th>
                <th className="px-3 py-3 text-right">Comissão</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-center">NF/RPA</th>
                <th className="px-3 py-3 text-left">Mês Pag.</th>
                <th className="px-3 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {comissoes.map((c) => {
                const acoes = ACOES_POR_STATUS[c.status] ?? [];

                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900">
                        {c.representante_nome}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {c.representante_codigo} ·{' '}
                        {c.representante_tipo_pessoa.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {c.entidade_nome}
                    </td>
                    <td className="px-3 py-3 text-gray-500 font-mono text-xs">
                      {c.numero_laudo ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-green-700">
                      {fmt(c.valor_comissao)}
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[c.status]?.cor ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {STATUS_BADGE[c.status]?.label ?? c.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {c.nf_rpa_aprovada_em ? (
                        <span
                          className="text-xs text-green-700"
                          title="NF aprovada"
                        >
                          ✅
                        </span>
                      ) : c.nf_rpa_enviada_em ? (
                        <a
                          href={`/api/admin/comissoes/${c.id}/nf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-blue-300 rounded text-blue-700 hover:bg-blue-50 transition-colors whitespace-nowrap"
                          title={c.nf_nome_arquivo || 'Ver NF/RPA'}
                        >
                          📄 Ver NF
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">
                      {c.mes_pagamento
                        ? new Date(c.mes_pagamento).toLocaleDateString(
                            'pt-BR',
                            { month: 'short', year: 'numeric' }
                          )
                        : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 justify-center flex-wrap">
                        {acoes.map((acao) => (
                          <button
                            key={acao}
                            onClick={() =>
                              setAcaoPendente({ comissao: c, acao })
                            }
                            className="text-xs px-2 py-1 border rounded hover:bg-gray-50 hover:border-blue-300 transition-colors whitespace-nowrap"
                          >
                            {ACAO_LABEL[acao]}
                          </button>
                        ))}
                        {acoes.length === 0 && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {total > 30 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Pág. {page} de {Math.ceil(total / 30)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 30)}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
