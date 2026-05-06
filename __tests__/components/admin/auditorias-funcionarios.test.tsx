import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabelaFuncionarios } from '@/components/admin/auditorias/AuditoriaTables';
import type { AuditoriaFuncionario } from '@/components/admin/auditorias/types';

function makeFuncionario(
  overrides: Partial<AuditoriaFuncionario> = {}
): AuditoriaFuncionario {
  return {
    funcionario_id: 1,
    cpf: '12345678901',
    nome: 'João Silva',
    data_inclusao: '2024-01-15T10:00:00Z',
    status_atual: true,
    tomador_tipo: 'rh',
    tomador_nome: 'Clínica XYZ',
    empresa_nome: 'Empresa ABC',
    setor: 'RH',
    ...overrides,
  };
}

describe('TabelaFuncionarios', () => {
  const mockOnAtualizar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização básica', () => {
    it('deve renderizar sem erros', () => {
      const data: AuditoriaFuncionario[] = [makeFuncionario()];
      render(
        <TabelaFuncionarios
          data={data}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );
      expect(screen.getByText('Auditoria de Funcionários')).toBeInTheDocument();
    });

    it('deve exibir contagem de funcionários', () => {
      const data: AuditoriaFuncionario[] = [
        makeFuncionario({ funcionario_id: 1 }),
        makeFuncionario({ funcionario_id: 2 }),
      ];
      render(
        <TabelaFuncionarios
          data={data}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );
      expect(screen.getByText('2 de 2 funcionários')).toBeInTheDocument();
    });

    it('deve mostrar mensagem quando lista vazia', () => {
      render(
        <TabelaFuncionarios
          data={[]}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );
      expect(screen.getByText('Nenhum funcionário encontrado.')).toBeInTheDocument();
    });
  });

  describe('Filtros', () => {
    it('deve filtrar por tipo de tomador (RH)', async () => {
      const data: AuditoriaFuncionario[] = [
        makeFuncionario({ funcionario_id: 1, tomador_tipo: 'rh' }),
        makeFuncionario({
          funcionario_id: 2,
          tomador_tipo: 'entidade',
          tomador_nome: 'Entidade ABC',
        }),
      ];
      render(
        <TabelaFuncionarios
          data={data}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );

      const tipoSelect = screen.getByDisplayValue('Todos os tipos');
      await userEvent.selectOptions(tipoSelect, 'rh');

      expect(screen.getByText('1 de 2 funcionários')).toBeInTheDocument();
    });

    it('deve filtrar por nome de tomador', async () => {
      const data: AuditoriaFuncionario[] = [
        makeFuncionario({
          funcionario_id: 1,
          tomador_nome: 'Clínica ABC',
        }),
        makeFuncionario({
          funcionario_id: 2,
          tomador_nome: 'Clínica XYZ',
        }),
      ];
      render(
        <TabelaFuncionarios
          data={data}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );

      const tomadorInput = screen.getByPlaceholderText('Filtrar por tomador...');
      await userEvent.type(tomadorInput, 'ABC');

      expect(screen.getByText('1 de 2 funcionários')).toBeInTheDocument();
    });

    it('deve filtrar por CPF', async () => {
      const data: AuditoriaFuncionario[] = [
        makeFuncionario({ funcionario_id: 1, cpf: '12345678901' }),
        makeFuncionario({ funcionario_id: 2, cpf: '98765432100' }),
      ];
      render(
        <TabelaFuncionarios
          data={data}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );

      const cpfInput = screen.getByPlaceholderText('Filtrar por CPF...');
      await userEvent.type(cpfInput, '123456');

      expect(screen.getByText('1 de 2 funcionários')).toBeInTheDocument();
    });

    it('deve filtrar por nome', async () => {
      const data: AuditoriaFuncionario[] = [
        makeFuncionario({ funcionario_id: 1, nome: 'João Silva' }),
        makeFuncionario({ funcionario_id: 2, nome: 'Maria Santos' }),
      ];
      render(
        <TabelaFuncionarios
          data={data}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );

      const nomeInput = screen.getByPlaceholderText('Filtrar por nome...');
      await userEvent.type(nomeInput, 'João');

      expect(screen.getByText('1 de 2 funcionários')).toBeInTheDocument();
    });

    it('deve filtrar por status', async () => {
      const data: AuditoriaFuncionario[] = [
        makeFuncionario({ funcionario_id: 1, status_atual: true }),
        makeFuncionario({ funcionario_id: 2, status_atual: false }),
      ];
      render(
        <TabelaFuncionarios
          data={data}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );

      const statusSelect = screen.getByDisplayValue('Todos os status');
      await userEvent.selectOptions(statusSelect, 'true');

      expect(screen.getByText('1 de 2 funcionários')).toBeInTheDocument();
    });

    it('deve combinar múltiplos filtros', async () => {
      const data: AuditoriaFuncionario[] = [
        makeFuncionario({
          funcionario_id: 1,
          nome: 'João',
          tomador_tipo: 'rh',
          status_atual: true,
        }),
        makeFuncionario({
          funcionario_id: 2,
          nome: 'Maria',
          tomador_tipo: 'rh',
          status_atual: false,
        }),
        makeFuncionario({
          funcionario_id: 3,
          nome: 'João',
          tomador_tipo: 'entidade',
          status_atual: true,
        }),
      ];
      render(
        <TabelaFuncionarios
          data={data}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );

      const tipoSelect = screen.getByDisplayValue('Todos os tipos');
      await userEvent.selectOptions(tipoSelect, 'rh');

      const nomeInput = screen.getByPlaceholderText('Filtrar por nome...');
      await userEvent.type(nomeInput, 'João');

      expect(screen.getByText('1 de 3 funcionários')).toBeInTheDocument();
    });

    it('deve limpar todos os filtros', async () => {
      const data: AuditoriaFuncionario[] = [
        makeFuncionario({ funcionario_id: 1 }),
        makeFuncionario({ funcionario_id: 2 }),
      ];
      render(
        <TabelaFuncionarios
          data={data}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );

      const tipoSelect = screen.getByDisplayValue('Todos os tipos');
      await userEvent.selectOptions(tipoSelect, 'rh');

      expect(screen.getByText('Limpar filtros')).toBeInTheDocument();

      const limparBtn = screen.getByText('Limpar filtros');
      await userEvent.click(limparBtn);

      expect(screen.queryByText('Limpar filtros')).not.toBeInTheDocument();
      expect(screen.getByText('2 de 2 funcionários')).toBeInTheDocument();
    });
  });

  describe('Formatação de dados', () => {
    it('deve formatar CPF corretamente', () => {
      const data: AuditoriaFuncionario[] = [
        makeFuncionario({ cpf: '12345678901' }),
      ];
      render(
        <TabelaFuncionarios
          data={data}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );

      expect(screen.getByText('123.456.789-01')).toBeInTheDocument();
    });

    it('deve exibir status ativo em verde', () => {
      const data: AuditoriaFuncionario[] = [
        makeFuncionario({ status_atual: true }),
      ];
      const { container } = render(
        <TabelaFuncionarios
          data={data}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );

      const statusBadge = container.querySelector('span.bg-green-100');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveTextContent('Ativo');
    });

    it('deve exibir status inativo em vermelho', () => {
      const data: AuditoriaFuncionario[] = [
        makeFuncionario({ status_atual: false }),
      ];
      const { container } = render(
        <TabelaFuncionarios
          data={data}
          onAtualizar={mockOnAtualizar}
          loading={false}
        />
      );

      const statusBadge = container.querySelector('span.bg-red-100');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveTextContent('Inativo');
    });
  });

  describe('Botão de atualização', () => {
    it('deve chamar onAtualizar ao clicar', async () => {
      const onAtualizar = jest.fn();
      render(
        <TabelaFuncionarios
          data={[makeFuncionario()]}
          onAtualizar={onAtualizar}
          loading={false}
        />
      );

      const atualizarBtn = screen.getByText('Atualizar');
      await userEvent.click(atualizarBtn);

      expect(onAtualizar).toHaveBeenCalled();
    });
  });
});
