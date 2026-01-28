import React from 'react';

type TabType =
  | 'overview'
  | 'lotes'
  | 'laudos'
  | 'funcionarios'
  | 'pendencias'
  | 'desligamentos';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  anomaliasCount?: number;
}

/**
 * Componente de navegação por abas
 */
export function TabNavigation({
  activeTab,
  onTabChange,
  anomaliasCount = 0,
}: TabNavigationProps) {
  const tabs = [
    {
      id: 'lotes' as TabType,
      label: '📋 Ciclos de Coletas Avaliativas',
      badge: null,
    },
    { id: 'laudos' as TabType, label: '📄 Laudos', badge: null },
    {
      id: 'funcionarios' as TabType,
      label: '👥 Funcionários Ativos',
      badge: null,
    },
    {
      id: 'pendencias' as TabType,
      label: '⚠️ Pendências',
      badge: anomaliasCount > 0 ? anomaliasCount : null,
      title: 'Anomalias e pendências (alertas informativos, não bloqueantes)',
    },
    { id: 'desligamentos' as TabType, label: '🚪 Desligamentos', badge: null },
  ];

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.badge !== null && (
                <span
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  title={tab.title || undefined}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
