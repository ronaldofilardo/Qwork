export function fmtBRL(v: number): string {
  return (v || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function fmtDoc(v: string | undefined): string | null {
  if (!v) return null;
  const d = v.replace(/\D/g, '');
  if (d.length === 14)
    return d.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
  if (d.length === 11)
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return v;
}

export function fmtCpf(v: string | null): string {
  if (!v) return '—';
  const d = v.replace(/\D/g, '');
  if (d.length === 11)
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return v;
}

export function fmtCnpj(v: string | null): string {
  if (!v) return '—';
  const d = v.replace(/\D/g, '');
  if (d.length === 14)
    return d.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
  return v;
}
