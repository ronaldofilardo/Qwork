/**
 * @file __tests__/context-engineering/comercial-context.test.tsx
 * Testes para ComercialProvider e useComercial (context engineering — fase 5)
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ComercialProvider,
  useComercial,
  ComercialContext,
} from '@/app/comercial/comercial-context';
import type { ComercialSection } from '@/components/comercial/ComercialSidebar';

// Componente auxiliar
function Inspector() {
  const { activeSection, setActiveSection } = useComercial();
  return (
    <div>
      <span data-testid="section">{activeSection}</span>
      <button data-testid="btn-leads" onClick={() => setActiveSection('leads')}>
        Leads
      </button>
      <button
        data-testid="btn-comissoes"
        onClick={() => setActiveSection('comissoes')}
      >
        Comissões
      </button>
    </div>
  );
}

describe('ComercialContext', () => {
  it('useComercial retorna default value fora do provider', () => {
    render(<Inspector />);
    // Default value tem activeSection = 'representantes'
    expect(screen.getByTestId('section').textContent).toBe('representantes');
  });

  it('ComercialProvider inicializa com "representantes"', () => {
    render(
      <ComercialProvider>
        <Inspector />
      </ComercialProvider>
    );
    expect(screen.getByTestId('section').textContent).toBe('representantes');
  });

  it('setActiveSection atualiza a seção ativa', () => {
    render(
      <ComercialProvider>
        <Inspector />
      </ComercialProvider>
    );

    act(() => {
      screen.getByTestId('btn-leads').click();
    });

    expect(screen.getByTestId('section').textContent).toBe('leads');

    act(() => {
      screen.getByTestId('btn-comissoes').click();
    });

    expect(screen.getByTestId('section').textContent).toBe('comissoes');
  });

  it('ComercialContext.Provider aceita value externo', () => {
    const value = {
      activeSection: 'comissoes' as ComercialSection,
      setActiveSection: jest.fn(),
    };
    render(
      <ComercialContext.Provider value={value}>
        <Inspector />
      </ComercialContext.Provider>
    );
    expect(screen.getByTestId('section').textContent).toBe('comissoes');
  });

  it('múltiplos consumers compartilham o mesmo estado', () => {
    function Consumer1() {
      const { activeSection } = useComercial();
      return <span data-testid="c1">{activeSection}</span>;
    }
    function Consumer2() {
      const { setActiveSection } = useComercial();
      return (
        <button data-testid="toggle" onClick={() => setActiveSection('leads')}>
          set
        </button>
      );
    }

    render(
      <ComercialProvider>
        <Consumer1 />
        <Consumer2 />
      </ComercialProvider>
    );

    expect(screen.getByTestId('c1').textContent).toBe('representantes');

    act(() => {
      screen.getByTestId('toggle').click();
    });

    expect(screen.getByTestId('c1').textContent).toBe('leads');
  });
});
