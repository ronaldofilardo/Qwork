'use client';

import { createContext, useContext, useState } from 'react';
import type { ComercialSection } from '@/components/comercial/ComercialSidebar';

interface ComercialContextValue {
  activeSection: ComercialSection;
  setActiveSection: (section: ComercialSection) => void;
}

export const ComercialContext = createContext<ComercialContextValue>({
  activeSection: 'representantes',
  setActiveSection: () => {},
});

export const useComercial = (): ComercialContextValue =>
  useContext(ComercialContext);

export function ComercialProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] =
    useState<ComercialSection>('representantes');

  return (
    <ComercialContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </ComercialContext.Provider>
  );
}
