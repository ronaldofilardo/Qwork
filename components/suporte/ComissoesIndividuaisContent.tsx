'use client';

import { useState, useEffect, useCallback } from 'react';
import { ACAO_LABEL, fmt } from '@/app/admin/comissoes/types';
import { useComissoes } from '@/app/admin/comissoes/hooks/useComissoes';
import { ComissoesTab } from '@/app/admin/comissoes/components/ComissoesTab';
import { CheckCircle2, XCircle, FileText, Eye, Loader2 } from 'lucide-react';

const MESES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function ComissoesIndividuaisContent() {
  const now = new Date();
  const [selectedMes, setSelectedMes] = useState<number>(now.getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState<number>(now.getFullYear());

  const {
    comissoes,
    resumo,
    total,
    page,
    setPage,
    statusFiltro,
    setStatusFiltro,
    setMesFilter,
    loading,
    actionLoading,
    erro,
    sucesso,
    acaoPendente,
    setAcaoPendente,
    motivoAcao,
    setMotivoAcao,
    comprovante,
    setComprovante,
    executarAcao,
  } = useComissoes();

  const handleMesChange = (mes: number, ano: number) => {
    setSelectedMes(mes);
    setSelectedAno(ano);
    const mm = String(mes).padStart(2, '0');
    setMesFilter(`${ano}-${mm}`);
    setPage(1);
  };

  const anoOptions: number[] = [];
  for (let y = now.getFullYear(); y >= 2024; y--) anoOptions.push(y);

  const [abaAtiva, setAbaAtiva] = useState<'comissoes' | 'por-representante'>('comissoes');

  // --- Por Representante tab ---
  interface RepAgrupado {
    representante_id: number;
    representante_nome: string;
    representante_cnpj: string | null;
    asaas_wallet_id: string | null;
    total_comissoes: number;
    valor_total: number;
    valor_pago: number;
    valor_pendente: number;
    valor_provisionado: number;
    ciclo_id: number | null;
    ciclo_status: string | null;
    nf_path: string | null;
    nf_nome_arquivo: string | null;
    nf_enviada_em: string | null;
    nf_aprovada_em: string | null;
    nf_rejeitada_em: string | null;
    nf_motivo_rejeicao: string | null;
  }

  const [repsAgrupados, setRepsAgrupados] = useState<RepAgrupado[]>([]);
  const [loadingReps, setLoadingReps] = useState(false);
  const [nfActionLoading, setNfActionLoading] = useState<number | null>(null);
  const [nfMotivo, setNfMotivo] = useState('');
  const [nfRejectId, setNfRejectId] = useState<number | null>(null);

  const fetchReps = useCallback(async () => {
    setLoadingReps(true);
    try {
      const mm = String(selectedMes).padStart(2, '0');
      const mesParam = `${selectedAno}-${mm}`;
      const res = await fetch(`/api/suporte/comissoes/por-representante?mes=${mesParam}`);
      if (res.ok) {
        const data = await res.json() as { representantes: RepAgrupado[] };
        setRepsAgrupados(data.representantes);
      }
    } catch { /* ignore */ }
    setLoadingReps(false);
  }, [selectedMes, selectedAno]);

  useEffect(() => {
    if (abaAtiva === 'por-representante') {
      void fetchReps();
    }
  }, [abaAtiva, fetchReps]);

  const handleNfAction = async (cicloId: number, acao: 'aprovar' | 'rejeitar', motivo?: string) => {
    setNfActionLoading(cicloId);
    try {
      const res = await fetch(`/api/suporte/comissoes/ciclos/${cicloId}/nf`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, motivo }),
      });
      if (res.ok) {
        void fetchReps();
        setNfRejectId(null);
        setNfMotivo('');
      }
    } catch { /* ignore */ }
    setNfActionLoading(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Modais de ação */}
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
                  Caminho do comprovante (opcional)
                </label>
                <input
                  type="text"
                  value={comprovante}
                  onChange={(e) => setComprovante(e.target.value)}
                  placeholder="comprovantes/2026/mar/rep-123.pdf"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAcaoPendente(null);
                  setMotivoAcao('');
                  setComprovante('');
                }}
                className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={executarAcao}
                disabled={
                  actionLoading !== null ||
                  (acaoPendente.acao === 'congelar' && !motivoAcao.trim())
                }
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de revisão de NF removido - liberação agora via fluxo de ciclos */}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Comissões Individuais
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestão e aprovação de comissões por laudo
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtro de mês/ano */}
          <select
            value={selectedMes}
            onChange={(e) =>
              handleMesChange(Number(e.target.value), selectedAno)
            }
            className="border rounded-lg px-2 py-1.5 text-sm bg-white text-gray-700"
          >
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedAno}
            onChange={(e) =>
              handleMesChange(selectedMes, Number(e.target.value))
            }
            className="border rounded-lg px-2 py-1.5 text-sm bg-white text-gray-700"
          >
            {anoOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setMesFilter('');
              setPage(1);
            }}
            className="text-xs px-2 py-1.5 border rounded-lg text-gray-500 hover:bg-gray-50"
            title="Todos os meses"
          >
            Todos
          </button>
          <span className="text-sm text-gray-500">{total} comissões</span>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setAbaAtiva('comissoes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            abaAtiva === 'comissoes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Individuais
        </button>
        <button
          onClick={() => setAbaAtiva('por-representante')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            abaAtiva === 'por-representante'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Por Representante
        </button>
      </div>

      {/* Mensagens */}
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

      {/* Conteúdo */}
      {abaAtiva === 'comissoes' && (
        <ComissoesTab
          comissoes={comissoes}
          resumo={resumo}
          total={total}
          page={page}
          setPage={setPage}
          statusFiltro={statusFiltro}
          setStatusFiltro={setStatusFiltro}
          loading={loading}
          actionLoading={actionLoading}
          onSetAcaoPendente={setAcaoPendente}
        />
      )}

      {/* Por Representante */}
      {abaAtiva === 'por-representante' && (
        <div className="space-y-3">
          {loadingReps ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : repsAgrupados.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Nenhuma comissão encontrada para este período.
            </p>
          ) : (
            repsAgrupados.map((rep) => (
              <div key={`${rep.representante_id}-${rep.ciclo_id}`} className="bg-white border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{rep.representante_nome}</p>
                    <p className="text-xs text-gray-500">
                      {rep.representante_cnpj ?? '—'} · {Number(rep.total_comissoes)} comissões
                      {!rep.asaas_wallet_id && (
                        <span className="ml-2 text-amber-600 font-medium">⚠ Sem wallet</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{fmt(Number(rep.valor_total))}</p>
                    <p className="text-[11px] text-gray-500">
                      Pago: {fmt(Number(rep.valor_pago))} · Pendente: {fmt(Number(rep.valor_pendente))}
                    </p>
                  </div>
                </div>

                {/* NF Status */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-600">
                      NF: {!rep.ciclo_id ? (
                        <span className="text-gray-400">Sem ciclo</span>
                      ) : rep.ciclo_status === 'nf_aprovada' ? (
                        <span className="text-green-600 font-medium">Aprovada</span>
                      ) : rep.ciclo_status === 'nf_enviada' ? (
                        <span className="text-amber-600 font-medium">Aguardando revisão</span>
                      ) : rep.nf_rejeitada_em ? (
                        <span className="text-red-600 font-medium">Rejeitada: {rep.nf_motivo_rejeicao}</span>
                      ) : (
                        <span className="text-gray-400">Não enviada</span>
                      )}
                    </span>
                  </div>

                  {/* NF Actions */}
                  {rep.ciclo_id && rep.ciclo_status === 'nf_enviada' && (
                    <div className="flex items-center gap-1.5">
                      {rep.nf_path && (
                        <a
                          href={rep.nf_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
                        >
                          <Eye size={12} /> Ver
                        </a>
                      )}
                      <button
                        onClick={() => void handleNfAction(rep.ciclo_id!, 'aprovar')}
                        disabled={nfActionLoading === rep.ciclo_id}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        <CheckCircle2 size={12} /> Aprovar
                      </button>
                      {nfRejectId === rep.ciclo_id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={nfMotivo}
                            onChange={(e) => setNfMotivo(e.target.value)}
                            placeholder="Motivo..."
                            className="border rounded px-2 py-1 text-xs w-40"
                          />
                          <button
                            onClick={() => void handleNfAction(rep.ciclo_id!, 'rejeitar', nfMotivo)}
                            disabled={!nfMotivo.trim() || nfActionLoading === rep.ciclo_id}
                            className="px-2 py-1 text-xs rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => { setNfRejectId(null); setNfMotivo(''); }}
                            className="px-1 py-1 text-xs text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setNfRejectId(rep.ciclo_id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          <XCircle size={12} /> Rejeitar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
