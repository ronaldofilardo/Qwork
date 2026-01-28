// Service Worker para PWA - Qwork
const CACHE_NAME = 'qwork-v3';
const urlsToCache = [
  '/',
  '/login',
  '/dashboard',
  '/rh',
  '/rh/empresas',
  '/rh/laudos',
  '/rh/notificacoes',
  '/rh/conta',
  '/rh/dashboard',
  '/entidade',
  '/entidade/lotes',
  '/entidade/funcionarios',
  '/entidade/laudos',
  '/entidade/notificacoes',
  '/entidade/conta',
  '/entidade/dashboard',
  '/manifest.json',
  '/globals.css',
  '/offline.html',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache aberto');
      return cache.addAll(urlsToCache);
    })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  // Ignorar requests não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  const acceptHeader = event.request.headers.get('accept') || '';
  const isNavigation =
    event.request.mode === 'navigate' || acceptHeader.includes('text/html');

  // Ignorar requests para API (sempre buscar da rede)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Sem conexão com a internet' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // Navegação (document): Network first, fallback para /offline.html
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((resp) => {
            return resp || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Outros recursos: network first com fallback para cache e /offline.html
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches
          .match(event.request)
          .then((response) => response || caches.match('/offline.html'));
      })
  );
});

// Background Sync (para sincronizar dados quando voltar online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-avaliacoes') {
    event.waitUntil(syncAvaliacoes());
  }
});

async function syncAvaliacoes() {
  try {
    // Buscar dados pendentes do IndexedDB e enviar para API
    const db = await openDB();
    const pending = await db.getAll('avaliacoes-pendentes');

    for (const avaliacao of pending) {
      try {
        await fetch('/api/avaliacao/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(avaliacao),
        });
        await db.delete('avaliacoes-pendentes', avaliacao.id);
      } catch (error) {
        console.error('Erro ao sincronizar avaliação:', error);
      }
    }
  } catch (error) {
    console.error('Erro no sync:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bps-brasil-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('avaliacoes-pendentes')) {
        db.createObjectStore('avaliacoes-pendentes', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    };
  });
}
