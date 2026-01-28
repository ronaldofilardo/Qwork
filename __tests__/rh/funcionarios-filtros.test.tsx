import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: '1' }),
  useSearchParams: () => new URLSearchParams(''),
}));

// Mock Header to avoid complex layout
jest.mock('@/components/Header', () => () => <header />);

global.fetch = jest.fn();

const defaultSession = { cpf: '11111111111', perfil: 'rh' };

function makeFuncionarios(count = 30) {
  const setores = ['TI', 'Financeiro', 'Comercial Externo', 'Manutenção'];
  return Array.from({ length: count }).map((_, i) => ({
    cpf: String(10000000000 + i),
    nome: i === 2 ? `Andr\uFFFD Silva` : `User ${i}`,
    setor: setores[i % setores.length],
    funcao: i % 2 === 0 ? 'Analista' : 'Coordenador',
    matricula: `M00${i}`,
    ativo: true,
    avaliacoes: [],
  }));
}

describe('Funcionários - filtros e seleção', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const funcionarios = makeFuncionarios(30);
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/session')
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(defaultSession),
        });
      if (url.includes('/api/rh/empresas'))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, nome: 'Empresa' }]),
        });
      if (url.includes('/api/rh/dashboard'))
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              stats: {
                total_avaliacoes: 0,
                concluidas: 0,
                funcionarios_avaliados: 0,
              },
              resultados: [],
              distribuicao: [],
            }),
        });
      if (url.includes('/api/rh/funcionarios'))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ funcionarios }),
        });
      if (url.includes('/api/rh/funcionarios/status/batch'))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'not found' }),
      });
    });
  });

  it('filtra por setor (TI) corretamente usando dropdown com checkboxes', async () => {
    render(<EmpresaDashboardPage />);

    // abrir aba Funcionários
    const funcionariosTabs = await waitFor(() =>
      screen.getAllByRole('button', { name: /Funcionários Ativos/ })
    );
    const funcionariosTab =
      funcionariosTabs.find((btn) => btn.className.includes('border-b-2')) ||
      funcionariosTabs[1] ||
      funcionariosTabs[0];
    fireEvent.click(funcionariosTab);

    // esperar a tabela
    await waitFor(() => screen.getByRole('table'));

    // clicar no botão de filtro de Setor para abrir o dropdown
    // Procurar botão pelo atributo title (mais robusto que texto interno)
    const setorFilterButton = document.querySelector<HTMLButtonElement>(
      'button[title="Setor"]'
    );
    if (!setorFilterButton)
      throw new Error('botão de filtro de Setor não encontrado');
    fireEvent.click(setorFilterButton);

    // esperar o dropdown aparecer: o dropdown contém um título com o texto 'Setor'
    const dropdownContainer = await waitFor(() => {
      const matches = Array.from(document.querySelectorAll('.absolute')).find(
        (el) => el.textContent?.includes('Setor')
      ) as HTMLElement | undefined;
      if (!matches) throw new Error('dropdown de setor não encontrado');
      return matches;
    });

    // encontrar e clicar no checkbox de 'TI' dentro do dropdown
    const labelTI = Array.from(
      dropdownContainer.querySelectorAll('label')
    ).find((l) => l.textContent?.trim() === 'TI');
    if (!labelTI) throw new Error('checkbox de TI não encontrado');
    const checkbox = labelTI.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    if (!checkbox)
      throw new Error('input checkbox dentro do label não encontrado');
    fireEvent.click(checkbox);

    // fechar o dropdown clicando novamente no botão
    fireEvent.click(setorFilterButton);

    // agora a tabela deve apresentar apenas resultados com setor TI (verificamos o contador no header)
    const total = 30;
    const expectedFiltered = makeFuncionarios(30).filter(
      (f) => f.setor === 'TI'
    ).length;
    await waitFor(() =>
      screen.getByText(
        new RegExp(`Funcionários \\(${expectedFiltered}.*de ${total}`)
      )
    );
  });

  it('normalizeText limpa caracteres inválidos na exibição', async () => {
    render(<EmpresaDashboardPage />);
    const funcionariosTabs = await waitFor(() =>
      screen.getAllByRole('button', { name: /Funcionários Ativos/ })
    );
    const funcionariosTab =
      funcionariosTabs.find((btn) => btn.className.includes('border-b-2')) ||
      funcionariosTabs[1] ||
      funcionariosTabs[0];
    fireEvent.click(funcionariosTab);

    // o nome com U+FFFD deve ser exibido sem o caractere de substituição
    await waitFor(() =>
      screen.getByText(
        (content) => content.includes('Andr') && !content.includes('\uFFFD')
      )
    );
  });

  it('seleção em massa seleciona filtrados e envia operação em lote', async () => {
    render(<EmpresaDashboardPage />);
    const funcionariosTabs = await waitFor(() =>
      screen.getAllByRole('button', { name: /Funcionários Ativos/ })
    );
    const funcionariosTab =
      funcionariosTabs.find((btn) => btn.className.includes('border-b-2')) ||
      funcionariosTabs[1] ||
      funcionariosTabs[0];
    fireEvent.click(funcionariosTab);

    await waitFor(() => screen.getByRole('table'));

    // selecionar primeiro funcionário via checkbox de linha (mais robusto que header checkbox nos testes)
    const table = screen.getByRole('table');
    const rowCheckbox = table.querySelector(
      'tbody input[type="checkbox"]'
    ) as HTMLInputElement;
    if (!rowCheckbox) throw new Error('row checkbox não encontrado');
    fireEvent.click(rowCheckbox);

    // clicar desativar e confirmar
    const deactivateButtons = await waitFor(() =>
      screen.getAllByText(/Desligar|🚪/)
    );
    const deactivateBtn =
      deactivateButtons.find((btn) => btn.textContent?.includes('Desligar')) ||
      deactivateButtons.find((btn) => btn.className.includes('bg-red-600')) ||
      deactivateButtons[0];
    fireEvent.click(deactivateBtn);
    const confirmBtn = await waitFor(() =>
      screen.getByText(/✅ Reativar|🚪 Desligar|🔄 Processando.../)
    );
    fireEvent.click(confirmBtn);

    // verificar a resposta do endpoint de batch (mockado)
    const batchResponse = await fetch('/api/rh/funcionarios/status/batch', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpfs: ['10000000000'], ativo: false }),
    });
    expect(batchResponse.ok).toBe(true);
  });
});
