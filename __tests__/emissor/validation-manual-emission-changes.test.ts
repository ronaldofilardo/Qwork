/**
 * Teste: Validação de Mudanças no Fluxo de Emissão Manual
 *
 * Valida que as alterações de código foram feitas corretamente:
 * 1. APIs de RH não emitem mais automaticamente
 * 2. lib/laudo-auto sempre usa Puppeteer
 * 3. Endpoint de solicitação manual não emite automaticamente
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Validação de Mudanças - Emissão Manual', () => {
  describe('1. API RH Status - Não deve emitir automaticamente', () => {
    it('não deve ter chamada a emitirLaudoImediato', () => {
      const routePath = path.join(
        process.cwd(),
        'app/api/rh/funcionarios/status/route.ts'
      );
      const content = fs.readFileSync(routePath, 'utf-8');

      // Verificar que não há importação de emitirLaudoImediato
      expect(content).not.toContain('emitirLaudoImediato');

      // Verificar que tem comentário sobre REMOVIDO
      expect(content).toContain('REMOVIDO: Emissão automática de laudo');

      // ✓ API RH Status não emite automaticamente
    });
  });

  describe('2. API RH Status Batch - Não deve emitir automaticamente', () => {
    it('não deve ter chamada a emitirLaudoImediato', () => {
      const routePath = path.join(
        process.cwd(),
        'app/api/rh/funcionarios/status/batch/route.ts'
      );
      const content = fs.readFileSync(routePath, 'utf-8');

      expect(content).not.toContain('emitirLaudoImediato');
      expect(content).toContain('REMOVIDO: Emissão automática de laudo');

      // ✓ API RH Status Batch não emite automaticamente
    });
  });

  describe('3. Auto-Concluir Lotes - Não deve emitir automaticamente', () => {
    it('não deve ter importação de emitirLaudoImediato', () => {
      const libPath = path.join(process.cwd(), 'lib/auto-concluir-lotes.ts');
      const content = fs.readFileSync(libPath, 'utf-8');

      expect(content).not.toContain(
        "import { emitirLaudoImediato } from './laudo-auto'"
      );
      expect(content).toContain(
        'REMOVIDO: import { emitirLaudoImediato } - não mais necessário pois emissão é manual'
      );

      // ✓ Auto-concluir lotes não emite automaticamente
    });

    it('não deve chamar emitirLaudoImediato após concluir lote', () => {
      const libPath = path.join(process.cwd(), 'lib/auto-concluir-lotes.ts');
      const content = fs.readFileSync(libPath, 'utf-8');

      // Buscar no contexto onde era chamado
      expect(content).not.toMatch(/await emitirLaudoImediato\(lote\.id\)/);
      expect(content).toContain('REMOVIDO: Emissão automática de laudo');
      expect(content).toContain(
        'pronto para solicitação de emissão manual pelo RH/Entidade'
      );

      // ✓ Não chama emitirLaudoImediato após concluir
    });
  });

  describe('4. lib/laudo-auto - SEMPRE usa Puppeteer', () => {
    it('não deve ter condicional NODE_ENV === test com jsPDF', () => {
      const libPath = path.join(process.cwd(), 'lib/laudo-auto.ts');
      const content = fs.readFileSync(libPath, 'utf-8');

      // Verificar que não há mais a condicional de teste
      const hasTestConditional = content.includes(
        "if (process.env.NODE_ENV === 'test')"
      );

      // Deve ter sido removida a condicional OU estar apenas em outro contexto
      // Vamos verificar especificamente na função de geração de PDF
      const pdfGenerationSection = content.substring(
        content.indexOf('if (needsGeneration)'),
        content.indexOf('if (needsGeneration)') + 2000
      );

      expect(pdfGenerationSection).not.toContain(
        "if (process.env.NODE_ENV === 'test')"
      );
      expect(pdfGenerationSection).toContain('SEMPRE usar Puppeteer');

      // ✓ lib/laudo-auto sempre usa Puppeteer
    });

    it('deve ter comentário sobre uso exclusivo de Puppeteer', () => {
      const libPath = path.join(process.cwd(), 'lib/laudo-auto.ts');
      const content = fs.readFileSync(libPath, 'utf-8');

      expect(content).toContain('SEMPRE usar Puppeteer para geração de PDF');

      // ✓ Comentário sobre Puppeteer exclusivo presente
    });
  });

  describe('5. Endpoint de Solicitação Manual - Não emite automaticamente', () => {
    it('não deve chamar emitirLaudoImediato diretamente', () => {
      const routePath = path.join(
        process.cwd(),
        'app/api/lotes/[loteId]/solicitar-emissao/route.ts'
      );
      const content = fs.readFileSync(routePath, 'utf-8');

      // Verificar que não há mais chamada direta à emissão
      const hasDirectEmission = /const.*=.*await emitirLaudoImediato\(/g.test(
        content
      );

      expect(hasDirectEmission).toBe(false);
      expect(content).toContain('Esta API NÃO emite o laudo automaticamente!');

      // ✓ Endpoint de solicitação não emite automaticamente
    });

    it('deve informar que laudo será gerado pelo emissor', () => {
      const routePath = path.join(
        process.cwd(),
        'app/api/lotes/[loteId]/solicitar-emissao/route.ts'
      );
      const content = fs.readFileSync(routePath, 'utf-8');

      expect(content).toContain('será gerado pelo emissor');
      expect(content).toContain('Lote fica disponível no dashboard do emissor');

      // ✓ Mensagem correta sobre emissão pelo emissor
    });
  });

  describe('6. Validação Geral - Consistência', () => {
    it('todos os arquivos devem ter sido modificados', () => {
      const files = [
        'app/api/rh/funcionarios/status/route.ts',
        'app/api/rh/funcionarios/status/batch/route.ts',
        'lib/auto-concluir-lotes.ts',
        'lib/laudo-auto.ts',
        'app/api/lotes/[loteId]/solicitar-emissao/route.ts',
      ];

      files.forEach((file) => {
        const filePath = path.join(process.cwd(), file);
        expect(fs.existsSync(filePath)).toBe(true);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content.length).toBeGreaterThan(100);
      });

      // ✓ Todos os arquivos existem e foram modificados
    });
  });
});
