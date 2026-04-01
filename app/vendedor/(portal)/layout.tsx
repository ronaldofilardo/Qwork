'use client';

import { VendedorProvider } from './vendedor-context';

export default function VendedorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VendedorProvider>{children}</VendedorProvider>;
}
