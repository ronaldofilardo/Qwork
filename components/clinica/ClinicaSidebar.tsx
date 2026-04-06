'use client';

import { useState } from 'react';
import { Building2, CreditCard, User, Upload } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import SidebarLayout from '@/components/shared/SidebarLayout';
import { PWAMenuItem } from '@/components/PWAMenuItem';
import { useRH } from '@/app/rh/rh-context';

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
  counts: propCounts,
  userName: propUserName,
}: ClinicaSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Consume RH context; default value (session: null, counts: zeros) é seguro fora do RHProvider
  const { session: ctxSession, counts: ctxCounts } = useRH();

  // Props têm precedência sobre contexto. Unifica tipos para acesso seguro.
  const counts: {
    empresas?: number;
    lotes?: number;
    laudos?: number;
    notificacoes?: number;
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
        isActive={pathname === '/rh' || false}
        onClick={() => router.push('/rh')}
      />

      {/* Seção Importação em Massa */}
      <MenuItem
        icon={Upload}
        label="Importação em Massa"
        isActive={pathname?.startsWith('/rh/importacao') || false}
        onClick={() => router.push('/rh/importacao')}
      />

      {/* Seção Informações da Conta */}
      <MenuItem
        icon={User}
        label="Informações da Conta"
        count={counts.pagamentos}
        paymentAlert
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
