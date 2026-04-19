'use client';

import { useState, useEffect } from 'react';

export interface OrgInfo {
  nome: string;
  logo_url: string | null;
  tipo: 'clinica' | 'entidade';
}

export function useOrgInfo(enabled: boolean = true): {
  orgInfo: OrgInfo | null;
  loading: boolean;
} {
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!enabled || typeof fetch !== 'function') {
      setOrgInfo(null);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);

    const request = fetch('/api/dashboard/org-info');

    if (!request || typeof request.then !== 'function') {
      setOrgInfo(null);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    request
      .then((res) => (res.ok ? res.json() : null))
      .then((data: OrgInfo | null) => {
        if (isMounted) {
          setOrgInfo(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setOrgInfo(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  return { orgInfo, loading };
}
