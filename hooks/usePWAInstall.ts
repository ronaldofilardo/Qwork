'use client';

import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt?: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface UsePWAInstallReturn {
  canInstall: boolean;
  handleInstallClick: () => Promise<void>;
  dismissPrompt: () => void;
}

/**
 * Hook para gerenciar instalação do PWA
 * Expõe controle manual da instalação do PWA
 */
export function usePWAInstall(): UsePWAInstallReturn {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar se já está instalado
    const nav = navigator as NavigatorWithStandalone;
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      nav.standalone === true
    ) {
      setCanInstall(false);
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('PWA install prompt não disponível');
      return;
    }

    try {
      await deferredPrompt.prompt?.();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('✅ PWA instalado com sucesso');
      }

      setDeferredPrompt(null);
      setCanInstall(false);
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    }
  };

  const dismissPrompt = () => {
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  return {
    canInstall,
    handleInstallClick,
    dismissPrompt,
  };
}
