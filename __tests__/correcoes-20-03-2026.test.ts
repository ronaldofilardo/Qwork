/**
 * Testes para as alterações da sessão 20/03/2026:
 * 1. CNPJ na listagem de leads do vendedor (API + UI)
 * 2. Dados bancários do vendedor — GET /api/vendedor/dados/bancarios
 * 3. Fixes de colunas: tipo_usuario (antes "perfil"), observacoes em leads_representante
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// 1. CNPJ na API GET /api/vendedor/leads
// ---------------------------------------------------------------------------
describe('1. GET /api/vendedor/leads — cnpj incluído no SELECT', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'vendedor',
    'leads',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('SELECT deve incluir lr.cnpj', () => {
    expect(src).toContain('lr.cnpj');
  });

  it('SELECT não deve ter lr.cnpj ausente antes do valor_negociado', () => {
    // Confirma que cnpj vem antes de valor_negociado na query
    const cnpjIdx = src.indexOf('lr.cnpj');
    const valorIdx = src.indexOf('lr.valor_negociado');
    expect(cnpjIdx).toBeGreaterThan(-1);
    expect(cnpjIdx).toBeLessThan(valorIdx);
  });
});

// ---------------------------------------------------------------------------
// 2. CNPJ na UI de leads
// ---------------------------------------------------------------------------
describe('2. UI /vendedor/leads — coluna CNPJ na tabela', () => {
  const pagePath = path.join(
    ROOT,
    'app',
    'vendedor',
    '(portal)',
    'leads',
    'page.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(pagePath, 'utf-8');
  });

  it('interface Lead deve ter campo cnpj', () => {
    expect(src).toMatch(/cnpj\s*:\s*string\s*\|\s*null/);
  });

  it('thead deve ter coluna CNPJ', () => {
    expect(src).toContain('CNPJ');
  });

  it('linha da tabela deve renderizar lead.cnpj', () => {
    expect(src).toContain('lead.cnpj');
  });

  it('deve fazer máscara de CNPJ (formatação XX.XXX.XXX/XXXX-XX)', () => {
    expect(src).toContain('replace(');
    expect(src).toMatch(/\$1\.\$2\.\$3\/\$4-\$5/);
  });
});

// ---------------------------------------------------------------------------
// 3. API /api/vendedor/dados/bancarios — nova rota
// ---------------------------------------------------------------------------
describe('3. GET /api/vendedor/dados/bancarios — rota criada', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'vendedor',
    'dados',
    'bancarios',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve exigir perfil vendedor', () => {
    expect(src).toContain("requireRole('vendedor'");
  });

  it('deve consultar tabela vendedores_dados_bancarios', () => {
    expect(src).toContain('vendedores_dados_bancarios');
  });

  it('deve retornar dados_bancarios no JSON', () => {
    expect(src).toContain('dados_bancarios');
  });

  it('deve exportar somente GET (sem PATCH — edição é exclusiva do suporte)', () => {
    expect(src).toContain('export async function GET');
    expect(src).not.toContain('export async function PATCH');
    expect(src).not.toContain('export async function POST');
  });

  it('deve ter force-dynamic', () => {
    expect(src).toContain('force-dynamic');
  });
});

// ---------------------------------------------------------------------------
// 4. UI /vendedor/dados — seção de dados bancários read-only
// ---------------------------------------------------------------------------
describe('4. UI /vendedor/dados — seção dados bancários', () => {
  const pagePath = path.join(
    ROOT,
    'app',
    'vendedor',
    '(portal)',
    'dados',
    'page.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(pagePath, 'utf-8');
  });

  it('interface DadosBancarios deve existir', () => {
    expect(src).toContain('interface DadosBancarios');
  });

  it('deve buscar /api/vendedor/dados/bancarios', () => {
    expect(src).toContain('/api/vendedor/dados/bancarios');
  });

  it('deve exibir seção "Dados Bancários"', () => {
    expect(src).toContain('Dados Bancários');
  });

  it('deve exibir mensagem quando sem dados bancários', () => {
    expect(src).toContain('Nenhum dado bancário cadastrado');
  });

  it('deve mostrar campo banco_codigo', () => {
    expect(src).toContain('banco_codigo');
  });

  it('deve mostrar campo pix_chave', () => {
    expect(src).toContain('pix_chave');
  });

  it('estado dadosBancarios deve ser inicializado como null', () => {
    expect(src).toMatch(/dadosBancarios.*null/);
  });
});

// ---------------------------------------------------------------------------
// 5. Fix: tipo_usuario em vez de perfil no GET /api/vendedor/dados
// ---------------------------------------------------------------------------
describe('5. GET /api/vendedor/dados — tipo_usuario corrigido', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'vendedor',
    'dados',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('GET não deve usar perfil = vendedor (coluna não existe)', () => {
    expect(src).not.toContain("perfil = 'vendedor'");
  });

  it('GET deve usar tipo_usuario = vendedor', () => {
    expect(src).toContain("tipo_usuario = 'vendedor'");
  });

  it('PATCH não deve usar perfil = vendedor', () => {
    const patchSection = src.slice(src.indexOf('async function PATCH'));
    expect(patchSection).not.toContain("perfil = 'vendedor'");
  });

  it('PATCH deve usar tipo_usuario = vendedor', () => {
    const patchSection = src.slice(src.indexOf('async function PATCH'));
    expect(patchSection).toContain("tipo_usuario = 'vendedor'");
  });
});

// ---------------------------------------------------------------------------
// 6. Fix: observacoes em POST /api/vendedor/leads
// ---------------------------------------------------------------------------
describe('6. POST /api/vendedor/leads — observacoes no INSERT', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'vendedor',
    'leads',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('INSERT deve incluir coluna observacoes', () => {
    expect(src).toContain('observacoes');
  });

  it('schema de validação deve aceitar campo observacoes', () => {
    expect(src).toMatch(/observacoes\s*:\s*z\.string/);
  });
});

// ---------------------------------------------------------------------------
// 7. Migration 1027: coluna observacoes em leads_representante
// ---------------------------------------------------------------------------
describe('7. Migration 1027 — ADD COLUMN observacoes', () => {
  const migPath = path.join(
    ROOT,
    'database',
    'migrations',
    '1027_add_observacoes_to_leads_representante.sql'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(migPath, 'utf-8');
  });

  it('arquivo de migration deve existir', () => {
    expect(fs.existsSync(migPath)).toBe(true);
  });

  it('deve conter ADD COLUMN observacoes', () => {
    expect(src).toContain('ADD COLUMN');
    expect(src).toContain('observacoes');
  });

  it('deve usar IF NOT EXISTS para segurança', () => {
    expect(src).toContain('IF NOT EXISTS');
  });
});

// ---------------------------------------------------------------------------
// 8. Suporte API dados bancários vendedor — rota existente
// ---------------------------------------------------------------------------
describe('8. PATCH /api/suporte/vendedores/[id]/dados-bancarios — requer suporte', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'suporte',
    'vendedores',
    '[id]',
    'dados-bancarios',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve exigir perfil suporte', () => {
    expect(src).toContain("'suporte'");
  });

  it('deve ter GET e PATCH', () => {
    expect(src).toContain('export async function GET');
    expect(src).toContain('export async function PATCH');
  });

  it('PATCH deve fazer UPSERT em vendedores_dados_bancarios', () => {
    const patchSection = src.slice(src.indexOf('async function PATCH'));
    expect(patchSection).toContain('vendedores_dados_bancarios');
    expect(patchSection).toContain('ON CONFLICT');
  });
});
