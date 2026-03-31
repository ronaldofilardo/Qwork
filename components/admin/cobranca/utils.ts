/**
 * Utility functions for cobrança/billing formatting.
 * Pure functions — no React or state dependencies.
 */

export function formatarValor(
  valor: number | string | null | undefined
): string {
  if (valor === null || valor === undefined) return 'Não informado';

  const num = Number(valor);
  if (!Number.isFinite(num)) return 'Não informado';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR');
}

export function getTipoPagamentoLabel(tipo: string | null): string {
  const tipos: Record<string, string> = {
    boleto: 'Boleto',
    cartao: 'Cartão',
    pix: 'PIX',
  };
  return tipos[tipo || ''] || 'Não informado';
}

export function getModalidadeLabel(modalidade: string | null): string {
  const modalidades: Record<string, string> = {
    a_vista: 'À vista',
    parcelado: 'Parcelado',
  };
  return modalidades[modalidade || ''] || 'Não informado';
}
