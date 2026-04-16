/**
 * @file __tests__/components/NovoLeadVendedorModal.test.tsx
 * Testes do componente NovoLeadVendedorModal (vendedor/leads).
 *
 * Cobre:
 *  - Renderização inicial e campos do formulário
 *  - Botão desabilitado até formulário válido
 *  - Fechamento via botão X e backdrop
 *  - Validação inline: e-mail, telefone, CNPJ, vidas, valor
 *  - Alternância de tipo de cliente (Entidade / Clínica)
 *  - Submit com sucesso → chama onSuccess
 *  - Submit com erro de API → exibe erroGeral
 *  - Estado de carregamento (salvando)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import NovoLeadVendedorModal from '@/app/vendedor/(portal)/leads/components/NovoLeadModal';

// ─── Mocks ───────────────────────────────────────────────────────────────────

global.fetch = jest.fn();

jest.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x">X</span>,
  Loader2: () => <span data-testid="icon-loader">...</span>,
  AlertCircle: () => <span data-testid="icon-alert">!</span>,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderModal(overrides: {
  onClose?: () => void;
  onSuccess?: () => void;
} = {}) {
  const onClose = overrides.onClose ?? jest.fn();
  const onSuccess = overrides.onSuccess ?? jest.fn();
  const result = render(
    <NovoLeadVendedorModal onClose={onClose} onSuccess={onSuccess} />
  );
  return { ...result, onClose, onSuccess };
}

/** Preenche os campos obrigatórios mínimos para tornar o formulário válido */
async function preencherFormularioValido(user: ReturnType<typeof userEvent.setup>) {
  // contato_nome (obrigatório, >= 3 chars)
  await user.type(
    screen.getByPlaceholderText('Nome da empresa ou pessoa'),
    'Empresa Teste SA'
  );
  // num_vidas_estimado (>= 1)
  await user.type(screen.getByPlaceholderText('Ex: 50'), '100');
  // valor_negociado
  await user.type(screen.getByPlaceholderText('R$ 0,00'), '1000');
  // cnpj (obrigatório visualmente mas apenas validado, não required para formValido)
  // formValido = nome >= 3 && !erros.email && !erros.tel && !erros.cnpj && vidas >= 1 && valor > 0
}

// ─── Suíte de Testes ─────────────────────────────────────────────────────────

describe('NovoLeadVendedorModal — Renderização', () => {
  it('deve renderizar o título "Novo Lead"', () => {
    renderModal();
    expect(screen.getByText('Novo Lead')).toBeInTheDocument();
  });

  it('deve exibir todos os campos do formulário', () => {
    renderModal();
    expect(screen.getByPlaceholderText('Nome da empresa ou pessoa')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@empresa.com.br')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(11) 99999-9999')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('00.000.000/0000-00')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex: 50')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('R$ 0,00')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Informações adicionais sobre o lead...')).toBeInTheDocument();
  });

  it('deve exibir botões de tipo de cliente: Entidade e Clínica', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Entidade' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clínica' })).toBeInTheDocument();
  });

  it('deve exibir botão "Cadastrar Lead" desabilitado inicialmente', () => {
    renderModal();
    const btnSalvar = screen.getByRole('button', { name: 'Cadastrar Lead' });
    expect(btnSalvar).toBeDisabled();
  });

  it('deve exibir botão "Cancelar"', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });
});

describe('NovoLeadVendedorModal — Fechamento', () => {
  it('deve chamar onClose ao clicar no botão X', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.click(screen.getByTestId('icon-x').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onClose ao clicar no botão Cancelar', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onClose ao clicar no backdrop (fora do modal)', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    // O backdrop é o div com fixed inset-0
    const backdrop = screen.getByText('Novo Lead').closest('.bg-white')?.parentElement;
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });
});

