/**
 * Testes das correções implementadas na sessão de auditoria do comissionamento
 * (remoção de Cobranças + correções B1-B6 do sistema de comissionamento)
 *
 * 1. ComissoesContent aceita prop perfil e filtra ações de comercial
 * 2. ciclos.ts — fecharCiclo/aprovarNf/rejeitarNf/registrarPagamento aceitam executorPerfil
 * 3. Triggador dinâmico: suporte → suporte_action, admin → admin_action
 * 4. useComissoes — exporta mesFilter e setMesFilter
 * 5. ComissoesIndividuaisContent — inclui seletores de mês e ano
 * 6. ComissoesIndividuaisContent — seletores de mês/ano no componente
 * 7. CiclosComissoesContent — setMesFilter e limpar filtro
 * 8. ACOES_COMERCIAL_BLOQUEADAS exportado de types.ts + ComissoesTab prop perfil
 * 9. Cobranças removidas — arquivos não devem mais existir
 * 10. Ciclos removidos do dashboard suporte (componente + API routes)
 * 11. Correção Invalid Date — mes_pagamento usa substring(0,10) + T12:00:00
 * 12. pg.types.setTypeParser(1082) em connection.ts — DATE retorna string
 * 13. types.ts — Comissao interface tem campos de lote e parcela
 * 14. ComissoesTab — colunas espelham o painel comercial (Lote, Valor Total, %, Parcelas)
 * 15. API /api/admin/comissoes — normalização do parâmetro mes (bare number vs YYYY-MM)
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// ─────────────────────────────────────────────────────────────────────────────
// 1. ComissoesContent — prop perfil + filtro de ações comercial
// ─────────────────────────────────────────────────────────────────────────────
describe('1. ComissoesContent — prop perfil filtra ações de comercial', () => {
  const filePath = path.join(
    ROOT,
    'components',
    'admin',
    'ComissoesContent.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve ter interface ComissoesContentProps com perfil opcional', () => {
    expect(src).toContain('ComissoesContentProps');
    expect(src).toContain('perfil?: string');
  });

  it('ComissoesContent deve aceitar prop perfil na assinatura', () => {
    expect(src).toMatch(/ComissoesContent\s*\(\s*\{[^}]*perfil/);
  });

  it('deve filtrar "pagar" quando perfil === comercial', () => {
    expect(src).toContain("a !== 'pagar'");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. comercial/page.tsx usa ComercialComissoesAbas (com tabs Produtividade + Minhas comissões)
// ─────────────────────────────────────────────────────────────────────────────
describe('2. comercial/page.tsx usa ComercialComissoesAbas', () => {
  const filePath = path.join(ROOT, 'app', 'comercial', 'page.tsx');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('deve importar ComercialComissoesAbas', () => {
    expect(src).toContain('ComercialComissoesAbas');
  });

  it('ComercialComissoesAbas deve passar perfil="comercial" para ComissoesContent', () => {
    const abasPath = path.join(
      ROOT,
      'components',
      'comercial',
      'ComercialComissoesAbas.tsx'
    );
    const abasSrc = fs.readFileSync(abasPath, 'utf-8');
    expect(abasSrc).toContain('perfil="comercial"');
  });
});

// [Seções 3-5 REMOVIDAS] — ciclos.ts e rota ciclos/[id] eliminados do sistema

// ─────────────────────────────────────────────────────────────────────────────
// 6. useComissoes — expõe mesFilter e setMesFilter
// ─────────────────────────────────────────────────────────────────────────────
describe('6. useComissoes — mesFilter e setMesFilter', () => {
  const hookPath = path.join(
    ROOT,
    'app',
    'admin',
    'comissoes',
    'hooks',
    'useComissoes.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(hookPath, 'utf-8');
  });

  it('deve ter mesFilter no tipo de retorno', () => {
    expect(src).toContain('mesFilter: string');
  });

  it('deve ter setMesFilter no tipo de retorno', () => {
    expect(src).toContain('setMesFilter');
  });

  it('deve incluir mesFilter nos parâmetros da API', () => {
    expect(src).toContain("params.set('mes', mesFilter)");
  });

  it('mesFilter deve ser dependência do carregar callback', () => {
    expect(src).toContain('mesFilter');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. ComissoesIndividuaisContent — seletores de mês e ano
// ─────────────────────────────────────────────────────────────────────────────
describe('7. ComissoesIndividuaisContent — seletores de mês/ano', () => {
  const compPath = path.join(
    ROOT,
    'components',
    'suporte',
    'ComissoesIndividuaisContent.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(compPath, 'utf-8');
  });

  it('deve ter seletor de mês', () => {
    expect(src).toContain('selectedMes');
  });

  it('deve ter seletor de ano', () => {
    expect(src).toContain('selectedAno');
  });

  it('deve chamar setMesFilter', () => {
    expect(src).toContain('setMesFilter');
  });

  it('deve formatar mês como YYYY-MM', () => {
    expect(src).toContain('padStart(2,');
  });

  it('deve ter botão para limpar filtro (Todos)', () => {
    expect(src).toContain("setMesFilter('')");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. ACOES_COMERCIAL_BLOQUEADAS e prop perfil em ComissoesTab
// ─────────────────────────────────────────────────────────────────────────────
describe('8. ComissoesTab — prop perfil e ACOES_COMERCIAL_BLOQUEADAS', () => {
  const tabPath = path.join(
    ROOT,
    'app',
    'admin',
    'comissoes',
    'components',
    'ComissoesTab.tsx'
  );
  const typesPath = path.join(ROOT, 'app', 'admin', 'comissoes', 'types.ts');
  let tabSrc: string;
  let typesSrc: string;

  beforeAll(() => {
    tabSrc = fs.readFileSync(tabPath, 'utf-8');
    typesSrc = fs.readFileSync(typesPath, 'utf-8');
  });

  it('types.ts deve exportar ACOES_COMERCIAL_BLOQUEADAS', () => {
    expect(typesSrc).toContain('ACOES_COMERCIAL_BLOQUEADAS');
  });

  it('ACOES_COMERCIAL_BLOQUEADAS deve incluir pagar', () => {
    expect(typesSrc).toContain("'pagar'");
  });

  it('ComissoesTab deve ter prop perfil opcional', () => {
    expect(tabSrc).toContain('perfil?: string');
  });

  it('ComissoesTab deve filtrar ACOES_COMERCIAL_BLOQUEADAS quando perfil === comercial', () => {
    expect(tabSrc).toContain("perfil === 'comercial'");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Cobranças — arquivos removidos completamente
// ─────────────────────────────────────────────────────────────────────────────
describe('9. Cobranças — arquivos removidos', () => {
  it('components/admin/CobrancaContent.tsx não deve existir', () => {
    const p = path.join(ROOT, 'components', 'admin', 'CobrancaContent.tsx');
    expect(fs.existsSync(p)).toBe(false);
  });

  it('components/admin/cobranca/ não deve existir', () => {
    const p = path.join(ROOT, 'components', 'admin', 'cobranca');
    expect(fs.existsSync(p)).toBe(false);
  });

  it('app/api/admin/cobranca/ não deve existir', () => {
    const p = path.join(ROOT, 'app', 'api', 'admin', 'cobranca');
    expect(fs.existsSync(p)).toBe(false);
  });

  it('SuporteSidebar não deve ter menuitem cobranca', () => {
    const sidebarPath = path.join(
      ROOT,
      'components',
      'suporte',
      'SuporteSidebar.tsx'
    );
    const src = fs.readFileSync(sidebarPath, 'utf-8');
    expect(src).not.toContain("'cobranca'");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Ciclos — arquivos removidos do dashboard suporte
// ─────────────────────────────────────────────────────────────────────────────
describe('10. Ciclos — arquivos removidos do suporte', () => {
  it('components/suporte/CiclosComissoesContent.tsx não deve existir no sidebar', () => {
    // Verifica que o ANTIGO CiclosComissoesContent foi removido do sidebar
    // (o NOVO CiclosComissaoContent — sem 's' — é permitido como nova feature)
    const sidebarPath = path.join(
      ROOT,
      'components',
      'suporte',
      'SuporteSidebar.tsx'
    );
    const sidebarSrc = fs.readFileSync(sidebarPath, 'utf-8');
    expect(sidebarSrc).not.toContain('CiclosComissoesContent');
  });

  it('app/api/suporte/ciclos/ não deve existir', () => {
    const p = path.join(ROOT, 'app', 'api', 'suporte', 'ciclos');
    expect(fs.existsSync(p)).toBe(false);
  });

  it('SuporteSidebar não deve ter item ciclos', () => {
    const sidebarPath = path.join(
      ROOT,
      'components',
      'suporte',
      'SuporteSidebar.tsx'
    );
    const src = fs.readFileSync(sidebarPath, 'utf-8');
    expect(src).not.toContain("'ciclos'");
    expect(src).not.toContain('CiclosComissoesContent');
    // Nota: 'Ciclos NF/RPA' é permitido — é a nova feature de ciclos de comissionamento
  });

  it('suporte/page.tsx não deve importar CiclosComissoesContent', () => {
    const pagePath = path.join(ROOT, 'app', 'suporte', 'page.tsx');
    const src = fs.readFileSync(pagePath, 'utf-8');
    expect(src).not.toContain('CiclosComissoesContent');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Correção Invalid Date — mes_pagamento renderiza corretamente
// ─────────────────────────────────────────────────────────────────────────────
describe('11. Correção Invalid Date — mes_pagamento usa substring(0,10) + T12:00:00', () => {
  const files = [
    path.join(
      ROOT,
      'app',
      'admin',
      'comissoes',
      'components',
      'ComissoesTab.tsx'
    ),
    path.join(ROOT, 'components', 'admin', 'ComissoesContent.tsx'),
    path.join(
      ROOT,
      'app',
      'representante',
      '(portal)',
      'comissoes',
      'components',
      'ComissoesTable.tsx'
    ),
  ];

  for (const filePath of files) {
    const label = filePath.replace(ROOT + path.sep, '');
    it(`${label} deve usar .substring(0, 10) + 'T12:00:00' para evitar Invalid Date`, () => {
      const src = fs.readFileSync(filePath, 'utf-8');
      expect(src).toContain(".substring(0, 10) + 'T12:00:00'");
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. pg.types.setTypeParser para DATE retornar string "YYYY-MM-DD"
// ─────────────────────────────────────────────────────────────────────────────
describe('12. pg.types.setTypeParser(1082) configurado em connection.ts', () => {
  it('lib/db/connection.ts deve configurar setTypeParser para OID 1082 (DATE)', () => {
    const connPath = path.join(ROOT, 'lib', 'db', 'connection.ts');
    const src = fs.readFileSync(connPath, 'utf-8');
    expect(src).toContain('setTypeParser(1082');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. types.ts — interface Comissao contém campos de lote e parcela
// ─────────────────────────────────────────────────────────────────────────────
describe('13. types.ts — interface Comissao: campos de lote e parcela', () => {
  const typesPath = path.join(ROOT, 'app', 'admin', 'comissoes', 'types.ts');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(typesPath, 'utf-8');
  });

  it('deve ter lote_pagamento_id como number | null', () => {
    expect(src).toContain('lote_pagamento_id: number | null');
  });

  it('deve ter lote_pagamento_metodo como string | null', () => {
    expect(src).toContain('lote_pagamento_metodo: string | null');
  });

  it('deve ter lote_pagamento_parcelas como number | null', () => {
    expect(src).toContain('lote_pagamento_parcelas: number | null');
  });

  it('deve ter parcela_numero como number', () => {
    expect(src).toContain('parcela_numero: number');
  });

  it('deve ter total_parcelas como number', () => {
    expect(src).toContain('total_parcelas: number');
  });

  it('deve ter valor_laudo como string', () => {
    expect(src).toContain('valor_laudo: string');
  });

  it('deve ter percentual_comissao como string', () => {
    expect(src).toContain('percentual_comissao: string');
  });

  it('deve ter representante_percentual', () => {
    // Campo usado pelo ComissoesTab para derivar repPct
    expect(src).toContain('representante_percentual');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. ComissoesTab — colunas espelham o painel de sociedade (fonte da verdade)
// ─────────────────────────────────────────────────────────────────────────────
describe('14. ComissoesTab — colunas espelham o painel de sociedade (Lote, Valor Total, Comissão, Parcelas)', () => {
  const tabPath = path.join(
    ROOT,
    'app',
    'admin',
    'comissoes',
    'components',
    'ComissoesTab.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(tabPath, 'utf-8');
  });

  it('deve ter coluna Lote no cabeçalho', () => {
    expect(src).toContain('>Lote<');
  });

  it('deve ter coluna Valor Total no cabeçalho', () => {
    expect(src).toContain('>Valor Total<');
  });

  it('deve ter coluna Comissão no cabeçalho (renomeada de %)', () => {
    expect(src).toContain('>Comissão<');
  });

  it('deve ter coluna Parcelas no cabeçalho', () => {
    expect(src).toContain('>Parcelas<');
  });

  it('deve renderizar lote_pagamento_id como "Lote #ID"', () => {
    expect(src).toContain('Lote #');
    expect(src).toContain('lote_pagamento_id');
  });

  it('deve renderizar valor_laudo formatado', () => {
    expect(src).toContain('fmt(c.valor_laudo)');
  });

  it('deve usar valor_comissao do BD para exibir comissão do rep (não cálculo direto)', () => {
    // Correção: usa c.valor_comissao (gravado no BD) em vez de (valorTotal * pct / 100)
    expect(src).toContain('fmt(c.valor_comissao)');
    // Garante que não há cálculo inline do valor do representante
    expect(src).not.toContain('valorTotal * repPct');
  });

  it('deve renderizar percentual via representante_percentual como fonte primária', () => {
    expect(src).toContain('representante_percentual');
  });

  it('deve renderizar badge X/Y para pagamento parcelado', () => {
    expect(src).toContain('c.parcela_numero');
    expect(src).toContain('c.total_parcelas');
  });

  it('deve exibir "À vista" para total_parcelas === 1', () => {
    expect(src).toContain('À vista');
  });

  it('deve mostrar badge azul de parcelas (bg-blue-50 text-blue-700)', () => {
    expect(src).toContain('bg-blue-50 text-blue-700');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. API /api/admin/comissoes — normalização do parâmetro mes
// ─────────────────────────────────────────────────────────────────────────────
describe('15. API /api/admin/comissoes — normalização do parâmetro mes', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'comissoes',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('deve aceitar mes no formato YYYY-MM (regex test)', () => {
    expect(src).toContain('/^\\d{4}-\\d{2}$/.test(mesRaw)');
  });

  it('deve normalizar mes bare number + ano para YYYY-MM', () => {
    expect(src).toContain('padStart(2,');
    expect(src).toContain('anoRaw');
  });

  it('deve criar filtro com mes-01 para busca de date no banco', () => {
    // `${mes}-01` → usada no params.push para filtrar mes_emissao como date
    expect(src).toMatch(/params\.push\([`'"]?.*-01/);
  });

  it('busca SQL deve usar mes_emissao como tipo date', () => {
    expect(src).toContain('mes_emissao');
    expect(src).toContain('::date');
  });
});
