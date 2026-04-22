'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Link2,
  UserCircle2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import SidebarLayout from '@/components/shared/SidebarLayout';
import type { VendedorSession } from '@/app/vendedor/(portal)/vendedor-context';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/vendedor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendedor/leads', label: 'Leads', icon: Target },
  { href: '/vendedor/vinculos', label: 'Vínculos', icon: Link2 },
  { href: '/vendedor/dados', label: 'Dados', icon: UserCircle2 },
];

interface VendedorPortalSidebarProps {
  session: VendedorSession;
  onLogout: () => void | Promise<void>;
}

export default function VendedorPortalSidebar({
  session,
  onLogout,
}: VendedorPortalSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const handleCopiarCodigo = async () => {
    if (!session.id) return;
    try {
      await navigator.clipboard.writeText(String(session.id));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = String(session.id);
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const footer = !isCollapsed ? (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 font-mono">#{session.id}</span>
      <button
        onClick={handleCopiarCodigo}
        title="Copiar ID"
        className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
        aria-label="Copiar ID do vendedor"
      >
        {copiado ? (
          <Check size={13} className="text-green-600" />
        ) : (
          <Copy size={13} />
        )}
      </button>
    </div>
  ) : undefined;

  return (
    <SidebarLayout
      title="QWork"
      subtitle="Portal do Vendedor"
      isCollapsed={isCollapsed}
      onToggleCollapsed={() => setIsCollapsed((v) => !v)}
      userName={session.nome}
      roleLabel="Vendedor"
      onLogout={onLogout}
      footer={footer}
    >
      {/* Toggle icon */}
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
        const isActive = pathname === href || pathname.startsWith(href + '/');

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-4 ${
              isActive
                ? 'bg-green-50 text-green-700 border-green-500'
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
