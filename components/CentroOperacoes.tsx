'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  FolderOpen,
  Layers,
  Send,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface LoteMonitor {
  id: number;
  descricao: string;
  tipo: string;
  status: string;
  liberado_em: string | null;
  empresa_id: number;
  empresa_nome: string;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
  avaliacoes_pendentes: number;
  laudo_id: number | null;
  laudo_status: string | null;
  emitido_em: string | null;
  enviado_em: string | null;
  emissao_solicitada: boolean;
  emissao_solicitado_em: string | null;
  solicitado_por: string | null;
}

interface LaudoMonitor {
  id: number;
  lote_id: number;
  lote_descricao: string;
  lote_tipo: string;
  lote_status: string;
  laudo_status: string;
  empresa_id: number;
  empresa_nome: string;
  emissor_nome: string | null;
  liberado_em: string | null;
  criado_em: string;
  emitido_em: string | null;
  enviado_em: string | null;
  hash_pdf: string | null;
  arquivo_remoto_url: string | null;
  arquivo_remoto_uploaded_at: string | null;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
}

interface CentroOperacoesProps {
  /** Tipo de usuário (mantido para compatibilidade) */
  tipoUsuario: 'tomador' | 'clinica' | 'funcionario';
  onNavigate?: (url: string) => void;
}

type TabAtiva = 'lotes' | 'laudos';

// ─── Helpers de UI ───────────────────────────────────────────────────────────

