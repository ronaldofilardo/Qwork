'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart2,
  Users2,
  Target,
  TrendingUp,
  UserCircle2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import SidebarLayout from '@/components/shared/SidebarLayout';
import type { RepresentanteSession } from '@/app/representante/(portal)/rep-context';

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-blue-100 text-blue-700',
  apto: 'bg-green-100 text-green-700',
  apto_pendente: 'bg-yellow-100 text-yellow-700',
  apto_bloqueado: 'bg-orange-100 text-orange-700',
  suspenso: 'bg-red-100 text-red-700',
  desativado: 'bg-gray-100 text-gray-600',
};

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/representante/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  { href: '/representante/metricas', label: 'Métricas', icon: BarChart2 },
  { href: '/representante/equipe', label: 'Minha Equipe', icon: Users2 },
  {
    href: '/representante/equipe/leads',
    label: 'Leads da Equipe',
    icon: Target,
  },
  {
    href: '/representante/minhas-vendas',
    label: 'Minhas Vendas',
    icon: TrendingUp,
  },
  { href: '/representante/dados', label: 'Dados', icon: UserCircle2 },
];

interface RepresentanteSidebarProps {
  session: RepresentanteSession;
  onLogout: () => void | Promise<void>;
}

export default function RepresentanteSidebar({
  session,
  onLogout,
}: RepresentanteSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const handleCopiarCodigo = async () => {
    if (!session.codigo) return;
    try {
      await navigator.clipboard.writeText(session.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = session.codigo;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const statusBadgeClass =
    STATUS_BADGE[session.status] ?? 'bg-gray-100 text-gray-600';

  const footer = !isCollapsed ? (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-mono">
          {session.codigo}
        </span>
        <button
          onClick={handleCopiarCodigo}
          title="Copiar código"
          className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
          aria-label="Copiar código do representante"
        >
          {copiado ? (
            <Check size={13} className="text-green-600" />
          ) : (
            <Copy size={13} />
          )}
        </button>
      </div>
      <span
        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass}`}
      >
        {session.status.replace(/_/g, ' ').toUpperCase()}
      </span>
    </div>
  ) : undefined;

  return (
    <SidebarLayout
      title="QWork"
      subtitle="Portal do Representante"
      isCollapsed={isCollapsed}
      onToggleCollapsed={() => setIsCollapsed((v) => !v)}
      userName={session.nome}
      roleLabel="Representante"
      onLogout={onLogout}
      footer={footer}
    >
      {/* Toggle icon override — rendered inside the header area */}
      <div className="px-2 mb-2 flex justify-end">
        <button
          onClick={() => setIsCollapsed((v) => !v)}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500"
          title={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === '/representante/equipe'
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/');

        // Caso especial: evitar que /equipe ative também /equipe/leads
        const activeEquipe =
          href === '/representante/equipe' &&
          pathname === '/representante/equipe';
        const activeLeads =
          href === '/representante/equipe/leads' &&
          (pathname === '/representante/equipe/leads' ||
            pathname.startsWith('/representante/equipe/leads/'));

        const finalActive =
          href === '/representante/equipe' ||
          href === '/representante/equipe/leads'
            ? href === '/representante/equipe'
              ? activeEquipe
              : activeLeads
            : isActive;

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-4 ${
              finalActive
                ? 'bg-blue-50 text-blue-700 border-blue-500'
                : 'text-gray-700 hover:bg-gray-100 border-transparent'
            }`}
          >
            <Icon size={20} className="shrink-0" />
            {!isCollapsed && (
              <span className="font-medium text-sm">{label}</span>
            )}
          </Link>
        );
      })}
    </SidebarLayout>
  );
}
