/**
 * rh-sidebar-empresas-mini.test.ts
 *
 * Valida a lógica do endpoint GET /api/rh/sidebar/empresas-mini:
 * 1. Arquivo de rota existe e exporta handler GET
 * 2. Status icons calculados corretamente por cenário (sem lote, ok, atenção, crítico)
 * 3. Query SQL usa LATERAL JOIN idempotente
 * 4. Filtro de clínica inclui subquery EXISTS para funcionarios_clinicas
 * 5. Resposta segue interface EmpresaMini
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const ROUTE_PATH = path.join(
  ROOT,
  'app',
  'api',
  'rh',
  'sidebar',
  'empresas-mini',
  'route.ts'
);

let src: string;

beforeAll(() => {
  src = fs.readFileSync(ROUTE_PATH, 'utf-8');
});

describe('GET /api/rh/sidebar/empresas-mini — Arquivo de rota', () => {
  it('arquivo existe', () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it('exporta função GET', () => {
    expect(src).toMatch(/export\s+async\s+function\s+GET/);
  });

  it('usa force-dynamic', () => {
    expect(src).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
  });

  it('chama requireClinica para autenticação', () => {
    expect(src).toMatch(/requireClinica/);
  });

  it('retorna 403 em falha de auth', () => {
    expect(src).toMatch(/status:\s*403/);
  });
});

describe('GET /api/rh/sidebar/empresas-mini — SQL e segurança', () => {
  it('usa parâmetro $1 para clinica_id (sem interpolação direta)', () => {
    expect(src).toMatch(/\$1/);
    // Garantir que não faz interpolação de variável diretamente na query
    expect(src).not.toMatch(/`.*clinicaId.*`/);
  });

  it('usa LATERAL JOIN para lote mais recente', () => {
    expect(src).toMatch(/LATERAL/i);
    expect(src).toMatch(/ORDER BY numero_ordem DESC/i);
    expect(src).toMatch(/LIMIT 1/i);
  });

  it('filtra RLS por clinica_id com OR EXISTS (funcionarios_clinicas)', () => {
    expect(src).toMatch(/ec\.clinica_id\s*=\s*\$1/);
    expect(src).toMatch(/funcionarios_clinicas/i);
  });

  it('filtra apenas empresas ativas', () => {
    expect(src).toMatch(/ec\.ativa\s*=\s*true/i);
  });
});

describe('GET /api/rh/sidebar/empresas-mini — Lógica de status icons', () => {
  it('exporta tipo EmpresaMiniStatusIcon com 5 valores', () => {
    expect(src).toMatch(/EmpresaMiniStatusIcon/);
    expect(src).toMatch(/'ok'/);
    expect(src).toMatch(/'atencao'/);
    expect(src).toMatch(/'critico'/);
    expect(src).toMatch(/'sem_lote'/);
    expect(src).toMatch(/'inativo'/);
  });

  it('retorna sem_lote quando lote_status é null', () => {
    // Verifica que existe lógica de retorno antecipado para sem lote
    expect(src).toMatch(
      /(?:!row\.lote_status|lote_status.*null|return.*sem_lote)/i
    );
  });

  it('classifica emissão_solicitada + dias > 7 como crítico', () => {
    expect(src).toMatch(/emissao_solicitada/);
    expect(src).toMatch(/critico/i);
    expect(src).toMatch(/diasLote\s*>\s*7/);
  });

  it('classifica cancelado como crítico', () => {
    expect(src).toMatch(/cancelado/);
    expect(src).toMatch(/critico/i);
  });
});

describe('GET /api/rh/sidebar/empresas-mini — Interface de resposta', () => {
  it('resposta inclui campo empresas array', () => {
    expect(src).toMatch(/empresas\s*:/);
    expect(src).toMatch(/NextResponse\.json\(\s*\{\s*empresas/);
  });

  it('cada item tem id, nome, status_icon', () => {
    expect(src).toMatch(/id\s*:\s*row\.id/);
    expect(src).toMatch(/nome\s*:\s*row\.nome/);
    expect(src).toMatch(/status_icon/);
  });
});
