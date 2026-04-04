/**
 * Testes: Correções 04/04/2026 — Status de Pagamento nos Cards de Lote
 *
 * Valida todas as alterações desta sessão:
 * 1. LotesGrid exibe banners corretos por status_pagamento (pago/aguardando_pagamento/default)
 * 2. API /api/rh/lotes retorna status_pagamento e link_disponibilizado_em
 * 3. API /api/entidade/lotes retorna status_pagamento e link_disponibilizado_em
 * 4. RHContext/rh-context.tsx inclui contador de pagamentos em aberto
 * 5. EntidadeContext inclui contador de pagamentos em aberto
 * 6. ClinicaSidebar exibe badge de pagamentos em "Informações da Conta"
 * 7. EntidadeSidebar exibe badge de pagamentos em "Informações da Conta"
 * 8. EmpresasTable diferencia "pago — aguard. emissão" de "emitido(s)"
 * 9. empresas-overview LaudosStatusInfo tem campo laudo_emitido
 * 10. API /api/rh/lotes/[id] retorna status_pagamento
 * 11. LoteStatusBanners (detalhe RH) distingue pagamento pendente de emissão pendente
 * 12. LoteInfo (types.ts do lote RH) tem campo status_pagamento
 * 13. empresas-overview: aguardando_emissao filtra por solicitacao_emissao_em IS NOT NULL
 * 14. entidade/lotes: LotesGrid não recebe onRelatorioSetor (botão removido)
 * 15. empresas-overview: laudos_laudo_emitido selecionado no SELECT principal
 * 16. empresas-overview: counters laud usam EXISTS na tabela laudos
 * 17. empresas-overview: la_atual lateral inclui tem_laudo_emitido
 * 18. empresas-overview: lotes_em_andamento exclui lotes com laudo emitido
 * 19. empresas-overview: total_laudos_emitidos stats query inclui tabela laudos
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

function readSrc(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

// ─── 1. LotesGrid — banners por status_pagamento ────────────────────────────

describe('LotesGrid — banners corretos por status_pagamento', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('components/rh/LotesGrid.tsx');
  });

  it('define variável aguardandoEmissao com condição status_pagamento pago', () => {
    expect(src).toMatch(/aguardandoEmissao\s*=\s*Boolean/);
    expect(src).toMatch(/statusPagamento\s*===\s*['"]pago['"]/);
  });

  it('emissaoSolicitada exclui estado aguardandoEmissao', () => {
    expect(src).toMatch(/!aguardandoEmissao/);
    const emissaoSolicitadaBlock = src.match(
      /emissaoSolicitada\s*=\s*Boolean\([^)]+\)/
    );
    expect(emissaoSolicitadaBlock?.[0]).toMatch(/!aguardandoEmissao/);
  });

  it('banner verde/emerald é renderizado condicionalmente para aguardandoEmissao', () => {
    expect(src).toMatch(/\{aguardandoEmissao\s*&&/);
    expect(src).toMatch(/bg-emerald-50/);
    expect(src).toMatch(/border-emerald-200/);
  });

  it('banner exibe texto "Pagamento confirmado — aguardando emissão do laudo"', () => {
    expect(src).toContain(
      'Pagamento confirmado — aguardando emissão do laudo.'
    );
  });

  it('banner laranja é renderizado condicionalmente para aguardandoPagamento', () => {
    expect(src).toMatch(/\{aguardandoPagamento\s*&&/);
    expect(src).toMatch(/bg-orange-50/);
    expect(src).toMatch(/border-orange-200/);
  });

  it('banner da emissão solicitada (azul) não aparece quando status é pago', () => {
    expect(src).toMatch(/statusPagamento\s*===\s*['"]aguardando_pagamento['"]/);
  });

  it('emissaoSolicitada exclui também aguardandoPagamento', () => {
    const emissaoBlock = src.match(/emissaoSolicitada\s*=\s*Boolean\([^)]+\)/);
    expect(emissaoBlock?.[0]).toMatch(/!aguardandoPagamento/);
  });
});

// ─── 2. API /api/rh/lotes — retorna status_pagamento ──────────────────────

describe('API /api/rh/lotes — inclui status_pagamento e link_disponibilizado_em', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/rh/lotes/route.ts');
  });

  it('SELECT inclui la.status_pagamento', () => {
    expect(src).toMatch(/la\.status_pagamento/);
  });

  it('SELECT inclui la.link_disponibilizado_em', () => {
    expect(src).toMatch(/la\.link_disponibilizado_em/);
  });

  it('objeto mapeado retorna status_pagamento', () => {
    expect(src).toMatch(/status_pagamento:\s*lote\.status_pagamento/);
  });

  it('objeto mapeado retorna link_disponibilizado_em', () => {
    expect(src).toMatch(
      /link_disponibilizado_em:\s*lote\.link_disponibilizado_em/
    );
  });
});

// ─── 3. API /api/entidade/lotes — retorna status_pagamento ────────────────

describe('API /api/entidade/lotes — inclui status_pagamento e link_disponibilizado_em', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/entidade/lotes/route.ts');
  });

  it('SELECT inclui la.status_pagamento', () => {
    expect(src).toMatch(/la\.status_pagamento/);
  });

  it('SELECT inclui la.link_disponibilizado_em', () => {
    expect(src).toMatch(/la\.link_disponibilizado_em/);
  });

  it('GROUP BY inclui status_pagamento e link_disponibilizado_em', () => {
    expect(src).toMatch(
      /GROUP BY[\s\S]*la\.status_pagamento[\s\S]*la\.link_disponibilizado_em/
    );
  });
});

// ─── 4. RHContext — contador de pagamentos em aberto ──────────────────────

describe('RHCounts — inclui campo pagamentos', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/rh/rh-context.tsx');
  });

  it('interface RHCounts tem campo pagamentos: number', () => {
    expect(src).toMatch(/pagamentos:\s*number/);
  });

  it('defaultCounts inclui pagamentos: 0', () => {
    expect(src).toMatch(/defaultCounts[\s\S]*pagamentos:\s*0/);
  });

  it('loadCounts busca /api/rh/pagamentos-em-aberto/count', () => {
    expect(src).toContain('/api/rh/pagamentos-em-aberto/count');
  });

  it('loadCounts popula next.pagamentos com data.count', () => {
    expect(src).toMatch(/next\.pagamentos\s*=\s*data\.count/);
  });
});

// ─── 5. EntidadeContext — contador de pagamentos em aberto ────────────────

describe('EntidadeCounts — inclui campo pagamentos', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/entidade/entidade-context.tsx');
  });

  it('interface EntidadeCounts tem campo pagamentos: number', () => {
    expect(src).toMatch(/pagamentos:\s*number/);
  });

  it('defaultCounts inclui pagamentos: 0', () => {
    expect(src).toMatch(/defaultCounts[\s\S]*pagamentos:\s*0/);
  });

  it('loadCounts busca /api/entidade/pagamentos-em-aberto/count', () => {
    expect(src).toContain('/api/entidade/pagamentos-em-aberto/count');
  });

  it('loadCounts popula next.pagamentos com data.count', () => {
    expect(src).toMatch(/next\.pagamentos\s*=\s*data\.count/);
  });
});

// ─── 6. ClinicaSidebar — badge de pagamentos em "Informações da Conta" ────

describe('ClinicaSidebar — badge no MenuItem "Informações da Conta"', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('components/clinica/ClinicaSidebar.tsx');
  });

  it('tipo local counts aceita campo pagamentos opcional', () => {
    expect(src).toMatch(/pagamentos\?\s*:\s*number/);
  });

  it('MenuItem "Informações da Conta" recebe count={counts.pagamentos}', () => {
    const block = src.match(/Informa.*da Conta[\s\S]*?\/>/);
    expect(block?.[0]).toMatch(/count=\{counts\.pagamentos\}/);
  });
});

// ─── 7. EntidadeSidebar — badge de pagamentos em "Informações da Conta" ───

describe('EntidadeSidebar — badge no MenuItem "Informações da Conta"', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('components/entidade/EntidadeSidebar.tsx');
  });

  it('tipo local counts aceita campo pagamentos opcional', () => {
    expect(src).toMatch(/pagamentos\?\s*:\s*number/);
  });

  it('MenuItem "Informações da Conta" recebe count={counts.pagamentos}', () => {
    const block = src.match(/Informa.*da Conta[\s\S]*?\/>/);
    expect(block?.[0]).toMatch(/count=\{counts\.pagamentos\}/);
  });
});

// ─── 8. EmpresasTable — labels corretos para pago vs emitido ──────────────

describe('EmpresasTable — diferencia "pago — aguard. emissão" de "emitido(s)"', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/rh/components/EmpresasTable.tsx');
  });

  it('campo pago usa label "pago — aguard. emissão"', () => {
    expect(src).toContain('pago — aguard. emissão');
  });

  it('campo pago usa cor teal, não verde', () => {
    expect(src).toMatch(/text-teal-600/);
  });

  it('campo laudo_emitido usa label "emitido(s)" com cor verde', () => {
    expect(src).toMatch(/laudo_emitido\s*>/);
    expect(src).toContain('emitido(s)');
    // O text-green-600 deve estar associado ao laudo_emitido, não ao pago
    const emitidoBlock = src.match(
      /laudos_status\.laudo_emitido[\s\S]{0,200}emitido\(s\)/
    );
    expect(emitidoBlock).not.toBeNull();
  });

  it('condição "—" now also verifica laudo_emitido === 0', () => {
    expect(src).toMatch(/laudos_status\.laudo_emitido\s*===\s*0/);
  });
});

// ─── 9. LaudosStatusInfo — campo laudo_emitido adicionado ─────────────────

describe('LaudosStatusInfo — campo laudo_emitido separado', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/rh/empresas-overview/route.ts');
  });

  it('interface LaudosStatusInfo exporta campo laudo_emitido', () => {
    // Deve ter laudo_emitido no bloco da interface
    const interfaceBlock = src.match(
      /export interface LaudosStatusInfo\s*\{[\s\S]*?\}/
    );
    expect(interfaceBlock).not.toBeNull();
    expect(interfaceBlock?.[0]).toMatch(/laudo_emitido:\s*number/);
  });

  it('EmpresaRow tem campo laudos_laudo_emitido', () => {
    expect(src).toMatch(/laudos_laudo_emitido:\s*number\s*\|/);
  });

  it('mapeamento de empresas inclui laudo_emitido no laudos_status', () => {
    expect(src).toMatch(/laudo_emitido:\s*Number\(row\.laudos_laudo_emitido/);
  });

  it('lateral join laud conta laudo_emitido (status IN laudo_emitido, finalizado)', () => {
    expect(src).toMatch(/AS laudo_emitido/);
    expect(src).toMatch(/status\s+IN\s+\('laudo_emitido',\s*'finalizado'\)/);
  });

  it('contador pago exclui lotes com status laudo_emitido ou finalizado', () => {
    expect(src).toMatch(
      /status_pagamento\s*=\s*'pago'[\s\S]{0,100}NOT IN\s*\(\s*'laudo_emitido',\s*'finalizado'\s*\)/
    );
  });
});

// ─── 10. API /api/rh/lotes/[id] — retorna status_pagamento ────────────────

describe('API /api/rh/lotes/[id] — inclui status_pagamento', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/rh/lotes/[id]/route.ts');
  });

  it('SELECT inclui la.status_pagamento', () => {
    expect(src).toMatch(/la\.status_pagamento/);
  });
});

// ─── 11. LoteStatusBanners — distingue pagamento pendente de emissão pendente

describe('LoteStatusBanners (detalhe RH) — banners por status_pagamento', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc(
      'app/rh/empresa/[id]/lote/[loteId]/components/LoteStatusBanners.tsx'
    );
  });

  it('renderiza banner "Aguardando Pagamento" para status aguardando_pagamento', () => {
    expect(src).toMatch(
      /status_pagamento\s*===\s*['"]aguardando_pagamento['"]/
    );
    expect(src).toContain('Aguardando Pagamento');
    expect(src).toMatch(/bg-orange-50|from-orange-50/);
  });

  it('renderiza banner "Pagamento Confirmado — Aguardando Emissão" para status pago', () => {
    expect(src).toMatch(/status_pagamento\s*===\s*['"]pago['"]/);
    expect(src).toMatch(/Pagamento Confirmado.*Aguardando Emiss/);
    expect(src).toMatch(/bg-emerald-50|from-emerald-50/);
  });

  it('banner "Emissão Solicitada" só aparece quando não é pago nem aguardando pagamento', () => {
    // Deve condicionalmente excluir os outros dois estados
    expect(src).toMatch(
      /status_pagamento\s*!==\s*['"]aguardando_pagamento['"]/
    );
    expect(src).toMatch(/status_pagamento\s*!==\s*['"]pago['"]/);
  });
});

// ─── 12. LoteInfo (types.ts) — campo status_pagamento ────────────────────

describe('LoteInfo (types.ts lote RH) — campo status_pagamento', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/rh/empresa/[id]/lote/[loteId]/types.ts');
  });

  it('interface LoteInfo exportada inclui status_pagamento opcional', () => {
    const loteInfoBlock = src.match(/export interface LoteInfo\s*\{[\s\S]*?\}/);
    expect(loteInfoBlock).not.toBeNull();
    expect(loteInfoBlock?.[0]).toMatch(/status_pagamento\?\s*:\s*string/);
  });
});

// ─── 13. empresas-overview: aguardando_emissao filtra por solicitacao_emissao_em ──

describe('empresas-overview — aguardando_emissao só conta lotes com emissão solicitada', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/rh/empresas-overview/route.ts');
  });

  it('counter aguardando_emissao filtra por solicitacao_emissao_em IS NOT NULL', () => {
    // No SQL o FILTER vem antes do alias AS aguardando_emissao (pode ter NOT EXISTS entre eles)
    expect(src).toMatch(
      /solicitacao_emissao_em\s+IS\s+NOT\s+NULL[\s\S]{0,600}AS\s+aguardando_emissao/
    );
  });

  it('counter aguardando_emissao não conta lotes só por ter status ativo', () => {
    // A condição anterior (status IN 'ativo', 'rascunho' ...) deve ter sido removida
    // e substituída pelo filtro solicitacao_emissao_em IS NOT NULL
    const aguardandoBlock = src.match(
      /FILTER[\s\S]{0,700}AS aguardando_emissao/
    );
    expect(aguardandoBlock?.[0]).not.toMatch(
      /la_l\.status\s+IN\s+\('rascunho'/
    );
    expect(aguardandoBlock?.[0]).toMatch(
      /solicitacao_emissao_em\s+IS\s+NOT\s+NULL/
    );
  });

  it('counter aguardando_emissao exclui lotes com status laudo_emitido/finalizado', () => {
    const aguardandoBlock = src.match(
      /FILTER[\s\S]{0,700}AS aguardando_emissao/
    );
    expect(aguardandoBlock?.[0]).toMatch(
      /NOT IN\s*\(\s*'laudo_emitido',\s*'finalizado'\s*\)/
    );
  });
});

// ─── 14. entidade/lotes — LotesGrid sem onRelatorioSetor ──────────────────

describe('entidade/lotes/page.tsx — botão Relatório por Setor removido', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/entidade/lotes/page.tsx');
  });

  it('não passa onRelatorioSetor ao LotesGrid', () => {
    expect(src).not.toMatch(/onRelatorioSetor/);
  });

  it('não define handleRelatorioSetor', () => {
    expect(src).not.toMatch(/handleRelatorioSetor/);
  });
});

// ─── 15. empresas-overview: laudos_laudo_emitido no SELECT principal ─────────

describe('empresas-overview — laudos_laudo_emitido selecionado no SELECT', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/rh/empresas-overview/route.ts');
  });

  it('seleciona laud.laudo_emitido como laudos_laudo_emitido no main SELECT', () => {
    expect(src).toMatch(
      /COALESCE\(laud\.laudo_emitido,\s*0\)\s+AS\s+laudos_laudo_emitido/
    );
  });
});

// ─── 16. empresas-overview: counters usam EXISTS na tabela laudos ────────────

describe('empresas-overview — counters laud verificam tabela laudos', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/rh/empresas-overview/route.ts');
  });

  it('counter laudo_emitido usa OR EXISTS para checar laudos.status', () => {
    const laudoEmitidoBlock = src.match(
      /FILTER[\s\S]{0,600}AS\s+laudo_emitido/
    );
    expect(laudoEmitidoBlock?.[0]).toMatch(/OR\s+EXISTS/);
    expect(laudoEmitidoBlock?.[0]).toMatch(
      /ld\.status\s+IN\s+\('emitido',\s*'enviado'\)/
    );
  });

  it('counter pago usa NOT EXISTS para excluir lotes com laudo', () => {
    // Deve ter NOT EXISTS antes do AS pago
    const pagoBlock = src.match(/FILTER[\s\S]{0,600}AS\s+pago,/);
    expect(pagoBlock?.[0]).toMatch(/NOT\s+EXISTS/);
    expect(pagoBlock?.[0]).toMatch(
      /ld\.status\s+IN\s+\('emitido',\s*'enviado'\)/
    );
  });
});

// ─── 17. empresas-overview: la_atual inclui tem_laudo_emitido ────────────────

describe('empresas-overview — la_atual lateral inclui tem_laudo_emitido', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/rh/empresas-overview/route.ts');
  });

  it('la_atual lateral computa tem_laudo_emitido via EXISTS', () => {
    expect(src).toMatch(
      /EXISTS\s*\([\s\S]{0,200}ld\.status\s+IN\s+\('emitido',\s*'enviado'\)[\s\S]{0,50}\)\s+AS\s+tem_laudo_emitido/
    );
  });

  it('main SELECT propaga lote_atual_tem_laudo_emitido', () => {
    expect(src).toMatch(
      /la_atual\.tem_laudo_emitido\s+AS\s+lote_atual_tem_laudo_emitido/
    );
  });

  it('LoteAtualInfo interface expõe tem_laudo_emitido como boolean', () => {
    expect(src).toMatch(/tem_laudo_emitido\s*:\s*boolean/);
  });
});

// ─── 18. empresas-overview: lotes_em_andamento exclui lotes com laudo ────────

describe('empresas-overview — lotes_em_andamento exclui lotes com laudo emitido', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/rh/empresas-overview/route.ts');
  });

  it('lotes_em_andamento verifica !e.lote_atual.tem_laudo_emitido', () => {
    expect(src).toMatch(/!e\.lote_atual\.tem_laudo_emitido/);
  });
});

// ─── 19. empresas-overview: total_laudos_emitidos stats inclui laudos ────────

describe('empresas-overview — total_laudos_emitidos considera tabela laudos', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/rh/empresas-overview/route.ts');
  });

  it('stats total_laudos_emitidos inclui OR EXISTS para laudos.status', () => {
    // Busca o bloco WHERE com laudo_emitido/finalizado E OR EXISTS que termina em AS total_laudos_emitidos
    expect(src).toMatch(
      /la\.status\s+IN\s+\('laudo_emitido'[\s\S]{0,300}OR\s+EXISTS[\s\S]{0,300}AS\s+total_laudos_emitidos/
    );
    expect(src).toMatch(
      /OR\s+EXISTS[\s\S]{0,200}ld\.status\s+IN\s+\('emitido',\s*'enviado'\)[\s\S]{0,200}AS\s+total_laudos_emitidos/
    );
  });
});
