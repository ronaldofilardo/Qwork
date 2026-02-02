'use client';

import { useState } from 'react';
import { Building2, ChevronDown, FileText, Users, User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import SidebarLayout from '@/components/shared/SidebarLayout';

interface EntidadeSidebarProps {
  counts?: {
    funcionarios?: number;
    lotes?: number;
    pendencias?: number;
    desligamentos?: number;
  };
  userName?: string;
}

export default function EntidadeSidebar({
  counts = {},
  userName = 'Gestor',
}: EntidadeSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [empresaExpanded, setEmpresaExpanded] = useState(true);

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
          ? 'bg-primary-100 text-primary-600 border-l-4 border-primary-500'
          : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        {!isCollapsed && <span className="font-medium">{label}</span>}
        {!isCollapsed && count !== undefined && count > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-500 text-white">
            {count}
          </span>
        )}
      </div>
    </button>
  );

  // Determinar se alguma subpágina da empresa está ativa
  const isEmpresaActive =
    pathname?.startsWith('/entidade/lotes') ||
    pathname?.startsWith('/entidade/funcionarios') ||
    pathname === '/entidade/dashboard';

  return (
    <SidebarLayout
      title="QWork"
      subtitle="Painel Entidade"
      isCollapsed={isCollapsed}
      onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
      userName={userName}
      roleLabel="Gestor de Entidade"
    >
      {/* Seção Empresa com Submenu */}
      <div className="mb-2">
        <button
          onClick={() => setEmpresaExpanded(!empresaExpanded)}
          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isEmpresaActive ? 'bg-primary-100 text-primary-600 border-l-4 border-primary-500' : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'}`}
        >
          <div className="flex items-center gap-3">
            <Building2 size={20} />
            {!isCollapsed && <span className="font-medium">Empresa</span>}
          </div>
          {!isCollapsed && (
            <ChevronDown
              size={16}
              className={`transition-transform ${empresaExpanded ? 'rotate-0' : '-rotate-90'}`}
            />
          )}
        </button>

        {/* Submenu Empresa */}
        {empresaExpanded && !isCollapsed && (
          <div className="ml-4 mt-1 space-y-1">
            <MenuItem
              icon={FileText}
              label="Visão Geral"
              isActive={pathname === '/entidade/dashboard'}
              onClick={() => router.push('/entidade/dashboard')}
            />
            <MenuItem
              icon={FileText}
              label="Ciclos de Coletas Avaliativas"
              count={counts.lotes}
              isActive={pathname === '/entidade/lotes'}
              onClick={() => router.push('/entidade/lotes')}
            />
            <MenuItem
              icon={Users}
              label="Funcionários Ativos"
              count={counts.funcionarios}
              isActive={pathname === '/entidade/funcionarios'}
              onClick={() => router.push('/entidade/funcionarios')}
            />
          </div>
        )}
      </div>

      {/* Seção Informações da Conta */}
      <MenuItem
        icon={User}
        label="Informações da Conta"
        isActive={pathname === '/entidade/conta'}
        onClick={() => router.push('/entidade/conta')}
      />
    </SidebarLayout>
  );
}
