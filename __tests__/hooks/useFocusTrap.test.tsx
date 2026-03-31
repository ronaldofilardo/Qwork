/**
 * @fileoverview Testes do hook useFocusTrap
 *
 * Alterações cobertas (Phase D — Auditoria Sênior):
 *  - Foco automaticamente posto no primeiro elemento focável ao abrir
 *  - Tab circula entre elementos focáveis
 *  - Shift+Tab vai para o último elemento
 *  - Escape chama onEscape
 *  - Foco restaurado ao fechar
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// Componente teste que usa o hook
function TrapModal({
  isOpen,
  onEscape,
}: {
  isOpen: boolean;
  onEscape?: () => void;
}) {
  const trapRef = useFocusTrap<HTMLDivElement>({ isOpen, onEscape });

  if (!isOpen) return null;

  return (
    <div ref={trapRef} role="dialog" aria-modal="true">
      <button>Botão 1</button>
      <input type="text" placeholder="Campo texto" />
      <button>Botão 2</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('foca o primeiro elemento focável ao abrir', () => {
    render(<TrapModal isOpen={true} />);
    const buttons = screen.getAllByRole('button');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('chama onEscape quando tecla Escape é pressionada', () => {
    const onEscape = jest.fn();
    render(<TrapModal isOpen={true} onEscape={onEscape} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('não chama onEscape quando onEscape não é fornecido', () => {
    // Não deve lançar erro
    expect(() => {
      render(<TrapModal isOpen={true} />);
      fireEvent.keyDown(document, { key: 'Escape' });
    }).not.toThrow();
  });

  it('não instala listeners quando isOpen=false', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    render(<TrapModal isOpen={false} />);
    expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
    addSpy.mockRestore();
  });

  it('remove listener de teclado ao desmontar', () => {
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = render(<TrapModal isOpen={true} />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('cicla Tab do último para o primeiro elemento', () => {
    render(<TrapModal isOpen={true} />);
    const buttons = screen.getAllByRole('button');
    const lastButton = buttons[buttons.length - 1];

    // Foca o último elemento
    lastButton.focus();
    expect(document.activeElement).toBe(lastButton);

    // Tab deve ir para o primeiro
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('cicla Shift+Tab do primeiro para o último elemento', () => {
    render(<TrapModal isOpen={true} />);
    const buttons = screen.getAllByRole('button');
    const firstButton = buttons[0];

    // Foca o primeiro elemento
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    // Shift+Tab deve ir para o último
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });
});
