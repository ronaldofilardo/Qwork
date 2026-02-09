'use client';

import { useEffect, useState } from 'react';
import {
  registerServiceWorker,
  setupOnlineSync,
  syncIndicesFuncionarios,
} from '@/lib/offline';

export default function PWAInitializer() {
  const [isOnline, setIsOnline] = useState(true);

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

    // Event listeners para status online/offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    </>
  );
}
