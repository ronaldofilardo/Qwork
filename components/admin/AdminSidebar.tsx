'use client';

import { useState } from 'react';
import {
  DollarSign,
  Settings,
  ChevronDown,
  ChevronRight,
  FileCheck,
  Shield,
  BarChart2,
} from 'lucide-react';
import SidebarLayout from '@/components/shared/SidebarLayout';

export type AdminSection = 'volume' | 'financeiro' | 'geral' | 'auditorias';
export type VolumeSubSection = 'entidade' | 'rh';
export type FinanceiroSubSection = 'contagem' | 'contratos';
export type GeralSubSection = 'emissores';

interface AdminSidebarProps {
  activeSection: AdminSection;
  activeSubSection?: string;
  onSectionChange: (section: AdminSection, subSection?: string) => void;
}

export default function AdminSidebar({
  activeSection,
  activeSubSection,
  onSectionChange,
}: AdminSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([activeSection])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const isExpanded = (section: string) => expandedSections.has(section);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const legend = (
    <>
      <div className="flex items-center gap-2 mb-2">
        <FileCheck size={14} />
        <span>Perfis: Emissor, Suporte, Comercial</span>
      </div>
      <div className="flex items-center gap-2">
        <Shield size={14} />
        <span>Auditorias: Acompanhamento</span>
      </div>
    </>
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
          ? 'bg-orange-100 text-orange-600 border-l-4 border-orange-500'
          : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="font-medium">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-500 text-white">
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
    count,
    isActive,
    onClick,
  }: {
    label: string;
    count?: number;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between pl-12 pr-4 py-2.5 text-left text-sm transition-colors ${
        isActive
          ? 'bg-orange-50 text-orange-600 font-medium'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-500 text-white">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <SidebarLayout
      title="QWork"
      subtitle="Painel Administrativo"
      isCollapsed={isCollapsed}
      onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
      footer={legend}
    >
      {/* Volume */}
      <MenuItem
        icon={BarChart2}
        label="Volume"
        isActive={activeSection === 'volume'}
        onClick={() => {
          toggleSection('volume');
          onSectionChange('volume', 'entidade');
        }}
        hasSubMenu
        isExpanded={isExpanded('volume')}
      />

      {isExpanded('volume') && (
        <div className="border-l-2 border-gray-200 ml-4">
          <SubMenuItem
            label="Entidade"
            isActive={
              activeSection === 'volume' && activeSubSection === 'entidade'
            }
            onClick={() => onSectionChange('volume', 'entidade')}
          />
          <SubMenuItem
            label="RH"
            isActive={activeSection === 'volume' && activeSubSection === 'rh'}
            onClick={() => onSectionChange('volume', 'rh')}
          />
        </div>
      )}

      {/* Financeiro */}
      <MenuItem
        icon={DollarSign}
        label="Financeiro"
        isActive={activeSection === 'financeiro'}
        onClick={() => {
          toggleSection('financeiro');
          onSectionChange('financeiro', 'contagem');
        }}
        hasSubMenu
        isExpanded={isExpanded('financeiro')}
      />

      {isExpanded('financeiro') && (
        <div className="border-l-2 border-gray-200 ml-4">
          <SubMenuItem
            label="Contagem"
            isActive={
              activeSection === 'financeiro' && activeSubSection === 'contagem'
            }
            onClick={() => onSectionChange('financeiro', 'contagem')}
          />
          <SubMenuItem
            label="Contratos"
            isActive={
              activeSection === 'financeiro' && activeSubSection === 'contratos'
            }
            onClick={() => onSectionChange('financeiro', 'contratos')}
          />
        </div>
      )}

      {/* Geral */}
      <MenuItem
        icon={Settings}
        label="Perfis"
        isActive={activeSection === 'geral'}
        onClick={() => {
          onSectionChange('geral', 'emissores');
        }}
      />

      {/* Auditorias */}
      <MenuItem
        icon={Shield}
        label="Auditorias"
        isActive={activeSection === 'auditorias'}
        onClick={() => onSectionChange('auditorias')}
      />
    </SidebarLayout>
  );
}