describe('NovoLeadVendedorModal — Validação Inline', () => {
  it('deve exibir erro ao digitar e-mail inválido', async () => {
    const user = userEvent.setup();
    renderModal();
    const emailInput = screen.getByPlaceholderText('email@empresa.com.br');
    await user.type(emailInput, 'invalido');
    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument();
  });

  it('deve remover erro ao corrigir e-mail inválido', async () => {
    const user = userEvent.setup();
    renderModal();
    const emailInput = screen.getByPlaceholderText('email@empresa.com.br');
    await user.type(emailInput, 'invalido');
    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument();
    await user.clear(emailInput);
    await user.type(emailInput, 'valido@empresa.com.br');
    await waitFor(() => {
      expect(screen.queryByText('E-mail inválido')).not.toBeInTheDocument();
    });
  });

  it('deve exibir "CNPJ incompleto" ao digitar CNPJ parcial', async () => {
    const user = userEvent.setup();
    renderModal();
    const cnpjInput = screen.getByPlaceholderText('00.000.000/0000-00');
    await user.type(cnpjInput, '123');
    expect(await screen.findByText('CNPJ incompleto')).toBeInTheDocument();
  });

  it('deve exibir "CNPJ inválido" ao digitar CNPJ com 14 dígitos inválido', async () => {
    const user = userEvent.setup();
    renderModal();
    const cnpjInput = screen.getByPlaceholderText('00.000.000/0000-00');
    // CNPJ com 14 dígitos mas inválido (sequência de 1s)
    await user.type(cnpjInput, '11111111111111');
    expect(await screen.findByText('CNPJ inválido')).toBeInTheDocument();
  });

  it('deve exibir erro ao inserir quantidade de vidas inválida', async () => {
    const user = userEvent.setup();
    renderModal();
    const vidasInput = screen.getByPlaceholderText('Ex: 50');
    await user.type(vidasInput, '0');
    // limpa o campo e vidas fica 0 → erro
    await user.clear(vidasInput);
    await user.type(vidasInput, '0');
    expect(await screen.findByText('Informe ao menos 1 vida')).toBeInTheDocument();
  });
});

describe('NovoLeadVendedorModal — Alternância de Tipo de Cliente', () => {
  it('deve iniciar com "Entidade" selecionado', () => {
    renderModal();
    const btnEntidade = screen.getByRole('button', { name: 'Entidade' });
    // Entidade deve ter classe de selecionado (bg-green-600)
    expect(btnEntidade.className).toContain('bg-green-600');
  });

  it('deve alterar tipo para Clínica ao clicar no botão Clínica', async () => {
    const user = userEvent.setup();
    renderModal();
    const btnClinica = screen.getByRole('button', { name: 'Clínica' });
    await user.click(btnClinica);
    expect(btnClinica.className).toContain('bg-green-600');
    const btnEntidade = screen.getByRole('button', { name: 'Entidade' });
    expect(btnEntidade.className).not.toContain('bg-green-600');
  });
});

describe('NovoLeadVendedorModal — Submit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar onSuccess após submit bem-sucedido', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    const { onSuccess } = renderModal();

    await preencherFormularioValido(user);

    const btnSalvar = screen.getByRole('button', { name: 'Cadastrar Lead' });
    await waitFor(() => expect(btnSalvar).not.toBeDisabled());
    await user.click(btnSalvar);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('deve exibir mensagem de erro geral ao receber erro da API', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Falha ao salvar lead' }),
    });

    renderModal();

    await preencherFormularioValido(user);

    const btnSalvar = screen.getByRole('button', { name: 'Cadastrar Lead' });
    await waitFor(() => expect(btnSalvar).not.toBeDisabled());
    await user.click(btnSalvar);

    expect(await screen.findByText('Falha ao salvar lead')).toBeInTheDocument();
  });

  it('deve exibir mensagem genérica ao receber erro de rede', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Erro de rede'));

    renderModal();

    await preencherFormularioValido(user);

    const btnSalvar = screen.getByRole('button', { name: 'Cadastrar Lead' });
    await waitFor(() => expect(btnSalvar).not.toBeDisabled());
    await user.click(btnSalvar);

    expect(await screen.findByText('Erro de rede')).toBeInTheDocument();
  });

  it('deve desabilitar o botão durante o salvamento', async () => {
    const user = userEvent.setup();
    // Deixa o fetch pendente para observar estado intermediário
    let resolvePromise!: () => void;
    (global.fetch as jest.Mock).mockReturnValueOnce(
      new Promise<{ ok: boolean }>((resolve) => {
        resolvePromise = () => resolve({ ok: true });
      })
    );

    renderModal();

    await preencherFormularioValido(user);

    const btnSalvar = screen.getByRole('button', { name: 'Cadastrar Lead' });
    await waitFor(() => expect(btnSalvar).not.toBeDisabled());
    await user.click(btnSalvar);

    // Durante o salvamento o botão fica desabilitado
    await waitFor(() => expect(btnSalvar).toBeDisabled());

    resolvePromise();
  });

  it('deve enviar corretamente os campos preenchidos no body', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    renderModal();

    await user.type(
      screen.getByPlaceholderText('Nome da empresa ou pessoa'),
      'Empresa ABC'
    );
    await user.type(screen.getByPlaceholderText('Ex: 50'), '25');
    await user.type(screen.getByPlaceholderText('R$ 0,00'), '1500');

    const btnSalvar = screen.getByRole('button', { name: 'Cadastrar Lead' });
    await waitFor(() => expect(btnSalvar).not.toBeDisabled());
    await user.click(btnSalvar);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe('/api/vendedor/leads');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body as string) as Record<string, unknown>;
    expect(body.contato_nome).toBe('Empresa ABC');
    expect(body.num_vidas_estimado).toBe(25);
    expect(body.tipo_cliente).toBe('entidade');
  });
});
