global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Adicionar fetch global para testes
const fetch = require('node-fetch');
global.fetch = fetch;
global.Request = fetch.Request;
global.Response = fetch.Response;
global.Headers = fetch.Headers;

// Polyfill para TransformStream (necessário para Playwright)
global.TransformStream = class TransformStream {
  constructor() {
    this.readable = {
      getReader: () => ({
        read: () => Promise.resolve({ done: true, value: undefined }),
        releaseLock: () => {},
      }),
    };
    this.writable = {
      getWriter: () => ({
        write: () => Promise.resolve(),
        close: () => Promise.resolve(),
        abort: () => Promise.resolve(),
      }),
    };
  }
};
// === PROTEÇÃO DO BANCO DE TESTES ===
// Garantia de segurança para testes - IMPEDE uso de nr-bps_db
if (process.env.NODE_ENV === 'test') {
  // Carregar .env.test se não estiver carregado
  require('dotenv').config({ path: '.env.test' });

  // ⚠️ CRÍTICO: Remover DATABASE_URL para evitar uso do banco de produção (Neon)
  // Durante testes, dotenv pode carregar .env.local que contém DATABASE_URL do Neon
  // Isso DEVE ser removido para forçar uso de TEST_DATABASE_URL
  if (
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.includes('neon.tech')
  ) {
    console.log(
      '🛡️ [jest.setup] Removendo DATABASE_URL de produção do ambiente de testes'
    );
    delete process.env.DATABASE_URL;
  }

  // Validar que TEST_DATABASE_URL está definido e aponta para banco de testes
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error(
      'TEST_DATABASE_URL não está definido. Defina TEST_DATABASE_URL para apontar para um banco de teste (ex: "postgres://postgres:123456@localhost:5432/nr-bps_db_test") antes de executar os testes para evitar alterações no banco de desenvolvimento (nr-bps_db).'
    );
  }

  // Validar que não estamos usando o banco de desenvolvimento
  const testDbUrl = process.env.TEST_DATABASE_URL;
  const parsed = new URL(testDbUrl);
  const dbName = parsed.pathname.replace(/^\//, '');

  if (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') {
    throw new Error(
      `🚨 ERRO CRÍTICO DE ISOLAMENTO: TEST_DATABASE_URL aponta para o banco de DESENVOLVIMENTO!\n` +
        `URL: ${testDbUrl}\n` +
        `Os testes DEVEM usar nr-bps_db_test, NÃO nr-bps_db.\n` +
        `Configure TEST_DATABASE_URL corretamente.`
    );
  }

  console.log(
    `🛡️ [jest.setup] Proteção do banco de testes ativada - usando: ${dbName}`
  );
}

// Hook global para validar antes de cada teste (apenas em ambiente Jest)
if (typeof beforeEach === 'function') {
  beforeEach(() => {
    // Validar que ainda estamos usando o banco de testes
    if (process.env.JEST_WORKER_ID) {
      const testDbUrl = process.env.TEST_DATABASE_URL;
      if (testDbUrl) {
        try {
          const parsed = new URL(testDbUrl);
          const dbName = parsed.pathname.replace(/^\//, '');
          if (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') {
            throw new Error(
              `🚨 BLOQUEADO: Teste tentando usar banco de desenvolvimento (nr-bps_db)!\n` +
                `Todos os testes DEVEM usar nr-bps_db_test.`
            );
          }
        } catch {
          // Se a URL for inválida, já vai falhar na conexão
        }
      }
    }
  });
}

// Semente mínima para RBAC necessária pelos testes
try {
  // Executar sincronamente para garantir que roles/perms existam antes dos testes
  const { execSync } = require('child_process');
  execSync('node ./scripts/seed-test-rbac.cjs', { stdio: 'inherit' });
} catch (err) {
  // Falha ao semear não deve bloquear os testes, mas será registrada
  console.warn(
    'Não foi possível aplicar semente RBAC para o banco de teste:',
    err.message || err
  );
}
// Mock Chart.js para testes
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// Mock window.location será feito por teste individual devido a limitações do jsdom

jest.mock('react-chartjs-2', () => ({
  Bar: jest.fn(() => <div data-testid="mock-chart">Mock Chart</div>),
}));

// Mock Next.js router com padrão aprovado
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
  // Suporte para redirect em Server Components nos testes
  redirect: jest.fn(),
}));

