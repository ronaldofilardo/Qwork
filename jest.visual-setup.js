/**
 * Setup específico para testes de regressão visual
 * Inclui mocks comuns para evitar erros em componentes
 */

require('@testing-library/jest-dom');

// Mock de TextEncoder/TextDecoder para Node.js < 19
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock do módulo lib/db antes de qualquer import
jest.mock('@/lib/db', () => ({
  db: {
    execute: jest.fn(() => Promise.resolve({ rows: [], rowCount: 0 })),
    query: jest.fn(() => Promise.resolve({ rows: [], rowCount: 0 })),
  },
  pool: {
    query: jest.fn(() => Promise.resolve({ rows: [], rowCount: 0 })),
  },
}));

// Mock do módulo lib/session
jest.mock('@/lib/session', () => ({
  getServerSession: jest.fn(() => Promise.resolve(null)),
  getSession: jest.fn(() => Promise.resolve(null)),
  authOptions: {},
}));

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

// Mock de EventSource para componentes que usam SSE
global.EventSource = jest.fn(() => ({
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  onerror: null,
  onmessage: null,
  onopen: null,
  readyState: 0,
  url: '',
  withCredentials: false,
}));

// Mock de fetch global
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  })
);

// Mock de window.matchMedia para testes de responsividade
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock de ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock de window.alert
global.alert = jest.fn();

// Mock de window.confirm
global.confirm = jest.fn(() => true);

// Mock de window.prompt
global.prompt = jest.fn(() => 'test');

// Suprimir warnings específicos de console nos testes
const originalConsoleError = console.error;
console.error = (...args) => {
  // Ignorar avisos comuns em testes
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('[SSE]') ||
      args[0].includes('EventSource') ||
      args[0].includes('not wrapped in act') ||
      args[0].includes('Not implemented: window.alert') ||
      args[0].includes('Not implemented: navigation') ||
      args[0].includes('NEXT_REDIRECT') ||
      args[0].includes('NEXT_NOT_FOUND') ||
      args[0].includes('No QueryClient set') ||
      args[0].includes('Error: Not implemented'))
  ) {
    return;
  }
  // Também ignorar erros de tipo Error com mensagens específicas
  if (args[0] instanceof Error) {
    const message = args[0].message || '';
    if (
      message.includes('Not implemented: window.alert') ||
      message.includes('Not implemented: navigation') ||
      message.includes('NEXT_REDIRECT') ||
      message.includes('NEXT_NOT_FOUND') ||
      message.includes('No QueryClient set') ||
      message.includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      return;
    }
  }
  originalConsoleError.apply(console, args);
};

const originalConsoleLog = console.log;
console.log = (...args) => {
  // Ignorar logs de SSE em testes
  if (typeof args[0] === 'string' && args[0].includes('[SSE]')) {
    return;
  }
  originalConsoleLog.apply(console, args);
};

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  // Ignorar avisos de TEST_DATABASE_URL em testes visuais
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('TEST_DATABASE_URL') || args[0].includes('_test'))
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};
