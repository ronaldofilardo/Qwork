'use client';

import { RepresentanteProvider } from './rep-context';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RepresentanteProvider>{children}</RepresentanteProvider>;
}
