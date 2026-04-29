/**
 * @fileoverview Testes de validação do formulário de criação de leads
 * Cobre: máscara CNPJ, máscara telefone, validação email,
 * estado do botão de submit e mensagens de erro em tempo real.
 *
 * Contexto: formatarCNPJ e formatarTelefone foram removidos dos imports da página
 * (eram unused). Este arquivo garante que a lógica de máscara e validação
 * continua funcionando corretamente sem eles.
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeadsRepresentante from '@/app/representante/(portal)/leads/page';
import { RepContext } from '@/app/representante/(portal)/rep-context';

// Usa implementação real do validators para testar a lógica de máscara/validação
jest.mock('@/lib/validators', () => {
  const actual = jest.requireActual('@/lib/validators');
  return {
    ...actual,
    // Controla validarCNPJ para isolar o teste do dígito verificador
    validarCNPJ: jest.fn((cnpj: string) => cnpj === '11444777000161'),
  };
});

const mockSession = {
  id: 1,
  nome: 'Rep Teste',
  email: 'rep@test.dev',
  codigo: 'REP-P1123',
  status: 'apto',
  tipo_pessoa: 'pf',
  telefone: null,
  aceite_termos: true,
  aceite_disclaimer_nv: true,
  criado_em: '2026-01-01T00:00:00Z',
  aprovado_em: '2026-01-10T00:00:00Z',
};

function setupEmptyFetch() {
  global.fetch = jest.fn((url: string) => {
    if (url.includes('/api/representante/me')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            representante: {
              percentual_comissao: 10,
              modelo_comissionamento: 'percentual',
              valor_custo_fixo_entidade: 12,
              valor_custo_fixo_clinica: 5,
            },
          }),
      });
    }
    // Default para outras rotas
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          leads: [],
          total: 0,
          page: 1,
          limit: 20,
          contagens: { pendente: 0, convertido: 0, expirado: 0 },
        }),
    });
  });
}

function renderPage() {
  return render(
    <RepContext.Provider value={{ session: mockSession }}>
      <LeadsRepresentante />
    </RepContext.Provider>
  );
}

async function abrirModal() {
  // Aguarda o botão ficar habilitado (fetch /api/representante/me precisa completar
  // para definir modeloComissionamento e habilitar o botão + Novo Lead)
  const btn = await screen.findByRole('button', { name: /\+ Novo Lead/i });
  await waitFor(() => expect(btn).not.toBeDisabled());
  fireEvent.click(btn);
  await screen.findByPlaceholderText('00.000.000/0001-00');
}

describe('Leads — máscara e validação do formulário (sem formatarCNPJ/formatarTelefone)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupEmptyFetch();
  });

  // ── CNPJ ────────────────────────────────────────────────────────────────────

  it('aplica máscara de CNPJ progressivamente ao digitar', async () => {
    renderPage();
    await abrirModal();

    const input = screen.getByPlaceholderText('00.000.000/0001-00');

    await userEvent.type(input, '11444777000161');

    // Deve formatar como XX.XXX.XXX/XXXX-XX
    expect(input).toHaveValue('11.444.777/0001-61');
  });

  it('exibe "CNPJ válido ✓" para CNPJ com dígitos corretos', async () => {
    renderPage();
    await abrirModal();

    const input = screen.getByPlaceholderText('00.000.000/0001-00');
    await userEvent.type(input, '11444777000161');

    await waitFor(() => {
      expect(screen.getByText('CNPJ válido ✓')).toBeInTheDocument();
    });
  });

  it('exibe "CNPJ incompleto" para entrada parcial', async () => {
    renderPage();
    await abrirModal();

    const input = screen.getByPlaceholderText('00.000.000/0001-00');
    await userEvent.type(input, '1144477');

    await waitFor(() => {
      expect(screen.getByText('CNPJ incompleto')).toBeInTheDocument();
    });
  });

  it('exibe "CNPJ inválido" para 14 dígitos com dígito verificador errado', async () => {
    renderPage();
    await abrirModal();

    const input = screen.getByPlaceholderText('00.000.000/0001-00');
    // validarCNPJ mockado retorna false para qualquer CNPJ diferente de 11444777000161
    await userEvent.type(input, '11111111111111');

    await waitFor(() => {
      expect(screen.getByText('CNPJ inválido')).toBeInTheDocument();
    });
  });

  // ── Botão de submit ──────────────────────────────────────────────────────────

  it('botão "Registrar Lead" fica desabilitado sem CNPJ válido', async () => {
    renderPage();
    await abrirModal();

    const submitBtn = screen.getByRole('button', { name: /Registrar Lead/i });
    expect(submitBtn).toBeDisabled();
  });

  it('botão "Registrar Lead" fica habilitado com todos os campos obrigatórios preenchidos', async () => {
    // Causa raiz: formValido exige cnpj válido, valorNegociadoNum > 0 e numVidasEstimadoNum > 0
    renderPage();
    await abrirModal();

    const cnpjInput = screen.getByPlaceholderText('00.000.000/0001-00');
    await userEvent.type(cnpjInput, '11444777000161');

    // Preencher valor negociado (placeholder R$ 0,00)
    const valorInput = screen.getByPlaceholderText('R$ 0,00');
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '1500');

    // Preencher número de vidas estimado (placeholder Ex: 150)
    const vidasInput = screen.getByPlaceholderText('Ex: 150');
    await userEvent.clear(vidasInput);
    await userEvent.type(vidasInput, '50');

    await waitFor(() => {
      const submitBtn = screen.getByRole('button', { name: /Registrar Lead/i });
      expect(submitBtn).not.toBeDisabled();
    });
  });

  // ── Telefone ────────────────────────────────────────────────────────────────

  it('aplica máscara de telefone celular ao digitar 11 dígitos', async () => {
    renderPage();
    await abrirModal();

    const telInput = screen.getByPlaceholderText('(11) 91234-5678');
    await userEvent.type(telInput, '11987654321');

    expect(telInput).toHaveValue('(11) 98765-4321');
  });

  it('exibe "Telefone inválido" para número incompleto', async () => {
    renderPage();
    await abrirModal();

    const telInput = screen.getByPlaceholderText('(11) 91234-5678');
    // 8 dígitos — inválido (mínimo é 10)
    await userEvent.type(telInput, '11987654');

    await waitFor(() => {
      expect(screen.getByText('Telefone inválido')).toBeInTheDocument();
    });
  });

  it('telefone válido não exibe mensagem de erro', async () => {
    renderPage();
    await abrirModal();

    const telInput = screen.getByPlaceholderText('(11) 91234-5678');
    await userEvent.type(telInput, '1130001234');

    await waitFor(() => {
      expect(screen.queryByText('Telefone inválido')).not.toBeInTheDocument();
    });
  });

  // ── E-mail ──────────────────────────────────────────────────────────────────

  it('exibe "E-mail inválido" para formato incorreto', async () => {
    renderPage();
    await abrirModal();

    const emailInput = screen.getByPlaceholderText('contato@empresa.com.br');
    await userEvent.type(emailInput, 'invalido-sem-arroba');

    await waitFor(() => {
      expect(screen.getByText('E-mail inválido')).toBeInTheDocument();
    });
  });

  it('e-mail válido não exibe mensagem de erro', async () => {
    renderPage();
    await abrirModal();

    const emailInput = screen.getByPlaceholderText('contato@empresa.com.br');
    await userEvent.type(emailInput, 'contato@empresa.com.br');

    await waitFor(() => {
      expect(screen.queryByText('E-mail inválido')).not.toBeInTheDocument();
    });
  });

  it('botão fica desabilitado com e-mail inválido mesmo com CNPJ válido', async () => {
    renderPage();
    await abrirModal();

    const cnpjInput = screen.getByPlaceholderText('00.000.000/0001-00');
    const emailInput = screen.getByPlaceholderText('contato@empresa.com.br');

    await userEvent.type(cnpjInput, '11444777000161');
    await userEvent.type(emailInput, 'invalido');

    await waitFor(() => {
      const submitBtn = screen.getByRole('button', { name: /Registrar Lead/i });
      expect(submitBtn).toBeDisabled();
    });
  });
});
