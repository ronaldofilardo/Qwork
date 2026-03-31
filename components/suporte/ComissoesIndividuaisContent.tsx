'use client';

import { useState } from 'react';
import { ACAO_LABEL, fmt } from '@/app/admin/comissoes/types';
import { useComissoes } from '@/app/admin/comissoes/hooks/useComissoes';
import { ComissoesTab } from '@/app/admin/comissoes/components/ComissoesTab';
import { NfPendentesTab } from '@/app/admin/comissoes/components/NfPendentesTab';

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
    nfReviewModal,
    setNfReviewModal,
    nfRejectMotivo,
    setNfRejectMotivo,
    nfPendentes,
    nfPendentesCount,
    executarAcao,
    executarNfReview,
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

  const [abaAtiva, setAbaAtiva] = useState<'comissoes' | 'nf_pendentes'>(
    'comissoes'
  );

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

      {/* Modal de revisão de NF */}
      {nfReviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">
              {nfReviewModal.acao === 'aprovar'
                ? '✅ Aprovar NF'
                : '❌ Rejeitar NF'}{' '}
              — Comissão #{nfReviewModal.comissao.id}
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Representante:</strong>{' '}
                {nfReviewModal.comissao.representante_nome} (
                {nfReviewModal.comissao.representante_codigo})
              </p>
              <p>
                <strong>Arquivo:</strong>{' '}
                {nfReviewModal.comissao.nf_nome_arquivo}
              </p>
              <p>
                <strong>Enviada em:</strong>{' '}
                {nfReviewModal.comissao.nf_rpa_enviada_em
                  ? new Date(
                      nfReviewModal.comissao.nf_rpa_enviada_em
                    ).toLocaleDateString('pt-BR')
                  : '—'}
              </p>
              <p>
                <strong>Valor comissão:</strong>{' '}
                {fmt(nfReviewModal.comissao.valor_comissao)}
              </p>
            </div>
            <a
              href={`/api/admin/comissoes/${nfReviewModal.comissao.id}/nf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-blue-600 hover:bg-gray-200 transition-colors"
            >
              📥 Baixar NF/RPA
            </a>
            {nfReviewModal.acao === 'rejeitar' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo da rejeição (obrigatório)
                </label>
                <textarea
                  value={nfRejectMotivo}
                  onChange={(e) => setNfRejectMotivo(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  rows={2}
                  placeholder="Descreva o motivo..."
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNfReviewModal(null);
                  setNfRejectMotivo('');
                }}
                className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={executarNfReview}
                disabled={
                  actionLoading !== null ||
                  (nfReviewModal.acao === 'rejeitar' && !nfRejectMotivo.trim())
                }
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
                  nfReviewModal.acao === 'aprovar'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading
                  ? 'Processando...'
                  : nfReviewModal.acao === 'aprovar'
                    ? 'Aprovar NF'
                    : 'Rejeitar NF'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Abas */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setAbaAtiva('comissoes')}
            className={`py-2.5 text-sm font-medium border-b-2 transition-colors ${
              abaAtiva === 'comissoes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Comissões
          </button>
          <button
            onClick={() => setAbaAtiva('nf_pendentes')}
            className={`py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              abaAtiva === 'nf_pendentes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            NFs Pendentes
            {nfPendentesCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-orange-500 text-white rounded-full">
                {nfPendentesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo da aba */}
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
      {abaAtiva === 'nf_pendentes' && (
        <NfPendentesTab
          nfPendentes={nfPendentes}
          loading={loading}
          actionLoading={actionLoading}
          onNfReview={setNfReviewModal}
        />
      )}
    </div>
  );
}
