// lib/asaas/types.ts
// Tipos TypeScript para integração com API Asaas Payment Gateway

/**
 * Tipos de cobrança suportados pelo Asaas
 */
export type AsaasBillingType =
  | 'BOLETO'
  | 'CREDIT_CARD'
  | 'PIX'
  | 'DEBIT_CARD'
  | 'UNDEFINED';

/**
 * Status de pagamento no Asaas
 */
export type AsaasPaymentStatus =
  | 'PENDING' // Aguardando pagamento
  | 'RECEIVED' // Pagamento confirmado (dinheiro na conta)
  | 'CONFIRMED' // Pagamento confirmado (aguardando compensação)
  | 'OVERDUE' // Vencido
  | 'REFUNDED' // Estornado
  | 'RECEIVED_IN_CASH' // Recebido em dinheiro
  | 'REFUND_REQUESTED' // Estorno solicitado
  | 'CHARGEBACK_REQUESTED' // Chargeback solicitado
  | 'CHARGEBACK_DISPUTE' // Em disputa
  | 'AWAITING_CHARGEBACK_REVERSAL' // Aguardando reversão
  | 'DUNNING_REQUESTED' // Negativação solicitada
  | 'DUNNING_RECEIVED' // Recuperado via negativação
  | 'AWAITING_RISK_ANALYSIS'; // Aguardando análise de risco

/**
 * Dados do cliente no Asaas
 */
export interface AsaasCustomer {
  name: string;
  email: string;
  cpfCnpj: string; // Sem formatação, apenas números
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string; // Bairro
  postalCode?: string; // CEP sem formatação
  externalReference?: string; // ID no sistema QWork (ex: tomador_id)
  notificationDisabled?: boolean;
  observations?: string;
}

/**
 * Resposta ao criar cliente no Asaas
 */
export interface AsaasCustomerResponse {
  id: string; // cus_xxxxxxxxxx
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled: boolean;
  observations?: string;
  dateCreated: string; // ISO 8601
}

/**
 * Configuração de desconto
 */
export interface AsaasDiscount {
  value: number;
  dueDateLimitDays?: number; // Prazo em dias para aplicar desconto
  type: 'FIXED' | 'PERCENTAGE';
}

/**
 * Configuração de multa
 */
export interface AsaasFine {
  value: number;
  type: 'FIXED' | 'PERCENTAGE';
}

/**
 * Configuração de juros
 */
export interface AsaasInterest {
  value: number;
  type: 'PERCENTAGE'; // Asaas só aceita percentual para juros
}

/**
 * Dados para criar cobrança no Asaas
 */
export interface AsaasPayment {
  customer: string; // ID do cliente Asaas (cus_xxx)
  billingType: AsaasBillingType;
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string; // ID no QWork (ex: pagamento_id ou contrato_id)
  installmentCount?: number; // Número de parcelas (1-12)
  installmentValue?: number; // Valor de cada parcela
  discount?: AsaasDiscount;
  fine?: AsaasFine;
  interest?: AsaasInterest;
  postalService?: boolean; // Enviar boleto pelos Correios
  split?: any[]; // Split de pagamento (avançado)
  callback?: {
    successUrl?: string;
    autoRedirect?: boolean;
  };
}

/**
 * Resposta ao criar cobrança no Asaas
 */
export interface AsaasPaymentResponse {
  id: string; // pay_xxxxxxxxxx
  customer: string; // cus_xxx
  billingType: AsaasBillingType;
  value: number;
  netValue: number; // Valor líquido (após taxas)
  originalValue?: number;
  interestValue?: number;
  description?: string;
  externalReference?: string;
  status: AsaasPaymentStatus;
  dueDate: string; // YYYY-MM-DD
  originalDueDate?: string;
  paymentDate?: string; // Data efetiva do pagamento
  clientPaymentDate?: string;
  installmentNumber?: number;
  installmentCount?: number;
  installmentValue?: number;
  discount?: AsaasDiscount;
  fine?: AsaasFine;
  interest?: AsaasInterest;
  deleted: boolean;
  postalService: boolean;
  anticipated: boolean;
  anticipable: boolean;

  // URLs de pagamento
  invoiceUrl?: string; // URL da fatura (todos os métodos)
  bankSlipUrl?: string; // URL do boleto (apenas BOLETO)
  transactionReceiptUrl?: string; // Comprovante de pagamento
  invoiceNumber?: string;