// Mock Next.js headers and cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextResponse: class MockNextResponse {
    constructor(body, options) {
      this._body = body;
      this.status = options?.status || 200;
      this.headers = new Map(Object.entries(options?.headers || {}));
    }
    static json(data, options) {
      return new MockNextResponse(JSON.stringify(data), options);
    }
    json() {
      return JSON.parse(this._body || '{}');
    }
    text() {
      return this._body || '';
    }
  },
  NextRequest: class MockNextRequest {
    constructor(url, options) {
      this.url = url;
      this.method = options?.method || 'GET';
      this.headers = new Map(Object.entries(options?.headers || {}));
      this._body = options?.body;
    }
    json() {
      return JSON.parse(this._body || '{}');
    }
  },
}));

// Mock global Request and Response for Node.js environment
global.Request = class MockRequest {
  constructor(url, options) {
    this.url = url;
    this.method = options?.method || 'GET';
    this.headers = new Map(Object.entries(options?.headers || {}));
    this._body = options?.body;
  }
  json() {
    return JSON.parse(this._body || '{}');
  }
};

global.Response = class MockResponse {
  constructor(body, options) {
    this._body = body;
    this.status = options?.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Map(Object.entries(options?.headers || {}));
  }
  json() {
    return JSON.parse(this._body || '{}');
  }
  text() {
    return this._body || '';
  }
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock EventSource para testes (SSE)
global.__EVENT_SOURCES__ = [];
function MockEventSource(url) {
  this.url = url;
  this.onopen = null;
  this.onmessage = null;
  this.onerror = null;
  global.__EVENT_SOURCES__ = global.__EVENT_SOURCES__ || [];
  global.__EVENT_SOURCES__.push(this);
  // Simular onopen assíncrono
  setTimeout(() => {
    if (this.onopen) this.onopen();
  }, 0);
}
MockEventSource.prototype.close = function () {
  global.__EVENT_SOURCES__ = (global.__EVENT_SOURCES__ || []).filter(
    (s) => s !== this
  );
};
global.EventSource = MockEventSource;

// Helper para emitir mensagem SSE nos mocks
global.emitSSEMessage = function (msg) {
  const list = global.__EVENT_SOURCES__ || [];
  for (const s of list) {
    if (s.onmessage) {
      s.onmessage({ data: JSON.stringify(msg) });
    }
  }
};

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

// Suppress console.error in tests to clean output
jest.spyOn(console, 'error').mockImplementation(() => {});

// Track and suppress console.warn in tests so we can assert on warnings when needed.
// Warnings are recorded in global.__WARN_CALLS__ as arrays of stringified args.
global.__WARN_CALLS__ = [];
jest.spyOn(console, 'warn').mockImplementation((...args) => {
  global.__WARN_CALLS__ = global.__WARN_CALLS__ || [];
  global.__WARN_CALLS__.push(
    args.map((arg) => {
      if (typeof arg === 'string') return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
  );
});

// Helper utilities for tests to inspect/suppress warnings
global.clearWarns = () => {
  global.__WARN_CALLS__ = [];
};
global.getWarns = () => global.__WARN_CALLS__ || [];
// Expect that at least one warn was emitted; if pattern is provided, assert a match
global.expectWarned = (pattern) => {
  if (pattern === undefined) {
    expect(global.__WARN_CALLS__.length).toBeGreaterThan(0);
    return;
  }
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
  const found = (global.__WARN_CALLS__ || []).some((args) =>
    args.join(' ').match(regex)
  );
  expect(found).toBeTruthy();
};

// === MOCKS GLOBAIS PADRONIZADOS (Política de Mocks) ===

// Mock para matchMedia (PWA, responsividade)
if (typeof window !== 'undefined') {
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
}

// Mock para ResizeObserver (componentes responsivos)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock para IntersectionObserver (lazy loading, infinite scroll)
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock para Notification API (PWA)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'Notification', {
    writable: true,
    value: {
      permission: 'granted',
      requestPermission: jest.fn().mockResolvedValue('granted'),
    },
  });
}

// Mock para localStorage e sessionStorage
const createMockStorage = () => {
  let storage = {};
  return {
    getItem: jest.fn((key) => storage[key] || null),
    setItem: jest.fn((key, value) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      storage = {};
    }),
    get length() {
      return Object.keys(storage).length;
    },
    key: jest.fn((index) => Object.keys(storage)[index] || null),
  };
};

