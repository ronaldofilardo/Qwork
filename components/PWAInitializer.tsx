'use client';

import { useEffect, useState } from 'react';
import {
  registerServiceWorker,
  setupOnlineSync,
  syncIndicesFuncionarios,
} from '@/lib/offline';

export default function PWAInitializer() {
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null);

  useEffect(() => {
    // Registrar Service Worker
    registerServiceWorker();

    // Configurar sincronização online
    setupOnlineSync();

    // Função para sincronizar planos offline
    const syncPlanosData = async () => {
      try {
        // Sincronizar planos
        const planosResponse = await fetch('/api/admin/financeiro/planos');
        if (planosResponse.ok) {
          const planosData = await planosResponse.json();
          localStorage.setItem('planos-cache', JSON.stringify(planosData));
        }

        // Sincronizar notificações
        const notifResponse = await fetch('/api/admin/financeiro/notificacoes');
        if (notifResponse.ok) {
          const notifData = await notifResponse.json();
          localStorage.setItem('notificacoes-cache', JSON.stringify(notifData));
        }
      } catch (error) {
        console.error('Erro ao sincronizar dados de planos:', error);
      }
    };

    // Detectar status de conexão inicial
    setIsOnline(navigator.onLine);

    // Handlers de conexão
    const handleOnline = () => {
      setIsOnline(true);
      console.log('✅ Conectado à internet');
      // Sincronizar dados offline se houver
      window.dispatchEvent(new CustomEvent('sync-offline-data'));
      // Sincronizar índices de funcionários
      void syncIndicesFuncionarios();
      // Sincronizar dados de planos e notificações
      void syncPlanosData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('⚠️ Sem conexão - Modo offline ativado');
    };

    // Handler para prompt de instalação PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Detectar se é mobile
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // Detectar se já está instalado como PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as Record<string, unknown>).standalone ===
        true;

    // Mostrar prompt apenas em mobile e se não estiver instalado
    if (isMobile && !isStandalone) {
      setTimeout(() => {
        if (!deferredPrompt) {
          setShowInstallPrompt(true);
        }
      }, 10000); // Mostrar após 10 segundos
    }

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      const dp = deferredPrompt as {
        prompt?: () => void;
        userChoice?: Promise<{ outcome: string }>;
      };
      dp.prompt?.();
      const uc = await dp.userChoice;
      if (uc?.outcome === 'accepted') {
        console.log('PWA instalado');
      }
      setDeferredPrompt(null);
    }
    setShowInstallPrompt(false);
  };

  return (
    <>
      {/* Indicador de status de conexão */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
          <div className="flex items-center justify-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            Modo Offline - Suas respostas serão sincronizadas quando reconectar
          </div>
        </div>
      )}

      {/* Prompt de instalação PWA */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 md:max-w-sm md:left-auto md:right-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Instalar App</h3>
              <p className="text-sm text-gray-600 mb-3">
                Adicione à tela inicial para acesso rápido e funcionalidade
                offline
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleInstallClick}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  Instalar
                </button>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Agora não
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
