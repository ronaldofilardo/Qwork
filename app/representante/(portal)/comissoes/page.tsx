'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';

interface Comissao {
  id: number;
  entidade_nome: string;
  valor_laudo: string;
  valor_comissao: string;
  percentual_comissao: string;
  status: string;
  mes_emissao: string;
  mes_pagamento: string;
  data_emissao_laudo: string;
  data_pagamento: string | null;
  numero_laudo: string | null;
  motivo_congelamento: string | null;
  nf_rpa_enviada_em: string | null;
  nf_nome_arquivo: string | null;
  nf_rpa_aprovada_em: string | null;
  nf_rpa_rejeitada_em: string | null;
  nf_rpa_motivo_rejeicao: string | null;
  comprovante_pagamento_path: string | null;
  parcela_numero: number | null;
  total_parcelas: number | null;
  /** NULL = parcela futura provisionada; NOT NULL = parcela efetivamente paga */
  parcela_confirmada_em: string | null;
}

interface Resumo {
  pendentes: string;
  liberadas: string;
  pagas: string;
  valor_pendente: string;
  valor_futuro: string;
  valor_liberado: string;
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
    label: 'Congelada',
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

const NF_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const NF_TIPOS = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

function CicloPagamentoBanner() {
  // Usar horário de São Paulo para cálculos de prazo (F-18)
  const spFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = spFormatter.formatToParts(new Date());
  const get = (t: string) =>
    parseInt(parts.find((p) => p.type === t)?.value ?? '0');
  const ano = get('year');
  const mes = get('month') - 1; // 0-indexed
  const diaAtual = get('day');
  const horaAtual = get('hour');

  const dentroDoPrazo = diaAtual < 5 || (diaAtual === 5 && horaAtual < 18);

  let mesAlvo: number;
  let anoAlvo: number;

  if (dentroDoPrazo) {
    mesAlvo = mes;
    anoAlvo = ano;
  } else {
    mesAlvo = mes + 1;
    anoAlvo = mesAlvo > 11 ? ano + 1 : ano;
    mesAlvo = mesAlvo > 11 ? 0 : mesAlvo;
  }

  const prazoNf = new Date(anoAlvo, mesAlvo, 5, 18, 0);
  const dataPagamento = new Date(anoAlvo, mesAlvo, 15);
  const agora = new Date();

  const fmtData = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  const diasRestantes = Math.max(
    0,
    Math.ceil((prazoNf.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Ciclo de Pagamento
            </p>
            <p className="text-xs text-gray-600">
              Envie sua NF/RPA até <strong>18h de {fmtData(prazoNf)}</strong>{' '}
              para receber em <strong>{fmtData(dataPagamento)}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {diasRestantes <= 3 && diasRestantes > 0 && (
            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              ⚠️ {diasRestantes} dia{diasRestantes > 1 ? 's' : ''} restante
              {diasRestantes > 1 ? 's' : ''}
            </span>
          )}
          {diasRestantes === 0 && (
            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              ⏰ Prazo encerra hoje!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NfUploadModal({
  comissao,
  onClose,
  onSuccess,
}: {
  comissao: Comissao;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    setErro('');
    setPreview(null);
    if (!f) return;
    if (f.size > NF_MAX_SIZE) {
      setErro(`Arquivo excede 2MB (${(f.size / (1024 * 1024)).toFixed(1)}MB)`);
      return;
    }
    if (!NF_TIPOS.includes(f.type)) {
      setErro('Tipo não aceito. Use PDF, PNG, JPG ou WEBP.');
      return;
    }
    setFile(f);
    // Preview para imagens
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setErro('');
    try {
      const formData = new FormData();
      formData.append('nf', file);
      const res = await fetch(
        `/api/representante/comissoes/${comissao.id}/nf`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao enviar NF');
        return;
      }
      alert(
        data.previsao
          ? `NF enviada! Previsão de pagamento: ${new Date(data.previsao.data_prevista_pagamento).toLocaleDateString('pt-BR')}`
          : 'NF enviada com sucesso!'
      );
      onSuccess();
    } catch {
      setErro('Erro de rede. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-1">Enviar NF/RPA</h3>
        <p className="text-sm text-gray-500 mb-4">
          Comissão #{comissao.id} — {comissao.entidade_nome}
        </p>

        {/* Drop area */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFile(e.dataTransfer.files?.[0] || null);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <div>
              {preview && (
                <Image
                  src={preview}
                  alt="Preview"
                  width={160}
                  height={160}
                  className="mx-auto mb-3 max-h-40 rounded"
                />
              )}
              <p className="text-sm font-medium text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          ) : (
            <div>
              <span className="text-4xl">📄</span>
              <p className="text-sm text-gray-600 mt-2">
                Clique ou arraste o arquivo aqui
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, PNG, JPG ou WEBP — máx. 2MB
              </p>
            </div>
          )}
        </div>

        {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Enviando...' : 'Enviar NF'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NfStatusCell({
  comissao,
  onUpload,
}: {
  comissao: Comissao;
  onUpload: () => void;
}) {
  // Já tem NF aprovada
  if (comissao.nf_rpa_aprovada_em) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700">
        ✅ NF Aprovada
      </span>
    );
  }

  // NF rejeitada — pode reenviar
  if (comissao.nf_rpa_rejeitada_em) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs text-red-600">
          ❌ NF Rejeitada
        </span>
        {comissao.nf_rpa_motivo_rejeicao && (
          <p
            className="text-xs text-gray-400 mt-0.5"
            title={comissao.nf_rpa_motivo_rejeicao}
          >
            {comissao.nf_rpa_motivo_rejeicao.length > 40
              ? comissao.nf_rpa_motivo_rejeicao.slice(0, 40) + '...'
              : comissao.nf_rpa_motivo_rejeicao}
          </p>
        )}
        <button
          onClick={onUpload}
          className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Reenviar
        </button>
      </div>
    );
  }

  // NF enviada, aguardando review
  if (comissao.nf_rpa_enviada_em) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs text-yellow-700">
          📤 Enviada
        </span>
        <p className="text-xs text-gray-400 mt-0.5">
          {comissao.nf_nome_arquivo}
        </p>
      </div>
    );
  }

  // Status permite envio de NF
  const podeEnviar = ['pendente_nf', 'congelada_aguardando_admin'].includes(
    comissao.status
  );

  if (!podeEnviar) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <button
      onClick={onUpload}
      className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      📤 Enviar NF
    </button>
  );
}

export default function ComissoesRepresentante() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState<Comissao | null>(null);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (statusFiltro) params.set('status', statusFiltro);
      const res = await fetch(`/api/representante/comissoes?${params}`);
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

  const fmt = (v: string | number) =>
    `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Minhas Comissões</h1>

      {erro && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* Banner ciclo pagamento */}
      <CicloPagamentoBanner />

      {/* Resumo financeiro */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'A Receber',
              value: fmt(resumo.valor_pendente),
              icon: '⏳',
              cor: 'text-blue-700',
              title: 'Parcelas pagas aguardando NF/aprovação',
            },
            {
              label: 'Futuro',
              value: fmt(resumo.valor_futuro),
              icon: '📆',
              cor: 'text-slate-600',
              title: 'Parcelas futuras ainda não vencidas',
            },
            {
              label: 'Liberado',
              value: fmt(resumo.valor_liberado),
              icon: '🟢',
              cor: 'text-purple-700',
              title: 'NF aprovada, aguardando pagamento no dia 15',
            },
            {
              label: 'Total Pago',
              value: fmt(resumo.valor_pago_total),
              icon: '✅',
              cor: 'text-green-700',
              title: 'Valor histórico de comissões pagas',
            },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-white rounded-xl border p-4"
              title={c.title}
            >
              <span className="text-2xl">{c.icon}</span>
              <div className={`text-xl font-bold mt-2 ${c.cor}`}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline visual de status */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Pipeline de Pagamento
        </h2>
        <div className="flex items-center gap-1 flex-wrap">
          {['retida', 'pendente_nf', 'nf_em_analise', 'liberada', 'paga'].map(
            (s, i, arr) => (
              <div key={s} className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setStatusFiltro(statusFiltro === s ? '' : s);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                    ${STATUS_BADGE[s]?.cor ?? 'bg-gray-100 text-gray-600'}
                    ${statusFiltro === s ? 'ring-2 ring-offset-1 ring-blue-400' : 'opacity-70 hover:opacity-100'}`}
                >
                  {STATUS_BADGE[s]?.label}
                </button>
                {i < arr.length - 1 && (
                  <span className="text-gray-300 text-xs">→</span>
                )}
              </div>
            )
          )}
          <span className="text-gray-200 mx-2">|</span>
          {[
            'congelada_rep_suspenso',
            'congelada_aguardando_admin',
            'cancelada',
          ].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFiltro(statusFiltro === s ? '' : s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${STATUS_BADGE[s]?.cor ?? 'bg-gray-100 text-gray-600'}
                  ${statusFiltro === s ? 'ring-2 ring-offset-1 ring-blue-400' : 'opacity-70 hover:opacity-100'}`}
            >
              {STATUS_BADGE[s]?.label}
            </button>
          ))}
          {statusFiltro && (
            <button
              onClick={() => setStatusFiltro('')}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : comissoes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">💸</div>
          <p className="text-lg font-medium">Nenhuma comissão encontrada</p>
          <p className="text-sm mt-1">
            Comissões aparecem quando o admin gera a comissão a partir de
            pagamentos de clientes indicados por você.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Laudo</th>
                <th className="px-4 py-3 text-left">Mês Emissão</th>
                <th className="px-4 py-3 text-center">Parcela</th>
                <th className="px-4 py-3 text-right">Valor Laudo</th>
                <th className="px-4 py-3 text-right">Comissão</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Previsão</th>
                <th className="px-4 py-3 text-center">NF/RPA</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {comissoes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {c.entidade_nome}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {c.numero_laudo ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.mes_emissao
                      ? new Date(c.mes_emissao).toLocaleDateString('pt-BR', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500 font-medium">
                    {(c.total_parcelas ?? 1) > 1
                      ? `${c.parcela_numero ?? 1}/${c.total_parcelas}`
                      : 'À vista'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {fmt(c.valor_laudo)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">
                    {fmt(c.valor_comissao)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      {/* Retida-futura: parcela não paga ainda (provisionada antecipadamente) */}
                      {c.status === 'retida' && !c.parcela_confirmada_em ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                          ⏳ Aguardando parcela
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[c.status]?.cor ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {STATUS_BADGE[c.status]?.label ?? c.status}
                        </span>
                      )}
                      {/* Retida com parcela paga: rep ainda não apto */}
                      {c.status === 'retida' && !!c.parcela_confirmada_em && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Aguardando aprovação
                        </div>
                      )}
                      {c.motivo_congelamento && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {c.motivo_congelamento.replace(/_/g, ' ')}
                        </div>
                      )}
                      {c.data_pagamento && (
                        <div className="text-xs text-green-600 mt-0.5">
                          Pago em{' '}
                          {new Date(c.data_pagamento).toLocaleDateString(
                            'pt-BR'
                          )}
                        </div>
                      )}
                      {c.status === 'paga' && c.comprovante_pagamento_path && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <a
                            href={`/api/representante/comissoes/${c.id}/comprovante`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 border border-green-300 rounded text-green-700 hover:bg-green-50 transition-colors cursor-pointer"
                            aria-label="Visualizar comprovante de pagamento"
                          >
                            📄 Ver
                          </a>
                          <a
                            href={`/api/representante/comissoes/${c.id}/comprovante?download=1`}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                            aria-label="Baixar comprovante de pagamento"
                          >
                            ↓ Baixar
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.mes_pagamento
                      ? new Date(c.mes_pagamento).toLocaleDateString('pt-BR', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <NfStatusCell
                      comissao={c}
                      onUpload={() => setUploadModal(c)}
                    />
                  </td>
                </tr>
              ))}
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

      {/* Modal NF Upload */}
      {uploadModal && (
        <NfUploadModal
          comissao={uploadModal}
          onClose={() => setUploadModal(null)}
          onSuccess={() => {
            setUploadModal(null);
            carregar();
          }}
        />
      )}
    </div>
  );
}
