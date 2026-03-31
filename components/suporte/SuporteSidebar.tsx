'use client';

import { useState } from 'react';
import {
  Building2,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Users,
} from 'lucide-react';
import SidebarLayout from '@/components/shared/SidebarLayout';

export type SuporteSection = 'tomadores' | 'financeiro' | 'representantes';
export type TomadoresSubSection = 'clinicas' | 'entidades';
export type FinanceiroSubSection = 'pagamentos' | 'comissoes' | 'individuais';
export type RepresentantesSubSection = 'lista' | 'aprovacao';

interface SuporteSidebarProps {
  activeSection: SuporteSection;
  activeSubSection?: string;
  onSectionChange: (section: SuporteSection, subSection?: string) => void;
  userName?: string;
  roleLabel?: string;
  counts?: {
    clinicas?: number;
    entidades?: number;
    pagamentos?: number;
    representantesPendentes?: number;
  };
}

export default function SuporteSidebar({
  activeSection,
  activeSubSection,
  onSectionChange,
  userName,
  roleLabel = 'Suporte',
  counts = {},
}: SuporteSidebarProps) {
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
          ? 'bg-blue-100 text-blue-600 border-l-4 border-blue-500'
          : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="font-medium">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">
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
          ? 'bg-blue-50 text-blue-600 font-medium'
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
      subtitle="Painel de Suporte"
      isCollapsed={isCollapsed}
      onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
      userName={userName}
      roleLabel={roleLabel}
    >
      {/* Tomadores */}
      <MenuItem
        icon={Building2}
        label="Tomadores"
        isActive={activeSection === 'tomadores'}
        onClick={() => {
          toggleSection('tomadores');
          onSectionChange('tomadores', 'clinicas');
        }}
        hasSubMenu
        isExpanded={isExpanded('tomadores')}
      />

      {isExpanded('tomadores') && (
        <div className="border-l-2 border-gray-200 ml-4">
          <SubMenuItem
            label="Clínicas"
            count={counts.clinicas}
            isActive={
              activeSection === 'tomadores' && activeSubSection === 'clinicas'
            }
            onClick={() => onSectionChange('tomadores', 'clinicas')}
          />
          <SubMenuItem
            label="Entidades"
            count={counts.entidades}
            isActive={
              activeSection === 'tomadores' && activeSubSection === 'entidades'
            }
            onClick={() => onSectionChange('tomadores', 'entidades')}
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
          onSectionChange('financeiro', 'pagamentos');
        }}
        hasSubMenu
        isExpanded={isExpanded('financeiro')}
      />

      {isExpanded('financeiro') && (
        <div className="border-l-2 border-gray-200 ml-4">
          <SubMenuItem
            label="Pagamentos"
            count={counts.pagamentos}
            isActive={
              activeSection === 'financeiro' &&
              activeSubSection === 'pagamentos'
            }
            onClick={() => onSectionChange('financeiro', 'pagamentos')}
          />
          <SubMenuItem
            label="Comissões"
            isActive={
              activeSection === 'financeiro' &&
              activeSubSection === 'individuais'
            }
            onClick={() => onSectionChange('financeiro', 'individuais')}
          />
        </div>
      )}

      {/* Representantes */}
      <MenuItem
        icon={Users}
        label="Representantes"
        isActive={activeSection === 'representantes'}
        onClick={() => {
          toggleSection('representantes');
          onSectionChange('representantes', 'lista');
        }}
        hasSubMenu
        isExpanded={isExpanded('representantes')}
      />

      {isExpanded('representantes') && (
        <div className="border-l-2 border-gray-200 ml-4">
          <SubMenuItem
            label="Lista Geral"
            isActive={
              activeSection === 'representantes' && activeSubSection === 'lista'
            }
            onClick={() => onSectionChange('representantes', 'lista')}
          />
          <SubMenuItem
            label="Pendentes de Aprovação"
            count={counts.representantesPendentes}
            isActive={
              activeSection === 'representantes' &&
              activeSubSection === 'aprovacao'
            }
            onClick={() => onSectionChange('representantes', 'aprovacao')}
          />
        </div>
      )}
    </SidebarLayout>
  );
}
