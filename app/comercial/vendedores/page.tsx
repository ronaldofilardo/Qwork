'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ComercialVendedoresPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/comercial/representantes'); }, [router]);
  return null;
}

