import './globals.css';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import PWAInitializer from '@/components/PWAInitializer';
import ConditionalHeader from '@/components/ConditionalHeader';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@/components/QueryClientProvider';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Qwork - Avaliação Psicossocial',
  description: 'Sistema de avaliação psicossocial baseado no COPSOQ III',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Qwork',
  },
};

export const viewport = {
  themeColor: '#2D2D2D',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await Promise.resolve(); // Satisfaz require-await

  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2D2D2D" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans">
        <QueryClientProvider>
          <div className="qw-content-area min-h-screen bg-white">
            <PWAInitializer />
            {/* Header condicional, não aparece em login e avaliação */}
            <ConditionalHeader />
            {children}
          </div>
          <div id="modal-root"></div>
          <Toaster position="top-right" />
        </QueryClientProvider>
      </body>
    </html>
  );
}
