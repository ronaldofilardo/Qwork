/**
 * @file __tests__/security/route-auth-guards.test.ts
 * Testes: Verificação estática de que rotas têm guards de autenticação
 *
 * Valida que rotas previamente desprotegidas agora possuem:
 * - test/db: guard de NODE_ENV
 * - storage: getSession()
 * - recibo/pdf: getSession()
 * - recibo/verificar: getSession()
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Guards de autenticação em rotas', () => {
  describe('GET /api/test/db', () => {
    const routePath = path.join(
      process.cwd(),
      'app',
      'api',
      'test',
      'db',
      'route.ts'
    );

    it('deve existir', () => {
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('deve verificar NODE_ENV e retornar 404 em produção', () => {
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toContain("process.env.NODE_ENV !== 'development'");
      expect(content).toContain("process.env.NODE_ENV !== 'test'");
      expect(content).toContain('status: 404');
    });
  });

  describe('GET /api/storage/[...path]', () => {
    const routePath = path.join(
      process.cwd(),
      'app',
      'api',
      'storage',
      '[...path]',
      'route.ts'
    );

    it('deve existir', () => {
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('deve importar getSession e verificar autenticação', () => {
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toContain("import { getSession } from '@/lib/session'");
      expect(content).toContain('const session = getSession()');
      expect(content).toContain('status: 401');
    });
  });

  describe('GET /api/recibo/[id]/pdf', () => {
    const routePath = path.join(
      process.cwd(),
      'app',
      'api',
      'recibo',
      '[id]',
      'pdf',
      'route.ts'
    );

    it('deve existir', () => {
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('deve importar getSession e verificar autenticação', () => {
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toContain("getSession");
      expect(content).toContain('const session = getSession()');
      expect(content).toContain('status: 401');
    });
  });

  describe('GET /api/recibo/[id]/verificar', () => {
    const routePath = path.join(
      process.cwd(),
      'app',
      'api',
      'recibo',
      '[id]',
      'verificar',
      'route.ts'
    );

    it('deve existir', () => {
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('deve importar getSession e verificar autenticação', () => {
      const content = fs.readFileSync(routePath, 'utf-8');
      expect(content).toContain("getSession");
      expect(content).toContain('const session = getSession()');
      expect(content).toContain('status: 401');
    });
  });
});

describe('Rotas RH usam requireRole em vez de inline checks', () => {
  const rhRoutes = [
    'app/api/rh/pagamentos-em-aberto/route.ts',
    'app/api/rh/pagamentos-em-aberto/count/route.ts',
    'app/api/rh/lotes/route.ts',
    'app/api/rh/liberar-lote/route.ts',
  ];

  it.each(rhRoutes)('%s deve usar requireRole em vez de requireAuth+inline', (routeRelPath) => {
    const routePath = path.join(process.cwd(), routeRelPath);
    if (!fs.existsSync(routePath)) return; // skip if route doesn't exist

    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('requireRole');
    // Não deve ter inline check de perfil após autenticação
    expect(content).not.toMatch(/requireAuth\(\)[\s\S]*?perfil\s*!==\s*['"]rh['"]/);
  });

  it('app/api/laudos/validar-lote/route.ts deve usar requireRole com emissor+rh', () => {
    const routePath = path.join(process.cwd(), 'app', 'api', 'laudos', 'validar-lote', 'route.ts');
    if (!fs.existsSync(routePath)) return;

    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('requireRole');
    expect(content).toContain('emissor');
    expect(content).toContain('rh');
  });
});

describe('Notificações usam getDestinatarioTipo helper', () => {
  const notifRoutes = [
    'app/api/notificacoes/route.ts',
    'app/api/notificacoes/contagem/route.ts',
    'app/api/notificacoes/marcar-todas-lidas/route.ts',
  ];

  it.each(notifRoutes)('%s deve importar getDestinatarioTipo', (routeRelPath) => {
    const routePath = path.join(process.cwd(), routeRelPath);
    if (!fs.existsSync(routePath)) return;

    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('getDestinatarioTipo');
    expect(content).toContain("from '@/lib/helpers/destinatario-tipo'");
  });
});

describe('lib/auth.ts requireRole está deprecated', () => {
  it('deve ter anotação @deprecated', () => {
    const authPath = path.join(process.cwd(), 'lib', 'auth.ts');
    const content = fs.readFileSync(authPath, 'utf-8');
    expect(content).toContain('@deprecated');
    expect(content).toContain("from `@/lib/session`");
  });
});
