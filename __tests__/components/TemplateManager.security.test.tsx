/**
 * @file __tests__/components/TemplateManager.security.test.tsx
 * Teste de segurança: fix de contaminação multi-tenant via localStorage.
 *
 * Contexto:
 *   O TemplateManager armazenava templates no localStorage, que é GLOBAL
 *   no navegador e não isolado por usuário/entidade/sessão.
 *   O fix remove o dado legado no mount e usa apenas a API (segregada por session/tenant).
 *
 * Cobre:
 *  - Remove chave legada do localStorage ao montar o TemplatePicker
 *  - NÃO lê templates do localStorage (apenas da API)
 *  - Carrega templates corretamente da API
 *  - Trata erro de fetch de forma silenciosa (sem crash)
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TemplatePicker } from '@/components/importacao/TemplateManager';

// ─── Mocks ───────────────────────────────────────────────────────────────────

global.fetch = jest.fn();

jest.mock('lucide-react', () => {
  const MockIcon = () => <svg data-testid="mock-icon" />;
  return new Proxy({}, { get: () => MockIcon });
});

// ─── Suíte de Testes ─────────────────────────────────────────────────────────

describe('TemplatePicker — Segurança: remoção de localStorage legado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Garantir que localStorage inicia com a chave legada para verificar remoção
    localStorage.setItem('qwork-importacao-templates', JSON.stringify([{ id: '1', nome: 'legado' }]));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve remover a chave legada do localStorage ao montar', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ templates: [] }),
    });

    // Confirmar que a chave existe antes do mount
    expect(localStorage.getItem('qwork-importacao-templates')).not.toBeNull();

    render(
      <TemplatePicker
        apiBase="/api/rh/importacao/templates"
        onApply={jest.fn()}
      />
    );

    // Após montar, o localStorage DEVE ter sido limpo
    await waitFor(() => {
      expect(localStorage.getItem('qwork-importacao-templates')).toBeNull();
    });
  });

  it('deve carregar templates da API, não do localStorage', async () => {
    const apiTemplates = [
      { id: 'api-1', nome: 'Template API', criadoEm: '2026-04-01', mapeamentos: [] },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ templates: apiTemplates }),
    });

    render(
      <TemplatePicker
        apiBase="/api/rh/importacao/templates"
        onApply={jest.fn()}
      />
    );

    // Verificar que fetch foi chamado para carregar da API
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/rh/importacao/templates');
    });

    // Os dados do localStorage NÃO devem ser usados (a chave legada foi removida)
    await waitFor(() => {
      expect(localStorage.getItem('qwork-importacao-templates')).toBeNull();
    });
  });

  it('deve tratar erro de fetch de forma silenciosa (sem crash)', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Não deve lançar erro
    expect(() => {
      render(
        <TemplatePicker
          apiBase="/api/rh/importacao/templates"
          onApply={jest.fn()}
        />
      );
    }).not.toThrow();

    // Aguardar o useEffect completar sem crash
    await waitFor(() => {
      expect(localStorage.getItem('qwork-importacao-templates')).toBeNull();
    });
  });

  it('deve tratar resposta não-ok da API de forma silenciosa', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    expect(() => {
      render(
        <TemplatePicker
          apiBase="/api/rh/importacao/templates"
          onApply={jest.fn()}
        />
      );
    }).not.toThrow();

    // localStorage legado ainda deve ser removido mesmo com erro de API
    await waitFor(() => {
      expect(localStorage.getItem('qwork-importacao-templates')).toBeNull();
    });
  });
});
