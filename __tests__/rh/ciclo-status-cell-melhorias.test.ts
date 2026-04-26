/**
 * ciclo-status-cell-melhorias.test.ts
 *
 * Valida as alterações de melhoria da coluna "Ciclo" no dashboard RH (23/04/2026):
 * 1. LoteAtualInfo agora expõe status_pagamento
 * 2. API empresas-overview retorna status_pagamento do lote atual
 * 3. CicloStatusCell renderiza mensagens corretas por estado + status_pagamento
 * 4. Coluna Laudos identifica-se como "(geral)" para evitar ambiguidade
 * 5. Componente não expõe código legado
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

function readSrc(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

// ─── 1. LoteAtualInfo — interface inclui status_pagamento ──────────────────

describe('LoteAtualInfo — interface inclui status_pagamento', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/rh/empresas-overview/route.ts');
  });

  it('LoteAtualInfo interface tem campo status_pagamento: StatusPagamentoTipo', () => {
    expect(src).toMatch(
      /export\s+interface\s+LoteAtualInfo[\s\S]*?status_pagamento\s*:\s*StatusPagamentoTipo/
    );
  });

  it('status_pagamento vem logo após status: LoteStatusTipo', () => {
    const interfaceBlock = src.match(
      /export\s+interface\s+LoteAtualInfo[\s\S]*?status:\s*LoteStatusTipo[\s\S]*?status_pagamento/
    );
    expect(interfaceBlock).not.toBeNull();
  });

  it('EmpresaRow tem campo lote_atual_status_pagamento: string | null', () => {
    expect(src).toMatch(/lote_atual_status_pagamento:\s*string\s*\|\s*null/);
  });
});

// ─── 2. SQL — expõe status_pagamento do lote atual ────────────────────────

describe('API SQL — empresas-overview expõe lote_atual.status_pagamento', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/rh/empresas-overview/route.ts');
  });

  it('outer SELECT inclui la_atual.status_pagamento::text AS lote_atual_status_pagamento', () => {
    expect(src).toMatch(
      /la_atual\.status_pagamento::text\s+AS\s+lote_atual_status_pagamento/
    );
  });

  it('object builder mapeia lote_atual_status_pagamento para status_pagamento', () => {
    const builderBlock = src.match(
      /status_pagamento:\s*\(\s*row\.lote_atual_status_pagamento\s+as\s+StatusPagamentoTipo\s*\)\s*\?\?\s*null/i
    );
    expect(builderBlock).not.toBeNull();
  });
});

// ─── 3. CicloStatusCell — renderiza mensagens por sub-estado ──────────────

describe('CicloStatusCell — renderiza mensagens contextuais', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/rh/components/EmpresasTable.tsx');
  });

  it('função CicloStatusCell é exportada', () => {
    expect(src).toMatch(/function\s+CicloStatusCell/);
  });

  it('caso rascunho: exibe "Aguardando liberação"', () => {
    expect(src).toMatch(/case\s+'rascunho'[\s\S]*?Aguardando\s+liberação/);
  });

  it('caso ativo: renderiza ProgressBarLote', () => {
    expect(src).toMatch(/case\s+'ativo'[\s\S]*?ProgressBarLote/);
  });

  it('caso concluido: verifica status_pagamento antes de renderizar', () => {
    const concluidoBlock = src.match(
      /case\s+'concluido':\s*{?[\s\S]*?if\s*\(\s*lote\.status_pagamento/
    );
    expect(concluidoBlock).not.toBeNull();
  });

  it('concluido + pago: exibe "Pagamento confirmado - aguard. emissao"', () => {
    expect(src).toContain('Pagamento confirmado - aguard. emissao');
  });

  it('concluido + aguardando_pagamento: exibe "Aguardando pagamento"', () => {
    expect(src).toMatch(
      /if\s*\(\s*pgto\s*===\s*['"]aguardando_pagamento['"][\s\S]*?Aguardando\s+pagamento/
    );
  });

  it('concluido + aguardando_cobranca: exibe "Aguardando link de pgto"', () => {
    expect(src).toMatch(/Aguardando\s+link\s+de\s+pgto/);
  });

  it('concluido sem status_pagamento: exibe "Pronto para solicitar laudo"', () => {
    expect(src).toMatch(
      /case\s+'concluido'[\s\S]*?Pronto\s+para\s+solicitar\s+laudo/
    );
  });

  it('emissao_solicitada + pago: exibe "Na fila de emissão"', () => {
    expect(src).toMatch(
      /if\s*\(\s*pgto\s*===\s*['"]pago['"][\s\S]*?Na\s+fila\s+de\s+emissão/
    );
  });

  it('emissao_em_andamento: exibe "Gerando laudo..."', () => {
    expect(src).toMatch(/Gerando\s+laudo/);
  });

  it('laudo_emitido: exibe "Laudo disponível"', () => {
    expect(src).toMatch(/Laudo\s+disponível/);
  });

  it('finalizado: exibe "Ciclo concluído"', () => {
    expect(src).toMatch(/Ciclo\s+concluído/);
  });

  it('cancelado: exibe "Cancelado"', () => {
    expect(src).toMatch(/case\s+'cancelado'[\s\S]*?Cancelado/);
  });
});

// ─── 4. Coluna Laudos — clarificação de escopo ──────────────────────────

describe('EmpresasTable — coluna Laudos identifica-se como (geral)', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/rh/components/EmpresasTable.tsx');
  });

  it('header da coluna Laudos inclui "(geral)"', () => {
    expect(src).toMatch(/Laudos\s+\(geral\)/);
  });

  it('label mobile card para Laudos inclui "(geral)"', () => {
    expect(src).toMatch(/qw-mobile-card-label.*Laudos\s+\(geral\)/);
  });

  it('mensagens de laudos incluem "(geral)" para clarificar escopo', () => {
    expect(src).toMatch(/aguardando\s+link\s+\(geral\)/);
    expect(src).toMatch(/aguard\.\s+pgto\s+\(geral\)/);
    expect(src).toMatch(/pago\s+-\s+aguard\.\s+emissao\s+\(geral\)/);
    expect(src).toMatch(/disponivel\(eis\)\s+\(geral\)/);
  });
});

// ─── 5. Imports — sem código legado ──────────────────────────────────────

describe('EmpresasTable — imports e estrutura limpos', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/rh/components/EmpresasTable.tsx');
  });

  it('usa "use client" directive', () => {
    expect(src).toMatch(/['"]use\s+client['"];/);
  });

  it('importa ícones do lucide-react (CreditCard, FileText)', () => {
    expect(src).toMatch(/CreditCard/);
    expect(src).toMatch(/FileText/);
  });

  it('não contém console.log de debug', () => {
    expect(src).not.toMatch(/console\.log/);
  });

  it('não contém TODO comments vagos', () => {
    expect(src).not.toMatch(/TODO.*(?!:)/);
  });

  it('tipos importados de rota corretamente', () => {
    expect(src).toMatch(
      /import\s+type\s+{[\s\S]*?EmpresaOverview[\s\S]*?LoteAtualInfo[\s\S]*?}\s+from/
    );
  });
});

// ─── 6. StatusPagamentoTipo — tipo exportado corretamente ──────────────────

describe('API — StatusPagamentoTipo bem definido', () => {
  let src: string;

  beforeAll(() => {
    src = readSrc('app/api/rh/empresas-overview/route.ts');
  });

  it('StatusPagamentoTipo inclui "pago"', () => {
    expect(src).toMatch(/'pago'/);
  });

  it('StatusPagamentoTipo inclui "aguardando_pagamento"', () => {
    expect(src).toMatch(/'aguardando_pagamento'/);
  });

  it('StatusPagamentoTipo inclui "aguardando_cobranca"', () => {
    expect(src).toMatch(/'aguardando_cobranca'/);
  });

  it('StatusPagamentoTipo inclui null', () => {
    expect(src).toMatch(/\|\s*null/);
  });
});
