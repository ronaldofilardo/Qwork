/**
 * @file __tests__/components/admin/AuditoriaTables.test.tsx
 * Testes: TabelaAceites (componente de auditoria de aceites)
 *
 * Garante que:
 *  1. Tabela renderiza corretamente com dados
 *  2. Filtro por nome funciona
 *  3. Filtro por CPF (dígitos e máscara) funciona
 *  4. Limpar filtro restaura lista completa
 *  5. CPF nulo não causa erro
 *  6. Perfis exibem badges corretos
 *  7. Células N/A exibidas para aceites não aplicáveis
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TabelaAceites } from '@/components/admin/auditorias/AuditoriaTables';
import type { AceiteUsuario } from '@/components/admin/auditorias/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAceite(overrides: Partial<AceiteUsuario> = {}): AceiteUsuario {
  return {
    cpf: '12345678901',
    nome: 'João da Silva',
    perfil: 'representante',
    aceite_contrato: true,
    aceite_contrato_em: '2024-03-01T10:00:00Z',
    aceite_termos: true,
    aceite_termos_em: '2024-03-01T10:01:00Z',
    aceite_politica_privacidade: true,
    aceite_politica_privacidade_em: '2024-03-01T10:02:00Z',
    aceite_disclaimer_nv: false,
    aceite_disclaimer_nv_em: null,
    confirmacao_identificacao: null,
    confirmacao_identificacao_em: null,
    ...overrides,
  };
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('TabelaAceites', () => {
  it('deve renderizar tabela com dados', () => {
    // Arrange
    const data: AceiteUsuario[] = [
      makeAceite({ nome: 'João da Silva', cpf: '12345678901' }),
      makeAceite({
        nome: 'Maria Souza',
        cpf: '98765432100',
        perfil: 'funcionario',
      }),
    ];

    // Act
    render(<TabelaAceites data={data} />);

    // Assert
    expect(screen.getByText('João da Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Souza')).toBeInTheDocument();
    expect(screen.getByText('Aceites por Usuário')).toBeInTheDocument();
  });

  it('deve exibir contagem correta de usuários', () => {
    // Arrange
    const data = [
      makeAceite({ nome: 'Alice', cpf: '11111111111' }),
      makeAceite({ nome: 'Bruno', cpf: '22222222222' }),
      makeAceite({ nome: 'Carlos', cpf: '33333333333' }),
    ];

    // Act
    render(<TabelaAceites data={data} />);

    // Assert
    expect(screen.getByText('3 de 3 usuários')).toBeInTheDocument();
  });

  it('deve filtrar por nome', () => {
    // Arrange
    const data = [
      makeAceite({ nome: 'Alice Mendes', cpf: '11111111111' }),
      makeAceite({ nome: 'Bruno Carvalho', cpf: '22222222222' }),
    ];
    render(<TabelaAceites data={data} />);
    const input = screen.getByPlaceholderText('Buscar por nome ou CPF...');

    // Act
    fireEvent.change(input, { target: { value: 'alice' } });

    // Assert
    expect(screen.getByText('Alice Mendes')).toBeInTheDocument();
    expect(screen.queryByText('Bruno Carvalho')).not.toBeInTheDocument();
    expect(screen.getByText('1 de 2 usuários')).toBeInTheDocument();
  });

  it('deve filtrar por nome ignorando acentos', () => {
    // Arrange
    const data = [
      makeAceite({ nome: 'José Fernández', cpf: '11111111111' }),
      makeAceite({ nome: 'Ana Lima', cpf: '22222222222' }),
    ];
    render(<TabelaAceites data={data} />);
    const input = screen.getByPlaceholderText('Buscar por nome ou CPF...');

    // Act
    fireEvent.change(input, { target: { value: 'jose' } });

    // Assert
    expect(screen.getByText('José Fernández')).toBeInTheDocument();
    expect(screen.queryByText('Ana Lima')).not.toBeInTheDocument();
  });

  it('deve filtrar por CPF numérico (apenas dígitos)', () => {
    // Arrange
    const data = [
      makeAceite({ nome: 'Alice', cpf: '11111111111' }),
      makeAceite({ nome: 'Bruno', cpf: '22222222222' }),
    ];
    render(<TabelaAceites data={data} />);
    const input = screen.getByPlaceholderText('Buscar por nome ou CPF...');

    // Act
    fireEvent.change(input, { target: { value: '111' } });

    // Assert
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bruno')).not.toBeInTheDocument();
  });

  it('deve filtrar por CPF com máscara formatada', () => {
    // Arrange
    const data = [
      makeAceite({ nome: 'Alice', cpf: '11111111111' }),
      makeAceite({ nome: 'Bruno', cpf: '22222222222' }),
    ];
    render(<TabelaAceites data={data} />);
    const input = screen.getByPlaceholderText('Buscar por nome ou CPF...');

    // Act
    fireEvent.change(input, { target: { value: '111.111' } });

    // Assert
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bruno')).not.toBeInTheDocument();
  });

  it('deve exibir mensagem quando busca não retorna resultados', () => {
    // Arrange
    const data = [makeAceite({ nome: 'Alice', cpf: '11111111111' })];
    render(<TabelaAceites data={data} />);
    const input = screen.getByPlaceholderText('Buscar por nome ou CPF...');

    // Act
    fireEvent.change(input, { target: { value: 'inexistente xyz' } });

    // Assert
    expect(
      screen.getByText('Nenhum resultado para a busca.')
    ).toBeInTheDocument();
    expect(screen.getByText('0 de 1 usuários')).toBeInTheDocument();
  });

  it('deve limpar filtro ao clicar no botão Limpar', () => {
    // Arrange
    const data = [
      makeAceite({ nome: 'Alice', cpf: '11111111111' }),
      makeAceite({ nome: 'Bruno', cpf: '22222222222' }),
    ];
    render(<TabelaAceites data={data} />);
    const input = screen.getByPlaceholderText('Buscar por nome ou CPF...');
    fireEvent.change(input, { target: { value: 'alice' } });
    expect(screen.getByText('1 de 2 usuários')).toBeInTheDocument();

    // Act
    fireEvent.click(screen.getByText('Limpar'));

    // Assert
    expect(screen.getByText('2 de 2 usuários')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bruno')).toBeInTheDocument();
  });

  it('deve tratar CPF nulo sem lançar erro', () => {
    // Arrange
    const data = [
      makeAceite({ nome: 'Sem CPF', cpf: null as unknown as string }),
    ];

    // Act & Assert
    expect(() => render(<TabelaAceites data={data} />)).not.toThrow();
    expect(screen.getByText('Sem CPF')).toBeInTheDocument();
  });

  it('deve exibir N/A para aceites não aplicáveis ao perfil', () => {
    // Arrange — RH não tem aceite_contrato nem confirmacao_identificacao
    const data = [
      makeAceite({
        nome: 'Gestor RH',
        cpf: '11111111111',
        perfil: 'rh',
        aceite_contrato: null,
        aceite_contrato_em: null,
        confirmacao_identificacao: null,
        confirmacao_identificacao_em: null,
      }),
    ];

    // Act
    render(<TabelaAceites data={data} />);

    // Assert — deve ter ao menos um elemento "N/A"
    const naCells = screen.getAllByText('N/A');
    expect(naCells.length).toBeGreaterThan(0);
  });

  it('deve exibir lista vazia com mensagem quando data está vazio', () => {
    // Arrange & Act
    render(<TabelaAceites data={[]} />);

    // Assert
    expect(screen.getByText('Nenhum registro encontrado.')).toBeInTheDocument();
    expect(screen.getByText('0 de 0 usuários')).toBeInTheDocument();
  });

  it('deve formatar CPF de 11 dígitos com máscara', () => {
    // Arrange
    const data = [makeAceite({ nome: 'Alice', cpf: '12345678901' })];

    // Act
    render(<TabelaAceites data={data} />);

    // Assert
    expect(screen.getByText('123.456.789-01')).toBeInTheDocument();
  });

  it('deve exibir badge correto para cada perfil', () => {
    // Arrange
    const data = [
      makeAceite({ nome: 'Func', cpf: '11111111111', perfil: 'funcionario' }),
      makeAceite({ nome: 'Rep', cpf: '22222222222', perfil: 'representante' }),
    ];

    // Act
    render(<TabelaAceites data={data} />);

    // Assert
    expect(screen.getByText('Funcionário')).toBeInTheDocument();
    expect(screen.getByText('Representante')).toBeInTheDocument();
  });
});
