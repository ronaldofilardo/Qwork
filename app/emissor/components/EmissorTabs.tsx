'use client';

/**
 * app/emissor/components/EmissorTabs.tsx
 *
 * Tab navigation for the Emissor dashboard (3 tabs).
 */

import type { ActiveTab } from '../types';

interface EmissorTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export default function EmissorTabs({
  activeTab,
  onTabChange,
}: EmissorTabsProps) {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onTabChange('laudo-para-emitir')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'laudo-para-emitir'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📝 Laudo para Emitir
          </button>
          <button
            onClick={() => onTabChange('laudo-emitido')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'laudo-emitido'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ✅ Laudo Emitido
          </button>
          <button
            onClick={() => onTabChange('cancelados')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cancelados'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ❌ Cancelados
          </button>
        </nav>
      </div>
    </div>
  );
}
