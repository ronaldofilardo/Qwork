// lib/asaas/mappers.ts
// Utilitários para converter dados entre o sistema QWork e API Asaas

import type { AsaasBillingType, AsaasPaymentStatus } from './types';
import type { MetodoPagamento, StatusPagamento } from '@/lib/types/contratacao';

/**
 * Mapear método de pagamento do QWork para billingType do Asaas
 */
export function mapMetodoPagamentoToAsaasBillingType(
  metodo: string
): AsaasBillingType {
  const mapping: Record<string, AsaasBillingType> = {
    pix: 'PIX',
    PIX: 'PIX',
    boleto: 'BOLETO',
    Boleto: 'BOLETO',
    BOLETO: 'BOLETO',
    cartao: 'CREDIT_CARD',
    Cartao: 'CREDIT_CARD',
    cartão: 'CREDIT_CARD',
    CREDIT_CARD: 'CREDIT_CARD',
    credito: 'CREDIT_CARD',
    crédito: 'CREDIT_CARD',
    debito: 'DEBIT_CARD',
    débito: 'DEBIT_CARD',
    DEBIT_CARD: 'DEBIT_CARD',
  };

  const normalized = metodo?.toString().toLowerCase() || 'pix';
  return mapping[normalized] || mapping[metodo] || 'PIX';
}

/**
 * Mapear billingType do Asaas para método de pagamento do QWork
 */
export function mapAsaasBillingTypeToMetodoPagamento(
  billingType: AsaasBillingType
): MetodoPagamento {
  const mapping: Record<AsaasBillingType, MetodoPagamento> = {
    PIX: 'pix',
    BOLETO: 'boleto',
    CREDIT_CARD: 'cartao',
    DEBIT_CARD: 'cartao',
    UNDEFINED: 'pix', // Default para PIX
  };

  return mapping[billingType] || 'pix';
}

/**
 * Mapear status de pagamento do Asaas para status local do QWork
 */
export function mapAsaasStatusToLocal(
  status: AsaasPaymentStatus
): StatusPagamento {
  const mapping: Record<AsaasPaymentStatus, StatusPagamento> = {
    PENDING: 'pendente',
    RECEIVED: 'pago',
    CONFIRMED: 'pago',
    RECEIVED_IN_CASH: 'pago',
    OVERDUE: 'cancelado', // Vencido tratado como cancelado
    REFUNDED: 'estornado',
    REFUND_REQUESTED: 'estornado',
    CHARGEBACK_REQUESTED: 'estornado',
    CHARGEBACK_DISPUTE: 'processando',
    AWAITING_CHARGEBACK_REVERSAL: 'processando',
    AWAITING_RISK_ANALYSIS: 'processando',
    DUNNING_REQUESTED: 'pendente',
    DUNNING_RECEIVED: 'pago',
  };

  return mapping[status] || 'pendente';
}

/**
 * Mapear status local para status Asaas (para filtros)
 */
export function mapLocalStatusToAsaas(
  status: StatusPagamento
): AsaasPaymentStatus | undefined {
  const mapping: Record<StatusPagamento, AsaasPaymentStatus> = {
    pendente: 'PENDING',
    processando: 'PENDING',
    pago: 'RECEIVED',
    cancelado: 'OVERDUE',
    estornado: 'REFUNDED',
  };

  return mapping[status];
}

/**
 * Remover formatação de CPF/CNPJ (deixar apenas números)
 */
export function formatCpfCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Remover formatação de telefone (deixar apenas números)
 */
export function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '');

  // Garantir formato brasileiro (mínimo 10 dígitos)
  if (cleaned.length >= 10) {
    return cleaned;
  }

  return '';
}

/**
 * Remover formatação de CEP (deixar apenas números)
 */
export function formatCep(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formatar data para formato Asaas (YYYY-MM-DD)
 */
export function formatDateToAsaas(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Calcular data de vencimento (hoje + N dias)
 */
export function calculateDueDate(daysFromNow: number = 3): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDateToAsaas(date);
}

/**
 * Validar se CPF é válido (algoritmo básico)
 */
export function isValidCpf(cpf: string): boolean {
  const cleaned = formatCpfCnpj(cpf);

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // Todos dígitos iguais

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

/**
 * Validar se CNPJ é válido (algoritmo básico)
 */
export function isValidCnpj(cnpj: string): boolean {
  const cleaned = formatCpfCnpj(cnpj);

  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false; // Todos dígitos iguais

  // Validação dos dígitos verificadores
  let size = cleaned.length - 2;
  let numbers = cleaned.substring(0, size);
  const digits = cleaned.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleaned.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Validar CPF ou CNPJ
 */
export function isValidCpfCnpj(value: string): boolean {
  const cleaned = formatCpfCnpj(value);

  if (cleaned.length === 11) {
    return isValidCpf(cleaned);
  } else if (cleaned.length === 14) {
    return isValidCnpj(cleaned);
  }

  return false;
}

/**
 * Converter valor em centavos para reais
 */
export function centavosToReais(centavos: number): number {
  return centavos / 100;
}

/**
 * Converter valor em reais para centavos
 */
export function reaisToCentavos(reais: number): number {
  return Math.round(reais * 100);
}

/**
 * Formatar valor monetário para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Gerar referência externa única para o Asaas
 * Formato: prefixo_id_timestamp
 */
export function generateExternalReference(
  prefix: string,
  id: number | string
): string {
  const timestamp = Date.now();
  return `${prefix}_${id}_${timestamp}`;
}

/**
 * Parsear referência externa do Asaas
 * Retorna: { prefix, id, timestamp }
 */
export function parseExternalReference(reference: string): {
  prefix: string;
  id: string;
  timestamp: number;
} | null {
  const parts = reference.split('_');

  if (parts.length >= 3) {
    return {
      prefix: parts[0],
      id: parts[1],
      timestamp: parseInt(parts[2], 10),
    };
  }

  return null;
}

/**
 * Determinar se um método de pagamento é à vista ou parcelado
 */
export function isPaymentMethodInstallment(
  metodo: MetodoPagamento,
  numParcelas?: number
): boolean {
  // Boleto e PIX não permitem parcelamento
  if (metodo === 'boleto' || metodo === 'pix') {
    return false;
  }

  // Cartão pode ser parcelado
  if (metodo === 'cartao' || metodo === 'avista') {
    return (numParcelas || 1) > 1;
  }

  // Parcelado explícito
  if (metodo === 'parcelado') {
    return true;
  }

  return false;
}

/**
 * Calcular juros de parcelamento (simplificado)
 * Asaas cobra taxas próprias, este é apenas para estimativa
 */
export function calculateInstallmentInterest(
  valor: number,
  numParcelas: number,
  taxaMensal: number = 0.0199 // 1.99% ao mês (exemplo)
): number {
  if (numParcelas <= 1) return valor;

  // Fórmula de juros compostos
  const total = valor * Math.pow(1 + taxaMensal, numParcelas);
  return Math.round(total * 100) / 100;
}

/**
 * Truncar descrição para limite do Asaas (500 caracteres)
 */
export function truncateDescription(
  description: string,
  maxLength: number = 500
): string {
  if (description.length <= maxLength) {
    return description;
  }

  return description.substring(0, maxLength - 3) + '...';
}
