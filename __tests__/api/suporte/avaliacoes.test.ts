/**
 * @file __tests__/api/suporte/avaliacoes.test.ts
 *
 * Testes de contrato para a rota GET /api/suporte/avaliacoes.
 *
 * Cobre:
 *  - Autenticação via requireRole('suporte', false)
 *  - Paginação (page, limit)
 *  - Filtros (search, status, data_inicio, data_fim)
 *  - JOIN com laudos table para laudo_status
 *  - COALESCE prioriza laudos.emitido_em/enviado_em sobre lotes_avaliacao
 *  - Retorno de estrutura correta com laudo_status
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const ROUTE_PATH = path.join(
  ROOT,
  'app',
  'api',
  'suporte',
  'avaliacoes',
  'route.ts'
);

const COMPONENT_PATH = path.join(
  ROOT,
  'components',
  'suporte',
  'AvaliacoesContent.tsx'
);

let src: string;
let componentSrc: string;

beforeAll(() => {
  src = fs.readFileSync(ROUTE_PATH, 'utf-8');
  componentSrc = fs.readFileSync(COMPONENT_PATH, 'utf-8');
});

describe('GET /api/suporte/avaliacoes — Arquivo', () => {
  it('arquivo route.ts existe', () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it('exporta função GET', () => {
    expect(src).toMatch(/export\s+async\s+function\s+GET/);
  });

  it('componente AvaliacoesContent.tsx existe', () => {
    expect(fs.existsSync(COMPONENT_PATH)).toBe(true);
  });
});

describe('GET /api/suporte/avaliacoes — Autenticação', () => {
  it('usa requireRole com perfil suporte', () => {
    expect(src).toMatch(/requireRole\s*\(\s*['"]suporte['"]/);
  });

  it('desabilita enforceMfa passando false', () => {
    expect(src).toMatch(/requireRole\s*\(\s*['"]suporte['"]\s*,\s*false\s*\)/);
  });
});

describe('GET /api/suporte/avaliacoes — Paginação', () => {
  it('aceita parametro page', () => {
    expect(src).toMatch(/searchParams\.get\s*\(\s*['"]page['"]/);
  });

  it('aceita parametro limit', () => {
    expect(src).toMatch(/searchParams\.get\s*\(\s*['"]limit['"]/);
  });

  it('retorna pagination object', () => {
    expect(src).toMatch(/pagination/);
    expect(src).toMatch(/Math\.ceil\s*\(\s*total\s*\/\s*limit\s*\)/);
  });
});

describe('GET /api/suporte/avaliacoes — Filtros', () => {
  it('aceita filtro search', () => {
    expect(src).toMatch(/searchParams\.get\s*\(\s*['"]search['"]/);
  });

  it('aceita filtro status', () => {
    expect(src).toMatch(/searchParams\.get\s*\(\s*['"]status['"]/);
  });

  it('aceita filtro data_inicio', () => {
    expect(src).toMatch(/searchParams\.get\s*\(\s*['"]data_inicio['"]/);
  });

  it('aceita filtro data_fim', () => {
    expect(src).toMatch(/searchParams\.get\s*\(\s*['"]data_fim['"]/);
  });

  it('aplica WHERE na query quando há filtros', () => {
    expect(src).toMatch(/WHERE/);
    expect(src).toMatch(/conditions/);
  });
});

describe('GET /api/suporte/avaliacoes — JOIN com Laudos', () => {
  it('faz LEFT JOIN com laudos table', () => {
    expect(src).toMatch(/LEFT\s+JOIN\s+laudos\s+ld/);
  });

  it('usa COALESCE para emitido_em (prioriza laudos)', () => {
    expect(src).toMatch(/COALESCE\s*\(\s*ld\.emitido_em\s*,\s*la\.emitido_em\s*\)\s+AS\s+emitido_em/);
  });

  it('usa COALESCE para enviado_em (prioriza laudos)', () => {
    expect(src).toMatch(/COALESCE\s*\(\s*ld\.enviado_em\s*,\s*la\.enviado_em\s*\)\s+AS\s+enviado_em/);
  });

  it('seleciona laudo_status com COALESCE e fallback rascunho', () => {
    expect(src).toMatch(/COALESCE\s*\(\s*ld\.status\s*,\s*['"]rascunho['"][^)]*\)\s+AS\s+laudo_status/);
  });

  it('agrupa por ld.emitido_em, ld.enviado_em, ld.status', () => {
    expect(src).toMatch(/GROUP BY[\s\S]*ld\.emitido_em[\s\S]*ld\.enviado_em[\s\S]*ld\.status/);
  });
});

describe('GET /api/suporte/avaliacoes — Retorno', () => {
  it('retorna array lotes com laudo_status', () => {
    expect(src).toMatch(/laudo_status.*row\s*as\s*string|row\.laudo_status/i);
  });

  it('cada lote tem: lote_id, status, laudo_status, emitido_em, enviado_em', () => {
    expect(src).toMatch(/lote_id.*Number/);
    expect(src).toMatch(/status.*string/i);
    expect(src).toMatch(/laudo_status.*string/i);
    expect(src).toMatch(/emitido_em.*null/);
    expect(src).toMatch(/enviado_em.*null/);
  });

  it('retorna NextResponse.json com lotes e pagination', () => {
    expect(src).toMatch(/NextResponse\.json/);
    expect(src).toMatch(/lotes/);
    expect(src).toMatch(/pagination/);
  });
});

describe('Component AvaliacoesContent — Interface', () => {
  it('define interface LoteAvaliacao com laudo_status', () => {
    expect(componentSrc).toMatch(/interface\s+LoteAvaliacao[\s\S]*laudo_status\s*:\s*string/);
  });

  it('função getStatusDisplay verifica laudo_status === enviado', () => {
    expect(componentSrc).toMatch(/laudo_status\s*===\s*['"]enviado['"][^}]*?Laudo\s+Enviado/);
  });

  it('função getStatusDisplay verifica laudo_status === emitido', () => {
    expect(componentSrc).toMatch(/laudo_status\s*===\s*['"]emitido['"][^}]*?Laudo\s+Emitido/);
  });
});

describe('Component AvaliacoesContent — Fetch', () => {
  it('passa laudo_status para getStatusDisplay', () => {
    expect(componentSrc).toMatch(/getStatusDisplay/);
  });

  it('debug log exibe campos importantes', () => {
    expect(componentSrc).toMatch(/console\.log/);
    expect(componentSrc).toMatch(/status/);
  });
});
