'use client';

import { useState, useCallback } from 'react';
import type { RepDocsCache } from '../types';

interface UseCachedDocsReturn {
  repDocs: Record<number, RepDocsCache>;
  repDocsLoading: Record<number, boolean>;
  leadDocs: Record<string, RepDocsCache>;
  leadDocsLoading: Record<string, boolean>;
  openRepDoc: (
    repId: number,
    docType: 'cpf' | 'cnpj' | 'cpf_resp'
  ) => Promise<void>;
  openLeadDoc: (
    leadId: string,
    docType: 'cpf' | 'cnpj' | 'cpf_resp'
  ) => Promise<void>;
}

function docKey(
  docType: 'cpf' | 'cnpj' | 'cpf_resp'
): 'doc_cpf' | 'doc_cnpj' | 'doc_cpf_resp' {
  if (docType === 'cpf') return 'doc_cpf';
  if (docType === 'cnpj') return 'doc_cnpj';
  return 'doc_cpf_resp';
}

export function useCachedDocs(): UseCachedDocsReturn {
  const [repDocs, setRepDocs] = useState<Record<number, RepDocsCache>>({});
  const [repDocsLoading, setRepDocsLoading] = useState<Record<number, boolean>>(
    {}
  );
  const [leadDocs, setLeadDocs] = useState<Record<string, RepDocsCache>>({});
  const [leadDocsLoading, setLeadDocsLoading] = useState<
    Record<string, boolean>
  >({});

  const openRepDoc = useCallback(
    async (repId: number, docType: 'cpf' | 'cnpj' | 'cpf_resp') => {
      const key = docKey(docType);
      const cached = repDocs[repId];
      if (cached !== undefined) {
        const doc = cached?.documentos?.[key];
        if (doc?.url) window.open(doc.url, '_blank', 'noopener,noreferrer');
        return;
      }
      setRepDocsLoading((prev) => ({ ...prev, [repId]: true }));
      try {
        const res = await fetch(
          `/api/admin/representantes/${repId}/documentos`
        );
        const data: RepDocsCache = await res.json();
        setRepDocs((prev) => ({ ...prev, [repId]: data }));
        const doc = data?.documentos?.[key];
        if (doc?.url) window.open(doc.url, '_blank', 'noopener,noreferrer');
      } catch {
        // Silencia erro de rede
      } finally {
        setRepDocsLoading((prev) => ({ ...prev, [repId]: false }));
      }
    },
    [repDocs]
  );

  const openLeadDoc = useCallback(
    async (leadId: string, docType: 'cpf' | 'cnpj' | 'cpf_resp') => {
      const key = docKey(docType);
      const cached = leadDocs[leadId];
      if (cached !== undefined) {
        const doc = cached?.documentos?.[key];
        if (doc?.url) window.open(doc.url, '_blank', 'noopener,noreferrer');
        return;
      }
      setLeadDocsLoading((prev) => ({ ...prev, [leadId]: true }));
      try {
        const res = await fetch(`/api/admin/leads/${leadId}/documentos`);
        const data: RepDocsCache = await res.json();
        setLeadDocs((prev) => ({ ...prev, [leadId]: data }));
        const doc = data?.documentos?.[key];
        if (doc?.url) window.open(doc.url, '_blank', 'noopener,noreferrer');
      } catch {
        // Silencia erro de rede
      } finally {
        setLeadDocsLoading((prev) => ({ ...prev, [leadId]: false }));
      }
    },
    [leadDocs]
  );

  return {
    repDocs,
    repDocsLoading,
    leadDocs,
    leadDocsLoading,
    openRepDoc,
    openLeadDoc,
  };
}
