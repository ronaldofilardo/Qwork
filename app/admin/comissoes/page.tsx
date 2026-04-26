'use client';

import { ACAO_LABEL, fmt } from './types';
import { useComissoes } from './hooks/useComissoes';
import { ComissoesTab } from './components/ComissoesTab';

export default function AdminComissoes() {
  const {
    comissoes,
    resumo,
    total,
    page,
    setPage,
    statusFiltro,
    setStatusFiltro,
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action status modal */}
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
      {/* NF Review modal removed - liberation now via cycle flow */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <a
              href="/admin/representantes"
              className="text-sm text-gray-500 hover:text-blue-600"
            >
              ← Representantes
            </a>
            <h1 className="text-xl font-bold text-gray-900 mt-1">
              Comissões — Painel Admin
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">{total} comissões</div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
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
      </main>
    </div>
  );
}
