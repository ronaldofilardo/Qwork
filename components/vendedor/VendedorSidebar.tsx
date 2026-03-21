'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  BarChart2,
  ChevronDown,
  ChevronRight,
  Users,
} from 'lucide-react';
import SidebarLayout from '@/components/shared/SidebarLayout';

export type VendedorSection = 'dashboard' | 'relatorios' | 'representantes';
export type RelatoriosSubSection = 'vendas' | 'pagamentos';

interface VendedorSidebarProps {
  activeSection: VendedorSection;
  activeSubSection?: string;
  onSectionChange: (section: VendedorSection, subSection?: string) => void;
  counts?: {
    representantes?: number;
    comissoesPendentes?: number;
  };
}

export default function VendedorSidebar({
  activeSection,
  activeSubSection,
  onSectionChange,
  counts = {},
}: VendedorSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [relatoriosExpanded, setRelatoriosExpanded] = useState(
    activeSection === 'relatorios'
  );

  const MenuItem = ({
    icon: Icon,
    label,
    count,
    isActive,
    onClick,
    hasSubMenu = false,
    isExpanded: expanded = false,
  }: {
    icon: React.ElementType;
    label: string;
    count?: number;
    isActive: boolean;
    onClick: () => void;
    hasSubMenu?: boolean;
    isExpanded?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
        isActive
          ? 'bg-amber-100 text-amber-700 border-l-4 border-amber-500'
          : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="font-medium">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white">
            {count}
          </span>
        )}
      </div>
      {hasSubMenu &&
        (expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
    </button>
  );

  const SubMenuItem = ({
    label,
    isActive,
    onClick,
  }: {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center pl-12 pr-4 py-2.5 text-left text-sm transition-colors ${
        isActive
          ? 'bg-amber-50 text-amber-700 font-medium'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <SidebarLayout
      title="QWork"
      subtitle="Painel do Vendedor"
      isCollapsed={isCollapsed}
      onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
    >
      {/* Dashboard */}
      <MenuItem
        icon={LayoutDashboard}
        label="Dashboard"
        isActive={activeSection === 'dashboard'}
        onClick={() => onSectionChange('dashboard')}
      />

      {/* Relatórios */}
      <MenuItem
        icon={BarChart2}
        label="Relatórios"
        isActive={activeSection === 'relatorios'}
        onClick={() => {
          setRelatoriosExpanded(!relatoriosExpanded);
          onSectionChange('relatorios', activeSubSection || 'vendas');
        }}
        hasSubMenu
        isExpanded={relatoriosExpanded}
      />

      {relatoriosExpanded && (
        <div className="border-l-2 border-gray-200 ml-4">
          <SubMenuItem
            label="Relatório de Vendas"
            isActive={
              activeSection === 'relatorios' && activeSubSection === 'vendas'
            }
            onClick={() => onSectionChange('relatorios', 'vendas')}
          />
          <SubMenuItem
            label="Relatório de Pagamentos"
            isActive={
              activeSection === 'relatorios' &&
              activeSubSection === 'pagamentos'
            }
            onClick={() => onSectionChange('relatorios', 'pagamentos')}
          />
        </div>
      )}

      {/* Representantes */}
      <MenuItem
        icon={Users}
        label="Representantes"
        count={counts.representantes}
        isActive={activeSection === 'representantes'}
        onClick={() => onSectionChange('representantes')}
      />
    </SidebarLayout>
  );
}