  // Dados específicos de cartão
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
    creditCardToken?: string;
  };

  // Dados de confirmação
  confirmedDate?: string;
  paymentUrl?: string; // Link genérico de pagamento

  // Metadados
  dateCreated: string; // ISO 8601

  // Chargeback/Refund
  refundedValue?: number;
  chargebackStatus?: string;
}

/**
 * QR Code PIX
 */
export interface AsaasPixQrCode {
  encodedImage: string; // Base64 da imagem do QR Code
  payload: string; // Código PIX Copia e Cola
  expirationDate?: string; // Data de expiração
}

/**
 * Eventos de webhook do Asaas
 */
export type AsaasWebhookEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_REFUND_IN_PROGRESS'
  | 'PAYMENT_RECEIVED_IN_CASH_UNDONE'
  | 'PAYMENT_CHARGEBACK_REQUESTED'
  | 'PAYMENT_CHARGEBACK_DISPUTE'
  | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  | 'PAYMENT_DUNNING_RECEIVED'
  | 'PAYMENT_DUNNING_REQUESTED'
  | 'PAYMENT_BANK_SLIP_VIEWED'
  | 'PAYMENT_CHECKOUT_VIEWED';

/**
 * Payload do webhook do Asaas
 */
export interface AsaasWebhookPayload {
  event: AsaasWebhookEvent;
  payment: {
    object: 'payment';
    id: string;
    dateCreated: string;
    customer: string;
    subscription?: string;
    installment?: string;
    paymentLink?: string;
    dueDate: string;
    originalDueDate?: string;
    value: number;
    netValue: number;
    billingType: AsaasBillingType;
    status: AsaasPaymentStatus;
    description?: string;
    externalReference?: string;
    confirmedDate?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    installmentNumber?: number;
    invoiceUrl?: string;
    invoiceNumber?: string;
    bankSlipUrl?: string;
    transactionReceiptUrl?: string;
    deleted: boolean;
    anticipated: boolean;
    anticipable: boolean;
    creditCard?: {
      creditCardNumber?: string;
      creditCardBrand?: string;
      creditCardToken?: string;
    };
    discount?: AsaasDiscount;
    fine?: AsaasFine;
    interest?: AsaasInterest;
    postalService: boolean;
    originalValue?: number;
    interestValue?: number;
    refundedValue?: number;
  };
}

/**
 * Erro da API Asaas
 */
export interface AsaasError {
  errors: Array<{
    code: string;
    description: string;
  }>;
}

/**
 * Resposta de listagem (paginated)
 */
export interface AsaasListResponse<T> {
  object: 'list';
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}

/**
 * Opções de filtro para buscar clientes
 */
export interface AsaasCustomerFilter {
  name?: string;
  email?: string;
  cpfCnpj?: string;
  groupName?: string;
  externalReference?: string;
  offset?: number;
  limit?: number;
}

/**
 * Opções de filtro para buscar pagamentos
 */
export interface AsaasPaymentFilter {
  customer?: string;
  billingType?: AsaasBillingType;
  status?: AsaasPaymentStatus;
  subscription?: string;
  installment?: string;
  externalReference?: string;
  paymentDate?: string; // YYYY-MM-DD
  estimatedCreditDate?: string;
  pixQrCodeId?: string;
  anticipated?: boolean;
  'dateCreated[ge]'?: string; // Data criação maior ou igual
  'dateCreated[le]'?: string; // Data criação menor ou igual
  'paymentDate[ge]'?: string;
  'paymentDate[le]'?: string;
  'estimatedCreditDate[ge]'?: string;
  'estimatedCreditDate[le]'?: string;
  offset?: number;
  limit?: number;
}

/**
 * Payment Link (link de pagamento reutilizável)
 */
export interface AsaasPaymentLink {
  name: string;
  description?: string;
  billingType?: AsaasBillingType;
  chargeType: 'DETACHED' | 'RECURRENT'; // Avulso ou recorrente
  value?: number; // Opcional se for "valor aberto"
  dueDateLimitDays?: number;
  maxInstallmentCount?: number;
  notificationEnabled?: boolean;
  callback?: {
    successUrl?: string;
    autoRedirect?: boolean;
  };
}

/**
 * Resposta ao criar Payment Link
 */
export interface AsaasPaymentLinkResponse {
  id: string; // plink_xxx
  name: string;
  url: string; // URL pública do link de pagamento
  billingType?: AsaasBillingType;
  chargeType: 'DETACHED' | 'RECURRENT';
  value?: number;
  active: boolean;
  dateCreated: string;
  description?: string;
  dueDateLimitDays?: number;
  maxInstallmentCount?: number;
  notificationEnabled: boolean;
  deleted: boolean;
}
