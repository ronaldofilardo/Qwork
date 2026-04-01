'use client';

import EntidadeSidebar from '@/components/entidade/EntidadeSidebar';
import { EntidadeProvider } from './entidade-context';

export default function EntidadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EntidadeProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <EntidadeSidebar />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 md:p-6">{children}</div>
        </div>
      </div>
    </EntidadeProvider>
  );
}
