/**
 * @fileoverview Regressão 24/04/2026 — Responsividade do ModalContrato
 *
 * Problema anterior:
 *   - Modal usava `overflow-y-auto` no container externo (footer saía do viewport no scroll)
 *   - `max-h-[56vh]` fixo no contrato deixava o footer inacessível em telas pequenas
 *   - Padding `p-6` fixo em todos os breakpoints
 *   - Botões com `flex-col md:flex-row` mas largura não-responsiva no mobile
 *
 * Correção aplicada:
 *   - Modal: `flex flex-col` + `max-h-[95dvh]`
 *   - Header: `shrink-0` (sempre visível, não precisa de sticky)
 *   - Corpo: `flex-1 min-h-0 overflow-y-auto` (único scroll do modal)
 *   - Footer: `shrink-0` (sempre visível na base)
 *   - Padding responsivo: `px-4 sm:px-6`
 *   - Botão aceite: `w-full sm:w-auto`
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

describe('Regressão 24/04/2026 — ModalContrato responsividade', () => {
  let content: string;

  beforeAll(() => {
    content = readFile('components/modals/ModalContrato.tsx');
  });

  // --------------------------------------------------------------------------
  // 1. Padrões problemáticos removidos
  // --------------------------------------------------------------------------
  describe('1. Padrões não-responsivos removidos', () => {
    it('não usa overflow-y-auto no container externo do modal', () => {
      // O container externo não deve ter overflow-y-auto; o scroll é no corpo interno
      expect(content).not.toMatch(/max-h-\[90vh\]\s+overflow-y-auto/);
    });

    it('não usa max-h fixo em vh para a área do contrato (scroll duplo)', () => {
      // O padrão antigo criava scroll dentro de scroll
      expect(content).not.toContain('max-h-[56vh]');
    });

    it('não usa p-6 fixo sem variante sm: no header', () => {
      // Header deve usar padding responsivo, não p-6 fixo
      expect(content).not.toMatch(
        /border-b sticky top-0 bg-white z-10[^"]*"[^"]*\bp-6\b/
      );
    });

    it('não usa max-w-4xl (muito largo para um modal de contrato)', () => {
      expect(content).not.toContain('max-w-4xl');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Estrutura flex col correta
  // --------------------------------------------------------------------------
  describe('2. Estrutura flex col implementada', () => {
    it('modal container usa flex flex-col', () => {
      expect(content).toContain('flex flex-col relative');
    });

    it('usa max-h com dvh para altura correta em mobile (barra de endereço)', () => {
      expect(content).toContain('max-h-[95dvh]');
    });

    it('header usa shrink-0 (não sai do layout no flex col)', () => {
      expect(content).toContain('shrink-0 flex items-center justify-between');
    });

    it('corpo do scroll usa flex-1 min-h-0 overflow-y-auto', () => {
      expect(content).toContain('flex-1 min-h-0 overflow-y-auto');
    });

    it('footer usa shrink-0 (sempre visível na base)', () => {
      expect(content).toContain('shrink-0 flex flex-col');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Padding responsivo
  // --------------------------------------------------------------------------
  describe('3. Padding responsivo', () => {
    it('usa padding responsivo px-4 sm:px-6 no corpo', () => {
      expect(content).toContain('px-4 sm:px-6');
    });

    it('backdrop usa p-2 sm:p-4 (menos margem em mobile)', () => {
      expect(content).toContain('p-2 sm:p-4');
    });

    it('max-w é sm:max-w-2xl (responsivo, não fixo)', () => {
      expect(content).toContain('sm:max-w-2xl');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Botões responsivos
  // --------------------------------------------------------------------------
  describe('4. Botões responsivos', () => {
    it('botão aceitar é full width em mobile (w-full sm:w-auto)', () => {
      expect(content).toContain('w-full sm:w-auto');
    });

    it('container dos botões inverte ordem em mobile (flex-col-reverse)', () => {
      // flex-col-reverse garante que o botão de aceite fica no topo em mobile
      expect(content).toContain('flex-col-reverse sm:flex-row');
    });

    it('preserva data-testid aceitar-button', () => {
      expect(content).toContain('data-testid="aceitar-button"');
    });

    it('preserva data-testid aceite-checkbox', () => {
      expect(content).toContain('data-testid="aceite-checkbox"');
    });

    it('preserva data-testid contrato-content', () => {
      expect(content).toContain('data-testid="contrato-content"');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Funcionalidade preservada
  // --------------------------------------------------------------------------
  describe('5. Funcionalidade crítica preservada', () => {
    it('preserva lógica de scroll detection (onScroll + scrolledToEnd)', () => {
      expect(content).toContain('setScrolledToEnd');
      expect(content).toContain('scrolledToEnd');
    });

    it('preserva texto do botão de aceite', () => {
      expect(content).toContain('Aceitar Contrato e Liberar Acesso');
    });

    it('preserva redirecionamento para boasVindasUrl', () => {
      expect(content).toContain('boasVindasUrl');
    });

    it('preserva overlay de processando', () => {
      expect(content).toContain('processando');
      expect(content).toContain('Processando aceite');
    });
  });
});