// Mock para localStorage e sessionStorage
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: createMockStorage(),
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: createMockStorage(),
  });
}

// Helper para limpar storage entre testes
global.clearTestStorage = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
};

// Bootstrap de DB executado no beforeAll para garantir sincronização com Jest
if (typeof beforeAll === 'function') {
  beforeAll(async () => {
    try {
      if (process.env.NODE_ENV !== 'test') return;
      const dbUrl = process.env.TEST_DATABASE_URL;
      if (!dbUrl) {
        console.warn(
          'TEST_DATABASE_URL não definido - pulando bootstrap de DB para testes'
        );
        return;
      }

      const fs = require('fs');
      const path = require('path');
      const { Client } = require('pg');

      const client = new Client({ connectionString: dbUrl });
      await client.connect();

      // Executar fix que cria tomadors se ausente (arquivo idempotente)
      try {
        const sql = fs.readFileSync(
          path.join(
            __dirname,
            'database',
            'fixes',
            'create-tomadors-if-missing.sql'
          ),
          'utf-8'
        );
        await client.query(sql);
      } catch (err) {
        // Se falhar, tentar versão minimal sem ENUMs
        console.warn(
          'Falha ao aplicar create-tomadors-if-missing.sql (tentar fallback):',
          err.message || err
        );
        await client.query(`
          CREATE TABLE IF NOT EXISTS tomadors (
            id SERIAL PRIMARY KEY,
            tipo TEXT,
            nome VARCHAR(200),
            cnpj VARCHAR(18),
            telefone VARCHAR(20),
            endereco TEXT,
            cidade VARCHAR(100),
            estado VARCHAR(2),
            cep VARCHAR(10),
            email VARCHAR(100),
            responsavel_nome VARCHAR(100),
            responsavel_cpf VARCHAR(11),
            responsavel_cargo VARCHAR(100),
            responsavel_email VARCHAR(100),
            responsavel_celular VARCHAR(20),
            ativa BOOLEAN DEFAULT true
          );
        `);
      }

      // Garantir colunas e tabela auxiliar esperadas por testes
      try {
        const sql2 = fs.readFileSync(
          path.join(
            __dirname,
            'database',
            'fixes',
            'add-tomadors-columns-and-joins.sql'
          ),
          'utf-8'
        );
        await client.query(sql2);
      } catch (err) {
        console.warn(
          'Falha ao aplicar add-tomadors-columns-and-joins.sql:',
          err.message || err
        );
      }

      // Inserir tomadors faltantes referenciados por funcionarios ou lotes (garantia de integridade para testes)
      try {
        await client.query(`
          INSERT INTO tomadors (id, tipo, nome, cnpj, email, ativa)
          SELECT DISTINCT f.tomador_id, 'entidade', 'Auto Seed tomador ' || f.tomador_id, '00000000000000', 'auto-seed@tests.local', true
          FROM funcionarios f
          LEFT JOIN tomadors c ON f.tomador_id = c.id
          WHERE f.tomador_id IS NOT NULL AND c.id IS NULL
        `);

        await client.query(`
          INSERT INTO tomadors (id, tipo, nome, cnpj, email, ativa)
          SELECT DISTINCT l.tomador_id, 'entidade', 'Auto Seed tomador ' || l.tomador_id, '00000000000000', 'auto-seed@tests.local', true
          FROM lotes_avaliacao l
          LEFT JOIN tomadors c ON l.tomador_id = c.id
          WHERE l.tomador_id IS NOT NULL AND c.id IS NULL
        `);
      } catch (err) {
        console.warn(
          'Falha ao inserir tomadors faltantes (possível ausência de tabelas funcionarios/lotes):',
          err.message || err
        );
      }

      // Garantir que empresas_clientes referenciem clinicas existentes (inserir clinicas mínimas se necessário)
      try {
        await client.query(`
          INSERT INTO clinicas (id, nome, cnpj, email, ativa)
          SELECT DISTINCT e.clinica_id, 'Auto Seed Clinica ' || e.clinica_id, '00000000000000', 'auto-clinica@tests.local', true
          FROM empresas_clientes e
          LEFT JOIN clinicas c ON e.clinica_id = c.id
          WHERE e.clinica_id IS NOT NULL AND c.id IS NULL
        `);
      } catch (err) {
        console.warn(
          'Falha ao inserir clinicas faltantes (possível ausência de empresas_clientes):',
          err.message || err
        );
      }

      // Adicionar colunas que podem estar ausentes na tabela tomadors
      try {
        await client.query(`
          ALTER TABLE tomadors
            ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS endereco TEXT,
            ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
            ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
            ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
            ADD COLUMN IF NOT EXISTS responsavel_nome VARCHAR(100),
            ADD COLUMN IF NOT EXISTS responsavel_cpf VARCHAR(11),
            ADD COLUMN IF NOT EXISTS responsavel_cargo VARCHAR(100),
            ADD COLUMN IF NOT EXISTS responsavel_email VARCHAR(100),
            ADD COLUMN IF NOT EXISTS responsavel_celular VARCHAR(20),
            ADD COLUMN IF NOT EXISTS cartao_cnpj_path VARCHAR(500),
            ADD COLUMN IF NOT EXISTS contrato_social_path VARCHAR(500),
            ADD COLUMN IF NOT EXISTS doc_identificacao_path VARCHAR(500),
            ADD COLUMN IF NOT EXISTS status VARCHAR(50),
            ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT,
            ADD COLUMN IF NOT EXISTS observacoes_reanalise TEXT,
            ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMP,
            ADD COLUMN IF NOT EXISTS aprovado_por_cpf VARCHAR(11)
        `);

        await client.query(
          `CREATE INDEX IF NOT EXISTS idx_tomadors_tipo ON tomadors (tipo)`
        );
        await client.query(
          `CREATE INDEX IF NOT EXISTS idx_tomadors_status ON tomadors (status)`
        );
        await client.query(
          `CREATE INDEX IF NOT EXISTS idx_tomadors_cnpj ON tomadors (cnpj)`
        );
        await client.query(
          `CREATE INDEX IF NOT EXISTS idx_tomadors_ativa ON tomadors (ativa)`
        );
        await client.query(
          `CREATE INDEX IF NOT EXISTS idx_tomadors_tipo_ativa ON tomadors (tipo, ativa)`
        );
      } catch (err) {
        console.warn(
          'Falha ao adicionar colunas/indexes em tomadors:',
          err.message || err
        );
      }

      // Criar/Atualizar view gestores com nomes de colunas esperadas pelos testes
      try {
        await client.query(`
          DROP VIEW IF EXISTS gestores CASCADE;
          CREATE VIEW gestores AS
          SELECT
            id,
            cpf,
            nome,
            email,
            tipo_usuario AS usuario_tipo,
            CASE
              WHEN tipo_usuario = 'rh' THEN 'Gestor RH/Clínica'
              WHEN tipo_usuario = 'gestor' THEN 'Gestor Entidade'
              ELSE 'Outro'
            END as tipo_gestor_descricao,
            clinica_id,
            entidade_id,
            ativo,
            criado_em,
            atualizado_em
          FROM usuarios
          WHERE tipo_usuario IN ('rh', 'gestor')
        `);
      } catch (err) {
        console.warn(
          'Falha ao criar/atualizar view gestores:',
          err.message || err
        );
      }

      await client.end();
      console.log(
        '✅ Bootstrap de DB: tomadors e views assegurados para testes'
      );
    } catch (err) {
      console.warn(
        'Falha no bootstrap de DB para testes (beforeAll):',
        err.message || err
      );
    }
  }, 30000);
}
