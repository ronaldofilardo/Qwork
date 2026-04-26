'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  UserCheck,
  UserX,
  ArrowRightCircle,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface CandidatoLP {
  id: string;
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  email: string;
  telefone: string;
  cpf: string | null;
  cnpj: string | null;
  razao_social: string | null;
  cpf_responsavel: string | null;
  doc_cpf_filename: string | null;
  doc_cpf_key: string | null;
  doc_cnpj_filename: string | null;
  doc_cnpj_key: string | null;
  doc_cpf_resp_filename: string | null;
  doc_cpf_resp_key: string | null;
  status: 'pendente_verificacao' | 'verificado' | 'rejeitado' | 'convertido';
  motivo_rejeicao: string | null;
  criado_em: string;
  verificado_em: string | null;
  convertido_em: string | null;
  representante_id: number | null;
  comercial_cpf: string | null;
}

// ── Badge de status ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CandidatoLP['status'] }) {
  const map = {
    pendente_verificacao: {
      label: 'Pendente',
      icon: Clock,
      cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    },
    verificado: {
      label: 'Verificado',
      icon: CheckCircle,
      cls: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    convertido: {
      label: 'Convertido',
      icon: CheckCircle,
      cls: 'bg-green-50 text-green-700 border border-green-200',
    },
    rejeitado: {
      label: 'Rejeitado',
      icon: XCircle,
      cls: 'bg-red-50 text-red-700 border border-red-200',
    },
  };
  const { label, icon: Icon, cls } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function CandidatosLPContent() {
  const [candidatos, setCandidatos] = useState<CandidatoLP[]>([]);
  const [total, setTotal] = useState(0);
  const [pendentes, setPendentes] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // Cache de URLs de documento por leadId
  const [docsCache, setDocsCache] = useState<
    Record<string, Record<string, string>>
  >({});
  const [docsLoading, setDocsLoading] = useState<Record<string, boolean>>({});

  // Modal de ação
  const [modalAcao, setModalAcao] = useState<{
    candidato: CandidatoLP;
    acao: 'aprovar' | 'rejeitar' | 'converter';
  } | null>(null);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [conviteLink, setConviteLink] = useState<string | null>(null);

  const carregar = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p) });
        if (statusFiltro) params.set('status', statusFiltro);
        if (busca.trim()) params.set('busca', busca.trim());
        const res = await fetch(
          `/api/comercial/representantes-leads?${params}`
        );
        if (!res.ok) return;
        const d = (await res.json()) as {
          leads?: CandidatoLP[];
          total?: number;
          pendentes?: number;
        };
        setCandidatos(d.leads ?? []);
        setTotal(d.total ?? 0);
        setPendentes(d.pendentes ?? 0);
      } finally {
        setLoading(false);
      }
    },
    [statusFiltro, busca]
  );

  useEffect(() => {
    void carregar(page);
  }, [carregar, page]);

  const abrirDoc = useCallback(
    async (leadId: string, docType: 'cpf' | 'cnpj' | 'cpf_resp') => {
      const cacheKey = `${leadId}_${docType}`;
      const docFieldMap: Record<string, string> = {
        cpf: 'doc_cpf',
        cnpj: 'doc_cnpj',
        cpf_resp: 'doc_cpf_resp',
      };
      const field = docFieldMap[docType];

      // Usar cache se disponível
      const cached = docsCache[leadId]?.[field];
      if (cached) {
        window.open(cached, '_blank', 'noopener,noreferrer');
        return;
      }

      setDocsLoading((prev) => ({ ...prev, [cacheKey]: true }));
      try {
        const res = await fetch(`/api/admin/leads/${leadId}/documentos`);
        const data = (await res.json()) as {
          documentos?: Record<string, { url: string; filename: string } | null>;
        };
        const urls: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.documentos ?? {})) {
          if (v?.url) urls[k] = v.url;
        }
        setDocsCache((prev) => ({ ...prev, [leadId]: urls }));
        const url = urls[field];
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      } catch {
        // silencia erro de rede
      } finally {
        setDocsLoading((prev) => ({ ...prev, [cacheKey]: false }));
      }
    },
    [docsCache]
  );

  const executarAcao = async () => {
    if (!modalAcao) return;
    setSalvando(true);
    setErro('');
    try {
      const { candidato, acao } = modalAcao;
      const url = `/api/comercial/representantes-leads/${candidato.id}/${acao}`;
      const body = acao === 'rejeitar' ? { motivo } : undefined;

      const res = await fetch(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      const d = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        convite_link?: string;
      };

      if (!res.ok) {
        setErro(d.error ?? 'Erro ao processar');
        return;
      }

      if (acao === 'converter' && d.convite_link) {
        setConviteLink(d.convite_link);
      }

      setSucesso(d.message ?? 'Ação realizada com sucesso.');
      setModalAcao(null);
      setMotivo('');
      setTimeout(() => setSucesso(''), 4000);
      await carregar(page);
    } catch {
      setErro('Erro ao processar ação');
    } finally {
      setSalvando(false);
    }
  };

  const totalPages = Math.ceil(total / 30);
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Candidatos da Landing Page
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} candidato{total !== 1 ? 's' : ''} via qwork.app.br
            {pendentes > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                {pendentes} pendente{pendentes !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFiltro}
            onChange={(e) => {
              setStatusFiltro(e.target.value);
              setPage(1);
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos os status</option>
            <option value="pendente_verificacao">Pendente</option>
            <option value="verificado">Verificado</option>
            <option value="convertido">Convertido</option>
            <option value="rejeitado">Rejeitado</option>
          </select>
          <input
            type="text"
            placeholder="Buscar por nome, email, CPF..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPage(1);
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[200px]"
          />
        </div>
      </div>

      {/* Feedback */}
      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          {sucesso}
        </div>
      )}

      {/* Link de convite gerado */}
      {conviteLink && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-amber-800">
              Link de acesso — copie e envie ao representante
            </p>
            <button
              onClick={() => setConviteLink(null)}
              className="text-amber-500 hover:text-amber-700 text-lg leading-none"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-amber-200 rounded px-2 py-1.5 text-amber-900 overflow-x-auto whitespace-nowrap">
              {conviteLink}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(conviteLink).catch(() => {});
                setSucesso('Link copiado!');
                setTimeout(() => setSucesso(''), 2000);
              }}
              className="shrink-0 text-sm font-medium bg-amber-600 text-white rounded px-3 py-1.5 hover:bg-amber-700 transition-colors"
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-green-500" />
        </div>
      ) : candidatos.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm">Nenhum candidato encontrado.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Candidato
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium">Contato</th>
                    <th className="px-4 py-3 text-center font-medium">Docs</th>
                    <th className="px-4 py-3 text-center font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center font-medium">Data</th>
                    <th className="px-4 py-3 text-center font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {candidatos.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {c.nome}
                        </div>
                        <div className="text-xs text-gray-400">{c.email}</div>
                        {c.cnpj && (
                          <div className="text-xs text-gray-400 font-mono">
                            CNPJ: {c.cnpj}
                          </div>
                        )}
                        {c.cpf && !c.cnpj && (
                          <div className="text-xs text-gray-400 font-mono">
                            CPF: {c.cpf}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.tipo_pessoa === 'pj'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {c.tipo_pessoa.toUpperCase()}
                        </span>
                        {c.razao_social && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {c.razao_social}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {c.telefone}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {c.doc_cpf_key && (
                            <button
                              onClick={() => void abrirDoc(c.id, 'cpf')}
                              className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Ver documento CPF"
                            >
                              {docsLoading[`${c.id}_cpf`] ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <FileText size={15} />
                              )}
                            </button>
                          )}
                          {c.doc_cnpj_key && (
                            <button
                              onClick={() => void abrirDoc(c.id, 'cnpj')}
                              className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Ver cartão CNPJ"
                            >
                              {docsLoading[`${c.id}_cnpj`] ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <FileText size={15} />
                              )}
                            </button>
                          )}
                          {c.doc_cpf_resp_key && (
                            <button
                              onClick={() => void abrirDoc(c.id, 'cpf_resp')}
                              className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Ver CPF responsável"
                            >
                              {docsLoading[`${c.id}_cpf_resp`] ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <FileText size={15} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={c.status} />
                        {c.motivo_rejeicao && (
                          <div
                            className="text-xs text-red-500 mt-0.5 max-w-[140px] truncate"
                            title={c.motivo_rejeicao}
                          >
                            {c.motivo_rejeicao}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">
                        {fmtDate(c.criado_em)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {c.status === 'pendente_verificacao' && (
                            <>
                              <button
                                onClick={() =>
                                  setModalAcao({
                                    candidato: c,
                                    acao: 'aprovar',
                                  })
                                }
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                                title="Aprovar documentação"
                              >
                                <UserCheck size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setModalAcao({
                                    candidato: c,
                                    acao: 'rejeitar',
                                  });
                                  setMotivo('');
                                }}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                title="Rejeitar"
                              >
                                <UserX size={16} />
                              </button>
                            </>
                          )}
                          {c.status === 'verificado' && (
                            <>
                              <button
                                onClick={() =>
                                  setModalAcao({
                                    candidato: c,
                                    acao: 'converter',
                                  })
                                }
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Converter em representante"
                              >
                                <ArrowRightCircle size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setModalAcao({
                                    candidato: c,
                                    acao: 'rejeitar',
                                  });
                                  setMotivo('');
                                }}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                title="Rejeitar"
                              >
                                <UserX size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Página {page} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de confirmação */}
      {modalAcao && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">
              {modalAcao.acao === 'aprovar' && 'Aprovar documentação'}
              {modalAcao.acao === 'rejeitar' && 'Rejeitar candidato'}
              {modalAcao.acao === 'converter' && 'Converter em representante'}
            </h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{modalAcao.candidato.nome}</span> (
              {modalAcao.candidato.tipo_pessoa.toUpperCase()})
            </p>

            {modalAcao.acao === 'aprovar' && (
              <p className="text-sm text-gray-500">
                Os documentos serão marcados como verificados. Após a aprovação,
                você pode converter o candidato em representante oficial.
              </p>
            )}

            {modalAcao.acao === 'converter' && (
              <p className="text-sm text-gray-500">
                Será criado um representante oficial e um e-mail de convite com
                link de criação de senha será enviado automaticamente.
              </p>
            )}

            {modalAcao.acao === 'rejeitar' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Motivo da rejeição *
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  rows={3}
                  placeholder="Descreva o motivo (mínimo 5 caracteres)..."
                />
              </div>
            )}

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {erro}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setModalAcao(null);
                  setErro('');
                  setMotivo('');
                }}
                disabled={salvando}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={executarAcao}
                disabled={
                  salvando ||
                  (modalAcao.acao === 'rejeitar' && motivo.trim().length < 5)
                }
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                  modalAcao.acao === 'rejeitar'
                    ? 'bg-red-600 hover:bg-red-700'
                    : modalAcao.acao === 'converter'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {salvando ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    {modalAcao.acao === 'aprovar' && 'Aprovar'}
                    {modalAcao.acao === 'rejeitar' && 'Rejeitar'}
                    {modalAcao.acao === 'converter' && 'Converter'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
