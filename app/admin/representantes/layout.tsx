'use client';

import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import type { AdminSection } from '@/components/admin/AdminSidebar';

export default function RepresentantesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleSectionChange = (section: AdminSection, subSection?: string) => {
    if (section === 'geral' && subSection === 'representantes') {
      router.push('/admin/representantes');
      return;
    }
    // Todas as outras seções vivem no SPA principal
    router.push('/admin');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar — mesma estrutura do admin/page.tsx */}
      <div className="flex-shrink-0 flex flex-col h-full">
        <AdminSidebar
          activeSection="geral"
          activeSubSection="representantes"
          onSectionChange={handleSectionChange}
        />
      </div>

      {/* Conteúdo da rota (lista ou detalhe do representante) */}
      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
    </div>
  );
}
