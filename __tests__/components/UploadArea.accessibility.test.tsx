/**
 * @fileoverview Testes de acessibilidade do componente UploadArea
 *
 * Alterações cobertas (Phase E — Auditoria Sênior):
 *  - aria-label no input file oculto
 *  - role="button" + aria-label na área de drag-drop
 *  - Ativação por teclado (Enter / Space)
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadArea from '@/components/importacao/UploadArea';

function renderUploadArea(isLoading = false) {
  const onFileSelect = jest.fn();
  const result = render(
    <UploadArea onFileSelect={onFileSelect} isLoading={isLoading} />
  );
  return { onFileSelect, ...result };
}

describe('UploadArea — acessibilidade', () => {
  it('input file tem aria-label descritivo', () => {
    renderUploadArea();
    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute(
      'aria-label',
      'Selecionar planilha para importação'
    );
  });

  it('área de drag-drop tem role="button"', () => {
    renderUploadArea();
    const dropzone = screen.getByRole('button', {
      name: /Área de upload/i,
    });
    expect(dropzone).toBeInTheDocument();
  });

  it('área de drag-drop tem aria-label descritivo', () => {
    renderUploadArea();
    const dropzone = screen.getByRole('button', {
      name: /Área de upload/i,
    });
    expect(dropzone).toHaveAttribute('aria-label');
    expect(dropzone.getAttribute('aria-label')).toMatch(/arrastar|clique/i);
  });

  it('área de drag-drop é focável via teclado (tabIndex=0)', () => {
    renderUploadArea();
    const dropzone = screen.getByRole('button', { name: /Área de upload/i });
    expect(dropzone).toHaveAttribute('tabindex', '0');
  });

  it('ativa abertura de arquivo com tecla Enter', () => {
    renderUploadArea();
    const dropzone = screen.getByRole('button', { name: /Área de upload/i });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const clickSpy = jest.spyOn(input, 'click');
    fireEvent.keyDown(dropzone, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('ativa abertura de arquivo com tecla Space', () => {
    renderUploadArea();
    const dropzone = screen.getByRole('button', { name: /Área de upload/i });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const clickSpy = jest.spyOn(input, 'click');
    fireEvent.keyDown(dropzone, { key: ' ' });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('não ativa upload por teclado quando isLoading=true', () => {
    renderUploadArea(true);
    const dropzone = screen.getByRole('button', { name: /Área de upload/i });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const clickSpy = jest.spyOn(input, 'click');
    fireEvent.keyDown(dropzone, { key: 'Enter' });
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
