/**
 * Testes para as alterações da sessão 22/03/2026:
 * 1. contagem route — entidade_id (não contratante_id)
 * 2. AuditoriasContent — cache no-store + error state + lastUpdated + 4 novas abas
 * 3. types.ts — 4 novas interfaces + AuditoriaSubTab expandido
 * 4. AuditoriaSubNav — 4 novos tabs
 * 5. AuditoriaTables — 4 novos componentes de tabela
 * 6. acesso-gestor route — session_duration inline (sem coluna GENERATED)
 * 7. acessos-rh route — query direta (sem VIEW)
 * 8. Novas rotas: acesso-suporte, acesso-comercial, acesso-representante, acesso-vendedor
 * 9. login/route.ts — INSERT INTO session_logs após createSession
 * 10. login/helpers.ts — INSERT session_logs para representante
 * 11. logout/route.ts — UPDATE logout_timestamp + getSession
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// 1. GET /api/admin/contagem — usa entidade_id (não contratante_id)
// ---------------------------------------------------------------------------
describe('1. GET /api/admin/contagem — entidade_id em vez de contratante_id', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'contagem',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('não deve conter referência a contratante_id', () => {
    expect(src).not.toContain('contratante_id');
  });

  it('deve usar entidade_id IS NOT NULL para filtrar lotes de entidades', () => {
    expect(src).toContain('entidade_id IS NOT NULL');
  });

  it('deve usar clinica_id IS NOT NULL para filtrar lotes de clínicas', () => {
    expect(src).toContain('clinica_id IS NOT NULL');
  });
});

// ---------------------------------------------------------------------------
// 2. AuditoriasContent — cache no-store, error state, lastUpdated, novas abas
// ---------------------------------------------------------------------------
describe('2. AuditoriasContent — cache, error state, lastUpdated e novas abas', () => {
  const compPath = path.join(
    ROOT,
    'components',
    'admin',
    'AuditoriasContent.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(compPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(compPath)).toBe(true);
  });

  it("fetch deve usar cache: 'no-store'", () => {
    expect(src).toContain("cache: 'no-store'");
  });

  it('deve ter state para erro de aba (tabError)', () => {
    expect(src).toContain('tabError');
  });

  it('deve exibir banner de erro quando tabError estiver definido', () => {
    expect(src).toContain('Erro ao carregar dados');
  });

  it('deve ter state para timestamp de atualização (lastUpdated)', () => {
    expect(src).toContain('lastUpdated');
  });

  it('deve renderizar texto de atualização com horário', () => {
    expect(src).toContain('Atualizado às');
  });

  it('deve ter endpoint e case para acesso-comercial', () => {
    expect(src).toContain("'acesso-comercial'");
    expect(src).toContain('/api/admin/auditorias/acesso-comercial');
  });

  it('deve ter endpoint e case para acesso-representante', () => {
    expect(src).toContain("'acesso-representante'");
    expect(src).toContain('/api/admin/auditorias/acesso-representante');
  });

  it('deve ter endpoint e case para acesso-vendedor', () => {
    expect(src).toContain("'acesso-vendedor'");
    expect(src).toContain('/api/admin/auditorias/acesso-vendedor');
  });
});

// ---------------------------------------------------------------------------
// 3. auditorias/types.ts — 4 novas interfaces e AuditoriaSubTab expandido
// ---------------------------------------------------------------------------
describe('3. auditorias/types.ts — novas interfaces e tipos', () => {
  const typesPath = path.join(
    ROOT,
    'components',
    'admin',
    'auditorias',
    'types.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(typesPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(typesPath)).toBe(true);
  });

  it('deve exportar interface AcessoSuporte', () => {
    expect(src).toContain('AcessoSuporte');
  });

  it('deve exportar interface AcessoComercial', () => {
    expect(src).toContain('AcessoComercial');
  });

  it('deve exportar interface AcessoRepresentante', () => {
    expect(src).toContain('AcessoRepresentante');
  });

  it('deve exportar interface AcessoVendedor', () => {
    expect(src).toContain('AcessoVendedor');
  });

  it('AuditoriaSubTab deve incluir acesso-comercial', () => {
    expect(src).toContain("'acesso-comercial'");
  });

  it('AuditoriaSubTab deve incluir acesso-representante', () => {
    expect(src).toContain("'acesso-representante'");
  });

  it('AuditoriaSubTab deve incluir acesso-vendedor', () => {
    expect(src).toContain("'acesso-vendedor'");
  });

  it('AcessoRepresentante deve ter campo representante_nome', () => {
    expect(src).toContain('representante_nome');
  });
});

// ---------------------------------------------------------------------------
// 4. AuditoriaSubNav — 4 novas entradas de tab
// ---------------------------------------------------------------------------
describe('4. AuditoriaSubNav — tabs Suporte, Comercial, Representantes, Vendedores', () => {
  const navPath = path.join(
    ROOT,
    'components',
    'admin',
    'auditorias',
    'AuditoriaSubNav.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(navPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(navPath)).toBe(true);
  });

  it("deve ter tab com key 'acesso-comercial'", () => {
    expect(src).toContain("'acesso-comercial'");
  });

  it("deve ter tab com key 'acesso-representante'", () => {
    expect(src).toContain("'acesso-representante'");
  });

  it("deve ter tab com key 'acesso-vendedor'", () => {
    expect(src).toContain("'acesso-vendedor'");
  });

  it("deve ter label 'Comercial'", () => {
    expect(src).toContain('Comercial');
  });

  it("deve ter label 'Representantes'", () => {
    expect(src).toContain('Representantes');
  });

  it("deve ter label 'Vendedores'", () => {
    expect(src).toContain('Vendedores');
  });
});

// ---------------------------------------------------------------------------
// 5. AuditoriaTables — 4 novos componentes de tabela
// ---------------------------------------------------------------------------
describe('5. AuditoriaTables — novos componentes de tabela', () => {
  const tablesPath = path.join(
    ROOT,
    'components',
    'admin',
    'auditorias',
    'AuditoriaTables.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(tablesPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(tablesPath)).toBe(true);
  });

  it('deve exportar TabelaAcessosSuporte', () => {
    expect(src).toContain('TabelaAcessosSuporte');
  });

  it('deve exportar TabelaAcessosComercial', () => {
    expect(src).toContain('TabelaAcessosComercial');
  });

  it('deve exportar TabelaAcessosRepresentante', () => {
    expect(src).toContain('TabelaAcessosRepresentante');
  });

  it('deve exportar TabelaAcessosVendedor', () => {
    expect(src).toContain('TabelaAcessosVendedor');
  });

  it('deve importar os tipos AcessoSuporte, AcessoComercial, AcessoRepresentante, AcessoVendedor', () => {
    expect(src).toContain('AcessoSuporte');
    expect(src).toContain('AcessoComercial');
    expect(src).toContain('AcessoRepresentante');
    expect(src).toContain('AcessoVendedor');
  });

  it('coluna Representante deve aparecer na tabela de representantes', () => {
    expect(src).toContain('representante_nome');
  });
});

// ---------------------------------------------------------------------------
// 6. GET /api/admin/auditorias/acesso-gestor — session_duration inline
// ---------------------------------------------------------------------------
describe('6. GET /api/admin/auditorias/acesso-gestor — session_duration inline', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'auditorias',
    'acesso-gestor',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("deve filtrar por perfil = 'gestor'", () => {
    expect(src).toContain("perfil = 'gestor'");
  });

  it('deve fazer JOIN com entidades', () => {
    expect(src).toContain('JOIN entidades');
  });

  it('deve calcular session_duration inline como subtração de timestamps', () => {
    expect(src).toContain('logout_timestamp - sl.login_timestamp');
  });

  it('deve proteger com requireRole admin', () => {
    expect(src).toContain("requireRole('admin'");
  });

  it('deve retornar acessos no JSON', () => {
    expect(src).toContain('acessos: result.rows');
  });
});

// ---------------------------------------------------------------------------
// 7. GET /api/admin/auditorias/acessos-rh — query direta sem VIEW
// ---------------------------------------------------------------------------
describe('7. GET /api/admin/auditorias/acessos-rh — query direta sem VIEW', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'auditorias',
    'acessos-rh',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('não deve usar VIEW vw_auditoria_acessos_rh', () => {
    expect(src).not.toContain('vw_auditoria_acessos_rh');
  });

  it("deve filtrar por perfil = 'rh'", () => {
    expect(src).toContain("perfil = 'rh'");
  });

  it('deve fazer JOIN com funcionarios', () => {
    expect(src).toContain('JOIN funcionarios');
  });

  it('deve fazer JOIN com clinicas', () => {
    expect(src).toContain('JOIN clinicas');
  });

  it('deve proteger com requireRole admin', () => {
    expect(src).toContain("requireRole('admin'");
  });
});

// ---------------------------------------------------------------------------
// 8b. GET /api/admin/auditorias/acesso-comercial — nova rota
// ---------------------------------------------------------------------------
describe('8b. GET /api/admin/auditorias/acesso-comercial — nova rota', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'auditorias',
    'acesso-comercial',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("deve filtrar por perfil = 'comercial'", () => {
    expect(src).toContain("perfil = 'comercial'");
  });

  it('deve fazer JOIN com funcionarios', () => {
    expect(src).toContain('JOIN funcionarios');
  });

  it('deve proteger com requireRole admin', () => {
    expect(src).toContain("requireRole('admin'");
  });
});

// ---------------------------------------------------------------------------
// 8c. GET /api/admin/auditorias/acesso-representante — nova rota
// ---------------------------------------------------------------------------
describe('8c. GET /api/admin/auditorias/acesso-representante — nova rota', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'auditorias',
    'acesso-representante',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("deve filtrar por perfil = 'representante'", () => {
    expect(src).toContain("perfil = 'representante'");
  });

  it('deve fazer JOIN com representantes por cpf ou cpf_responsavel_pj', () => {
    expect(src).toContain('representantes r');
    expect(src).toContain('cpf_responsavel_pj');
  });

  it('deve retornar representante_nome via COALESCE', () => {
    expect(src).toContain('COALESCE');
    expect(src).toContain('representante_nome');
  });

  it('deve proteger com requireRole admin', () => {
    expect(src).toContain("requireRole('admin'");
  });
});

// ---------------------------------------------------------------------------
// 8d. GET /api/admin/auditorias/acesso-vendedor — nova rota
// ---------------------------------------------------------------------------
describe('8d. GET /api/admin/auditorias/acesso-vendedor — nova rota', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'auditorias',
    'acesso-vendedor',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("deve filtrar por perfil = 'vendedor'", () => {
    expect(src).toContain("perfil = 'vendedor'");
  });

  it('deve fazer JOIN com funcionarios', () => {
    expect(src).toContain('JOIN funcionarios');
  });

  it('deve proteger com requireRole admin', () => {
    expect(src).toContain("requireRole('admin'");
  });
});

// ---------------------------------------------------------------------------
// 9. login/route.ts — INSERT INTO session_logs após createSession
// ---------------------------------------------------------------------------
describe('9. POST /api/auth/login — registra acesso em session_logs', () => {
  const routePath = path.join(ROOT, 'app', 'api', 'auth', 'login', 'route.ts');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve fazer INSERT INTO session_logs', () => {
    expect(src).toContain('INSERT INTO session_logs');
  });

  it('deve incluir cpf, perfil, clinica_id, empresa_id, ip_address, user_agent no INSERT', () => {
    expect(src).toContain(
      'cpf, perfil, clinica_id, empresa_id, ip_address, user_agent'
    );
  });

  it('deve fazer RETURNING id para obter o sessionLogId', () => {
    expect(src).toContain('RETURNING id');
  });

  it('deve chamar createSession com sessionLogId', () => {
    expect(src).toContain('sessionLogId');
  });

  it('deve ter try/catch para fail-safe (não bloquear login se insert falhar)', () => {
    expect(src).toContain('[LOGIN] Falha ao registrar session_log');
  });
});

// ---------------------------------------------------------------------------
// 10. login/helpers.ts — INSERT session_logs para representante
// ---------------------------------------------------------------------------
describe('10. login/helpers.ts — registra acesso de representante em session_logs', () => {
  const helpersPath = path.join(
    ROOT,
    'app',
    'api',
    'auth',
    'login',
    'helpers.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(helpersPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(helpersPath)).toBe(true);
  });

  it('deve fazer INSERT INTO session_logs para representante', () => {
    expect(src).toContain('INSERT INTO session_logs');
  });

  it('deve registrar perfil representante explicitamente', () => {
    expect(src).toContain("'representante'");
  });

  it('deve fazer RETURNING id', () => {
    expect(src).toContain('RETURNING id');
  });

  it('deve criar sessão com sessionLogId', () => {
    expect(src).toContain('sessionLogId');
  });

  it('deve ter try/catch fail-safe para não bloquear o login', () => {
    expect(src).toContain(
      '[LOGIN] Falha ao registrar session_log para representante'
    );
  });
});

// ---------------------------------------------------------------------------
// 11. logout/route.ts — UPDATE logout_timestamp + getSession
// ---------------------------------------------------------------------------
describe('11. POST /api/auth/logout — registra logout_timestamp em session_logs', () => {
  const routePath = path.join(ROOT, 'app', 'api', 'auth', 'logout', 'route.ts');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve importar getSession', () => {
    expect(src).toContain('getSession');
  });

  it('deve importar query de @/lib/db', () => {
    expect(src).toContain("from '@/lib/db'");
  });

  it('deve fazer UPDATE session_logs SET logout_timestamp = NOW()', () => {
    expect(src).toContain('UPDATE session_logs');
    expect(src).toContain('logout_timestamp = NOW()');
  });

  it('deve usar sessionLogId para UPDATE exato quando disponível', () => {
    expect(src).toContain('sessionLogId');
    expect(src).toContain('WHERE id = $1');
  });

  it('deve ter fallback por cpf+perfil quando sessionLogId não estiver disponível', () => {
    expect(src).toContain('logout_timestamp IS NULL');
    expect(src).toContain('ORDER BY login_timestamp DESC');
  });

  it('deve ter try/catch fail-safe para não bloquear o logout', () => {
    expect(src).toContain('[LOGOUT] Falha ao registrar logout em session_logs');
  });

  it('deve chamar destroySession após registrar logout', () => {
    expect(src).toContain('destroySession');
  });
});
