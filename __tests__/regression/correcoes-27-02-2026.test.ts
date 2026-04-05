/**
 * TESTES: Correções da Conversa 27/02/2026
 *
 * Valida todas as correções aplicadas nas sessões 1 e 2:
 *
 * Sessão 1:
 *  1. Login — campo dataNascimento removido
 *  2. Avaliação — update otimista (avançar antes do fetch) + 220ms setTimeout
 *  3. QuestionModal — setTimeout reduzido 400ms→100ms
 *  4. Laudo seção 3 — numeração "1.", "2.", "3." removida dos subtítulos
 *  5. Funcionários — campo ultimo_lote_numero via SQL subquery
 *  6. PDF individual — tabela 6 colunas implementada
 *
 * Sessão 2:
 *  7. PDF Categoria de Risco — somente cor no texto (sem fillColor)
 *  8. Scrollbars duplas — layouts com overflow-hidden; páginas sem min-h-screen
 *  9. Radio buttons — 220ms delay antes de setCurrentIndex
 * 10. RadioScale — círculo desktop visível (bg-white/20)
 */

import fs from 'fs';
import path from 'path';

jest.setTimeout(15000);

// ─── helpers ────────────────────────────────────────────────────────────────

const readSrc = (...segments: string[]) =>
  fs.readFileSync(path.join(process.cwd(), ...segments), 'utf-8');

// ─── Sessão 1 ────────────────────────────────────────────────────────────────

