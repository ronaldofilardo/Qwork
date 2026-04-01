'use client';

import { ComercialProvider } from './comercial-context';

export default function ComercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ComercialProvider>{children}</ComercialProvider>;
}
