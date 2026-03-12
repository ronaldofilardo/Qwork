export interface CheckoutAsaasProps {
  tomadorId: number;
  planoId: number;
  numeroFuncionarios?: number;
  valor: number;
  contratoId?: number | null;
  loteId?: number | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export type FormaPagamento = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

export interface PaymentData {
  pagamento: {
    id: number;
    status: string;
    asaas_payment_id: string;
    asaas_payment_url?: string;
    asaas_boleto_url?: string;
    asaas_invoice_url?: string;
    asaas_pix_qrcode?: string;
    asaas_pix_qrcode_image?: string;
    asaas_due_date?: string;
  };
  pixQrCode?: {
    payload: string;
    encodedImage: string;
  };
  bankSlipUrl?: string;
  paymentUrl?: string;
  dueDate?: string;
  billingType: FormaPagamento;
}