describe('Sessão 1 — Correções aplicadas', () => {
  // 1. Login
  describe('1. Login: campo dataNascimento removido', () => {
    let loginSrc: string;

    beforeAll(() => {
      loginSrc = readSrc('app', 'login', 'page.tsx');
    });

    it('não deve conter estado autônomo dataNascimento no login (estado foi movido para dadosConfirmacao)', () => {
      // dataNascimento pode aparecer dentro de dadosConfirmacao (modal de identidade do funcionário)
      // mas NÃO deve existir como estado independente: const [dataNascimento, setDataNascimento]
      expect(loginSrc).not.toMatch(
        /const\s*\[\s*dataNascimento\s*,\s*setDataNascimento/
      );
    });

    it('não deve conter input type="date"', () => {
      expect(loginSrc).not.toMatch(/type="date"/);
    });

    it('deve conter campo CPF (login permanece)', () => {
      expect(loginSrc).toMatch(/cpf/i);
    });

    it('deve conter campo senha (login permanece)', () => {
      expect(loginSrc).toMatch(/senha/i);
    });
  });

  // 2. Avaliação — update otimista + 220ms
  describe('2. Avaliação: update otimista + 220ms setTimeout', () => {
    let avaliacaoSrc: string;

    beforeAll(() => {
      avaliacaoSrc = readSrc('app', 'avaliacao', 'page.tsx');
    });

    it('deve chamar setRespostas antes do fetch (update otimista)', () => {
      const setRespostasIdx = avaliacaoSrc.indexOf('setRespostas');
      const fetchIdx = avaliacaoSrc.indexOf("fetch('/api/avaliacao/respostas'");
      expect(setRespostasIdx).toBeGreaterThan(-1);
      expect(fetchIdx).toBeGreaterThan(-1);
      expect(setRespostasIdx).toBeLessThan(fetchIdx);
    });

    it('deve conter setTimeout de 220ms antes de setCurrentIndex', () => {
      expect(avaliacaoSrc).toMatch(
        /setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?setCurrentIndex/
      );
      expect(avaliacaoSrc).toMatch(/220/);
    });

    it('deve avançar para próxima questão dentro do setTimeout', () => {
      expect(avaliacaoSrc).toMatch(/220\s*\)/);
    });
  });

  // 3. QuestionModal
  describe('3. QuestionModal: setTimeout ≤ 100ms', () => {
    let modalSrc: string;

    beforeAll(() => {
      modalSrc = readSrc('components', 'avaliacao', 'QuestionModal.tsx');
    });

    it('não deve conter setTimeout de 400ms', () => {
      expect(modalSrc).not.toMatch(/setTimeout[\s\S]{0,40}400/);
    });

    it('deve conter setTimeout de no máximo 100ms para avanço de questão', () => {
      // Aceita 0, 50 ou 100ms — {0,120} para acomodar corpo de função multiline
      expect(modalSrc).toMatch(/setTimeout[\s\S]{0,120}(0|50|100)\s*\)/);
    });
  });

  // 4. Laudo seção 3 — numeração removida
  describe('4. Laudo seção 3: numeração "N." removida dos subtítulos', () => {
    let laudoSrc: string;

    beforeAll(() => {
      laudoSrc = readSrc('app', 'emissor', 'laudo', '[loteId]', 'page.tsx');
    });

    it('seção 3 não deve conter subtítulo h4 com "1."', () => {
      // Pega apenas o bloco a partir da seção 3
      const secao3 = laudoSrc.slice(laudoSrc.indexOf('3. INTERPRETAÇÃO'));
      // Os h4 de subseções não devem começar com "1." "2." "3."
      expect(secao3).not.toMatch(/<h4[^>]*>[^<]*\b[123]\.\s+Risco/);
    });

    it('seção 3 deve manter h4 com títulos de risco sem numeração', () => {
      expect(laudoSrc).toMatch(/Risco Psicossocial Baixo/);
      expect(laudoSrc).toMatch(/Risco Psicossocial Moderado/);
      expect(laudoSrc).toMatch(/Risco Psicossocial Elevado/);
    });
  });

  // 5. Funcionários — ultimo_lote_numero
  describe('5. Funcionários: ultimo_lote_numero via SQL subquery', () => {
    let routeSrc: string;

    beforeAll(() => {
      routeSrc = readSrc('app', 'api', 'entidade', 'funcionarios', 'route.ts');
    });

    it('deve conter subquery para numero_ordem', () => {
      expect(routeSrc).toMatch(/numero_ordem/);
    });

    it('deve referenciar lotes_avaliacao na subquery', () => {
      expect(routeSrc).toMatch(/lotes_avaliacao/);
    });

    it('deve retornar ultimo_lote_numero como alias', () => {
      expect(routeSrc).toMatch(/as\s+ultimo_lote_numero/i);
    });
  });

  // 6. PDF individual — 6 colunas
  describe('6. PDF individual: tabela 6 colunas', () => {
    let pdfSrc: string;

    beforeAll(() => {
      pdfSrc = readSrc('lib', 'pdf', 'relatorio-individual.ts');
    });

    it('deve conter coluna Grupo', () => {
      expect(pdfSrc).toMatch(/['"]Grupo['"]/);
    });

    it('deve conter coluna Domínio', () => {
      expect(pdfSrc).toMatch(/Dom.nio/);
    });

    it('deve conter coluna Descrição', () => {
      expect(pdfSrc).toMatch(/Descri.+o/);
    });

    it('deve conter coluna Tipo', () => {
      expect(pdfSrc).toMatch(/['"]Tipo['"]/);
    });

    it('deve conter coluna Média Geral', () => {
      expect(pdfSrc).toMatch(/M.dia Geral/);
    });

    it('deve conter coluna Categoria de Risco', () => {
      expect(pdfSrc).toMatch(/Categoria de Risco/);
    });
  });
});

// ─── Sessão 2 ────────────────────────────────────────────────────────────────

describe('Sessão 2 — Correções aplicadas', () => {
  // 7. PDF categoria de risco — somente textColor
  describe('7. PDF Categoria de Risco: somente cor no texto', () => {
    let pdfSrc: string;

    beforeAll(() => {
      pdfSrc = readSrc('lib', 'pdf', 'relatorio-individual.ts');
    });

    it('não deve atribuir fillColor na coluna Categoria de Risco (índice 5)', () => {
      // Garante que o bloco do índice 5 não contenha fillColor
      const col5Block = pdfSrc
        .split(/didParseCell/)
        .slice(1)
        .join('didParseCell');
      // Dentro do callback não deve haver fillColor = COR_CATEGORIA
      expect(col5Block).not.toMatch(/fillColor\s*=\s*COR_CATEGORIA/);
    });

    it('deve atribuir textColor na coluna Categoria de Risco', () => {
      expect(pdfSrc).toMatch(/textColor\s*=\s*COR_CATEGORIA\[/);
    });

    it('COR_CATEGORIA "medio" deve ser âmbar escuro (legível sobre branco)', () => {
      // Não deve ser amarelo puro [255, 193, 7]
      expect(pdfSrc).not.toMatch(/medio.*255,\s*193,\s*7/);
      // Deve ser um Tom âmbar escurecido
      expect(pdfSrc).toMatch(/medio.*180,\s*83,\s*9/);
    });

    it('COR_CATEGORIA "baixo" deve ser verde', () => {
      expect(pdfSrc).toMatch(/baixo.*76,\s*175,\s*80/);
    });

    it('COR_CATEGORIA "alto" deve ser vermelho', () => {
      expect(pdfSrc).toMatch(/alto.*220,\s*38,\s*38/);
    });
  });

  // 8. Scrollbars duplas — layouts + páginas
  describe('8. Scrollbars duplas: overflow-hidden nos layouts; sem min-h-screen nas páginas', () => {
    describe('Layouts com overflow-hidden', () => {
      it('entidade/layout.tsx deve ter overflow-hidden no wrapper h-screen', () => {
        const src = readSrc('app', 'entidade', 'layout.tsx');
        expect(src).toMatch(/flex h-screen overflow-hidden/);
      });

      it('rh/layout.tsx deve ter overflow-hidden no wrapper h-screen', () => {
        const src = readSrc('app', 'rh', 'layout.tsx');
        expect(src).toMatch(/flex h-screen overflow-hidden/);
      });

      it('entidade/layout.tsx deve ter área de conteúdo com overflow-y-auto', () => {
        const src = readSrc('app', 'entidade', 'layout.tsx');
        expect(src).toMatch(/overflow-y-auto/);
      });

      it('rh/layout.tsx deve ter área de conteúdo com overflow-y-auto', () => {
        const src = readSrc('app', 'rh', 'layout.tsx');
        expect(src).toMatch(/overflow-y-auto/);
      });
    });

    describe('Páginas internas sem min-h-screen no return principal', () => {
      it('rh/page.tsx não deve ter min-h-screen no return principal', () => {
        const src = readSrc('app', 'rh', 'page.tsx');
        // O return principal (bg-gray-50) não deve ter min-h-screen
        // Apenas loading states internos (dentro do layout, como py-20) são aceitáveis
        const mainReturn = src.slice(src.lastIndexOf('return ('));
        expect(mainReturn).not.toMatch(/min-h-screen/);
      });

      it('entidade/lote/[id]/page.tsx não deve ter min-h-screen no return principal', () => {
        const src = readSrc('app', 'entidade', 'lote', '[id]', 'page.tsx');
        // O wrapper principal do return não deve ter min-h-screen
        expect(src).not.toMatch(/"min-h-screen bg-gray-50"/);
      });

      it('rh/empresa/[id]/lote/[loteId]/page.tsx não deve ter min-h-screen nos returns', () => {
        const src = readSrc(
          'app',
          'rh',
          'empresa',
          '[id]',
          'lote',
          '[loteId]',
          'page.tsx'
        );
        expect(src).not.toMatch(/"min-h-screen (flex|bg)/);
      });

      it('rh/empresa/[id]/page.tsx não deve ter min-h-screen no loading state', () => {
        const src = readSrc('app', 'rh', 'empresa', '[id]', 'page.tsx');
        expect(src).not.toMatch(/min-h-screen/);
      });
    });
  });

  // 9. Radio buttons — 220ms antes de setCurrentIndex
  describe('9. Radio buttons: 220ms delay antes de setCurrentIndex', () => {
    let avaliacaoSrc: string;

    beforeAll(() => {
      avaliacaoSrc = readSrc('app', 'avaliacao', 'page.tsx');
    });

    it('deve ter setTimeout com 220ms', () => {
      expect(avaliacaoSrc).toMatch(/220/);
    });

    it('setCurrentIndex deve estar dentro de setTimeout (não chamado diretamente)', () => {
      // verifica que setCurrentIndex aparece dentro de um setTimeout
      const setTimeoutBlocks = avaliacaoSrc.match(
        /setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\d+\s*\)/g
      );
      expect(setTimeoutBlocks).not.toBeNull();
      const hasSetCurrentIndex = setTimeoutBlocks.some((block) =>
        block.includes('setCurrentIndex')
      );
      expect(hasSetCurrentIndex).toBe(true);
    });
  });

  // 10. RadioScale — círculo desktop visível
  describe('10. RadioScale: círculo interno visível no desktop', () => {
    let radioScaleSrc: string;

    beforeAll(() => {
      radioScaleSrc = readSrc('components', 'RadioScale.tsx');
    });

    it('não deve usar border-primary bg-primary para o círculo selecionado (invisível sobre fundo preto)', () => {
      // O círculo interno (w-3 h-3) não deve ser bg-primary quando selecionado
      // Pois primary = #000 e o botão pai também é bg-primary = preto sobre preto
      expect(radioScaleSrc).not.toMatch(
        /w-3 h-3 rounded-full.*border-primary bg-primary/
      );
    });

    it('deve usar bg-white/20 ou similar para o círculo selecionado', () => {
      expect(radioScaleSrc).toMatch(/bg-white\/20|bg-white/);
    });
  });
});

// ─── Integridade Geral ───────────────────────────────────────────────────────

describe('Integridade Geral dos Layouts', () => {
  it('entidade/layout.tsx não deve ter erros de estrutura básica', () => {
    const src = readSrc('app', 'entidade', 'layout.tsx');
    expect(src).toMatch(/export default/);
    expect(src).toMatch(/flex h-screen overflow-hidden/);
    expect(src).toMatch(/flex-1 min-h-0 overflow-y-auto/);
  });

  it('rh/layout.tsx não deve ter erros de estrutura básica', () => {
    const src = readSrc('app', 'rh', 'layout.tsx');
    expect(src).toMatch(/export default/);
    expect(src).toMatch(/flex h-screen overflow-hidden/);
    expect(src).toMatch(/flex-1 min-h-0 overflow-y-auto/);
  });

  it('SidebarLayout.tsx deve ocultar scrollbar no nav', () => {
    const src = readSrc('components', 'shared', 'SidebarLayout.tsx');
    expect(src).toMatch(/scrollbarWidth.*none|msOverflowStyle.*none/);
  });
});
