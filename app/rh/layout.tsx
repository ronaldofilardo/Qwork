'use client';

import ClinicaSidebar from '@/components/clinica/ClinicaSidebar';
import { RHProvider } from './rh-context';

export default function RhLayout({ children }: { children: React.ReactNode }) {
  return (
    <RHProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <ClinicaSidebar />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="qw-content-area p-4 md:p-6">{children}</div>
        </div>
      </div>
    </RHProvider>
  );
}
