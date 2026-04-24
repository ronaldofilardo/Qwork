/**
 * @fileoverview Regressão 24/04/2026 — Redução do modal e aumento do logo na página boas-vindas
 *
 * Valida que:
 *   - O container principal usa max-w-md (reduzido de max-w-2xl)
 *   - O logo usa size="3xl" (3× o tamanho anterior size="lg")
 *   - O padding interno foi reduzido (px-6 py-6, não px-8 py-12)
 *   - O header do sucesso foi compactado (py-5, não py-8)
 *   - Os inputs usam text-sm (não text-lg)
 *   - Os botões de copiar usam py-2 (não py-3)
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

describe('Regressão 24/04/2026 — boas-vindas: modal compacto e logo ampliado', () => {
  let content: string;

  beforeAll(() => {
    content = readFile('app/boas-vindas/page.tsx');
  });

  // --------------------------------------------------------------------------
  // 1. Tamanho do container / modal
  // --------------------------------------------------------------------------
  describe('1. Container reduzido', () => {
    it('usa max-w-md como largura máxima do container', () => {
      expect(content).toContain('max-w-md');
    });

    it('não usa max-w-2xl (tamanho anterior, muito largo)', () => {
      expect(content).not.toContain('max-w-2xl');
    });

    it('padding vertical do container é py-8 (reduzido de py-12)', () => {
      expect(content).toContain('py-8 px-4');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Logo 3×
  // --------------------------------------------------------------------------
  describe('2. Logo com tamanho 3× maior', () => {
    it('usa size="3xl" para o logotipo principal', () => {
      expect(content).toContain('size="3xl"');
    });

    it('não usa size="lg" para o logotipo do cabeçalho (tamanho anterior)', () => {
      // O loading state usa lg mas o header principal deve ser 3xl
      // Verifica que o header com mb-8 não usa lg
      expect(content).not.toMatch(/mb-8["'][^]*?size="lg"/);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Header do sucesso compactado
  // --------------------------------------------------------------------------
  describe('3. Header do sucesso compacto', () => {
    it('header usa py-5 (reduzido de py-8)', () => {
      expect(content).toContain('px-6 py-5');
    });

    it('ícone de check usa w-12 h-12 (reduzido de w-16 h-16)', () => {
      expect(content).toContain('w-12 h-12 bg-white rounded-full');
    });

    it('título Parabéns usa text-xl (reduzido de text-3xl)', () => {
      expect(content).toContain('text-xl font-bold text-white');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Conteúdo interno compactado
  // --------------------------------------------------------------------------
  describe('4. Conteúdo interno compactado', () => {
    it('padding do conteúdo é px-6 py-6 (reduzido de px-8 py-12)', () => {
      expect(content).toContain('px-6 py-6');
    });

    it('título das credenciais usa text-lg (reduzido de text-2xl)', () => {
      expect(content).toContain('text-lg font-bold text-gray-900');
    });

    it('inputs usam text-sm (reduzido de text-lg)', () => {
      // Ambos os inputs de CPF e senha devem usar text-sm
      const inputMatches = content.match(/font-mono text-sm/g);
      expect(inputMatches).not.toBeNull();
      expect(inputMatches!.length).toBeGreaterThanOrEqual(2);
    });

    it('botões usam py-2 (reduzido de py-3)', () => {
      // Botões de copiar e toggle de senha
      const btnMatches = content.match(/px-3 py-2/g);
      expect(btnMatches).not.toBeNull();
      expect(btnMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });
});
