'use client';

import { useState, useEffect } from 'react';

export interface OrgInfo {
  nome: string;
  logo_url: string | null;
  tipo: 'clinica' | 'entidade';
}

export function useOrgInfo(): { orgInfo: OrgInfo | null; loading: boolean } {
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/org-info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: OrgInfo | null) => setOrgInfo(data))
      .catch(() => setOrgInfo(null))
      .finally(() => setLoading(false));
  }, []);

  return { orgInfo, loading };
}
