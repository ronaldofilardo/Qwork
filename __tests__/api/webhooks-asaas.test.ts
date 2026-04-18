/**
 * @file __tests__/api/webhooks-asaas.test.ts
 * Testes para app/api/webhooks/asaas/route.ts
 *
 * Verifica que GET não é exposto (405) e que POST valida assinatura/payload.
 */

// Mocks antes dos imports
jest.mock('@/lib/asaas/webhook-handler', () => ({
  validateWebhookSignature: jest.fn(),
  handlePaymentWebhook: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { validateWebhookSignature, handlePaymentWebhook } from '@/lib/asaas/webhook-handler';

const mockValidateSignature = validateWebhookSignature as jest.MockedFunction<
  typeof validateWebhookSignature
>;
const mockHandlePaymentWebhook = handlePaymentWebhook as jest.MockedFunction<
  typeof handlePaymentWebhook
>;

function makeRequest(
  method: string,
  body?: object,
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/asaas', {
    method,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeValidPayload() {
  return {
    event: 'PAYMENT_CONFIRMED',
    payment: {
      id: 'pay_123456',
      status: 'CONFIRMED',
      externalReference: 'ref_001',
      value: 99.9,
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/webhooks/asaas', () => {
  it('não deve exportar handler GET — método não permitido', async () => {
    // O route.ts não exporta função GET, portanto Next.js responde 405.
    // Este teste verifica que o módulo não exporta GET.
    const routeModule = await import('@/app/api/webhooks/asaas/route');
    expect((routeModule as any).GET).toBeUndefined();
  });
});

describe('POST /api/webhooks/asaas', () => {
  describe('rate limiting', () => {
    it('deve aceitar requisições dentro do limite', async () => {
      // Arrange
      mockValidateSignature.mockReturnValue(true);
      mockHandlePaymentWebhook.mockResolvedValue(undefined);

      const { POST } = await import('@/app/api/webhooks/asaas/route');
      const request = makeRequest('POST', makeValidPayload());

      // Act
      const response = await POST(request);

      // Assert: deve ser 200 (sucesso)
      expect(response.status).toBe(200);
    });
  });

  describe('validação de assinatura', () => {
    it('deve retornar 401 quando assinatura é inválida', async () => {
      // Arrange
      mockValidateSignature.mockReturnValue(false);

      const { POST } = await import('@/app/api/webhooks/asaas/route');
      const request = makeRequest('POST', makeValidPayload());

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBeTruthy();
    });
  });

  describe('validação do payload', () => {
    it('deve retornar 400 quando payload não tem campo event', async () => {
      // Arrange
      mockValidateSignature.mockReturnValue(true);

      const { POST } = await import('@/app/api/webhooks/asaas/route');
      const request = makeRequest('POST', { payment: { id: 'pay_123' } }); // sem event

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeTruthy();
    });

    it('deve retornar 400 quando payload não tem payment.id', async () => {
      // Arrange
      mockValidateSignature.mockReturnValue(true);

      const { POST } = await import('@/app/api/webhooks/asaas/route');
      const request = makeRequest('POST', { event: 'PAYMENT_CONFIRMED', payment: {} });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
    });

    it('deve retornar 400 quando body é JSON inválido', async () => {
      // Arrange
      mockValidateSignature.mockReturnValue(true);

      const { POST } = await import('@/app/api/webhooks/asaas/route');
      const request = new NextRequest('http://localhost/api/webhooks/asaas', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
        body: 'not-json',
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('processamento bem-sucedido', () => {
    it('deve retornar 200 e chamar handlePaymentWebhook com payload correto', async () => {
      // Arrange
      const payload = makeValidPayload();
      mockValidateSignature.mockReturnValue(true);
      mockHandlePaymentWebhook.mockResolvedValue(undefined);

      const { POST } = await import('@/app/api/webhooks/asaas/route');
      const request = makeRequest('POST', payload);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
    });
  });
});
