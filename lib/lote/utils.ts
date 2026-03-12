// ── Pure utility functions shared between RH and Entidade lote pages ────────

/** Remove acentos e normaliza para minusculas (busca insensivel a diacriticos) */
export function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Formata data para exibicao pt-BR com hora (dd/mm/yyyy, hh:mm) */
export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formata data com "as" para textos descritivos */
export function formatarData(data: string | null): string {
  if (!data) return '-';
  try {
    const date = new Date(data);
    if (isNaN(date.getTime())) return '-';
    return (
      date.toLocaleDateString('pt-BR') +
      ' \u00e0s ' +
      date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return '-';
  }
}

// ── Classificacao de grupos ───────────────────────────────────────────────

const GRUPOS_POSITIVOS = [2, 3, 5, 6];

/** Retorna label textual da classificacao (Excelente / Monitorar / Atencao) */
export function getClassificacaoLabel(
  media: number | undefined,
  numeroGrupo: number
): string {
  if (media === undefined) return '';
  const isPositivo = GRUPOS_POSITIVOS.includes(numeroGrupo);

  if (isPositivo) {
    if (media > 66) return 'Excelente';
    if (media >= 33) return 'Monitorar';
    return 'Aten\u00e7\u00e3o';
  } else {
    if (media < 33) return 'Excelente';
    if (media <= 66) return 'Monitorar';
    return 'Aten\u00e7\u00e3o';
  }
}

/** Retorna { label, colorClass } da classificacao, ou null se media undefined */
export function getClassificacaoStyle(
  media: number | undefined,
  numeroGrupo: number
): { label: string; colorClass: string } | null {
  if (media === undefined) return null;
  const isPositivo = GRUPOS_POSITIVOS.includes(numeroGrupo);

  let label: string;
  let colorClass: string;

  if (isPositivo) {
    if (media > 66) {
      label = 'Excelente';
      colorClass = 'bg-green-100 text-green-800';
    } else if (media >= 33) {
      label = 'Monitorar';
      colorClass = 'bg-yellow-100 text-yellow-800';
    } else {
      label = 'Aten\u00e7\u00e3o';
      colorClass = 'bg-red-100 text-red-800';
    }
  } else {
    if (media < 33) {
      label = 'Excelente';
      colorClass = 'bg-green-100 text-green-800';
    } else if (media <= 66) {
      label = 'Monitorar';
      colorClass = 'bg-yellow-100 text-yellow-800';
    } else {
      label = 'Aten\u00e7\u00e3o';
      colorClass = 'bg-red-100 text-red-800';
    }
  }

  return { label, colorClass };
}

// ── Status badge ──────────────────────────────────────────────────────────

export const STATUS_BADGE_MAP: Record<
  string,
  { label: string; color: string }
> = {
  concluida: { label: 'Conclu\u00edda', color: 'bg-green-100 text-green-800' },
  concluido: { label: 'Conclu\u00edda', color: 'bg-green-100 text-green-800' },
  em_andamento: {
    label: 'Em andamento',
    color: 'bg-yellow-100 text-yellow-800',
  },
  iniciada: { label: 'Iniciada', color: 'bg-blue-100 text-blue-800' },
  inativada: { label: 'Inativada', color: 'bg-red-100 text-red-800' },
};

export function getStatusBadgeInfo(status: string): {
  label: string;
  color: string;
} {
  return (
    STATUS_BADGE_MAP[status] || {
      label: status,
      color: 'bg-gray-100 text-gray-800',
    }
  );
}
