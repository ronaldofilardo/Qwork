// lib/asaas/client.ts
// Cliente HTTP para integração com API Asaas Payment Gateway

import type {
  AsaasCustomer,
  AsaasCustomerResponse,
  AsaasPayment,
  AsaasPaymentResponse,
  AsaasPixQrCode,
  AsaasError,
  AsaasListResponse,
  AsaasCustomerFilter,
  AsaasPaymentFilter,
  AsaasPaymentLink,
  AsaasPaymentLinkResponse,
} from './types';

// Configuração da API Asaas via variáveis de ambiente
const ASAAS_API_URL =
  process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

if (!ASAAS_API_KEY) {
  console.warn(
    '[Asaas] ASAAS_API_KEY não configurada. Pagamentos do Asaas não funcionarão.'
  );
}

/**
 * Erro customizado para falhas na API Asaas
 */
export class AsaasApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: AsaasError['errors']
  ) {
    super(message);
    this.name = 'AsaasApiError';
  }
}

/**
 * Cliente HTTP para comunicação com API Asaas
 */
class AsaasClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = ASAAS_API_URL;
    this.apiKey = ASAAS_API_KEY || '';
  }

  /**
   * Método genérico para fazer requisições HTTP à API Asaas
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new AsaasApiError(
        'ASAAS_API_KEY não configurada. Configure a variável de ambiente.',
        500
      );
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          access_token: this.apiKey,
          'User-Agent': 'QWork/1.0',
          ...options.headers,
        },
      });

      // Tratar resposta de erro
      if (!response.ok) {
        let errorData: AsaasError | null = null;
        try {
          errorData = await response.json();
        } catch {
          // Se não conseguir fazer parse do JSON, usa mensagem genérica
        }

        const errorMessage =
          errorData?.errors?.[0]?.description ||
          response.statusText ||
          'Erro desconhecido';

        throw new AsaasApiError(
          `Erro na API Asaas: ${errorMessage}`,
          response.status,
          errorData?.errors
        );
      }

      // Algumas respostas não têm body (DELETE)
      if (
        response.status === 204 ||
        response.headers.get('content-length') === '0'
      ) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      // Se já é um AsaasApiError, repassa
      if (error instanceof AsaasApiError) {
        throw error;
      }

      // Erro de rede ou outro erro inesperado
      console.error('[Asaas Client] Erro na requisição:', error);
      throw new AsaasApiError(
        `Falha ao comunicar com Asaas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        500
      );
    }
  }

  // ========================================
  // CLIENTES (Customers)
  // ========================================

  /**
   * Criar novo cliente no Asaas
   */
  async createCustomer(data: AsaasCustomer): Promise<AsaasCustomerResponse> {
    console.log('[Asaas] Criando cliente:', {
      name: data.name,
      cpfCnpj: data.cpfCnpj,
    });

    return this.request<AsaasCustomerResponse>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Buscar cliente por ID
   */
  async getCustomer(customerId: string): Promise<AsaasCustomerResponse> {
    return this.request<AsaasCustomerResponse>(`/customers/${customerId}`);
  }

  /**
   * Buscar clientes com filtros
   */
  async listCustomers(
    filters?: AsaasCustomerFilter
  ): Promise<AsaasListResponse<AsaasCustomerResponse>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    const endpoint = query ? `/customers?${query}` : '/customers';

    return this.request<AsaasListResponse<AsaasCustomerResponse>>(endpoint);
  }

  /**
   * Buscar cliente por CPF/CNPJ (helper method)
   */
  async getCustomerByCpfCnpj(
    cpfCnpj: string
  ): Promise<AsaasCustomerResponse | null> {
    const result = await this.listCustomers({ cpfCnpj, limit: 1 });
    return result.data.length > 0 ? result.data[0] : null;
  }

  /**
   * Atualizar cliente existente
   */
  async updateCustomer(
    customerId: string,
    data: Partial<AsaasCustomer>
  ): Promise<AsaasCustomerResponse> {
    console.log('[Asaas] Atualizando cliente:', customerId);

    return this.request<AsaasCustomerResponse>(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Deletar cliente
   */
  async deleteCustomer(customerId: string): Promise<void> {
    console.log('[Asaas] Deletando cliente:', customerId);

    await this.request<void>(`/customers/${customerId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Restaurar cliente deletado
   */
  async restoreCustomer(customerId: string): Promise<AsaasCustomerResponse> {
    console.log('[Asaas] Restaurando cliente:', customerId);

    return this.request<AsaasCustomerResponse>(
      `/customers/${customerId}/restore`,
      {
        method: 'POST',
      }
    );
  }

  // ========================================
  // COBRANÇAS (Payments)
  // ========================================

  /**
   * Criar nova cobrança
   */
  async createPayment(data: AsaasPayment): Promise<AsaasPaymentResponse> {
    console.log('[Asaas] Criando cobrança:', {
      customer: data.customer,
      value: data.value,
      billingType: data.billingType,
      externalReference: data.externalReference,
    });

    return this.request<AsaasPaymentResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Buscar cobrança por ID
   */
  async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>(`/payments/${paymentId}`);
  }

  /**
   * Listar cobranças com filtros
   */
  async listPayments(
    filters?: AsaasPaymentFilter
  ): Promise<AsaasListResponse<AsaasPaymentResponse>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    const endpoint = query ? `/payments?${query}` : '/payments';

    return this.request<AsaasListResponse<AsaasPaymentResponse>>(endpoint);
  }

  /**
   * Atualizar cobrança existente
   */
  async updatePayment(
    paymentId: string,
    data: Partial<AsaasPayment>
  ): Promise<AsaasPaymentResponse> {
    console.log('[Asaas] Atualizando cobrança:', paymentId);

    return this.request<AsaasPaymentResponse>(`/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Cancelar/deletar cobrança
   */
  async cancelPayment(paymentId: string): Promise<void> {
    console.log('[Asaas] Cancelando cobrança:', paymentId);

    await this.request<void>(`/payments/${paymentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Restaurar cobrança cancelada
   */
  async restorePayment(paymentId: string): Promise<AsaasPaymentResponse> {
    console.log('[Asaas] Restaurando cobrança:', paymentId);

    return this.request<AsaasPaymentResponse>(
      `/payments/${paymentId}/restore`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Confirmar recebimento em dinheiro
   */
  async receiveInCash(
    paymentId: string,
    options?: {
      paymentDate?: string; // YYYY-MM-DD
      value?: number;
      notifyCustomer?: boolean;
    }
  ): Promise<AsaasPaymentResponse> {
    console.log('[Asaas] Confirmando recebimento em dinheiro:', paymentId);

    return this.request<AsaasPaymentResponse>(
      `/payments/${paymentId}/receiveInCash`,
      {
        method: 'POST',
        body: JSON.stringify(options || {}),
      }
    );
  }

  /**
   * Desfazer recebimento em dinheiro
   */
  async undoReceivedInCash(paymentId: string): Promise<AsaasPaymentResponse> {
    console.log('[Asaas] Desfazendo recebimento em dinheiro:', paymentId);

    return this.request<AsaasPaymentResponse>(
      `/payments/${paymentId}/undoReceivedInCash`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Solicitar estorno de cobrança
   */
  async refundPayment(
    paymentId: string,
    value?: number,
    description?: string
  ): Promise<AsaasPaymentResponse> {
    console.log('[Asaas] Solicitando estorno:', paymentId);

    return this.request<AsaasPaymentResponse>(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ value, description }),
    });
  }

  // ========================================
  // PIX
  // ========================================

  /**
   * Buscar QR Code PIX de uma cobrança
   */
  async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
    console.log('[Asaas] Buscando QR Code PIX:', paymentId);

    return this.request<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
  }

  // ========================================
  // PAYMENT LINKS (Links de Pagamento)
  // ========================================

  /**
   * Criar link de pagamento reutilizável
   */
  async createPaymentLink(
    data: AsaasPaymentLink
  ): Promise<AsaasPaymentLinkResponse> {
    console.log('[Asaas] Criando payment link:', data.name);

    return this.request<AsaasPaymentLinkResponse>('/paymentLinks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Buscar payment link por ID
   */
  async getPaymentLink(linkId: string): Promise<AsaasPaymentLinkResponse> {
    return this.request<AsaasPaymentLinkResponse>(`/paymentLinks/${linkId}`);
  }

  /**
   * Atualizar payment link
   */
  async updatePaymentLink(
    linkId: string,
    data: Partial<AsaasPaymentLink>
  ): Promise<AsaasPaymentLinkResponse> {
    console.log('[Asaas] Atualizando payment link:', linkId);

    return this.request<AsaasPaymentLinkResponse>(`/paymentLinks/${linkId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Deletar payment link
   */
  async deletePaymentLink(linkId: string): Promise<void> {
    console.log('[Asaas] Deletando payment link:', linkId);

    await this.request<void>(`/paymentLinks/${linkId}`, {
      method: 'DELETE',
    });
  }

  // ========================================
  // UTILITÁRIOS
  // ========================================

  /**
   * Verificar se a API está acessível (health check)
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Tenta buscar o próprio perfil (endpoint simples)
      await this.request('/myAccount');
      return true;
    } catch (error) {
      console.error('[Asaas] Health check falhou:', error);
      return false;
    }
  }

  /**
   * Buscar informações da conta Asaas
   */
  async getAccount(): Promise<any> {
    return this.request('/myAccount');
  }
}

// Singleton - instância única do cliente
export const asaasClient = new AsaasClient();

// Exportar classe também para testes
export { AsaasClient };
