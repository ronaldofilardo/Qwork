'use client';

import { useState } from 'react';
import { Users, UserPlus, DollarSign } from 'lucide-react';
import SidebarLayout from '@/components/shared/SidebarLayout';

export type ComercialSection = 'representantes' | 'leads' | 'comissoes';

interface ComercialSidebarProps {
  activeSection: ComercialSection;
  onSectionChange: (section: ComercialSection) => void;
  counts?: {
    representantes?: number;
    leads?: number;
    comissoes?: number;
  };
}

export default function ComercialSidebar({
  activeSection,
  onSectionChange,
  counts = {},
}: ComercialSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const MenuItem = ({
    icon: Icon,
    label,
    count,
    isActive,
    onClick,
  }: {
    icon: React.ElementType;
    label: string;
    count?: number;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
        isActive
          ? 'bg-green-100 text-green-600 border-l-4 border-green-500'
          : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="font-medium">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-500 text-white">
            {count}
          </span>
        )}
      </div>
    </button>
  );

  return (
    <SidebarLayout
      title="QWork"
      subtitle="Painel Comercial"
      isCollapsed={isCollapsed}
      onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
    >
      <MenuItem
        icon={Users}
        label="Representantes"
        count={counts.representantes}
        isActive={activeSection === 'representantes'}
        onClick={() => onSectionChange('representantes')}
      />

      <MenuItem
        icon={UserPlus}
        label="Leads / Candidatos"
        count={counts.leads}
        isActive={activeSection === 'leads'}
        onClick={() => onSectionChange('leads')}
      />

      <MenuItem
        icon={DollarSign}
        label="Comissões"
        count={counts.comissoes}
        isActive={activeSection === 'comissoes'}
        onClick={() => onSectionChange('comissoes')}
      />
    </SidebarLayout>
  );
}
