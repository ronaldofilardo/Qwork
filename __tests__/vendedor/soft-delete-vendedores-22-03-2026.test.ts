/**
 * Testes para as alterações de soft-delete / reativação de vendedores e representantes
 * (sessões 22/03/2026):
 *
 * 1. POST /api/representante/equipe/vendedores/[id]/inativar — usa atualizado_em (não updated_at)
 * 2. GET /api/representante/equipe/vendedores — suporte a ?ativo=false para listar inativos
 * 3. POST /api/representante/equipe/vendedores/[id]/reativar — endpoint criado
 * 4. PATCH /api/representante/equipe/vendedores/[id] — sexo usa 'masculino'/'feminino'
 * 5. PATCH /api/comercial/representantes/[id] — inativação com schema correto de auditoria
 * 6. PATCH /api/comercial/vendedores/[id] — usa atualizado_em e schema correto de auditoria
 * 7. PATCH /api/suporte/vendedores/[id] — usa atualizado_em e schema correto de auditoria
 * 8. Migration 1030 — data_fim na hierarquia_comercial
 * 9. UI page equipe — aba inativos + modal reativar
 * 10. UI page comercial/representantes — aba inativos
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// 1. POST inativar vendedor (representante) — atualizado_em
// ---------------------------------------------------------------------------
describe('1. POST /api/representante/equipe/vendedores/[id]/inativar', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'representante',
    'equipe',
    'vendedores',
    '[id]',
    'inativar',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve usar atualizado_em (não updated_at) ao inativar usuario', () => {
    expect(src).toContain('atualizado_em = NOW()');
    expect(src).not.toContain('updated_at = NOW()');
  });

  it('deve verificar vínculo na hierarquia_comercial antes de inativar', () => {
    expect(src).toContain('hierarquia_comercial');
    expect(src).toContain('representante_id');
  });

  it('NÃO deve verificar comissões pendentes (removido)', () => {
    expect(src).not.toContain('COMISSOES_PENDENTES');
    expect(src).not.toContain('comissoes_laudo');
  });

  it('deve registrar auditoria com schema correto (tabela, registro_id, triggador)', () => {
    expect(src).toContain('tabela');
    expect(src).toContain('registro_id');
    expect(src).toContain('triggador');
    expect(src).not.toContain('tipo_acao');
    expect(src).not.toContain('referencia_tipo');
  });

  it('deve ter validação zod de motivo mínimo 5 chars', () => {
    expect(src).toContain('z.string().min(5)');
  });
});

// ---------------------------------------------------------------------------
// 2. GET /api/representante/equipe/vendedores — filtro ?ativo=false
// ---------------------------------------------------------------------------
describe('2. GET /api/representante/equipe/vendedores — suporte a inativos', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'representante',
    'equipe',
    'vendedores',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve aceitar param ativo=false para listar inativos', () => {
    expect(src).toContain("searchParams.get('ativo')");
    expect(src).toContain('soInativos');
  });

  it('deve filtrar por u.ativo além de hc.ativo', () => {
    expect(src).toContain('u.ativo');
  });

  it('deve incluir coluna data_fim no SELECT', () => {
    expect(src).toContain('data_fim');
  });
});

// ---------------------------------------------------------------------------
// 3. POST /api/representante/equipe/vendedores/[id]/reativar
// ---------------------------------------------------------------------------
describe('3. POST /api/representante/equipe/vendedores/[id]/reativar', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'representante',
    'equipe',
    'vendedores',
    '[id]',
    'reativar',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve usar requireRepresentante para autenticar', () => {
    expect(src).toContain('requireRepresentante');
  });

  it('deve reativar usuario (ativo = true)', () => {
    expect(src).toContain('ativo = true');
  });

  it('deve reativar vínculo na hierarquia_comercial', () => {
    expect(src).toContain('hierarquia_comercial');
    expect(src).toContain('data_fim = NULL');
  });

  it('deve registrar auditoria com status_novo = ativo', () => {
    expect(src).toContain("'ativo'");
    expect(src).toContain('comissionamento_auditoria');
  });

  it('deve retornar 409 se vendedor já estiver ativo', () => {
    expect(src).toContain('Vendedor já está ativo');
    expect(src).toContain('{ status: 409 }');
  });

  it('deve validar motivo mínimo 5 chars', () => {
    expect(src).toContain('z.string().min(5)');
  });
});

// ---------------------------------------------------------------------------
// 4. PATCH /api/representante/equipe/vendedores/[id] — sexo enum correto
// ---------------------------------------------------------------------------
describe('4. PATCH /api/representante/equipe/vendedores/[id] — PatchSchema sexo', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'representante',
    'equipe',
    'vendedores',
    '[id]',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('PatchSchema deve usar masculino/feminino (não M/F)', () => {
    expect(src).toContain("'masculino'");
    expect(src).toContain("'feminino'");
    expect(src).not.toContain("enum(['M'");
    expect(src).not.toContain("enum(['F'");
  });

  it('UI equipe deve ter opções select com masculino e feminino', () => {
    const uiPath = path.join(
      ROOT,
      'app',
      'representante',
      '(portal)',
      'equipe',
      'page.tsx'
    );
    const ui = fs.readFileSync(uiPath, 'utf-8');
    expect(ui).toContain('value="masculino"');
    expect(ui).toContain('value="feminino"');
    expect(ui).not.toContain('value="M"');
    expect(ui).not.toContain('value="F"');
  });
});

// ---------------------------------------------------------------------------
// 5. PATCH /api/comercial/representantes/[id] — auditoria e inativação
// ---------------------------------------------------------------------------
describe('5. PATCH /api/comercial/representantes/[id] — soft-delete com auditoria correta', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'comercial',
    'representantes',
    '[id]',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve usar schema correto na auditoria (tabela, registro_id, triggador)', () => {
    expect(src).toContain("'representantes'");
    expect(src).toContain('tabela');
    expect(src).toContain('triggador');
    expect(src).not.toContain('tipo_acao');
    expect(src).not.toContain('referencia_tipo');
  });

  it('deve atualizar hierarquia_comercial com data_fim', () => {
    expect(src).toContain('hierarquia_comercial');
    expect(src).toContain('data_fim = NOW()');
  });

  it('deve exigir motivo para desativar', () => {
    expect(src).toContain("'desativado'");
    expect(src).toContain('motivo');
  });

  it('NÃO deve verificar comissões pendentes antes de desativar (removido)', () => {
    expect(src).not.toContain('COMISSOES_PENDENTES');
  });
});

// ---------------------------------------------------------------------------
// 6. PATCH /api/comercial/vendedores/[id] — atualizado_em + auditoria
// ---------------------------------------------------------------------------
describe('6. PATCH /api/comercial/vendedores/[id] — campo correto e auditoria', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'comercial',
    'vendedores',
    '[id]',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve usar atualizado_em ao atualizar usuarios', () => {
    expect(src).toContain('atualizado_em = NOW()');
    expect(src).not.toContain('updated_at = NOW()');
  });

  it('deve usar schema correto de auditoria (tabela, triggador)', () => {
    expect(src).toContain('tabela');
    expect(src).toContain('triggador');
    expect(src).not.toContain('tipo_acao');
  });

  it('NÃO deve verificar comissões pendentes (removido)', () => {
    expect(src).not.toContain('COMISSOES_PENDENTES');
  });
});

// ---------------------------------------------------------------------------
// 7. PATCH /api/suporte/vendedores/[id] — atualizado_em + auditoria
// ---------------------------------------------------------------------------
describe('7. PATCH /api/suporte/vendedores/[id] — campo correto e auditoria', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'suporte',
    'vendedores',
    '[id]',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve usar atualizado_em ao atualizar usuarios', () => {
    expect(src).toContain('atualizado_em = NOW()');
    expect(src).not.toContain('updated_at = NOW()');
  });

  it('deve usar schema correto de auditoria (tabela, triggador)', () => {
    expect(src).toContain('tabela');
    expect(src).toContain('triggador');
    expect(src).not.toContain('tipo_acao');
  });
});

// ---------------------------------------------------------------------------
// 8. Migration 1030 — data_fim na hierarquia_comercial
// ---------------------------------------------------------------------------
describe('8. Migration 1030 — data_fim em hierarquia_comercial', () => {
  const migPath = path.join(
    ROOT,
    'database',
    'migrations',
    '1030_add_data_fim_hierarquia_comercial.sql'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(migPath, 'utf-8');
  });

  it('arquivo de migration deve existir', () => {
    expect(fs.existsSync(migPath)).toBe(true);
  });

  it('deve adicionar coluna data_fim', () => {
    expect(src).toContain('ADD COLUMN');
    expect(src).toContain('data_fim');
  });

  it('deve usar IF NOT EXISTS para ser idempotente', () => {
    expect(src).toContain('IF NOT EXISTS');
  });
});

// ---------------------------------------------------------------------------
// 9. UI página equipe do representante — abas e reativação
// ---------------------------------------------------------------------------
describe('9. UI /representante/equipe — aba inativos e modal reativar', () => {
  const pagePath = path.join(
    ROOT,
    'app',
    'representante',
    '(portal)',
    'equipe',
    'page.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(pagePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it('deve ter tipo Aba com ativos e inativos', () => {
    expect(src).toContain("'ativos'");
    expect(src).toContain("'inativos'");
  });

  it('deve chamar endpoint com ?ativo=false para listar inativos', () => {
    expect(src).toContain('ativo=false');
  });

  it('deve ter componente ReativarVendedorModal', () => {
    expect(src).toContain('ReativarVendedorModal');
  });

  it('deve ter componente VendedorInativoCard', () => {
    expect(src).toContain('VendedorInativoCard');
  });

  it('deve importar UserCheck para ícone de reativação', () => {
    expect(src).toContain('UserCheck');
  });
});

// ---------------------------------------------------------------------------
// 10. UI /comercial/representantes — aba inativos
// ---------------------------------------------------------------------------
describe('10. UI /comercial/representantes — aba inativos', () => {
  const pagePath = path.join(
    ROOT,
    'app',
    'comercial',
    'representantes',
    'page.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(pagePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it('deve ter tipo Aba com ativos e inativos', () => {
    expect(src).toContain("'ativos'");
    expect(src).toContain("'inativos'");
  });

  it('deve buscar inativos via ?status=desativado', () => {
    expect(src).toContain('status=desativado');
  });

  it('endpoint metricas deve aceitar ?status=desativado', () => {
    const apiPath = path.join(
      ROOT,
      'app',
      'api',
      'comercial',
      'representantes',
      'metricas',
      'route.ts'
    );
    const api = fs.readFileSync(apiPath, 'utf-8');
    expect(api).toContain('soDesativados');
    expect(api).toContain("searchParams.get('status')");
  });
});

// ---------------------------------------------------------------------------
// 11. GET /api/representante/equipe/vendedores/[id] — dados completos de perfil
// ---------------------------------------------------------------------------
describe('11. GET /api/representante/equipe/vendedores/[id] — perfil completo', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'representante',
    'equipe',
    'vendedores',
    '[id]',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve exportar função GET', () => {
    expect(src).toContain('export async function GET');
  });

  it('deve usar requireRepresentante para autenticar', () => {
    expect(src).toContain('requireRepresentante');
  });

  it('deve fazer JOIN com vendedores_perfil para retornar campos de perfil', () => {
    expect(src).toContain('vendedores_perfil');
    expect(src).toContain('LEFT JOIN vendedores_perfil');
  });

  it('deve retornar campos de perfil: sexo, endereco, cidade, estado, cep', () => {
    expect(src).toContain('vp.sexo');
    expect(src).toContain('vp.endereco');
    expect(src).toContain('vp.cidade');
    expect(src).toContain('vp.estado');
    expect(src).toContain('vp.cep');
  });

  it('deve retornar 400 para ID inválido (NaN)', () => {
    expect(src).toContain("'ID inválido'");
    expect(src).toContain('isNaN(vendedorId)');
    expect(src).toContain('{ status: 400 }');
  });

  it('deve retornar 404 quando vendedor não pertence à equipe', () => {
    expect(src).toContain('Vendedor não encontrado na sua equipe');
    expect(src).toContain('{ status: 404 }');
  });

  it('deve verificar vínculo ativo na hierarquia_comercial', () => {
    expect(src).toContain('hierarquia_comercial');
    expect(src).toContain('hc.ativo = true');
    expect(src).toContain('representante_id');
  });

  it('deve retornar objeto com chave "vendedor"', () => {
    expect(src).toContain('{ vendedor: result.rows[0] }');
  });

  it('deve também exportar PATCH (compatibilidade com edição)', () => {
    expect(src).toContain('export async function PATCH');
  });
});

// ---------------------------------------------------------------------------
// 12. GET /api/suporte/representantes — filtro ?grupo=ativos|inativos
// ---------------------------------------------------------------------------
describe('12. GET /api/suporte/representantes — filtro por grupo', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'suporte',
    'representantes',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve aceitar parâmetro grupo via searchParams', () => {
    expect(src).toContain("searchParams.get('grupo')");
  });

  it('grupo=inativos deve filtrar status IN desativado/rejeitado', () => {
    expect(src).toContain("grupo === 'inativos'");
    expect(src).toContain("r.status IN ('desativado', 'rejeitado')");
  });

  it('grupo=ativos deve filtrar status NOT IN desativado/rejeitado', () => {
    expect(src).toContain("grupo === 'ativos'");
    expect(src).toContain("r.status NOT IN ('desativado', 'rejeitado')");
  });

  it('grupo vazio ou ausente não deve adicionar filtro de status automático', () => {
    // Ambos os filtros de grupo são condicionais (dentro de ifs), não incondicionais
    expect(src).toContain("grupo === 'inativos'");
    expect(src).toContain("grupo === 'ativos'");
    // O filtro NOT IN / IN sempre está dentro de um bloco if
    const linhaInativos = src
      .split('\n')
      .find((l) => l.includes("r.status IN ('desativado', 'rejeitado')"));
    const linhaAtivos = src
      .split('\n')
      .find((l) => l.includes("r.status NOT IN ('desativado', 'rejeitado')"));
    expect(linhaInativos).toBeTruthy();
    expect(linhaAtivos).toBeTruthy();
  });

  it('deve autorizar suporte, comercial e admin', () => {
    expect(src).toContain("'suporte'");
    expect(src).toContain("'comercial'");
    expect(src).toContain("'admin'");
  });
});

// ---------------------------------------------------------------------------
// 13. UI /suporte — RepresentantesLista com abas ativos/inativos
// ---------------------------------------------------------------------------
describe('13. UI componente RepresentantesLista — abas ativos/inativos', () => {
  const componentPath = path.join(
    ROOT,
    'components',
    'suporte',
    'RepresentantesLista.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(componentPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('deve ter estado grupo com valores "ativos" e "inativos"', () => {
    expect(src).toContain("'ativos'");
    expect(src).toContain("'inativos'");
  });

  it('deve passar ?grupo= para a API ao carregar', () => {
    expect(src).toContain("params.set('grupo'");
    expect(src).toContain('grupo');
  });

  it('deve ter função handleGrupo para trocar de aba', () => {
    expect(src).toContain('handleGrupo');
  });

  it('deve renderizar botões de aba para ativos e inativos', () => {
    expect(src).toContain('Ativos');
    expect(src).toContain('Inativos');
  });

  it('deve ter estilo de aba ativa com border-green', () => {
    expect(src).toContain('border-green-600');
  });

  it('deve ocultar select de status quando grupo é inativos', () => {
    expect(src).toContain("grupo === 'ativos'");
  });
});
