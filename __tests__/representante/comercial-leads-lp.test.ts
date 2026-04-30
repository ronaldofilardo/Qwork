/**
 * comercial-leads-lp.test.ts
 *
 * Testes para a integração Landing Page → Comercial Leads (Migration 608 / Feature LP):
 *
 * 1. Migration 608 — estrutura SQL correta
 * 2. Rota pública /api/public/representantes/cadastro — inclui comercial_cpf no INSERT
 * 3. Rota GET /api/admin/representantes-leads — ownership filter para comercial
 * 4. Rotas /api/admin/representantes-leads/[id]/aprovar — ownership check comercial
 * 5. Rotas /api/admin/representantes-leads/[id]/rejeitar — ownership check comercial
 * 6. Rotas /api/admin/representantes-leads/[id]/converter — ownership check comercial
 * 7. Rotas /api/comercial/representantes-leads/* — existência, exports e segurança
 * 8. Componente CandidatosLPContent — estrutura e props
 * 9. page.tsx Comercial — integração da aba LP Candidates
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// 1. MIGRATION 608
// ---------------------------------------------------------------------------

describe('1. Migration 608 — comercial_cpf em representantes_cadastro_leads', () => {
  const sqlPath = path.join(
    ROOT,
    'database',
    'migrations',
    '608_representantes_cadastro_leads_comercial_cpf.sql'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(sqlPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(sqlPath)).toBe(true);
  });

  it('envolve a operação em transação (BEGIN/COMMIT)', () => {
    expect(src).toMatch(/^\s*BEGIN\s*;/im);
    expect(src).toMatch(/^\s*COMMIT\s*;/im);
  });

  it('adiciona coluna comercial_cpf CHAR(11) DEFAULT NULL com IF NOT EXISTS', () => {
    expect(src).toMatch(
      /ADD COLUMN IF NOT EXISTS\s+comercial_cpf\s+CHAR\(11\)/i
    );
    expect(src).toMatch(/DEFAULT NULL/i);
  });

  it('cria índice idx_cadastro_leads_comercial_status com IF NOT EXISTS', () => {
    expect(src).toMatch(
      /CREATE INDEX IF NOT EXISTS idx_cadastro_leads_comercial_status/i
    );
  });

  it('índice cobre colunas (comercial_cpf, status)', () => {
    expect(src).toMatch(/comercial_cpf.*status|status.*comercial_cpf/i);
  });

  it('script de aplicação multi-ambiente existe', () => {
    const scriptPath = path.join(
      ROOT,
      'database',
      'migrations',
      'scripts',
      'apply-608-all-envs.cjs'
    );
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('script multi-ambiente cobre dev, test, staging e prod', () => {
    const scriptPath = path.join(
      ROOT,
      'database',
      'migrations',
      'scripts',
      'apply-608-all-envs.cjs'
    );
    const scriptSrc = fs.readFileSync(scriptPath, 'utf-8');
    expect(scriptSrc).toMatch(/dev/i);
    expect(scriptSrc).toMatch(/test/i);
    expect(scriptSrc).toMatch(/staging/i);
    expect(scriptSrc).toMatch(/prod/i);
  });
});

// ---------------------------------------------------------------------------
// 2. Rota pública — inclui comercial_cpf no INSERT
// ---------------------------------------------------------------------------

describe('2. POST /api/public/representantes/cadastro — comercial_cpf no INSERT', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'public',
    'representantes',
    'cadastro',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo existe', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('define constante COMERCIAL_LP_CPF = "04256059903"', () => {
    expect(src).toMatch(/COMERCIAL_LP_CPF\s*=\s*'04256059903'/);
  });

  it('inclui comercial_cpf na lista de colunas do INSERT', () => {
    expect(src).toMatch(/comercial_cpf/);
  });

  it('passa COMERCIAL_LP_CPF como parâmetro do INSERT', () => {
    // A constante deve aparecer no array de parâmetros
    const insertMatch = src.match(
      /INSERT INTO representantes_cadastro_leads[\s\S]+?RETURNING/
    );
    expect(insertMatch).not.toBeNull();
    expect(insertMatch![0]).toContain('comercial_cpf');
  });

  it('exporta OPTIONS para CORS preflight', () => {
    expect(src).toMatch(/export function OPTIONS/);
  });

  it('tem rate limit de 5 cadastros/hora', () => {
    expect(src).toMatch(/RATE_LIMIT_MAX\s*=\s*5/);
    expect(src).toMatch(/RATE_LIMIT_WINDOW_MS/);
  });
});

// ---------------------------------------------------------------------------
// 3. Rota GET /api/admin/representantes-leads — ownership filter
// ---------------------------------------------------------------------------

describe('3. GET /api/admin/representantes-leads — ownership filter para comercial', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'representantes-leads',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo existe', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('aceita perfis comercial e suporte', () => {
    expect(src).toMatch(
      /requireRole\s*\(\s*\[.*comercial.*suporte|suporte.*comercial/i
    );
  });

  it('filtra por comercial_cpf quando perfil === "comercial"', () => {
    expect(src).toMatch(/session\.perfil\s*===\s*'comercial'/);
    expect(src).toMatch(/l\.comercial_cpf\s*=\s*\$/);
    expect(src).toMatch(/session\.cpf/);
  });

  it('retorna campo comercial_cpf no SELECT', () => {
    expect(src).toMatch(/l\.comercial_cpf/);
  });

  it('não usa session.tipo_usuario (campo inexistente no tipo Session)', () => {
    expect(src).not.toMatch(/session\.tipo_usuario/);
  });
});

// ---------------------------------------------------------------------------
// 4. Aprovar (admin route) — ownership check
// ---------------------------------------------------------------------------

describe('4. POST /api/admin/representantes-leads/[id]/aprovar — ownership check', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'representantes-leads',
    '[id]',
    'aprovar',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo existe', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('busca status e comercial_cpf do lead', () => {
    expect(src).toMatch(/SELECT.*status.*comercial_cpf|comercial_cpf.*status/i);
  });

  it('retorna 403 se comercial tenta aprovar lead de outro', () => {
    expect(src).toMatch(/403/);
    expect(src).toMatch(/Sem permiss/i);
  });

  it('não usa session.tipo_usuario', () => {
    expect(src).not.toMatch(/session\.tipo_usuario/);
  });

  it('usa session.perfil para checar role', () => {
    expect(src).toMatch(/session\.perfil/);
  });
});

// ---------------------------------------------------------------------------
// 5. Rejeitar (admin route) — ownership check
// ---------------------------------------------------------------------------

describe('5. POST /api/admin/representantes-leads/[id]/rejeitar — ownership check', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'representantes-leads',
    '[id]',
    'rejeitar',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo existe', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('busca comercial_cpf e status do lead antes de rejeitar', () => {
    expect(src).toMatch(/comercial_cpf/);
  });

  it('retorna 403 se comercial não é dono do lead', () => {
    expect(src).toMatch(/403/);
  });

  it('não usa session.tipo_usuario', () => {
    expect(src).not.toMatch(/session\.tipo_usuario/);
  });
});

// ---------------------------------------------------------------------------
// 6. Converter (admin route) — ownership check
// ---------------------------------------------------------------------------

describe('6. POST /api/admin/representantes-leads/[id]/converter — ownership check', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'representantes-leads',
    '[id]',
    'converter',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo existe', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('importa query de @/lib/db para ownership check', () => {
    expect(src).toMatch(/import.*query.*@\/lib\/db/);
  });

  it('aceita perfis comercial e suporte', () => {
    expect(src).toMatch(
      /requireRole\s*\(\s*\[.*comercial.*suporte|suporte.*comercial/i
    );
  });

  it('busca comercial_cpf antes de converter', () => {
    expect(src).toMatch(/comercial_cpf/);
  });

  it('retorna 403 se comercial_cpf !== session.cpf', () => {
    expect(src).toMatch(/403/);
  });

  it('não usa session.tipo_usuario', () => {
    expect(src).not.toMatch(/session\.tipo_usuario/);
  });
});

// ---------------------------------------------------------------------------
// 7. Novas rotas /api/comercial/representantes-leads/*
// ---------------------------------------------------------------------------

describe('7. /api/comercial/representantes-leads — novas rotas', () => {
  const baseDir = path.join(
    ROOT,
    'app',
    'api',
    'comercial',
    'representantes-leads'
  );

  describe('7a. GET /api/comercial/representantes-leads', () => {
    const routePath = path.join(baseDir, 'route.ts');
    let src: string;

    beforeAll(() => {
      src = fs.readFileSync(routePath, 'utf-8');
    });

    it('arquivo existe', () => {
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('exporta GET handler', () => {
      expect(src).toMatch(/export async function GET/);
    });

    it('usa requireRole("comercial")', () => {
      expect(src).toMatch(/requireRole\s*\(\s*'comercial'/);
    });

    it('sempre filtra por comercial_cpf = session.cpf (hardened security)', () => {
      // O WHERE deve conter comercial_cpf = $N e session.cpf deve ser passado
      expect(src).toMatch(/comercial_cpf\s*=\s*\$/);
      expect(src).toMatch(/session\.cpf/);
    });

    it('retorna campos: leads, total, pendentes, page', () => {
      expect(src).toMatch(/leads/);
      expect(src).toMatch(/total/);
      expect(src).toMatch(/pendentes/);
    });

    it('exporta dynamic = force-dynamic', () => {
      expect(src).toMatch(/export const dynamic\s*=\s*'force-dynamic'/);
    });
  });

  describe('7b. POST /api/comercial/representantes-leads/[id]/aprovar', () => {
    const routePath = path.join(baseDir, '[id]', 'aprovar', 'route.ts');
    let src: string;

    beforeAll(() => {
      src = fs.readFileSync(routePath, 'utf-8');
    });

    it('arquivo existe', () => {
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('exporta POST handler', () => {
      expect(src).toMatch(/export async function POST/);
    });

    it('usa requireRole("comercial")', () => {
      expect(src).toMatch(/requireRole\s*\(\s*'comercial'/);
    });

    it('verifica ownership (comercial_cpf === session.cpf)', () => {
      expect(src).toMatch(/comercial_cpf/);
      expect(src).toMatch(/403/);
    });

    it('transiciona status para "verificado"', () => {
      expect(src).toMatch(/verificado/);
    });
  });

  describe('7c. POST /api/comercial/representantes-leads/[id]/rejeitar', () => {
    const routePath = path.join(baseDir, '[id]', 'rejeitar', 'route.ts');
    let src: string;

    beforeAll(() => {
      src = fs.readFileSync(routePath, 'utf-8');
    });

    it('arquivo existe', () => {
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('exporta POST handler', () => {
      expect(src).toMatch(/export async function POST/);
    });

    it('exige motivo com mínimo de caracteres', () => {
      expect(src).toMatch(/motivo/i);
      // Mínimo de 5 chars
      expect(src).toMatch(/[<>]=?\s*5/);
    });

    it('verifica ownership', () => {
      expect(src).toMatch(/403/);
      expect(src).toMatch(/comercial_cpf/);
    });

    it('transiciona status para "rejeitado"', () => {
      expect(src).toMatch(/rejeitado/);
    });
  });

  describe('7d. POST /api/comercial/representantes-leads/[id]/converter', () => {
    const routePath = path.join(baseDir, '[id]', 'converter', 'route.ts');
    let src: string;

    beforeAll(() => {
      src = fs.readFileSync(routePath, 'utf-8');
    });

    it('arquivo existe', () => {
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('exporta POST handler', () => {
      expect(src).toMatch(/export async function POST/);
    });

    it('importa converterLeadEmRepresentante', () => {
      expect(src).toMatch(/converterLeadEmRepresentante/);
    });

    it('verifica ownership antes de converter', () => {
      expect(src).toMatch(/comercial_cpf/);
      expect(src).toMatch(/403/);
    });

    it('usa requireRole("comercial")', () => {
      expect(src).toMatch(/requireRole\s*\(\s*'comercial'/);
    });
  });
});

// ---------------------------------------------------------------------------
// 8. Componente CandidatosLPContent
// ---------------------------------------------------------------------------

describe('8. app/comercial/leads/CandidatosLPContent.tsx — componente', () => {
  const componentPath = path.join(
    ROOT,
    'app',
    'comercial',
    'leads',
    'CandidatosLPContent.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(componentPath, 'utf-8');
  });

  it('arquivo existe', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('é marcado com "use client"', () => {
    expect(src.trimStart()).toMatch(/^'use client'/);
  });

  it('exporta default function CandidatosLPContent', () => {
    expect(src).toMatch(/export default function CandidatosLPContent/);
  });

  it('busca dados de /api/comercial/representantes-leads', () => {
    expect(src).toMatch(/\/api\/comercial\/representantes-leads/);
  });

  it('usa abrirDoc com (leadId, docType) — não com (key, filename) legado', () => {
    // Nova assinatura: abrirDoc(c.id, 'cpf')
    expect(src).toMatch(/abrirDoc\s*\(\s*c\.id\s*,\s*'cpf'\s*\)/);
    expect(src).toMatch(/abrirDoc\s*\(\s*c\.id\s*,\s*'cnpj'\s*\)/);
    expect(src).toMatch(/abrirDoc\s*\(\s*c\.id\s*,\s*'cpf_resp'\s*\)/);
    // Não deve ter a assinatura legada
    expect(src).not.toMatch(/abrirDoc\s*\(\s*c\.doc_cpf_key/);
  });

  it('usa /api/admin/leads/[id]/documentos para obter presigned URLs', () => {
    expect(src).toMatch(/\/api\/admin\/leads\/\$\{leadId\}\/documentos/);
  });

  it('tem cache de URLs (docsCache)', () => {
    expect(src).toMatch(/docsCache/);
  });

  it('tem estado de loading para documentos (docsLoading)', () => {
    expect(src).toMatch(/docsLoading/);
  });

  it('renderiza badge StatusBadge', () => {
    expect(src).toMatch(/StatusBadge/);
  });

  it('tem ações de aprovar, rejeitar, converter', () => {
    expect(src).toMatch(/aprovar/i);
    expect(src).toMatch(/rejeitar/i);
    expect(src).toMatch(/converter/i);
  });

  it('não usa abrirDoc com doc_cpf_key diretamente (padrão legado removido)', () => {
    expect(src).not.toMatch(/abrirDoc\(c\.doc_cpf_key/);
    expect(src).not.toMatch(/abrirDoc\(c\.doc_cnpj_key/);
  });
});

// ---------------------------------------------------------------------------
// 9. app/comercial/page.tsx — integração da aba LP Candidates
// ---------------------------------------------------------------------------

describe('9. app/comercial/page.tsx — aba LP Candidates integrada', () => {
  const pagePath = path.join(ROOT, 'app', 'comercial', 'page.tsx');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(pagePath, 'utf-8');
  });

  it('arquivo existe', () => {
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it('importa CandidatosLPContent', () => {
    expect(src).toMatch(/import.*CandidatosLPContent/);
  });

  it('usa CandidatosLPContent na seção de leads', () => {
    expect(src).toMatch(/CandidatosLPContent/);
  });

  it('tem LeadsTabsWrapper para navegação entre tipos de leads', () => {
    expect(src).toMatch(/LeadsTabsWrapper/);
  });

  it('mostra aba "Candidatos da LP"', () => {
    expect(src).toMatch(/Candidatos da LP/i);
  });
});
