'use client';

import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAMenuItemProps {
  isCollapsed?: boolean;
  className?: string;
}

/**
 * Componente para exibir a opção de instalar PWA no sidebar
 * Usa o hook usePWAInstall para gerenciar o estado
 */
export function PWAMenuItem({
  isCollapsed = false,
  className = '',
}: PWAMenuItemProps) {
  const { canInstall, handleInstallClick } = usePWAInstall();

  if (!canInstall) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isCollapsed ? 'justify-center' : ''
      } text-blue-600 hover:bg-blue-50 rounded-md ${className}`}
      title="Instalar aplicativo na tela inicial"
    >
      <Download size={20} />
      {!isCollapsed && <span className="font-medium">Instalar App</span>}
    </button>
  );
}