function formatarData(data: string | null | undefined): string {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function BadgeLoteStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ativo: { label: 'Em andamento', cls: 'bg-blue-100 text-blue-700' },
    concluido: { label: 'Concluído', cls: 'bg-green-100 text-green-700' },
    cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
    liberado: { label: 'Liberado', cls: 'bg-purple-100 text-purple-700' },
    emissao_solicitada: {
      label: 'Emissão Solicitada',
      cls: 'bg-amber-100 text-amber-700',
    },
    emissao_em_andamento: {
      label: 'Emissão em Andamento',
      cls: 'bg-orange-100 text-orange-700',
    },
    emitido: { label: 'Emitido', cls: 'bg-teal-100 text-teal-700' },
  };
  const { label, cls } = map[status] ?? {
    label: status,
    cls: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function BadgeLaudoStatus({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
        Sem laudo
      </span>
    );
  }
  const map: Record<string, { label: string; cls: string }> = {
    rascunho: { label: 'Em Elaboração', cls: 'bg-yellow-100 text-yellow-700' },
    emitido: { label: 'Emitido', cls: 'bg-blue-100 text-blue-700' },
    enviado: { label: 'Enviado', cls: 'bg-green-100 text-green-700' },
    cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
  };
  const { label, cls } = map[status] ?? {
    label: status,
    cls: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CentroOperacoes({ onNavigate }: CentroOperacoesProps) {
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>('lotes');

  const [lotes, setLotes] = useState<LoteMonitor[]>([]);
  const [laudos, setLaudos] = useState<LaudoMonitor[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [loadingLaudos, setLoadingLaudos] = useState(true);
  const [erroLotes, setErroLotes] = useState<string | null>(null);
  const [erroLaudos, setErroLaudos] = useState<string | null>(null);

  const carregarLotes = useCallback(async () => {
    try {
      setLoadingLotes(true);
      setErroLotes(null);
      const res = await fetch('/api/rh/monitor/lotes');
      if (res.ok) {
        const data = await res.json();
        setLotes(data.lotes ?? []);
      } else {
        setErroLotes('Erro ao carregar lotes.');
      }
    } catch {
      setErroLotes('Erro de rede ao carregar lotes.');
    } finally {
      setLoadingLotes(false);
    }
  }, []);

  const carregarLaudos = useCallback(async () => {
    try {
      setLoadingLaudos(true);
      setErroLaudos(null);
      const res = await fetch('/api/rh/monitor/laudos');
      if (res.ok) {
        const data = await res.json();
        setLaudos(data.laudos ?? []);
      } else {
        setErroLaudos('Erro ao carregar laudos.');
      }
    } catch {
      setErroLaudos('Erro de rede ao carregar laudos.');
    } finally {
      setLoadingLaudos(false);
    }
  }, []);

  useEffect(() => {
    carregarLotes();
    carregarLaudos();
  }, [carregarLotes, carregarLaudos]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Monitor de Lotes e Laudos
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Acompanhe todos os lotes e laudos das suas empresas clientes
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          <button
            onClick={() => setTabAtiva('lotes')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-medium transition-colors ${
              tabAtiva === 'lotes'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <Layers size={16} />
            Lotes
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                tabAtiva === 'lotes'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {lotes.length}
            </span>
          </button>
          <button
            onClick={() => setTabAtiva('laudos')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-medium transition-colors ${
              tabAtiva === 'laudos'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <FileText size={16} />
            Laudos
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                tabAtiva === 'laudos'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {laudos.length}
            </span>
          </button>
        </nav>
      </div>

      {/* ─── Aba Lotes ─────────────────────────────────────────────────────── */}
      {tabAtiva === 'lotes' && (
        <div>
          {loadingLotes ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : erroLotes ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
              <p className="text-red-700 text-sm">{erroLotes}</p>
            </div>
          ) : lotes.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FolderOpen className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-medium">
                Nenhum lote encontrado
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Os lotes das suas empresas clientes aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Lote
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status Lote
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Avaliações
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Laudo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Liberado em
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Emitido em
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lotes.map((lote) => {
                    const pct =
                      lote.total_avaliacoes > 0
                        ? Math.round(
                            (lote.avaliacoes_concluidas /
                              lote.total_avaliacoes) *
                              100
                          )
                        : 0;
                    return (
                      <tr
                        key={lote.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Empresa */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2
                              size={14}
                              className="text-gray-400 flex-shrink-0"
                            />
                            <span className="font-medium text-gray-800">
                              {lote.empresa_nome}
                            </span>
                          </div>
                        </td>

                        {/* Lote */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              onNavigate?.(`/rh/empresa/${lote.empresa_id}`)
                            }
                            className="text-primary hover:underline font-medium"
                          >
                            #{lote.id}
                          </button>
                          {lote.descricao && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              {lote.descricao}
                            </p>
                          )}
                        </td>

                        {/* Status Lote */}
                        <td className="px-4 py-3">
                          <BadgeLoteStatus
                            status={
                              lote.total_avaliacoes > 0 &&
                              lote.avaliacoes_inativadas ===
                                lote.total_avaliacoes &&
                              lote.avaliacoes_concluidas === 0
                                ? 'cancelado'
                                : lote.emissao_solicitada &&
                                    lote.status === 'concluido'
                                  ? 'emissao_solicitada'
                                  : lote.status
                            }
                          />
                          {lote.total_avaliacoes > 0 &&
                            lote.avaliacoes_inativadas ===
                              lote.total_avaliacoes &&
                            lote.avaliacoes_concluidas === 0 && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Todas inativadas
                              </p>
                            )}
                        </td>

                        {/* Avaliações */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-700">
                              <span className="font-semibold text-gray-900">
                                {lote.avaliacoes_concluidas}
                              </span>
                              /{lote.total_avaliacoes}
                            </span>
                            {lote.total_avaliacoes > 0 && (
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}
                            <span className="text-xs text-gray-500">
                              {pct}%
                            </span>
                          </div>
                        </td>

                        {/* Laudo */}
                        <td className="px-4 py-3">
                          {lote.total_avaliacoes > 0 &&
                          lote.avaliacoes_inativadas ===
                            lote.total_avaliacoes &&
                          lote.avaliacoes_concluidas === 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                              N/A
                            </span>
                          ) : lote.emissao_solicitada &&
                            lote.laudo_status === 'rascunho' ? (
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                Aguardando Emissor
                              </span>
                              {lote.emissao_solicitado_em && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  desde{' '}
                                  {formatarData(lote.emissao_solicitado_em)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <BadgeLaudoStatus status={lote.laudo_status} />
                          )}
                        </td>

                        {/* Liberado em */}
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatarData(lote.liberado_em)}
                        </td>

                        {/* Emitido em */}
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatarData(lote.emitido_em)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Aba Laudos ────────────────────────────────────────────────────── */}
      {tabAtiva === 'laudos' && (
        <div>
          {loadingLaudos ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : erroLaudos ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
              <p className="text-red-700 text-sm">{erroLaudos}</p>
            </div>
          ) : laudos.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FileText className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-medium">
                Nenhum laudo encontrado
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Os laudos das suas empresas clientes aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Lote
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status Laudo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Avaliações
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Emissor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Emitido em
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Enviado em
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {laudos.map((laudo) => (
                    <tr
                      key={laudo.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Empresa */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <span className="font-medium text-gray-800">
                            {laudo.empresa_nome}
                          </span>
                        </div>
                      </td>

                      {/* Lote */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            onNavigate?.(`/rh/empresa/${laudo.empresa_id}`)
                          }
                          className="text-primary hover:underline font-medium"
                        >
                          #{laudo.lote_id}
                        </button>
                        {laudo.lote_descricao && (
                          <p className="text-xs text-gray-500 truncate max-w-[180px]">
                            {laudo.lote_descricao}
                          </p>
                        )}
                      </td>

                      {/* Status Laudo */}
                      <td className="px-4 py-3">
                        <BadgeLaudoStatus status={laudo.laudo_status} />
                        {laudo.hash_pdf && (
                          <p
                            className="text-xs text-gray-400 mt-0.5 font-mono truncate max-w-[160px]"
                            title={laudo.hash_pdf}
                          >
                            {laudo.hash_pdf.slice(0, 12)}…
                          </p>
                        )}
                      </td>

                      {/* Avaliações */}
                      <td className="px-4 py-3 text-xs text-gray-700">
                        <span className="font-semibold text-gray-900">
                          {laudo.avaliacoes_concluidas}
                        </span>
                        /{laudo.total_avaliacoes} concluídas
                      </td>

                      {/* Emissor */}
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {laudo.emissor_nome ?? '—'}
                      </td>

                      {/* Emitido em */}
                      <td className="px-4 py-3">
                        {laudo.emitido_em ? (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <CheckCircle size={12} className="text-green-500" />
                            {formatarData(laudo.emitido_em)}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={12} />
                            Pendente
                          </div>
                        )}
                      </td>

                      {/* Enviado em */}
                      <td className="px-4 py-3">
                        {laudo.enviado_em ? (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Send size={12} className="text-blue-500" />
                            {formatarData(laudo.enviado_em)}
                          </div>
                        ) : laudo.arquivo_remoto_url ? (
                          <div>
                            <div className="flex items-center gap-1 text-xs text-teal-600">
                              <CheckCircle
                                size={12}
                                className="text-teal-500"
                              />
                              No bucket
                            </div>
                            {laudo.arquivo_remoto_uploaded_at && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {formatarData(laudo.arquivo_remoto_uploaded_at)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
