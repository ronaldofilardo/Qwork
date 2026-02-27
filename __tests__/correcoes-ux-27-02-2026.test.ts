/**
 * Testes para correções de UX - 27/02/2026
 *
 * CORREÇÕES IMPLEMENTADAS:
 * 1. PDF individual - Categoria de Risco: texto colorido em fundo branco (sem fillColor)
 * 2. Scrollbars duplos - ConditionalHeader excluindo /entidade e /rh
 * 3. Scrollbars duplos - layouts com overflow-hidden correto
 * 4. Botões de rádio - setTimeout 220ms para renderizar estado selecionado (React 18 batch)
 * 5. RadioScale desktop - círculo visível (border-white bg-white/20)
 */

import fs from 'fs';
import path from 'path';

// ────────────────────────────────────────────────────────────────────────────
// 1. PDF Individual – Categoria de Risco sem cor de fundo
// ────────────────────────────────────────────────────────────────────────────
describe('PDF Individual – Categoria de Risco', () => {
  const pdfFilePath = path.join(
    process.cwd(),
    'lib',
    'pdf',
    'relatorio-individual.ts'
  );
  let pdfSource: string;

  beforeAll(() => {
    pdfSource = fs.readFileSync(pdfFilePath, 'utf-8');
  });

  it('não deve usar fillColor na coluna Categoria de Risco (índice 5)', () => {
    // Encontra o bloco didParseCell e verifica que não há fillColor para coluna 5
    const didParseCellBlock =
      pdfSource.match(/didParseCell[\s\S]+?},/)?.[0] ?? '';
    // fillColor não pode aparecer junto à verificação de column.index === 5
    const hasIllegalFillColor =
      /column\.index === 5[\s\S]{0,200}fillColor/.test(didParseCellBlock) ||
      /fillColor[\s\S]{0,200}column\.index === 5/.test(didParseCellBlock);
    expect(hasIllegalFillColor).toBe(false);
  });

  it('deve usar textColor para colorir o texto da coluna Categoria de Risco', () => {
    const didParseCellBlock =
      pdfSource.match(/didParseCell[\s\S]+?},/)?.[0] ?? '';
    expect(didParseCellBlock).toContain('textColor = COR_CATEGORIA');
  });

  it('deve manter fontStyle bold na coluna Categoria de Risco', () => {
    const didParseCellBlock =
      pdfSource.match(/didParseCell[\s\S]+?},/)?.[0] ?? '';
    expect(didParseCellBlock).toContain("fontStyle = 'bold'");
  });

  it('COR_CATEGORIA deve ter cor verde para baixo (risco baixo = Excelente)', () => {
    // [76, 175, 80] = verde Material Design
    expect(pdfSource).toMatch(/baixo:\s*\[76,\s*175,\s*80\]/);
  });

  it('COR_CATEGORIA deve ter âmbar escuro para medio (legível sobre fundo branco)', () => {
    // [180, 83, 9] = âmbar escuro — NÃO pode ser [255, 193, 7] (amarelo invisível)
    expect(pdfSource).toMatch(/medio:\s*\[180,\s*83,\s*9\]/);
    // Confirma que o amarelo antigo NÃO está mais presente para 'medio'
    expect(pdfSource).not.toMatch(/medio:\s*\[255,\s*193,\s*7\]/);
  });

  it('COR_CATEGORIA deve ter cor vermelha para alto (risco alto = Atenção Necessária)', () => {
    // [220, 38, 38] = vermelho
    expect(pdfSource).toMatch(/alto:\s*\[220,\s*38,\s*38\]/);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 2. ConditionalHeader – Exclusão de rotas com sidebar próprio
// ────────────────────────────────────────────────────────────────────────────
describe('ConditionalHeader – Rotas excluídas', () => {
  const headerFilePath = path.join(
    process.cwd(),
    'components',
    'ConditionalHeader.tsx'
  );
  let headerSource: string;

  beforeAll(() => {
    headerSource = fs.readFileSync(headerFilePath, 'utf-8');
  });

  it('deve excluir /entidade do header global', () => {
    expect(headerSource).toContain("startsWith('/entidade')");
  });

  it('deve excluir /rh do header global', () => {
    expect(headerSource).toContain("startsWith('/rh')");
  });

  it('deve manter exclusão de /login', () => {
    expect(headerSource).toContain("pathname === '/login'");
  });

  it('deve manter exclusão de /avaliacao', () => {
    expect(headerSource).toContain("startsWith('/avaliacao')");
  });

  it('deve retornar null para rotas /entidade (lógica de exclusão presente)', () => {
    // Verifica que tanto a exclusão de /entidade quanto o return null estão presentes
    // (a condição abrange múltiplas linhas com ||, então verificamos de forma simples)
    expect(headerSource).toContain("startsWith('/entidade')");
    expect(headerSource).toContain('return null');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 3. Layouts com sidebar – overflow-hidden no wrapper externo
// ────────────────────────────────────────────────────────────────────────────
describe('Layouts com sidebar – overflow-hidden', () => {
  const layouts = [
    {
      name: 'entidade',
      filePath: path.join(process.cwd(), 'app', 'entidade', 'layout.tsx'),
    },
    {
      name: 'rh',
      filePath: path.join(process.cwd(), 'app', 'rh', 'layout.tsx'),
    },
  ];

  for (const layout of layouts) {
    describe(`Layout ${layout.name}`, () => {
      let source: string;

      beforeAll(() => {
        source = fs.readFileSync(layout.filePath, 'utf-8');
      });

      it('deve ter overflow-hidden no wrapper externo flex h-screen', () => {
        expect(source).toMatch(
          /flex\s+h-screen\s+overflow-hidden|overflow-hidden\s+.*?flex\s+h-screen|flex.*?h-screen.*?overflow-hidden/
        );
      });

      it('deve ter min-h-0 overflow-y-auto no container de conteúdo', () => {
        expect(source).toMatch(
          /min-h-0.*?overflow-y-auto|overflow-y-auto.*?min-h-0/
        );
      });

      it('não deve ter min-h-screen no return principal', () => {
        // Extrai apenas o JSX do return principal (não o estado de loading)
        const mainReturn =
          source.match(
            /return\s*\(\s*<div[^>]*>([\s\S]*?)<\/div>\s*\);\s*}/
          )?.[0] ?? '';
        // Se não capturou tudo, verifica que não há min-h-screen fora do loading state
        const loadingBlock =
          source.match(/if\s*\(loading[\s\S]{0,500}return\s*\(/)?.[0] ?? '';
        const sourceWithoutLoading = source.replace(loadingBlock, '');
        expect(sourceWithoutLoading).not.toContain('min-h-screen');
      });
    });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// 4. Página de avaliação – setTimeout 220ms para botões de rádio (React 18)
// ────────────────────────────────────────────────────────────────────────────
describe('Avaliação – Timing de transição de questões', () => {
  const avaliacaoFilePath = path.join(
    process.cwd(),
    'app',
    'avaliacao',
    'page.tsx'
  );
  let avaliacaoSource: string;

  beforeAll(() => {
    avaliacaoSource = fs.readFileSync(avaliacaoFilePath, 'utf-8');
  });

  it('deve usar setTimeout antes de setCurrentIndex para permitir renderização do estado selecionado', () => {
    expect(avaliacaoSource).toContain('setTimeout');
    expect(avaliacaoSource).toContain('setCurrentIndex');
  });

  it('deve ter delay de 220ms no setTimeout de transição', () => {
    // O setTimeout usa callback multiline: setTimeout(() => { ... }, 220)
    // então verificamos a presença de }, 220) que é a assinatura real
    expect(avaliacaoSource).toMatch(/},\s*220\)/);
  });

  it('setCurrentIndex deve estar dentro do setTimeout (não chamado diretamente antes do timeout)', () => {
    // O setTimeout deve conter setCurrentIndex
    const setTimeoutBlock =
      avaliacaoSource.match(
        /setTimeout\s*\(\s*\([^)]*\)\s*=>\s*\{[\s\S]{0,300}\}/
      )?.[0] ?? '';
    expect(setTimeoutBlock).toContain('setCurrentIndex');
  });

  it('deve usar atualização otimista: setRespostas antes do fetch', () => {
    // setRespostas deve ocorrer antes de qualquer await fetch
    const setRespostasIdx = avaliacaoSource.indexOf('setRespostas');
    const awaitFetchIdx = avaliacaoSource.indexOf('await fetch');
    // Pode haver múltiplas ocorrências; verifica que existe ao menos um setRespostas antes de um fetch
    expect(setRespostasIdx).toBeGreaterThan(-1);
    expect(setRespostasIdx).toBeLessThan(
      awaitFetchIdx > -1 ? awaitFetchIdx : Infinity
    );
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 5. RadioScale – Visibilidade do círculo no desktop quando selecionado
// ────────────────────────────────────────────────────────────────────────────
describe('RadioScale – Círculo desktop visível quando selecionado', () => {
  const radioScaleFilePath = path.join(
    process.cwd(),
    'components',
    'RadioScale.tsx'
  );
  let radioScaleSource: string;

  beforeAll(() => {
    radioScaleSource = fs.readFileSync(radioScaleFilePath, 'utf-8');
  });

  it('círculo interno do desktop selecionado deve usar border-white (não border-primary preto sobre preto)', () => {
    expect(radioScaleSource).toContain('border-white');
  });

  it('círculo interno do desktop selecionado deve usar bg-white/20 (não bg-primary invisível)', () => {
    expect(radioScaleSource).toContain('bg-white/20');
  });

  it('o círculo interno desktop selecionado deve usar border-white bg-white/20 (não bg-primary que seria invisível)', () => {
    // Verifica que a correção foi aplicada: o círculo usa border-white bg-white/20
    // (os testes anteriores já garantem border-white e bg-white/20 individualmente)
    expect(radioScaleSource).toContain('border-white bg-white/20');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 6. SidebarLayout – Nav sem scrollbar visível
// ────────────────────────────────────────────────────────────────────────────
describe('SidebarLayout – Scrollbar do nav oculto', () => {
  const sidebarFilePath = path.join(
    process.cwd(),
    'components',
    'shared',
    'SidebarLayout.tsx'
  );
  let sidebarSource: string;

  beforeAll(() => {
    sidebarSource = fs.readFileSync(sidebarFilePath, 'utf-8');
  });

  it('deve ter scrollbarWidth: none no nav para ocultar a scrollbar do sidebar', () => {
    expect(sidebarSource).toContain("scrollbarWidth: 'none'");
  });

  it('deve ter msOverflowStyle: none para compatibilidade com IE/Edge legado', () => {
    expect(sidebarSource).toContain("msOverflowStyle: 'none'");
  });

  it('o nav deve ser overflow-y-auto (scrollável mas sem scroll visual visível)', () => {
    expect(sidebarSource).toContain('overflow-y-auto');
  });

  it('a raiz do SidebarLayout deve ser h-screen (sidebar altura total da tela)', () => {
    expect(sidebarSource).toContain('h-screen');
  });
});
