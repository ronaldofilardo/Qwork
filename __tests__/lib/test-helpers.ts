/**
 * Utilitários de Mock para Testes - Padrão QWork
 *
// @ts-nocheck
 * Este arquivo contém helpers padronizados para criação de mocks
 * seguindo a Política de Mocks documentada em docs/testing/MOCKS_POLICY.md
 */

import { jest } from '@jest/globals';

/**
 * Cria um mock consistente para fetch API responses
 * Seguindo o padrão: mockImplementationOnce para controle preciso
 */
export const mockFetchResponse = <T = any>(
  data: T,
  status = 200,
  headers: Record<string, string> = {}
): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: async () => data,
    text: async () => JSON.stringify(data),
    clone: jest.fn(),
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'default',
    url: '',
  }) as unknown as Response;

/**
 * Cria um mock para cenários de erro de fetch
 */
export const mockFetchError = (error: Error | string): Promise<never> =>
  Promise.reject(error instanceof Error ? error : new Error(error));

/**
 * Mock consistente para Next.js router
 * Inclui todos os métodos necessários
 */
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  locale: 'pt-BR',
  locales: ['pt-BR', 'en-US'],
  defaultLocale: 'pt-BR',
};

/**
 * Mock para APIs do navegador - matchMedia
 * Essencial para componentes PWA e responsivos
 */
export const mockMatchMedia = (matches = false) => ({
  matches,
  media: '',
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

/**
 * Mock para ResizeObserver
 * Necessário para componentes que usam resize detection
 */
export const mockResizeObserver = {
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
};

/**
 * Setup completo de mocks para testes PWA
 * Inclui todos os mocks necessários para componentes offline
 */
export const setupPWAMocks = () => {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(() => mockMatchMedia()),
  });

  // Mock ResizeObserver
  global.ResizeObserver = jest
    .fn()
    .mockImplementation(() => mockResizeObserver) as any;

  // Mock Notification API se necessário
  Object.defineProperty(window, 'Notification', {
    writable: true,
    value: {
      permission: 'granted',
      requestPermission: jest
        .fn()
        .mockResolvedValue('granted' as NotificationPermission),
    } as any,
  });

  // Mock Service Worker API
  Object.defineProperty(navigator, 'serviceWorker', {
    writable: true,
    value: {
      register: jest.fn().mockResolvedValue({} as ServiceWorkerRegistration),
      ready: Promise.resolve({
        active: {} as ServiceWorker,
        waiting: null,
        controller: null,
      } as ServiceWorkerRegistration),
    } as ServiceWorkerContainer,
  });
};

/**
 * Helper para limpar todos os mocks entre testes
 * Deve ser chamado no beforeEach
 */
export const clearAllTestMocks = () => {
  jest.clearAllMocks();

  // Limpar mocks globais se necessário
  if (global.fetch) {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  }
};

/**
 * Wrapper para waitFor com timeout consistente
 * Ajuda na padronização de testes assíncronos
 */
export const waitForMockCall = async (
  mockFunction: jest.MockedFunction<any>,
  options: {
    timeout?: number;
    expectedCalls?: number;
  } = {}
) => {
  const { timeout = 1000, expectedCalls = 1 } = options;

  await new Promise((resolve) => setTimeout(resolve, 0)); // Microtask tick

  if (mockFunction.mock.calls.length < expectedCalls) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (mockFunction.mock.calls.length < expectedCalls) {
          reject(new Error('Timeout'));
        } else {
          resolve(mockFunction.mock.calls);
        }
      }, timeout);
    });
  }

  return mockFunction.mock.calls;
};

/**
 * Utilitário para debug de mocks durante desenvolvimento
 * Remove console.logs automaticamente em produção
 */
export const debugMock = (mock: jest.MockedFunction<any>, label = 'Mock') => {
  if (process.env.NODE_ENV === 'test' && process.env.DEBUG_MOCKS === 'true') {
    console.log(`${label} calls:`, mock.mock.calls);
    console.log(`${label} results:`, mock.mock.results);
  }
};

// Testes para os utilitários de mock
describe('Test Helpers', () => {
  describe('mockFetchResponse', () => {
    it('deve criar uma resposta de sucesso padrão', () => {
      const data = { message: 'success' };
      const response = mockFetchResponse(data);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
    });

    it('deve criar uma resposta de erro', () => {
      const data = { error: 'not found' };
      const response = mockFetchResponse(data, 404);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(response.statusText).toBe('Error');
    });

    it('deve retornar os dados corretos via json()', async () => {
      const data = { id: 1, name: 'Test' };
      const response = mockFetchResponse(data);

      const result = await response.json();
      expect(result).toEqual(data);
    });

    it('deve incluir headers customizados', () => {
      const headers = { 'Content-Type': 'application/json' };
      const response = mockFetchResponse({}, 200, headers);

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('mockFetchError', () => {
    it('deve rejeitar com Error quando passado string', async () => {
      const errorMessage = 'Network error';
      await expect(mockFetchError(errorMessage)).rejects.toThrow(
        'Network error'
      );
    });

    it('deve rejeitar com o Error passado', async () => {
      const error = new Error('Custom error');
      await expect(mockFetchError(error)).rejects.toThrow('Custom error');
    });
  });

  describe('mockRouter', () => {
    it('deve ter todos os métodos necessários do Next.js router', () => {
      expect(typeof mockRouter.push).toBe('function');
      expect(typeof mockRouter.replace).toBe('function');
      expect(typeof mockRouter.prefetch).toBe('function');
      expect(typeof mockRouter.back).toBe('function');
      expect(typeof mockRouter.forward).toBe('function');
      expect(typeof mockRouter.refresh).toBe('function');
    });

    it('deve ter propriedades padrão', () => {
      expect(mockRouter.pathname).toBe('/');
      expect(mockRouter.query).toEqual({});
    });
  });

  describe('waitForMockCall', () => {
    it('deve aguardar uma chamada de mock', async () => {
      const mockFn = jest.fn();
      setTimeout(() => mockFn('arg1', 'arg2'), 10);

      const calls = await waitForMockCall(mockFn);
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual(['arg1', 'arg2']);
    });

    it('deve respeitar timeout', async () => {
      const mockFn = jest.fn();

      await expect(waitForMockCall(mockFn, 5)).rejects.toThrow('Timeout');
    });
  });
});
