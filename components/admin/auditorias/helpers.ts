export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('pt-BR');
}

export function formatDuration(duration: unknown): string {
  if (!duration) return '-';

  if (typeof duration === 'object' && duration !== null) {
    if ('seconds' in (duration as Record<string, unknown>)) {
      const d = duration as { seconds?: number; milliseconds?: number };
      const totalSeconds = (d.seconds || 0) + (d.milliseconds || 0) / 1000;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
      if (minutes > 0) return `${minutes}m ${seconds}s`;
      return `${seconds}s`;
    }
    try {
      return JSON.stringify(duration);
    } catch {
      return '(duração desconhecida)';
    }
  }

  return typeof duration === 'string' || typeof duration === 'number'
    ? String(duration)
    : '(duração desconhecida)';
}
