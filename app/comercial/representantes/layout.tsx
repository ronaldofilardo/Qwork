'use client';

import { useRouter } from 'next/navigation';
import ComercialSidebar from '@/components/comercial/ComercialSidebar';
import type { ComercialSection } from '@/components/comercial/ComercialSidebar';
import { useComercial } from '@/app/comercial/comercial-context';

export default function ComercialRepresentantesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setActiveSection } = useComercial();

  const handleSectionChange = (section: ComercialSection) => {
    setActiveSection(section);
    if (section === 'representantes') {
      router.push('/comercial/representantes');
      return;
    }
    router.push('/comercial');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-shrink-0 flex flex-col h-full">
        <ComercialSidebar
          activeSection="representantes"
          onSectionChange={handleSectionChange}
        />
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
    </div>
  );
}
