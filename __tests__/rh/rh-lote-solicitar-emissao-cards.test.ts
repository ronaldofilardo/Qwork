/**
 * Teste: Cards de Solicitação de Emissão - Página RH Lote
 *
 * Valida que a página de detalhes do lote RH tem:
 * 1. Card verde "Lote Concluído" com botão "Solicitar Emissão"
 * 2. Card azul "Emissão Solicitada" após solicitar
 * 3. Card roxo "Laudo Emitido" quando tem laudo
 * 4. Comportamento idêntico à página de entidade
 */

import * as fs from 'fs';
import * as path from 'path';

describe('RH Lote - Cards de Solicitação de Emissão', () => {
  let rhLotePageContent: string;
  let entidadeLotePageContent: string;

  beforeAll(() => {
    const rhPath = path.join(
      process.cwd(),
      'app/rh/empresa/[id]/lote/[loteId]/page.tsx'
    );
    const entidadePath = path.join(
      process.cwd(),
      'app/entidade/lote/[id]/page.tsx'
    );

    rhLotePageContent = fs.readFileSync(rhPath, 'utf-8');
    entidadeLotePageContent = fs.readFileSync(entidadePath, 'utf-8');
  });

  describe('1. Card Verde - Lote Concluído com Botão', () => {
    it('deve ter card verde quando lote concluído sem emissão solicitada', () => {
      // Verificar estrutura condicional
      const greenCardPattern =
        /lote\.status === 'concluido'[\s\S]*?!lote\.emissao_solicitada[\s\S]*?!lote\.tem_laudo/;
      expect(rhLotePageContent).toMatch(greenCardPattern);

      // Verificar classes do card verde
      expect(rhLotePageContent).toContain(
        'from-green-50 to-emerald-50 border-2 border-green-300'
      );
      expect(rhLotePageContent).toContain('Lote Concluído');
    });

    it('deve ter botão "Solicitar Emissão do Laudo"', () => {
      expect(rhLotePageContent).toContain('Solicitar Emissão do Laudo');
      expect(rhLotePageContent).toContain(
        'from-green-600 to-emerald-600 text-white'
      );
      expect(rhLotePageContent).toContain('🚀');
    });

    it('deve chamar /api/lotes/[loteId]/solicitar-emissao', () => {
      expect(rhLotePageContent).toContain(
        '/api/lotes/${lote.id}/solicitar-emissao'
      );
      expect(rhLotePageContent).toMatch(/method:\s*['"]POST['"]/);
    });

    it('deve recarregar dados após sucesso (loadLoteData)', () => {
      // Verificar que após sucesso chama loadLoteData ao invés de window.location.reload
      const successPattern =
        /toast\.success[\s\S]*?setTimeout.*loadLoteData.*1500/;
      expect(rhLotePageContent).toMatch(successPattern);
    });
  });

  describe('2. Card Azul - Emissão Solicitada', () => {
    it('deve ter card azul quando emissão foi solicitada mas sem laudo', () => {
      const blueCardPattern =
        /lote\.emissao_solicitada[\s\S]*?!lote\.tem_laudo/;
      expect(rhLotePageContent).toMatch(blueCardPattern);

      expect(rhLotePageContent).toContain(
        'from-blue-50 to-indigo-50 border-2 border-blue-300'
      );
      expect(rhLotePageContent).toContain('Emissão Solicitada');
    });

    it('deve mostrar data de solicitação', () => {
      expect(rhLotePageContent).toMatch(
        /lote\.emissao_solicitado_em[\s\S]*?formatDate/
      );
      expect(rhLotePageContent).toContain(
        'A emissão do laudo foi solicitada em'
      );
    });

    it('não deve ter botão de solicitação (card informativo apenas)', () => {
      // O card azul não deve ter botão - verificar que não há button dentro dele
      const blueCardSection = rhLotePageContent.match(
        /lote\.emissao_solicitada && !lote\.tem_laudo[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/
      );
      expect(blueCardSection).toBeTruthy();
      if (blueCardSection) {
        expect(blueCardSection[0]).not.toContain('<button');
      }
    });
  });

  describe('3. Card Roxo - Laudo Emitido', () => {
    it('deve ter card roxo quando tem laudo', () => {
      const purpleCardPattern = /lote\.tem_laudo/;
      expect(rhLotePageContent).toMatch(purpleCardPattern);

      expect(rhLotePageContent).toContain(
        'from-purple-50 to-violet-50 border-2 border-purple-300'
      );
      expect(rhLotePageContent).toContain('Laudo Emitido');
    });

    it('deve mostrar status do laudo (emitido/enviado)', () => {
      expect(rhLotePageContent).toMatch(
        /lote\.laudo_status === 'enviado'[\s\S]*?e enviado/
      );
    });

    it('deve mostrar data de emissão', () => {
      expect(rhLotePageContent).toMatch(/lote\.emitido_em[\s\S]*?formatDate/);
      expect(rhLotePageContent).toContain('Emitido em');
    });
  });

  describe('4. Estrutura - Posicionamento Correto', () => {
    it('cards devem estar FORA do card principal (após o fechamento)', () => {
      // Verificar que os cards estão após </div></div></div> (fechamento do card principal)
      const mainCardEnd = rhLotePageContent.indexOf('{/* Filtros e Busca */}');
      const greenCardStart = rhLotePageContent.indexOf(
        'Botão de Solicitação de Emissão - só aparece'
      );

      expect(greenCardStart).toBeGreaterThan(0);
      expect(greenCardStart).toBeLessThan(mainCardEnd);
    });

    it('não deve usar componente BotaoSolicitarEmissao', () => {
      // A implementação atual usa cards inline ao invés do componente
      // Verificar que não há importação ou uso do componente
      expect(rhLotePageContent).not.toContain(
        "import { BotaoSolicitarEmissao } from '@/components/BotaoSolicitarEmissao'"
      );
      expect(rhLotePageContent).not.toContain('<BotaoSolicitarEmissao');
    });
  });

  describe('5. Imports Necessários', () => {
    it('deve importar toast do react-hot-toast', () => {
      expect(rhLotePageContent).toContain(
        "import toast from 'react-hot-toast'"
      );
    });

    it('deve ter import de formatDate ou usar função local', () => {
      // Verificar que formatDate está disponível (importado ou definido)
      const hasFormatDate =
        rhLotePageContent.includes('formatDate') ||
        rhLotePageContent.includes('formatarData');
      expect(hasFormatDate).toBe(true);
    });
  });

  describe('6. Paridade com Entidade', () => {
    it('estrutura de cards deve ser idêntica à da entidade', () => {
      // Verificar que ambos têm as mesmas condicionais (sem quebras de linha exatas)
      const rhHasConditions =
        rhLotePageContent.includes("lote.status === 'concluido'") &&
        rhLotePageContent.includes('!lote.emissao_solicitada') &&
        rhLotePageContent.includes('!lote.tem_laudo');

      const entidadeHasConditions =
        entidadeLotePageContent.includes("lote.status === 'concluido'") &&
        entidadeLotePageContent.includes('!lote.emissao_solicitada') &&
        entidadeLotePageContent.includes('!lote.tem_laudo');

      expect(rhHasConditions).toBe(true);
      expect(entidadeHasConditions).toBe(true);
    });

    it('textos dos cards devem ser idênticos', () => {
      // Card verde - verificar apenas texto principal sem quebras de linha
      expect(rhLotePageContent).toContain(
        'Todas as avaliações foram finalizadas. Você pode'
      );
      expect(rhLotePageContent).toContain('solicitar a emissão do laudo.');
      expect(entidadeLotePageContent).toContain(
        'Todas as avaliações foram finalizadas. Você pode'
      );
      expect(entidadeLotePageContent).toContain(
        'solicitar a emissão do laudo.'
      );

      // Card azul
      expect(rhLotePageContent).toContain(
        'O laudo está sendo processado pelo emissor.'
      );
      expect(entidadeLotePageContent).toContain(
        'O laudo está sendo processado pelo emissor.'
      );
    });

    it('classes CSS devem ser idênticas', () => {
      // Verde
      const rhHasGreenGradient = rhLotePageContent.includes(
        'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300'
      );
      const entidadeHasGreenGradient = entidadeLotePageContent.includes(
        'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300'
      );
      expect(rhHasGreenGradient).toBe(true);
      expect(entidadeHasGreenGradient).toBe(true);

      // Azul
      const rhHasBlueGradient = rhLotePageContent.includes(
        'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300'
      );
      const entidadeHasBlueGradient = entidadeLotePageContent.includes(
        'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300'
      );
      expect(rhHasBlueGradient).toBe(true);
      expect(entidadeHasBlueGradient).toBe(true);

      // Roxo
      const rhHasPurpleGradient = rhLotePageContent.includes(
        'bg-gradient-to-r from-purple-50 to-violet-50 border-2 border-purple-300'
      );
      const entidadeHasPurpleGradient = entidadeLotePageContent.includes(
        'bg-gradient-to-r from-purple-50 to-violet-50 border-2 border-purple-300'
      );
      expect(rhHasPurpleGradient).toBe(true);
      expect(entidadeHasPurpleGradient).toBe(true);
    });
  });

  describe('7. Comportamento da API', () => {
    it('deve confirmar antes de solicitar emissão', () => {
      expect(rhLotePageContent).toContain('const confirmado = confirm(');
      expect(rhLotePageContent).toContain(
        'Confirma a solicitação de emissão do laudo'
      );
      expect(rhLotePageContent).toContain('if (!confirmado) return;');
    });

    it('deve tratar erros adequadamente', () => {
      expect(rhLotePageContent).toContain('catch (error: any)');
      expect(rhLotePageContent).toContain('toast.error');
      expect(rhLotePageContent).toContain(
        "error.message || 'Erro ao solicitar emissão'"
      );
    });

    it('deve validar resposta da API', () => {
      expect(rhLotePageContent).toMatch(/if \(!response\.ok\)/);
      expect(rhLotePageContent).toContain('throw new Error');
    });
  });
});
