'use client';

import { useEmissorLotes } from './useEmissorLotes';
import EmissorHeader from './components/EmissorHeader';
import EmissorSidebar from './components/EmissorSidebar';
import LoteCard from './components/LoteCard';

export default function EmissorDashboard() {
  const {
    loading,
    loadingMore,
    error,
    activeTab,
    setActiveTab,
    hasMore,
    filteredLotes,
    counts,
    handleEmitirLaudo,
    handleDownloadLaudo,
    handleRefresh,
    handleLoadMore,
    handleLogout,
    canInstall,
    handleInstallClick,
    filterLoteId,
    setFilterLoteId,
    filterPeriod,
    setFilterPeriod,
  } = useEmissorLotes();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <EmissorSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
        onLogout={handleLogout}
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="qw-content-area p-4 md:p-6">
          <EmissorHeader
            canInstall={canInstall}
            onInstallClick={handleInstallClick}
            loading={loading}
            onRefresh={handleRefresh}
          />

          {!loading && !error && (
            <div className="mb-4 bg-white rounded-lg shadow p-3 flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="ID do lote..."
                value={filterLoteId}
                onChange={(e) => setFilterLoteId(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {(['all', 'today', 'week'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPeriod(p)}
                  className={`px-3 py-2 text-sm rounded-md font-medium transition-colors cursor-pointer ${
                    filterPeriod === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p === 'all' ? 'Todos' : p === 'today' ? 'Hoje' : 'Esta semana'}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando lotes...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors cursor-pointer"
              >
                Tentar Novamente
              </button>
            </div>
          ) : filteredLotes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">
                Nenhum ciclo encontrado para esta categoria.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="grid gap-4">
                  {filteredLotes.map((lote) => (
                    <LoteCard
                      key={lote.id}
                      lote={lote}
                      onEmitirLaudo={handleEmitirLaudo}
                      onDownloadLaudo={handleDownloadLaudo}
                      onUploadSuccess={handleRefresh}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {hasMore && !loading && (
            <div className="text-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {loadingMore ? 'Carregando...' : 'Carregar Mais'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
