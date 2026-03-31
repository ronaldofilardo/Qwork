/**
 * @jest-environment jsdom
 *
 * @file __tests__/ui/lote-botao-pdf-individual-removido.test.ts
 *
 * Valida que o botão de geração de PDF individual por avaliação
 * foi removido das páginas de lote (RH e Entidade).
 *
 * Correção aplicada em 26/03/2026:
 * - app/rh/empresa/[id]/lote/[loteId]/page.tsx — botão 📄 PDF removido
 * - app/entidade/lote/[id]/page.tsx — botão <FileText> PDF removido
 *
 * O relatório individual por avaliação não deve ser acessível via UI
 * nestas páginas. O botão era: onClick → gerarRelatorioFuncionario(cpf, nome)
 */

import fs from 'fs';
import path from 'path';

const RH_LOTE_PAGE = path.resolve(
  process.cwd(),
  'app/rh/empresa/[id]/lote/[loteId]/page.tsx'
);

const ENTIDADE_LOTE_PAGE = path.resolve(
  process.cwd(),
  'app/entidade/lote/[id]/page.tsx'
);

function readPage(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

describe('Botão PDF individual removido — página RH lote', () => {
  let source: string;

  beforeAll(() => {
    source = readPage(RH_LOTE_PAGE);
  });

  it('não deve conter botão com onClick para gerarRelatorioFuncionario', () => {
    // O botão tinha: onClick={() => gerarRelatorioFuncionario(func.cpf, func.nome)
    // Verifica que não há botão chamando gerarRelatorioFuncionario no JSX
    const buttonWithPDFCallback =
      /onClick\s*=\s*\{[^}]*gerarRelatorioFuncionario/;
    expect(source).not.toMatch(buttonWithPDFCallback);
  });

  it('não deve renderizar botão com texto "📄 PDF"', () => {
    expect(source).not.toContain('📄 PDF');
  });

  it('não deve ter botão com título "Gerar relatório PDF" (individual)', () => {
    // O botão individual tinha title="Gerar relatório PDF"
    // (diferente do botão de lote que tem title="Gerar Relatório PDF do Lote")
    expect(source).not.toContain('title="Gerar relatório PDF"');
  });

  it('não deve ter disabled baseado em status de avaliação individual para PDF', () => {
    // O botão tinha: disabled={func.avaliacao.status !== 'concluido' && ...}
    // junto com título de relatório PDF — esse padrão não deve existir mais
    const disabledPDFPattern =
      /disabled=\{[^}]*concluido[^}]*\}[\s\S]{0,200}📄 PDF/;
    expect(source).not.toMatch(disabledPDFPattern);
  });

  it('não deve conter mensagem "Relatório disponível apenas para avaliações concluídas"', () => {
    expect(source).not.toContain(
      'Relatório disponível apenas para avaliações concluídas'
    );
  });

  it('ainda deve conter botões de Inativar e Reset (não removidos)', () => {
    expect(source).toContain('Inativar');
    expect(source).toContain('Reset');
  });

  it('não deve ter referência a /api/rh/relatorio-individual-pdf dentro de onclick de linha da tabela', () => {
    // O botão individual chamava: /api/rh/relatorio-individual-pdf?lote_id=...&cpf=...
    // Esperamos que essa URL não seja mais usada inline na tabela de funcionários
    // (pode existir em outros contextos como useCallback fora da tabela)
    const inlineIndividualCall =
      /onClick[\s\S]{0,50}relatorio-individual-pdf[\s\S]{0,50}func\.cpf/;
    expect(source).not.toMatch(inlineIndividualCall);
  });
});

describe('Botão PDF individual removido — página Entidade lote', () => {
  let source: string;

  beforeAll(() => {
    source = readPage(ENTIDADE_LOTE_PAGE);
  });

  it('não deve conter botão com onClick para gerarRelatorioFuncionario em <td>', () => {
    const buttonWithPDFCallback =
      /onClick\s*=\s*\{[^}]*gerarRelatorioFuncionario/;
    expect(source).not.toMatch(buttonWithPDFCallback);
  });

  it('não deve ter <td> com botão PDF condicional baseado em avaliacao.status concluida', () => {
    // O padrão removido era:
    // <td ...> {(func.avaliacao.status === 'concluida' || ...) && <button>...<FileText>PDF</button>} </td>
    const removedPattern = /avaliacao\.status.*concluida[\s\S]{0,100}<FileText/;
    expect(source).not.toMatch(removedPattern);
  });

  it('não deve conter <th> "Ações" na tabela de funcionários (coluna removida)', () => {
    // Em entidade o th Ações foi completamente removido
    // Verificamos que o th com texto "Ações" na seção da tabela não existe
    expect(source).not.toMatch(/<th[^>]*>\s*Ações\s*<\/th>/);
  });

  it('ainda deve conter botões de Inativar e Reset', () => {
    expect(source).toContain('Inativar');
    expect(source).toContain('Reset');
  });
});
