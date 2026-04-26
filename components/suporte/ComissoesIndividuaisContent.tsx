'use client';

import { useState, useEffect, useCallback } from 'react';
import { ACAO_LABEL, fmt } from '@/app/admin/comissoes/types';
import { useComissoes } from '@/app/admin/comissoes/hooks/useComissoes';
import { ComissoesTab } from '@/app/admin/comissoes/components/ComissoesTab';
import { Loader2 } from 'lucide-react';

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
  }

  const [repsAgrupados, setRepsAgrupados] = useState<RepAgrupado[]>([]);
  const [loadingReps, setLoadingReps] = useState(false);

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
              <div key={`${rep.representante_id}`} className="bg-white border rounded-xl p-4 space-y-3">
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
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
