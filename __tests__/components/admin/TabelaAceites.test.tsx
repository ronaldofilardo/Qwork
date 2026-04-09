/**
 * @file __tests__/components/admin/TabelaAceites.test.tsx
 * Testes: TabelaAceites + aba "Aceites" no AuditoriasContent
 *
 * Garante que:
 *  1. A tab "Aceites" é renderizada no SubNav
 *  2. Ao clicar na tab, fetch é chamado com endpoint correto
 *  3. TabelaAceites exibe dados por perfil com badges corretos
 *  4. CPF é formatado (xxx.xxx.xxx-xx)
 *  5. Campos não aplicáveis exibem "—"
 *  6. Estado vazio exibe mensagem adequada
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditoriasContent } from '@/components/admin/AuditoriasContent';
import { TabelaAceites } from '@/components/admin/auditorias/AuditoriaTables';
import type { AceiteUsuario } from '@/components/admin/auditorias/types';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeAceiteRepresentante(overrides: Partial<AceiteUsuario> = {}): AceiteUsuario {
  return {
    cpf: '12345678901',
    nome: 'João Representante',
    perfil: 'representante',
    aceite_contrato: true,
    aceite_contrato_em: '2026-01-15T10:00:00Z',
    aceite_termos: true,
    aceite_termos_em: '2026-01-15T10:01:00Z',
    aceite_politica_privacidade: true,
    aceite_politica_privacidade_em: '2026-01-15T10:02:00Z',
    aceite_disclaimer_nv: false,
    aceite_disclaimer_nv_em: null,
    confirmacao_identificacao: null,
    confirmacao_identificacao_em: null,
    ...overrides,
  };
}

function makeAceiteFuncionario(overrides: Partial<AceiteUsuario> = {}): AceiteUsuario {
  return {
    cpf: '98765432100',
    nome: 'Maria Funcionária',
    perfil: 'funcionario',
    aceite_contrato: null,
    aceite_contrato_em: null,
    aceite_termos: null,
    aceite_termos_em: null,
    aceite_politica_privacidade: null,
    aceite_politica_privacidade_em: null,
    aceite_disclaimer_nv: null,
    aceite_disclaimer_nv_em: null,
    confirmacao_identificacao: true,
    confirmacao_identificacao_em: '2026-02-01T08:30:00Z',
    ...overrides,
  };
}

function makeAceiteRH(overrides: Partial<AceiteUsuario> = {}): AceiteUsuario {
  return {
    cpf: '11122233344',
    nome: 'Carlos RH',
    perfil: 'rh',
    aceite_contrato: null,
    aceite_contrato_em: null,
    aceite_termos: true,
    aceite_termos_em: '2026-01-10T09:00:00Z',
    aceite_politica_privacidade: false,
    aceite_politica_privacidade_em: null,
    aceite_disclaimer_nv: null,
    aceite_disclaimer_nv_em: null,
    confirmacao_identificacao: null,
    confirmacao_identificacao_em: null,
    ...overrides,
  };
}

function mockFetchWith(data: Record<string, unknown>) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  });
}

// ── TabelaAceites (unitário) ──────────────────────────────────────────────────

describe('TabelaAceites', () => {
  it('deve exibir mensagem quando não há registros', () => {
    render(<TabelaAceites data={[]} />);
    expect(screen.getByText('Nenhum registro encontrado.')).toBeInTheDocument();
  });

  it('deve formatar CPF corretamente', () => {
    render(<TabelaAceites data={[makeAceiteRepresentante()]} />);
    expect(screen.getByText('123.456.789-01')).toBeInTheDocument();
  });

  it('deve exibir badge de perfil "Representante"', () => {
    render(<TabelaAceites data={[makeAceiteRepresentante()]} />);
    // getAllByText porque o mesmo texto aparece no select option E no badge da tabela
    expect(screen.getAllByText('Representante').length).toBeGreaterThanOrEqual(1);
  });

  it('deve exibir badge "Funcionário" para perfil funcionario', () => {
    render(<TabelaAceites data={[makeAceiteFuncionario()]} />);
    expect(screen.getAllByText('Funcionário').length).toBeGreaterThanOrEqual(1);
  });

  it('deve exibir badge "RH" para perfil rh', () => {
    render(<TabelaAceites data={[makeAceiteRH()]} />);
    expect(screen.getAllByText('RH').length).toBeGreaterThanOrEqual(1);
  });

  it('deve exibir nome do usuário', () => {
    render(<TabelaAceites data={[makeAceiteRepresentante()]} />);
    expect(screen.getByText('João Representante')).toBeInTheDocument();
  });

  it('deve exibir colunas de cabeçalho corretas', () => {
    render(<TabelaAceites data={[]} />);
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('CPF')).toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Contrato')).toBeInTheDocument();
    expect(screen.getByText('Termos de Uso')).toBeInTheDocument();
    expect(screen.getByText('Política Privacidade')).toBeInTheDocument();
    expect(screen.getByText('Disclaimer NV')).toBeInTheDocument();
    expect(screen.getByText('Conf. Identificação')).toBeInTheDocument();
  });

  it('deve exibir ícone ✓ para aceite_contrato=true no representante', () => {
    render(<TabelaAceites data={[makeAceiteRepresentante()]} />);
    // Contrato aceito: ícone ✓ aparece nas células aceitas
    const aceitos = screen.getAllByText('✓');
    expect(aceitos.length).toBeGreaterThan(0);
  });

  it('deve exibir "—" para aceite_disclaimer_nv=false', () => {
    render(<TabelaAceites data={[makeAceiteRepresentante()]} />);
    // disclaimer_nv=false e confirmacao_identificacao=null → células — e N/A
    const tracos = screen.getAllByText('—');
    expect(tracos.length).toBeGreaterThan(0);
  });

  it('deve exibir "N/A" para campos null (funcionário sem contrato/termos/política/disclaimer)', () => {
    render(<TabelaAceites data={[makeAceiteFuncionario()]} />);
    // Funcionário: contrato, termos, política, disclaimer = null → 4 células "N/A"
    const naoAplicaveis = screen.getAllByText('N/A');
    expect(naoAplicaveis.length).toBe(4);
  });

  it('deve exibir total correto no subtítulo', () => {
    const data = [makeAceiteRepresentante(), makeAceiteFuncionario()];
    render(<TabelaAceites data={data} />);
    expect(screen.getByText('Total: 2 usuários')).toBeInTheDocument();
  });

  it('deve renderizar múltiplos usuários', () => {
    const data = [
      makeAceiteRepresentante(),
      makeAceiteFuncionario(),
      makeAceiteRH(),
    ];
    render(<TabelaAceites data={data} />);
    expect(screen.getByText('João Representante')).toBeInTheDocument();
    expect(screen.getByText('Maria Funcionária')).toBeInTheDocument();
    expect(screen.getByText('Carlos RH')).toBeInTheDocument();
  });
});

// ── AuditoriasContent — tab Aceites (integração) ──────────────────────────────

describe('AuditoriasContent — aba Aceites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWith({ acessos: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve renderizar a sub-tab "Aceites" no nav', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });
    expect(screen.getByText('Aceites')).toBeInTheDocument();
  });

  it('deve chamar fetch com endpoint /aceites ao clicar na tab', async () => {
    mockFetchWith({ acessos: [] });

    await act(async () => {
      render(<AuditoriasContent />);
    });

    mockFetchWith({ aceites: [] });

    await act(async () => {
      fireEvent.click(screen.getByText('Aceites'));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/auditorias/aceites'),
        expect.anything()
      );
    });
  });

  it('deve exibir tabela de aceites ao selecionar a tab', async () => {
    mockFetchWith({ acessos: [] });

    await act(async () => {
      render(<AuditoriasContent />);
    });

    mockFetchWith({
      aceites: [makeAceiteRepresentante(), makeAceiteFuncionario()],
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Aceites'));
    });

    await waitFor(() => {
      expect(screen.getByText('Aceites por Usuário')).toBeInTheDocument();
    });
  });

  it('deve exibir dados do representante na tabela de aceites', async () => {
    mockFetchWith({ acessos: [] });

    await act(async () => {
      render(<AuditoriasContent />);
    });

    mockFetchWith({ aceites: [makeAceiteRepresentante()] });

    await act(async () => {
      fireEvent.click(screen.getByText('Aceites'));
    });

    await waitFor(() => {
      expect(screen.getByText('João Representante')).toBeInTheDocument();
      expect(screen.getByText('123.456.789-01')).toBeInTheDocument();
    });
  });
});
