'use client';

import { useState } from 'react';
import { Building2, User, Bell } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import SidebarLayout from '@/components/shared/SidebarLayout';
import { PWAMenuItem } from '@/components/PWAMenuItem';

interface ClinicaSidebarProps {
  counts?: {
    empresas?: number;
    lotes?: number;
    laudos?: number;
    notificacoes?: number;
  };
  userName?: string;
}

export default function ClinicaSidebar({
  counts = {},
  userName = 'Gestor',
}: ClinicaSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
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

  return (
    <SidebarLayout
      title="QWork"
      subtitle="Painel Clínica"
      isCollapsed={isCollapsed}
      onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
      userName={userName}
      roleLabel="Gestor de Clínica"
    >
      {/* Seção Empresas */}
      <MenuItem
        icon={Building2}
        label="Empresas Clientes"
        count={counts.empresas}
        isActive={pathname?.startsWith('/rh/empresas') || false}
        onClick={() => router.push('/rh/empresas')}
      />

      {/* Seção Notificações */}
      <MenuItem
        icon={Bell}
        label="Notificações"
        count={
          counts.notificacoes || (counts.lotes || 0) + (counts.laudos || 0)
        }
        isActive={
          pathname?.startsWith('/rh/notificacoes') ||
          pathname === '/rh/lotes' ||
          pathname === '/rh/laudos'
        }
        onClick={() => router.push('/rh/notificacoes')}
      />

      {/* Seção Informações da Conta */}
      <MenuItem
        icon={User}
        label="Informações da Conta"
        isActive={pathname === '/rh/conta'}
        onClick={() => router.push('/rh/conta')}
      />

      {/* Separador */}
      <div className="my-4 border-t border-gray-200" />

      {/* Seção PWA - Instalar App */}
      <PWAMenuItem isCollapsed={isCollapsed} />
    </SidebarLayout>
  );
}
