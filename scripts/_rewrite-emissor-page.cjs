/**
 * Script CJS: Rewrite app/emissor/page.tsx
 * Replaces 923L monolith with ~95L thin orchestrator
 * delegating to types.ts, useEmissorLotes.ts, and components/
 */
const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'emissor', 'page.tsx');

// Backup
const backup = fs.readFileSync(pagePath, 'utf-8');
fs.writeFileSync(pagePath + '.bak', backup, 'utf-8');

const newContent = `'use client';

/**
 * app/emissor/page.tsx
 *
 * Thin orchestrator: composes hook + sub-components.
 * State & logic live in useEmissorLotes.ts.
 * UI pieces live in components/.
 */

import { useEmissorLotes } from './useEmissorLotes';
import EmissorHeader from './components/EmissorHeader';
import EmissorTabs from './components/EmissorTabs';
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
    handleEmitirLaudo,
    handleDownloadLaudo,
    handleRefresh,
    handleLoadMore,
    handleLogout,
    reprocessarLaudo,
    isReprocessando,
    canInstall,
    handleInstallClick,
    currentPage,
    fetchLotes,
  } = useEmissorLotes();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando lotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmissorHeader
          canInstall={canInstall}
          onInstallClick={handleInstallClick}
          loading={loading}
          onRefresh={handleRefresh}
          onLogout={handleLogout}
        />

        <EmissorTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
                    onReprocessar={reprocessarLaudo}
                    isReprocessando={isReprocessando}
                    onUploadSuccess={() => {
                      void fetchLotes(currentPage, false);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? 'Carregando...' : 'Carregar Mais'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync(pagePath, newContent, 'utf-8');

const lines = newContent.split('\\n').length;
console.log('page.tsx rewritten: 923L -> ' + lines + 'L');
console.log('Backup saved: page.tsx.bak');
