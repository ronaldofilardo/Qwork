/**
 * Testes para Inserção Individual de Funcionários
 * Valida modal, API e validações de CPF brasileiro
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NextRequest, NextResponse } from 'next/server';
import ModalInserirFuncionario from '@/components/ModalInserirFuncionario';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Mocks
jest.mock('@/lib/db');
jest.mock('bcryptjs');
jest.mock('@/lib/session', () => ({
  requireRHWithEmpresaAccess: jest.fn(),
  requireAuth: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockRequireRHWithEmpresaAccess =
  require('@/lib/session').requireRHWithEmpresaAccess;

global.fetch = jest.fn();
global.alert = jest.fn();

describe('Inserção Individual de Funcionários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('ModalInserirFuncionario - Interface', () => {
    it('deve renderizar modal com todos os campos', () => {
      render(
        <ModalInserirFuncionario
          empresaId={1}
          empresaNome="Empresa Teste"
          onClose={() => {}}
          onSuccess={() => {}}
        />
      );

      expect(
        screen.getByText('Inserir Funcionário - Empresa Teste')
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText('000.000.000-00')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('João Silva')).toBeInTheDocument();
      expect(screen.getByLabelText('Data de Nascimento *')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Produção')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Operador de Máquinas')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('joao@empresa.com')
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText('MAT001')).toBeInTheDocument();
    });

    it('deve formatar CPF automaticamente com máscara', () => {
      render(
        <ModalInserirFuncionario
          empresaId={1}
          empresaNome="Teste"
          onClose={() => {}}
          onSuccess={() => {}}
        />
      );

      const cpfInput = screen.getByPlaceholderText('000.000.000-00');

      fireEvent.change(cpfInput, { target: { value: '12345678901' } });

      expect(cpfInput.value).toBe('123.456.789-01');
    });

    it('deve exibir mensagem de erro de validação', async () => {
      render(
        <ModalInserirFuncionario
          empresaId={1}
          empresaNome="Teste"
          onClose={() => {}}
          onSuccess={() => {}}
        />
      );

      const cpfInput = screen.getByPlaceholderText('000.000.000-00');
      fireEvent.change(cpfInput, { target: { value: '' } });

      const submitButton = screen.getByText('Criar Funcionário');
      const form = document.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(/CPF deve conter 11 dígitos/i)
        ).toBeInTheDocument();
      });
    });

    it('deve chamar onClose ao clicar em Cancelar', () => {
      const onClose = jest.fn();

      render(
        <ModalInserirFuncionario
          empresaId={1}
          empresaNome="Teste"
          onClose={onClose}
          onSuccess={() => {}}
        />
      );

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Validação de CPF Brasileiro', () => {
    const validCPFs = ['12345678909', '11144477735', '52998224725'];

    const invalidCPFs = [
      '11111111111', // Dígitos repetidos
      '12345678900', // Dígito verificador errado
      '00000000000', // Todos zeros
      '123456789', // Muito curto
      '123456789012', // Muito longo
    ];

    validCPFs.forEach((cpf) => {
      it(`deve aceitar CPF válido: ${cpf}`, async () => {
        render(
          <ModalInserirFuncionario
            empresaId={1}
            empresaNome="Teste"
            onClose={() => {}}
            onSuccess={() => {}}
          />
        );

        const cpfInput = screen.getByPlaceholderText('000.000.000-00');
        const nomeInput = screen.getByPlaceholderText('João Silva');
        const setorInput = screen.getByPlaceholderText('Produção');
        const funcaoInput = screen.getByPlaceholderText('Operador de Máquinas');
        const emailInput = screen.getByPlaceholderText('joao@empresa.com');

        fireEvent.change(cpfInput, { target: { value: cpf } });
        fireEvent.change(nomeInput, { target: { value: 'João Silva' } });
        fireEvent.change(screen.getByLabelText('Data de Nascimento *'), {
          target: { value: '1985-04-15' },
        });
        fireEvent.change(setorInput, { target: { value: 'TI' } });
        fireEvent.change(funcaoInput, { target: { value: 'Desenvolvedor' } });
        fireEvent.change(emailInput, { target: { value: 'joao@teste.com' } });

        const submitButton = screen.getByText('Criar Funcionário');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalled();
        });
      });
    });

    invalidCPFs.forEach((cpf) => {
      it(`deve rejeitar CPF inválido: ${cpf}`, async () => {
        render(
          <ModalInserirFuncionario
            empresaId={1}
            empresaNome="Teste"
            onClose={() => {}}
            onSuccess={() => {}}
          />
        );

        const cpfInput = screen.getByPlaceholderText('000.000.000-00');
        const nomeInput = screen.getByPlaceholderText('João Silva');
        const setorInput = screen.getByPlaceholderText('Produção');
        const funcaoInput = screen.getByPlaceholderText('Operador de Máquinas');
        const emailInput = screen.getByPlaceholderText('joao@empresa.com');

        fireEvent.change(cpfInput, { target: { value: cpf } });
        fireEvent.change(nomeInput, { target: { value: 'João Silva' } });
        fireEvent.change(screen.getByLabelText('Data de Nascimento *'), {
          target: { value: '1985-04-15' },
        });
        fireEvent.change(setorInput, { target: { value: 'TI' } });
        fireEvent.change(funcaoInput, { target: { value: 'Desenvolvedor' } });
        fireEvent.change(emailInput, { target: { value: 'joao@teste.com' } });

        const submitButton = screen.getByText('Criar Funcionário');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(
            screen.getByText(/CPF inválido|CPF deve conter 11 dígitos/i)
          ).toBeInTheDocument();
        });
      });
    });
  });

  describe('Validação de Campos Obrigatórios', () => {
    it('deve validar nome obrigatório', async () => {
      render(
        <ModalInserirFuncionario
          empresaId={1}
          empresaNome="Teste"
          onClose={() => {}}
          onSuccess={() => {}}
        />
      );

      const cpfInput = screen.getByPlaceholderText('000.000.000-00');
      fireEvent.change(cpfInput, { target: { value: '12345678909' } });

      const form = document.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Nome é obrigatório/i)).toBeInTheDocument();
      });
    });

    it('deve validar email obrigatório e formato', async () => {
      render(
        <ModalInserirFuncionario
          empresaId={1}
          empresaNome="Teste"
          onClose={() => {}}
          onSuccess={() => {}}
        />
      );

      const cpfInput = screen.getByPlaceholderText('000.000.000-00');
      const nomeInput = screen.getByPlaceholderText('João Silva');
      const setorInput = screen.getByPlaceholderText('Produção');
      const funcaoInput = screen.getByPlaceholderText('Operador de Máquinas');
      const emailInput = screen.getByPlaceholderText('joao@empresa.com');

      fireEvent.change(cpfInput, { target: { value: '12345678909' } });
      fireEvent.change(nomeInput, { target: { value: 'João Silva' } });
      fireEvent.change(screen.getByLabelText('Data de Nascimento *'), {
        target: { value: '1985-04-15' },
      });
      fireEvent.change(setorInput, { target: { value: 'TI' } });
      fireEvent.change(funcaoInput, { target: { value: 'Dev' } });
      fireEvent.change(emailInput, { target: { value: 'emailinvalido' } });

      const form = document.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(/Email válido é obrigatório/i)
        ).toBeInTheDocument();
      });
    });

    it('deve validar setor e função obrigatórios', async () => {
      render(
        <ModalInserirFuncionario
          empresaId={1}
          empresaNome="Teste"
          onClose={() => {}}
          onSuccess={() => {}}
        />
      );

      const cpfInput = screen.getByPlaceholderText('000.000.000-00');
      const nomeInput = screen.getByPlaceholderText('João Silva');

      fireEvent.change(cpfInput, { target: { value: '12345678909' } });
      fireEvent.change(nomeInput, { target: { value: 'João Silva' } });
      fireEvent.change(screen.getByLabelText('Data de Nascimento *'), {
        target: { value: '1985-04-15' },
      });

      const form = document.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        const errorText = screen.getByText(
          /Setor é obrigatório|Função é obrigatória/i
        );
        expect(errorText).toBeInTheDocument();
      });
    });
  });

  describe('API /rh/funcionarios - POST', () => {
    beforeEach(() => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1, // CRITICAL: API requires clinica_id from session
      });
      mockBcryptHash.mockResolvedValue('hashedpassword123');
    });

    it('deve criar funcionário com sucesso', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        }) // Verificar duplicata
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [],
        }); // INSERT

      const { POST } = await import('@/app/api/rh/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios',
        {
          method: 'POST',
          body: JSON.stringify({
            cpf: '12345678909',
            nome: 'João Silva',
            data_nascimento: '1985-04-15',
            setor: 'TI',
            funcao: 'Desenvolvedor',
            email: 'joao@teste.com',
            empresa_id: 1,
            senha: 'senha123',
            matricula: 'MAT001',
            nivel_cargo: 'operacional',
            turno: 'Manhã',
            escala: '8x40',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.funcionario.cpf).toBe('12345678909');
      expect(mockBcryptHash).toHaveBeenCalledWith('senha123', 10);
    });

    it('deve usar senha padrão se não fornecida', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rowCount: 1, rows: [] });

      const { POST } = await import('@/app/api/rh/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios',
        {
          method: 'POST',
          body: JSON.stringify({
            cpf: '12345678909',
            nome: 'João Silva',
            data_nascimento: '1985-04-15',
            setor: 'TI',
            funcao: 'Dev',
            email: 'joao@teste.com',
            empresa_id: 1,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(mockBcryptHash).toHaveBeenCalledWith('123456', 10);
    });

    it('deve prevenir duplicata de CPF', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ cpf: '12345678909' }],
        rowCount: 1,
      });

      const { POST } = await import('@/app/api/rh/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios',
        {
          method: 'POST',
          body: JSON.stringify({
            cpf: '12345678909',
            nome: 'João Silva',
            data_nascimento: '1985-04-15',
            setor: 'TI',
            funcao: 'Dev',
            email: 'joao@teste.com',
            empresa_id: 1,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Funcionário com este CPF já existe');
    });

    it('deve validar formato de CPF', async () => {
      const { POST } = await import('@/app/api/rh/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios',
        {
          method: 'POST',
          body: JSON.stringify({
            cpf: '123456', // CPF inválido
            nome: 'João Silva',
            data_nascimento: '1985-04-15',
            setor: 'TI',
            funcao: 'Dev',
            email: 'joao@teste.com',
            empresa_id: 1,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('CPF inválido');
    });

    it('deve validar formato de email', async () => {
      const { POST } = await import('@/app/api/rh/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios',
        {
          method: 'POST',
          body: JSON.stringify({
            cpf: '12345678909',
            nome: 'João Silva',
            data_nascimento: '1985-04-15',
            setor: 'TI',
            funcao: 'Dev',
            email: 'emailsemarroba',
            empresa_id: 1,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email inválido');
    });

    it('deve validar campos obrigatórios', async () => {
      const { POST } = await import('@/app/api/rh/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios',
        {
          method: 'POST',
          body: JSON.stringify({
            cpf: '12345678909',
            // Faltando campos obrigatórios
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('obrigatório');
    });

    it('deve validar acesso do RH à empresa', async () => {
      mockRequireRHWithEmpresaAccess.mockRejectedValue(
        new Error('Você não tem permissão para acessar esta empresa')
      );

      const { POST } = await import('@/app/api/rh/funcionarios/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios',
        {
          method: 'POST',
          body: JSON.stringify({
            cpf: '12345678909',
            nome: 'João Silva',
            data_nascimento: '1985-04-15',
            setor: 'TI',
            funcao: 'Dev',
            email: 'joao@teste.com',
            empresa_id: 999,
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(403);
    });
  });

  describe('Integração Modal + API', () => {
    it('deve enviar dados completos ao servidor', async () => {
      const fetchMock = global.fetch as jest.Mock;
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const onSuccess = jest.fn();

      render(
        <ModalInserirFuncionario
          empresaId={10}
          empresaNome="Empresa XYZ"
          onClose={() => {}}
          onSuccess={onSuccess}
        />
      );

      fireEvent.change(screen.getByPlaceholderText('000.000.000-00'), {
        target: { value: '12345678909' },
      });
      fireEvent.change(screen.getByPlaceholderText('João Silva'), {
        target: { value: 'Maria Santos' },
      });
      fireEvent.change(screen.getByPlaceholderText('Produção'), {
        target: { value: 'RH' },
      });
      fireEvent.change(screen.getByPlaceholderText('Operador de Máquinas'), {
        target: { value: 'Gestora' },
      });
      fireEvent.change(screen.getByPlaceholderText('joao@empresa.com'), {
        target: { value: 'maria@empresa.com' },
      });
      // Data de nascimento obrigatório
      fireEvent.change(screen.getByLabelText('Data de Nascimento *'), {
        target: { value: '1985-04-15' },
      });

      fireEvent.click(screen.getByText('Criar Funcionário'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/rh/funcionarios',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('12345678909'),
          })
        );
      });

      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
