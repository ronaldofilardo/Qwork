'use client';

/**
 * app/emissor/components/EmissorSidebar.tsx
 *
 * Sidebar de navegação do dashboard do emissor.
 * Usa SidebarLayout como base (padrão RH/Entidade).
 */

import { useState } from 'react';
import { FileText, CheckCircle, Upload } from 'lucide-react';
import SidebarLayout from '@/components/shared/SidebarLayout';
import type { ActiveTab } from '../types';

interface EmissorSidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  counts: Record<ActiveTab, number>;
  userName?: string;
  onLogout: () => void | Promise<void>;
}

const NAV_ITEMS: {
  tab: ActiveTab;
  icon: React.ElementType;
  label: string;
}[] = [
  { tab: 'laudo-para-emitir', icon: FileText, label: 'Para Emitir' },
  { tab: 'laudo-emitido', icon: CheckCircle, label: 'Laudo Emitido' },
  { tab: 'laudos-enviados', icon: Upload, label: 'Laudos Enviados' },
];

export default function EmissorSidebar({
  activeTab,
  onTabChange,
  counts,
  userName = 'Emissor',
  onLogout,
}: EmissorSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarLayout
      title="QWork"
      subtitle="Painel Emissor"
      isCollapsed={isCollapsed}
      onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
      userName={userName}
      roleLabel="Emissor"
      onLogout={onLogout}
    >
      {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
        const isActive = activeTab === tab;
        const count = counts[tab];
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 ${
              isActive
                ? 'bg-primary-100 text-primary-600 border-l-4 border-primary-500'
                : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="flex items-center gap-3">
              <Icon size={20} aria-hidden="true" />
              {!isCollapsed && <span className="font-medium">{label}</span>}
            </div>
            {!isCollapsed && count > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary-500 text-white">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </SidebarLayout>
  );
}
