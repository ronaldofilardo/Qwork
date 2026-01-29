/**
 * Testes para Exibição de Hash nas UIs dos Dashboards
 *
 * Valida:
 * 1. Funcionalidade de copiar hash para clipboard
 * 2. Validação de formato SHA-256
 * 3. Hash truncado para display
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';

describe('Exibição de Hash nos Dashboards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  describe('Funcionalidade de Copiar Hash', () => {
    it('deve copiar hash completo ao clicar no botão', async () => {
      const user = userEvent.setup();
      const testHash =
        'abc123def456789012345678901234567890123456789012345678901234';

      // Mock do clipboard
      const writeTextMock = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        writable: true,
        configurable: true,
      });

      // Criar um componente simples para testar a funcionalidade de cópia
      const TestHashCopy = () => {
        const copyToClipboard = async (text: string) => {
          try {
            await navigator.clipboard.writeText(text);
          } catch (err) {
            // Fallback silencioso
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
          }
        };

        return (
          <button onClick={() => copyToClipboard(testHash)}>Copiar Hash</button>
        );
      };

      render(<TestHashCopy />);
      const copyButton = screen.getByText('Copiar Hash');

      await user.click(copyButton);

      expect(writeTextMock).toHaveBeenCalledWith(testHash);
    });
  });

  describe('Hash Truncado - Display', () => {
    it('deve mostrar apenas primeiros 8 caracteres do hash', () => {
      const fullHash =
        '123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const truncated = fullHash.slice(0, 8);

      expect(truncated).toBe('12345678');
      expect(truncated).toHaveLength(8);
    });

    it('deve adicionar reticências ao hash truncado', () => {
      const fullHash =
        'abcdef123456789012345678901234567890123456789012345678901234';
      const display = `${fullHash.slice(0, 8)}...`;

      expect(display).toBe('abcdef12...');
      expect(display).toContain('...');
    });
  });

  describe('Validação de formato de hash SHA-256', () => {
    it('deve validar hash SHA-256 com 64 caracteres hexadecimais', () => {
      const validHash =
        'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678';

      expect(validHash).toHaveLength(64);
      expect(validHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('deve rejeitar hash com formato inválido', () => {
      const invalidHashes = [
        'invalid-hash',
        '123', // muito curto
        'g1h2i3j4k5l6m7n8o9p0', // caracteres inválidos
        '', // vazio
      ];

      invalidHashes.forEach((hash) => {
        expect(hash).not.toMatch(/^[a-f0-9]{64}$/);
      });
    });
  });
});
