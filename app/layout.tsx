import './globals.css';
import type { Metadata } from 'next';
import PWAInitializer from '@/components/PWAInitializer';
import ConditionalHeader from '@/components/ConditionalHeader';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@/components/QueryClientProvider';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Qwork - Avaliação Psicossocial',
  description: 'Sistema de avaliação psicossocial baseado no COPSOQ III',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Qwork',
  },
};

export const viewport = {
  themeColor: '#000000',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await Promise.resolve(); // Satisfaz require-await

  return (
    <html lang="pt-BR">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <QueryClientProvider>
          <PWAInitializer />
          {/* Header condicional, não aparece em login e avaliação */}
          <ConditionalHeader />
          {children}
          <div id="modal-root"></div>
          <Toaster position="top-right" />
        </QueryClientProvider>
      </body>
    </html>
  );
}
