'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SidebarLayoutProps {
  title: string;
  subtitle?: string;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  userName?: string;
  roleLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode; // optional content rendered after nav (outside)
}

export default function SidebarLayout({
  title,
  subtitle,
  isCollapsed = false,
  onToggleCollapsed,
  userName = 'Gestor',
  children,
  footer,
  roleLabel = 'Gestor',
}: SidebarLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className={`h-screen bg-white border-r border-gray-200 flex flex-col transition-all ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-800">{title}</h1>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          )}
          {onToggleCollapsed && (
            <button
              onClick={onToggleCollapsed}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {/* icon passed by parent if needed */}
              {isCollapsed ? <span /> : <span />}
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600">🏥</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation area */}
      <nav className="flex-1 overflow-y-auto py-4">
        {children}

        {/* Logout posicionado logo após a navegação */}
        <div className="mt-2 px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </nav>

      {footer && <div className="px-4 py-6 border-t border-gray-200 text-xs text-gray-500">{footer}</div>}
    </div>
  );
}