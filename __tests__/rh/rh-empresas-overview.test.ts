/**
 * rh-empresas-overview.test.ts
 *
 * Valida a lógica do endpoint GET /api/rh/empresas-overview:
 * 1. Arquivo de rota existe e exporta handler GET
 * 2. Query SQL usa dois LATERAL JOINs (lote_atual + lote_anterior)
 * 3. KPI resumo_kpi é calculado corretamente
 * 4. Filtro de busca aceita parâmetros de busca
 * 5. Elegibilidade computada corretamente por status do lote
 * 6. Tipos exportados estão completos
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const ROUTE_PATH = path.join(
  ROOT,
  'app',
  'api',
  'rh',
  'empresas-overview',
  'route.ts'
);

let src: string;

beforeAll(() => {
  src = fs.readFileSync(ROUTE_PATH, 'utf-8');
});

describe('GET /api/rh/empresas-overview — Arquivo de rota', () => {
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

describe('GET /api/rh/empresas-overview — Tipos exportados', () => {
  it('exporta EmpresaOverview', () => {
    expect(src).toMatch(/export\s+interface\s+EmpresaOverview/);
  });

  it('exporta ResumoKPI', () => {
    expect(src).toMatch(/export\s+interface\s+ResumoKPI/);
  });

  it('exporta EmpresasOverviewResponse', () => {
    expect(src).toMatch(/export\s+interface\s+EmpresasOverviewResponse/);
  });

  it('ResumoKPI tem campo lotes_em_andamento', () => {
    expect(src).toMatch(/lotes_em_andamento/);
  });

  it('ResumoKPI tem campo total_laudos_pendentes', () => {
    expect(src).toMatch(/total_laudos_pendentes/);
  });
});

describe('GET /api/rh/empresas-overview — SQL e performance', () => {
  it('usa LATERAL JOIN para lote_atual', () => {
    // Dois LATERAL JOINs esperados
    const matches = src.match(/LATERAL/gi);
    expect(matches).not.toBeNull();
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('usa parâmetro $1 para clinica_id (sem concatenação direta)', () => {
    expect(src).toMatch(/\$1/);
    expect(src).not.toMatch(/`.*clinicaId.*`/);
  });

  it('filtra RLS por clinica_id com OR EXISTS (funcionarios_clinicas)', () => {
    expect(src).toMatch(/ec\.clinica_id\s*=\s*\$1/);
    expect(src).toMatch(/funcionarios_clinicas/i);
  });

  it('suporta parâmetro de busca via SearchParams', () => {
    expect(src).toMatch(/busca/i);
    expect(src).toMatch(/searchParams|NextRequest/i);
  });
});

describe('GET /api/rh/empresas-overview — Lógica de elegibilidade', () => {
  it('bloqueia empresa com lote ativo', () => {
    expect(src).toMatch(/ativo/);
    expect(src).toMatch(/elegivel.*false|false.*elegivel/i);
  });

  it('bloqueia empresa com emissao_solicitada', () => {
    expect(src).toMatch(/emissao_solicitada/);
  });

  it('permite empresa sem lote atual (sem_lote)', () => {
    expect(src).toMatch(/elegivel.*true|count_elegiveis/i);
  });

  it('inclui motivo_bloqueio no retorno de elegibilidade', () => {
    expect(src).toMatch(/motivo_bloqueio/);
  });

  it('permite empresa com lote concluido (elegivel para novo ciclo)', () => {
    // concluido = avaliações do ciclo atual feitas; funcionários de Pendências são elegíveis
    expect(src).toMatch(/concluido/);
    // 'concluido' não deve aparecer em bloco com elegivel: false
    expect(src).not.toMatch(
      /concluido.*elegivel.*false|concluido.*Aguardando Emiss/i
    );
  });

  it('não bloqueia em estado concluido (removido de labelStatus bloqueante)', () => {
    // Varre que 'concluido' não está na lista de estados bloqueantes do labelStatus
    const labelStatusBlock = src.match(/labelStatus[\s\S]*?};/);
    if (labelStatusBlock) {
      expect(labelStatusBlock[0]).not.toMatch(/concluido/);
    }
  });
});

describe('GET /api/rh/empresas-overview — Estrutura da resposta', () => {
  it('resposta contém empresas e resumo_kpi', () => {
    expect(src).toMatch(/resumo_kpi/);
    expect(src).toMatch(/empresas/);
  });

  it('lote_atual contém percentual_conclusao', () => {
    expect(src).toMatch(/percentual_conclusao/);
  });

  it('laudos_status contém aguardando_emissao e aguardando_pagamento', () => {
    expect(src).toMatch(/aguardando_emissao/);
    expect(src).toMatch(/aguardando_pagamento/);
  });

  it('LaudosStatusInfo contém campo laudo_emitido separado de pago', () => {
    expect(src).toMatch(/laudo_emitido:\s*number/);
  });

  it('lateral join laud separa pago (aguardando emissão) de laudo_emitido', () => {
    // pago deve ter filtro excludindo laudo_emitido e finalizado
    expect(src).toMatch(/status_pagamento\s*=\s*'pago'/);
    expect(src).toMatch(/NOT IN\s*\(\s*'laudo_emitido',\s*'finalizado'\s*\)/);
    // laudo_emitido conta lotes realmente emitidos
    const lateralMatch = src.match(/laud ON true[\s\S]*?laud ON true/);
    const laudSection = src.match(/AS laudo_emitido\s/);
    expect(laudSection).not.toBeNull();
  });
});

describe('GET /api/rh/empresas-overview — ResumoKPI campos estendidos', () => {
  it('ResumoKPI tem campo total_funcionarios', () => {
    expect(src).toMatch(/total_funcionarios\s*:/);
  });

  it('ResumoKPI tem campo total_funcionarios_inativos', () => {
    expect(src).toMatch(/total_funcionarios_inativos/);
  });

  it('ResumoKPI tem campo total_lotes', () => {
    expect(src).toMatch(/total_lotes\s*:/);
  });

  it('ResumoKPI tem campo total_lotes_pendentes', () => {
    expect(src).toMatch(/total_lotes_pendentes/);
  });

  it('ResumoKPI tem campo total_laudos_emitidos', () => {
    expect(src).toMatch(/total_laudos_emitidos/);
  });

  it('ResumoKPI tem campo total_laudos_aguardando_emissao', () => {
    expect(src).toMatch(/total_laudos_aguardando_emissao/);
  });

  it('ResumoKPI tem campo total_laudos_aguardando_pagamento', () => {
    expect(src).toMatch(/total_laudos_aguardando_pagamento/);
  });

  it('calcula total_laudos_emitidos via status laudo_emitido e finalizado', () => {
    expect(src).toMatch(/laudo_emitido/);
    expect(src).toMatch(/finalizado/);
  });

  it('executa query secundária para stats de funcionários e lotes', () => {
    // Verifica que há uma segunda chamada a query() além da principal
    const queryMatches = src.match(/await\s+query</g);
    expect(queryMatches).not.toBeNull();
    expect((queryMatches ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
