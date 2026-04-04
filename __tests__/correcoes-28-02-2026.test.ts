/**
 * correcoes-28-02-2026.test.ts
 *
 * Testes para as correções aplicadas em 28/02/2026:
 *
 * 1. Coluna "Últimas Avaliações" em clínica (FuncionariosSection) deve usar
 *    ultimo_lote_numero — corrigido adicionando subquery em /api/rh/funcionarios.
 *
 * 2. PendenciasSection não deve exibir " - lote N" (lote.descricao) na aba
 *    Pendências nem no sidebar — corrigido removendo a exibição de descricao
 *    e usando numero_ordem no card de referência.
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

// ─────────────────────────────────────────────────────────────
// 1. /api/rh/funcionarios — subquery ultimo_lote_numero
// ─────────────────────────────────────────────────────────────

describe('1. /api/rh/funcionarios — coluna Últimas Avaliações (clinica)', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'rh',
    'funcionarios',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('deve conter a subquery ultimo_lote_numero no SELECT', () => {
    expect(src).toMatch(/as\s+ultimo_lote_numero/i);
  });

  it('deve usar avaliacoes a3 com status concluida ou inativada', () => {
    expect(src).toMatch(
      /FROM\s+avaliacoes\s+a3[\s\S]{1,300}status\s+IN\s*\(\s*'concluida'\s*,\s*'inativada'\s*\)/i
    );
  });

  it('deve fazer JOIN com lotes_avaliacao e selecionar numero_ordem', () => {
    // l.numero_ordem aparece no SELECT, e o JOIN com lotes_avaliacao l vem em seguida
    expect(src).toMatch(/l\.numero_ordem\s+FROM\s+avaliacoes\s+a3/i);
    expect(src).toMatch(
      /JOIN\s+lotes_avaliacao\s+l\s+ON\s+a3\.lote_id\s*=\s*l\.id/i
    );
  });

  it('deve ordenar por COALESCE(a3.envio, a3.inativada_em, a3.criado_em) com NULLS LAST', () => {
    expect(src).toMatch(
      /ORDER\s+BY\s+COALESCE\s*\(\s*a3\.envio\s*,\s*a3\.inativada_em\s*,\s*a3\.criado_em\s*\)\s+DESC\s+NULLS\s+LAST/i
    );
  });

  it('deve usar LIMIT 1 para pegar apenas o lote mais recente', () => {
    // Verifica que existe LIMIT 1 perto de ultimo_lote_numero
    const idx = src.indexOf('ultimo_lote_numero');
    expect(idx).toBeGreaterThan(0);
    const ctxBefore = src.substring(Math.max(0, idx - 500), idx);
    expect(ctxBefore).toMatch(/LIMIT\s+1/i);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. FuncionariosSection — exibição via ultimo_lote_numero (clinica/entidade)
// ─────────────────────────────────────────────────────────────

describe('2. FuncionarioRow — coluna Últimas Avaliações exibe numero_ordem', () => {
  const componentPath = path.join(
    ROOT,
    'components',
    'funcionarios',
    'components',
    'FuncionarioRow.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(componentPath, 'utf-8');
  });

  it('deve referenciar ultimo_lote_numero no componente de linha', () => {
    expect(src).toContain('ultimo_lote_numero');
  });

  it('deve renderizar texto "Lote" junto ao numero do lote', () => {
    // JSX inline: Lote {funcionario.ultimo_lote_numero}
    expect(src).toMatch(/Lote\s*\{funcionario\.ultimo_lote_numero\}/);
  });

  it('deve referenciar lote_ativo_numero para avaliaçoes ativas', () => {
    expect(src).toContain('lote_ativo_numero');
  });
});

// ─────────────────────────────────────────────────────────────
// 3. PendenciasSection — não exibe lote.descricao ("- lote N")
// ─────────────────────────────────────────────────────────────

describe('3. PendenciasSection — não exibe descricao do lote na aba/sidebar Pendências', () => {
  const componentPath = path.join(
    ROOT,
    'components',
    'pendencias',
    'PendenciasSection.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(componentPath, 'utf-8');
  });

  it('não deve renderizar lote.descricao no card de referência', () => {
    // A expressão que exibia "— Lote N" foi removida
    expect(src).not.toMatch(/lote\.descricao\s*\?\s*`\s*[—\-]/);
  });

  it('não deve ter o padrão "— ${lote.descricao}" ou similar', () => {
    expect(src).not.toMatch(/[—\-]\s*\$\{lote\.descricao\}/);
  });

  it('deve mostrar numero_ordem no lugar de descricao no card de lote', () => {
    expect(src).toMatch(/lote\.numero_ordem/);
  });

  it('deve usar o fallback lote.id caso numero_ordem seja nulo', () => {
    // Verifica padrão: lote.numero_ordem ?? lote.id
    expect(src).toMatch(/lote\.numero_ordem\s*\?\?\s*lote\.id/);
  });

  it('deve manter a interface LoteReferencia com campo numero_ordem', () => {
    expect(src).toMatch(/numero_ordem\s*:\s*number/);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. /api/pendencias/lote — retorna numero_ordem (base para o fix)
// ─────────────────────────────────────────────────────────────

describe('4. /api/pendencias/lote — retorna numero_ordem no lote de referência', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'pendencias',
    'lote',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('deve retornar numero_ordem no buildResponse', () => {
    expect(src).toMatch(/numero_ordem\s*:\s*loteRef\.numero_ordem/);
  });

  it('deve selecionar numero_ordem no SQL do lote de referência', () => {
    expect(src).toMatch(
      /SELECT[\s\S]{1,200}numero_ordem[\s\S]{1,200}FROM\s+lotes_avaliacao/i
    );
  });
});
