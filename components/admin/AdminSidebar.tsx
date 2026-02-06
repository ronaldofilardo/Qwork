'use client';

import { useState } from 'react';
import {
  Building2,
  DollarSign,
  Settings,
  UserCheck,
  ChevronDown,
  ChevronRight,
  FileCheck,
  Shield,
  Users,
} from 'lucide-react';
import SidebarLayout from '@/components/shared/SidebarLayout';

export type AdminSection =
  | 'contratantes'
  | 'financeiro'
  | 'geral'
  | 'novos-cadastros';
export type ContratantesSubSection = 'clinicas' | 'entidades';
export type ClinicasTab = 'dados' | 'auditorias' | 'financeiro';
export type EntidadesTab = 'dados' | 'auditorias';
export type FinanceiroSubSection = 'cobranca' | 'pagamentos' | 'planos';

interface AdminSidebarProps {
  activeSection: AdminSection;
  activeSubSection?: string;
  onSectionChange: (section: AdminSection, subSection?: string) => void;
  counts?: {
    novosCadastros?: number;
    clinicas?: number;
    entidades?: number;
    cobranca?: number;
    pagamentos?: number;
    planos?: number;
    emissores?: number;
  };
}

export default function AdminSidebar({
  activeSection,
  activeSubSection,
  onSectionChange,
  counts = {},
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
        <Users size={14} />
        <span>Clínicas: Medicina Ocupacional</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Building2 size={14} />
        <span>Entidades: Empresas Privadas</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <FileCheck size={14} />
        <span>Emissores: Laudos Técnicos</span>
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
      {/* Novos Cadastros */}
      <MenuItem
        icon={UserCheck}
        label="Novos Cadastros"
        count={counts.novosCadastros}
        isActive={activeSection === 'novos-cadastros'}
        onClick={() => onSectionChange('novos-cadastros')}
      />

      {/* Contratantes - Admin visualiza contratantes para gerenciar usuários gestores */}
      <MenuItem
        icon={Building2}
        label="Contratantes"
        isActive={activeSection === 'contratantes'}
        onClick={() => {
          toggleSection('contratantes');
          onSectionChange('contratantes', 'lista');
        }}
        hasSubMenu
        isExpanded={isExpanded('contratantes')}
      />

      {isExpanded('contratantes') && (
        <div className="border-l-2 border-gray-200 ml-4">
          <SubMenuItem
            label="Clínicas"
            count={counts.clinicas}
            isActive={
              activeSection === 'contratantes' &&
              activeSubSection === 'clinicas'
            }
            onClick={() => onSectionChange('contratantes', 'clinicas')}
          />
          <SubMenuItem
            label="Entidades"
            count={counts.entidades}
            isActive={
              activeSection === 'contratantes' &&
              activeSubSection === 'entidades'
            }
            onClick={() => onSectionChange('contratantes', 'entidades')}
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
          onSectionChange('financeiro', 'cobranca');
        }}
        hasSubMenu
        isExpanded={isExpanded('financeiro')}
      />

      {isExpanded('financeiro') && (
        <div className="border-l-2 border-gray-200 ml-4">
          <SubMenuItem
            label="Planos"
            count={counts.planos}
            isActive={
              activeSection === 'financeiro' && activeSubSection === 'planos'
            }
            onClick={() => onSectionChange('financeiro', 'planos')}
          />
          <SubMenuItem
            label="Cobrança"
            count={counts.cobranca}
            isActive={
              activeSection === 'financeiro' && activeSubSection === 'cobranca'
            }
            onClick={() => onSectionChange('financeiro', 'cobranca')}
          />
          <SubMenuItem
            label="Pagamentos"
            count={counts.pagamentos}
            isActive={
              activeSection === 'financeiro' &&
              activeSubSection === 'pagamentos'
            }
            onClick={() => onSectionChange('financeiro', 'pagamentos')}
          />
        </div>
      )}

      {/* Geral */}
      <MenuItem
        icon={Settings}
        label="Geral"
        isActive={activeSection === 'geral'}
        onClick={() => {
          toggleSection('geral');
          onSectionChange('geral', 'emissores');
        }}
        hasSubMenu
        isExpanded={isExpanded('geral')}
      />

      {isExpanded('geral') && (
        <div className="border-l-2 border-gray-200 ml-4">
          <SubMenuItem
            label="Emissores"
            count={counts.emissores}
            isActive={
              activeSection === 'geral' && activeSubSection === 'emissores'
            }
            onClick={() => onSectionChange('geral', 'emissores')}
          />
        </div>
      )}
    </SidebarLayout>
  );
}
