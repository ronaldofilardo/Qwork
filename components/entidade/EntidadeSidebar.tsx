'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  CreditCard,
  FileText,
  Upload,
  Users,
  User,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import SidebarLayout from '@/components/shared/SidebarLayout';
import { PWAMenuItem } from '@/components/PWAMenuItem';
import { useEntidade } from '@/app/entidade/entidade-context';

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
  counts: propCounts,
  userName: propUserName,
}: EntidadeSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [empresaExpanded, setEmpresaExpanded] = useState(true);

  // Consume Entidade context; default value é seguro fora do EntidadeProvider
  const { session: ctxSession, counts: ctxCounts } = useEntidade();

  // Props têm precedência sobre contexto. Unifica tipos para acesso seguro.
  const counts: {
    funcionarios?: number;
    lotes?: number;
    pendencias?: number;
    desligamentos?: number;
    pagamentos?: number;
  } = propCounts ?? ctxCounts;
  const userName = propUserName ?? ctxSession?.nome ?? 'Gestor';

  const MenuItem = ({
    icon: Icon,
    label,
    count,
    paymentAlert,
    isActive,
    onClick,
  }: {
    icon: React.ElementType;
    label: string;
    count?: number;
    paymentAlert?: boolean;
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
        <div className="relative">
          <Icon size={20} />
          {paymentAlert && count !== undefined && count > 0 && isCollapsed && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </div>
        {!isCollapsed && <span className="font-medium">{label}</span>}
        {!isCollapsed && paymentAlert && count !== undefined && count > 0 && (
          <CreditCard
            size={14}
            className="text-amber-500 ml-1"
            aria-label="Pagamento em aberto"
          />
        )}
        {!isCollapsed && !paymentAlert && count !== undefined && count > 0 && (
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
    pathname?.startsWith('/entidade/pendencias') ||
    pathname?.startsWith('/entidade/importacao') ||
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
              label="Funcionários"
              count={counts.funcionarios}
              isActive={pathname === '/entidade/funcionarios'}
              onClick={() => router.push('/entidade/funcionarios')}
            />
            <MenuItem
              icon={AlertTriangle}
              label="Pendências"
              count={counts.pendencias}
              isActive={pathname?.startsWith('/entidade/pendencias')}
              onClick={() => router.push('/entidade/pendencias')}
            />
            <MenuItem
              icon={Upload}
              label="Importação em Massa"
              isActive={pathname?.startsWith('/entidade/importacao')}
              onClick={() => router.push('/entidade/importacao')}
            />
          </div>
        )}
      </div>

      {/* Seção Informações da Conta */}
      <MenuItem
        icon={User}
        label="Informações da Conta"
        count={counts.pagamentos}
        paymentAlert
        isActive={pathname === '/entidade/conta'}
        onClick={() => router.push('/entidade/conta')}
      />

      {/* Separador */}
      <div className="my-4 border-t border-gray-200" />

      {/* Seção PWA - Instalar App */}
      <PWAMenuItem isCollapsed={isCollapsed} />
    </SidebarLayout>
  );
}
